from __future__ import annotations

from datetime import datetime
from typing import Any

from client_circout.backend.client_communications.schemas import ClientMessageDeliveryLogUpdateSchema
from client_circout.backend.client_communications.services._utils import utc_now
from client_circout.backend.client_communications.services.client_message_delivery_service import (
    ClientMessageDeliveryService,
)


class ClientMessageSyncService:
    def __init__(
        self,
        delivery_service: ClientMessageDeliveryService,
    ) -> None:
        self._delivery_service = delivery_service

    async def apply_provider_status(
        self,
        *,
        provider_name: str,
        provider_message_id: str,
        status: str,
        status_at: datetime | None = None,
        error_text: str | None = None,
        payload_json: dict[str, Any] | None = None,
    ):
        log = await self._delivery_service.get_by_provider_message_id(
            provider_message_id=provider_message_id,
        )

        return await self._delivery_service.update_log_idempotent(
            log_id=log.id,
            payload=ClientMessageDeliveryLogUpdateSchema(
                provider_name=provider_name,
                provider_message_id=provider_message_id,
                status=status,
                status_at=status_at or utc_now(),
                error_text=error_text,
                payload_json=payload_json,
            ),
            update_message_status=True,
        )

    async def register_provider_status(
        self,
        *,
        message_id: int,
        provider_name: str,
        status: str,
        provider_message_id: str | None = None,
        status_at: datetime | None = None,
        error_text: str | None = None,
        payload_json: dict[str, Any] | None = None,
    ):
        return await self._delivery_service.register_status(
            message_id=message_id,
            provider_name=provider_name,
            provider_message_id=provider_message_id,
            status=status,
            status_at=status_at or utc_now(),
            error_text=error_text,
            payload_json=payload_json,
        )

    async def handle_webhook(
        self,
        *,
        provider_name: str,
        provider_message_id: str,
        status: str,
        payload_json: dict[str, Any] | None = None,
        error_text: str | None = None,
        status_at: datetime | None = None,
    ):
        return await self.apply_provider_status(
            provider_name=provider_name,
            provider_message_id=provider_message_id,
            status=status,
            status_at=status_at,
            error_text=error_text,
            payload_json=payload_json,
        )
