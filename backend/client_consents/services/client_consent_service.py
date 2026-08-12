from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_consents.crud import ClientConsentConflictError, ClientConsentCrud
from client_circout.backend.client_consents.models import ClientConsentModel
from client_circout.backend.client_consents.schemas import (
    ClientConsentCreateSchema,
    ClientConsentUpdateSchema,
)
from client_circout.backend.client_consents.services._utils import schema_dump, utc_now
from client_circout.backend.client_consents.services.client_consent_source_service import (
    ClientConsentSourceService,
)
from client_circout.backend.client_consents.services.exceptions import ClientConsentNotFoundError


class ClientConsentService:
    def __init__(
        self,
        consent_crud: ClientConsentCrud,
        source_service: ClientConsentSourceService | None = None,
    ) -> None:
        self._consent_crud = consent_crud
        self._source_service = source_service or ClientConsentSourceService()

    async def create(
        self,
        payload: ClientConsentCreateSchema,
    ) -> ClientConsentModel:
        data = schema_dump(payload)
        data = self._source_service.normalize_payload(data)
        data.setdefault("consent_given_at", utc_now())
        return await self._consent_crud.create(data)

    async def create_version(
        self,
        payload: ClientConsentCreateSchema,
        *,
        revoke_previous: bool = True,
        previous_comment: str | None = "Replaced by newer consent version.",
    ) -> ClientConsentModel:
        if revoke_previous:
            current = await self._consent_crud.get_current_by_client_id(
                client_id=payload.client_id,
            )
            if current is not None:
                await self.revoke(current.id, comment=previous_comment)

        return await self.create(payload)

    async def get(self, consent_id: int) -> ClientConsentModel:
        consent = await self._consent_crud.get_by_id(consent_id)
        if consent is None:
            raise ClientConsentNotFoundError(consent_id)
        return consent

    async def get_current_by_client_id(self, client_id: int) -> ClientConsentModel | None:
        return await self._consent_crud.get_current_by_client_id(client_id=client_id)

    async def get_history_by_client_id(
        self,
        client_id: int,
    ) -> Sequence[ClientConsentModel]:
        return await self._consent_crud.get_by_client_id(client_id=client_id)

    async def update(
        self,
        consent_id: int,
        payload: ClientConsentUpdateSchema,
    ) -> ClientConsentModel:
        consent = await self.get(consent_id)
        data = schema_dump(payload)
        data = self._source_service.normalize_payload(data)
        return await self._consent_crud.update(consent, data)

    async def grant_all_channels(
        self,
        consent_id: int,
        *,
        consent_text: str | None = None,
        consent_source: str | None = None,
    ) -> ClientConsentModel:
        data = {
            "service_messages_allowed": True,
            "marketing_messages_allowed": True,
            "sms_allowed": True,
            "email_allowed": True,
            "telegram_allowed": True,
            "consent_given_at": utc_now(),
            "consent_revoked_at": None,
            "consent_text": consent_text,
            "consent_source": consent_source,
        }
        data = self._source_service.normalize_payload(data)
        consent = await self.get(consent_id)
        return await self._consent_crud.update(consent, data)

    async def revoke(
        self,
        consent_id: int,
        *,
        comment: str | None = None,
    ) -> ClientConsentModel:
        consent = await self.get(consent_id)
        return await self._consent_crud.revoke(
            consent,
            revoked_at=utc_now(),
            comment=comment,
        )

    async def revoke_current_by_client_id(
        self,
        client_id: int,
        *,
        comment: str | None = None,
    ) -> ClientConsentModel:
        consent = await self._consent_crud.get_current_by_client_id(client_id=client_id)
        if consent is None:
            raise ClientConsentNotFoundError(client_id)

        return await self._consent_crud.revoke(
            consent,
            revoked_at=utc_now(),
            comment=comment,
        )

    async def delete(self, consent_id: int) -> None:
        consent = await self.get(consent_id)
        await self._consent_crud.delete(consent)

    @staticmethod
    def map_conflict(exc: ClientConsentConflictError) -> ClientConsentConflictError:
        return exc
