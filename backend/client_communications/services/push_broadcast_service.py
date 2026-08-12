from __future__ import annotations

import asyncio
import os
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_communications.models import (
    ClientMessageModel,
    ClientPushPreferenceModel,
    ClientPushSubscriptionModel,
)
from client_circout.backend.client_communications.schemas import ClientPushSendSchema
from client_circout.backend.client_communications.services.web_push_service import (
    send_web_push,
    web_push_configured,
)
from client_circout.backend.clients_core.models.client import ClientModel


AUTH_API_URL = (os.getenv("AUTH_AND_LOGGING_API_URL") or "http://auth_and_logging:7998").rstrip("/")
INTERNAL_SERVICE_SECRET = os.getenv("INTERNAL_SERVICE_SECRET") or os.getenv("WEBHOOK_SECRET") or ""

async def _prepare_max_images(organization_id: int, image_urls: list[str]) -> list[dict[str, object]]:
    if not INTERNAL_SERVICE_SECRET:
        return []
    async with httpx.AsyncClient(timeout=35.0, trust_env=False) as client:
        response = await client.post(
            f"{AUTH_API_URL}/bots/internal/prepare-max-images",
            headers={"X-Internal-Service-Secret": INTERNAL_SERVICE_SECRET},
            json={"organization_id": organization_id, "image_urls": image_urls},
        )
    response.raise_for_status()
    return list(response.json())

async def _send_organization_message(
    organization_id: int, channel: str, recipient_id: str, text: str,
    image_urls: list[str], max_attachments: list[dict[str, object]] | None,
) -> bool:
    if not INTERNAL_SERVICE_SECRET:
        return False
    async with httpx.AsyncClient(timeout=20.0, trust_env=False) as client:
        response = await client.post(
            f"{AUTH_API_URL}/bots/internal/send",
            headers={"X-Internal-Service-Secret": INTERNAL_SERVICE_SECRET},
            json={
                "organization_id": organization_id,
                "channel": channel,
                "recipient_id": recipient_id,
                "text": text,
                "image_urls": image_urls,
                "max_attachments": max_attachments,
            },
        )
    return response.status_code < 400 and bool(response.json().get("ok"))

class ClientPushBroadcastResult:
    def __init__(self, recipients: int, sent: int) -> None:
        self.recipients = recipients
        self.sent = sent


async def send_push_broadcast(
    session: AsyncSession,
    payload: ClientPushSendSchema,
) -> ClientPushBroadcastResult:
    now = datetime.now(timezone.utc)
    recipients = 0
    sent = 0
    delivered_client_ids: set[int] = set()
    messenger_text = f"{payload.title}\n\n{payload.message}"
    semaphore = asyncio.Semaphore(20)
    for channel in dict.fromkeys(payload.channels):
        if channel == "application":
            recipients_query = (
                select(ClientPushPreferenceModel.client_id)
                .join(ClientModel, ClientModel.id == ClientPushPreferenceModel.client_id)
                .where(ClientModel.organization_id == payload.organization_id, ClientPushPreferenceModel.enabled.is_(True))
            )
            subscriptions_query = (
                select(ClientPushSubscriptionModel)
                .join(ClientModel, ClientModel.id == ClientPushSubscriptionModel.client_id)
                .join(ClientPushPreferenceModel, ClientPushPreferenceModel.client_id == ClientPushSubscriptionModel.client_id)
                .where(ClientModel.organization_id == payload.organization_id, ClientPushSubscriptionModel.is_active.is_(True), ClientPushPreferenceModel.enabled.is_(True))
            )
            if payload.client_ids:
                recipients_query = recipients_query.where(ClientPushPreferenceModel.client_id.in_(payload.client_ids))
                subscriptions_query = subscriptions_query.where(ClientPushSubscriptionModel.client_id.in_(payload.client_ids))
            if payload.single_delivery and delivered_client_ids:
                recipients_query = recipients_query.where(ClientPushPreferenceModel.client_id.not_in(delivered_client_ids))
                subscriptions_query = subscriptions_query.where(ClientPushSubscriptionModel.client_id.not_in(delivered_client_ids))
            recipient_ids = list((await session.execute(recipients_query)).scalars().all())
            subscriptions = list((await session.execute(subscriptions_query)).scalars().all())
            configured = web_push_configured()
            sent += await send_web_push(session, subscriptions, title=payload.title, body=payload.message, image=payload.image_urls[0] if payload.image_urls else "")
            recipients += len(recipient_ids)
            successful_client_ids = {
                int(item.client_id)
                for item in subscriptions
                if configured and item.last_error == ""
            }
            if payload.single_delivery:
                delivered_client_ids.update(successful_client_ids)
            for client_id in recipient_ids:
                session.add(ClientMessageModel(organization_id=payload.organization_id, client_id=client_id, sent_at=now, channel="push", message_type="notification", message_title=payload.title, message_text=payload.message, image_urls=payload.image_urls, delivery_status="sent" if client_id in successful_client_ids else "saved"))
            continue

        id_field = ClientModel.max_id if channel == "max" else ClientModel.telegram_id
        query = select(ClientModel.id, id_field).where(ClientModel.organization_id == payload.organization_id, id_field.is_not(None))
        if payload.client_ids:
            query = query.where(ClientModel.id.in_(payload.client_ids))
        if payload.single_delivery and delivered_client_ids:
            query = query.where(ClientModel.id.not_in(delivered_client_ids))
        channel_recipients = list((await session.execute(query)).all())
        max_attachments = await _prepare_max_images(
            payload.organization_id, payload.image_urls,
        ) if channel == "max" and payload.image_urls else None

        async def send_one(external_id: int) -> bool:
            async with semaphore:
                return await _send_organization_message(
                    payload.organization_id,
                    channel,
                    str(external_id),
                    messenger_text,
                    payload.image_urls,
                    max_attachments,
                )

        delivery_results = await asyncio.gather(
            *(send_one(external_id) for _, external_id in channel_recipients),
            return_exceptions=True,
        )
        results = [result is True for result in delivery_results]
        recipients += len(channel_recipients)
        sent += sum(results)
        for (client_id, _), delivered in zip(channel_recipients, results):
            session.add(ClientMessageModel(organization_id=payload.organization_id, client_id=client_id, sent_at=now, channel=channel, message_type="notification", message_title=payload.title, message_text=payload.message, image_urls=payload.image_urls, delivery_status="sent" if delivered else "failed"))
            if payload.single_delivery and delivered:
                delivered_client_ids.add(int(client_id))

    await session.commit()
    return ClientPushBroadcastResult(recipients=recipients, sent=sent)
