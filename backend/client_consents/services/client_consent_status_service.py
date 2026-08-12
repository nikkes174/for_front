from __future__ import annotations

from dataclasses import dataclass

from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_consents.models import ClientConsentModel
from client_circout.backend.client_consents.services.exceptions import (
    ClientConsentInvalidChannelError,
    ClientConsentInvalidMessageTypeError,
)


@dataclass(frozen=True, slots=True)
class ClientConsentStatus:
    client_id: int
    service_messages_allowed: bool
    marketing_messages_allowed: bool
    sms_allowed: bool
    email_allowed: bool
    telegram_allowed: bool
    is_revoked: bool
    comment: str | None


class ClientConsentStatusService:
    CHANNEL_TO_FIELD: dict[str, str] = {
        "sms": "sms_allowed",
        "email": "email_allowed",
        "telegram": "telegram_allowed",
    }

    MESSAGE_TYPES = {"service", "marketing"}

    def __init__(self, consent_crud: ClientConsentCrud) -> None:
        self._consent_crud = consent_crud

    async def get_current_status(self, client_id: int) -> ClientConsentStatus:
        consent = await self._consent_crud.get_current_by_client_id(client_id=client_id)
        if consent is None:
            return ClientConsentStatus(
                client_id=client_id,
                service_messages_allowed=False,
                marketing_messages_allowed=False,
                sms_allowed=False,
                email_allowed=False,
                telegram_allowed=False,
                is_revoked=True,
                comment=None,
            )

        return self.build_status(consent)

    def build_status(self, consent: ClientConsentModel) -> ClientConsentStatus:
        is_revoked = consent.consent_revoked_at is not None
        return ClientConsentStatus(
            client_id=consent.client_id,
            service_messages_allowed=consent.service_messages_allowed and not is_revoked,
            marketing_messages_allowed=consent.marketing_messages_allowed and not is_revoked,
            sms_allowed=consent.sms_allowed and not is_revoked,
            email_allowed=consent.email_allowed and not is_revoked,
            telegram_allowed=consent.telegram_allowed and not is_revoked,
            is_revoked=is_revoked,
            comment=consent.comment,
        )

    async def is_channel_allowed(self, client_id: int, channel: str) -> bool:
        field_name = self._get_channel_field(channel)
        status = await self.get_current_status(client_id)
        return bool(getattr(status, field_name))

    async def can_send(
        self,
        *,
        client_id: int,
        channel: str,
        message_type: str,
    ) -> bool:
        field_name = self._get_channel_field(channel)
        message_type = message_type.strip().lower()
        if message_type not in self.MESSAGE_TYPES:
            raise ClientConsentInvalidMessageTypeError(message_type)

        status = await self.get_current_status(client_id)
        if status.is_revoked:
            return False

        channel_allowed = bool(getattr(status, field_name))
        if message_type == "service":
            return channel_allowed and status.service_messages_allowed

        return channel_allowed and status.marketing_messages_allowed

    def _get_channel_field(self, channel: str) -> str:
        normalized = channel.strip().lower()
        field_name = self.CHANNEL_TO_FIELD.get(normalized)
        if field_name is None:
            raise ClientConsentInvalidChannelError(channel)
        return field_name
