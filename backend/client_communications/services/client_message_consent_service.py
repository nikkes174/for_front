from __future__ import annotations

from dataclasses import dataclass

from client_circout.backend.client_communications.services.client_message_channel_service import (
    ClientMessageChannelService,
)
from client_circout.backend.client_communications.services.client_message_template_service import (
    ClientMessageTemplateService,
)
from client_circout.backend.client_communications.services.exceptions import (
    ClientCommunicationConsentDeniedError,
)
from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_consents.models import ClientConsentModel


@dataclass(frozen=True, slots=True)
class ClientMessageConsentDecision:
    allowed: bool
    reason: str | None = None
    consent: ClientConsentModel | None = None


class ClientMessageConsentService:
    def __init__(
        self,
        consent_crud: ClientConsentCrud,
        channel_service: ClientMessageChannelService | None = None,
        template_service: ClientMessageTemplateService | None = None,
    ) -> None:
        self._consent_crud = consent_crud
        self._channel_service = channel_service or ClientMessageChannelService()
        self._template_service = template_service or ClientMessageTemplateService()

    async def get_current_consent(self, *, client_id: int) -> ClientConsentModel | None:
        return await self._consent_crud.get_current_by_client_id(client_id=client_id)

    async def can_send(
        self,
        *,
        client_id: int,
        channel: str,
        message_type: str,
    ) -> ClientMessageConsentDecision:
        normalized_channel = self._channel_service.validate(channel)
        normalized_type = self._template_service.validate(message_type)
        consent = await self.get_current_consent(client_id=client_id)

        if consent is None:
            return ClientMessageConsentDecision(
                allowed=False,
                reason="consent_not_found",
                consent=None,
            )

        if consent.consent_revoked_at is not None:
            return ClientMessageConsentDecision(
                allowed=False,
                reason="consent_revoked",
                consent=consent,
            )

        if self._template_service.is_marketing_type(normalized_type):
            if not consent.marketing_messages_allowed:
                return ClientMessageConsentDecision(
                    allowed=False,
                    reason="marketing_messages_denied",
                    consent=consent,
                )

        if self._template_service.is_service_type(normalized_type):
            if not consent.service_messages_allowed:
                return ClientMessageConsentDecision(
                    allowed=False,
                    reason="service_messages_denied",
                    consent=consent,
                )

        consent_field = self._channel_service.get_consent_field(normalized_channel)

        if consent_field is not None and not bool(getattr(consent, consent_field)):
            return ClientMessageConsentDecision(
                allowed=False,
                reason=f"{consent_field}_denied",
                consent=consent,
            )

        return ClientMessageConsentDecision(allowed=True, consent=consent)

    async def ensure_can_send(
        self,
        *,
        client_id: int,
        channel: str,
        message_type: str,
    ) -> ClientMessageConsentDecision:
        decision = await self.can_send(
            client_id=client_id,
            channel=channel,
            message_type=message_type,
        )

        if not decision.allowed:
            raise ClientCommunicationConsentDeniedError(decision.reason)

        return decision
