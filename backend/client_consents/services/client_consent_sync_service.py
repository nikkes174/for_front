from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

from client_circout.backend.client_consents.models import ClientConsentModel
from client_circout.backend.client_consents.schemas import ClientConsentCreateSchema, ClientConsentUpdateSchema
from client_circout.backend.client_consents.services.client_consent_service import ClientConsentService
from client_circout.backend.client_consents.services.client_consent_source_service import (
    ClientConsentSourceService,
)


@dataclass(frozen=True, slots=True)
class ExternalConsentPayload:
    organization_id: int
    client_id: int
    service_messages_allowed: bool
    marketing_messages_allowed: bool
    sms_allowed: bool
    email_allowed: bool
    telegram_allowed: bool
    consent_text: str | None
    consent_source: str | None
    consent_given_at: datetime | None = None
    comment: str | None = None


class ClientConsentSyncService:
    def __init__(
        self,
        consent_service: ClientConsentService,
        source_service: ClientConsentSourceService | None = None,
    ) -> None:
        self._consent_service = consent_service
        self._source_service = source_service or ClientConsentSourceService()

    async def sync_from_external_payload(
        self,
        payload: ExternalConsentPayload,
        *,
        create_new_version: bool = True,
    ) -> ClientConsentModel:
        source = self._source_service.normalize(payload.consent_source)
        create_schema = ClientConsentCreateSchema(
            organization_id=payload.organization_id,
            client_id=payload.client_id,
            service_messages_allowed=payload.service_messages_allowed,
            marketing_messages_allowed=payload.marketing_messages_allowed,
            sms_allowed=payload.sms_allowed,
            email_allowed=payload.email_allowed,
            telegram_allowed=payload.telegram_allowed,
            consent_given_at=payload.consent_given_at,
            consent_text=payload.consent_text,
            consent_source=source,
            comment=payload.comment,
        )

        if create_new_version:
            return await self._consent_service.create_version(create_schema)

        current = await self._consent_service.get_current_by_client_id(payload.client_id)
        if current is None:
            return await self._consent_service.create(create_schema)

        update_schema = ClientConsentUpdateSchema(
            service_messages_allowed=payload.service_messages_allowed,
            marketing_messages_allowed=payload.marketing_messages_allowed,
            sms_allowed=payload.sms_allowed,
            email_allowed=payload.email_allowed,
            telegram_allowed=payload.telegram_allowed,
            consent_given_at=payload.consent_given_at,
            consent_text=payload.consent_text,
            consent_source=source,
            comment=payload.comment,
        )
        return await self._consent_service.update(current.id, update_schema)

    async def sync_revocation(
        self,
        *,
        client_id: int,
        comment: str | None = None,
    ) -> ClientConsentModel:
        return await self._consent_service.revoke_current_by_client_id(
            client_id,
            comment=comment,
        )
