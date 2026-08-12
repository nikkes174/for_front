from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_consents.models import ClientConsentModel


class ClientConsentQueryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_consents(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        consent_source: str | None = None,
        only_current: bool | None = None,
        service_messages_allowed: bool | None = None,
        marketing_messages_allowed: bool | None = None,
        sms_allowed: bool | None = None,
        email_allowed: bool | None = None,
        telegram_allowed: bool | None = None,
        given_from: datetime | None = None,
        given_to: datetime | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientConsentModel]:
        stmt = select(ClientConsentModel)

        if organization_id is not None:
            stmt = stmt.where(ClientConsentModel.organization_id == organization_id)

        if client_id is not None:
            stmt = stmt.where(ClientConsentModel.client_id == client_id)

        if consent_source is not None:
            stmt = stmt.where(ClientConsentModel.consent_source == consent_source)

        if only_current is True:
            stmt = stmt.where(ClientConsentModel.consent_revoked_at.is_(None))
        elif only_current is False:
            stmt = stmt.where(ClientConsentModel.consent_revoked_at.is_not(None))

        if service_messages_allowed is not None:
            stmt = stmt.where(
                ClientConsentModel.service_messages_allowed == service_messages_allowed,
            )

        if marketing_messages_allowed is not None:
            stmt = stmt.where(
                ClientConsentModel.marketing_messages_allowed
                == marketing_messages_allowed,
            )

        if sms_allowed is not None:
            stmt = stmt.where(ClientConsentModel.sms_allowed == sms_allowed)

        if email_allowed is not None:
            stmt = stmt.where(ClientConsentModel.email_allowed == email_allowed)

        if telegram_allowed is not None:
            stmt = stmt.where(ClientConsentModel.telegram_allowed == telegram_allowed)

        if given_from is not None:
            stmt = stmt.where(ClientConsentModel.consent_given_at >= given_from)

        if given_to is not None:
            stmt = stmt.where(ClientConsentModel.consent_given_at <= given_to)

        stmt = stmt.order_by(ClientConsentModel.created_at.desc()).offset(offset).limit(limit)
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def list_allowed_for_channel(
        self,
        *,
        organization_id: int,
        channel: str,
        message_type: str,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientConsentModel]:
        channel = channel.strip().lower()
        message_type = message_type.strip().lower()

        channel_field = {
            "sms": ClientConsentModel.sms_allowed,
            "email": ClientConsentModel.email_allowed,
            "telegram": ClientConsentModel.telegram_allowed,
        }[channel]

        message_field = {
            "service": ClientConsentModel.service_messages_allowed,
            "marketing": ClientConsentModel.marketing_messages_allowed,
        }[message_type]

        stmt = (
            select(ClientConsentModel)
            .where(
                ClientConsentModel.organization_id == organization_id,
                ClientConsentModel.consent_revoked_at.is_(None),
                channel_field.is_(True),
                message_field.is_(True),
            )
            .order_by(ClientConsentModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()
