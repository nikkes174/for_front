from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_consents.models import ClientConsentModel
from client_circout.backend.client_consents.schemas import ClientConsentCreateSchema
from client_circout.backend.client_consents.services.client_consent_service import ClientConsentService


class ClientConsentHistoryService:
    def __init__(
        self,
        consent_crud: ClientConsentCrud,
        consent_service: ClientConsentService,
    ) -> None:
        self._consent_crud = consent_crud
        self._consent_service = consent_service

    async def list_by_client(self, client_id: int) -> Sequence[ClientConsentModel]:
        return await self._consent_crud.get_by_client_id(client_id=client_id)

    async def append_version(
        self,
        payload: ClientConsentCreateSchema,
        *,
        revoke_previous: bool = True,
    ) -> ClientConsentModel:
        return await self._consent_service.create_version(
            payload,
            revoke_previous=revoke_previous,
        )

    async def get_last_change(self, client_id: int) -> ClientConsentModel | None:
        items = await self._consent_crud.get_by_client_id(client_id=client_id)
        return items[0] if items else None
