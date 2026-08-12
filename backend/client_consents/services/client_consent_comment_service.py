from __future__ import annotations

from dataclasses import dataclass

from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_consents.models import ClientConsentModel
from client_circout.backend.client_consents.services.exceptions import ClientConsentNotFoundError


@dataclass(frozen=True, slots=True)
class ClientCommunicationRestriction:
    no_call: bool
    no_write: bool
    only_specific_time: bool
    raw_comment: str | None


class ClientConsentCommentService:
    NO_CALL_MARKERS = ("не звонить", "no call", "do not call")
    NO_WRITE_MARKERS = ("не писать", "no write", "do not write", "не отправлять")
    SPECIFIC_TIME_MARKERS = ("только", "после", "до ", "время", "time")

    def __init__(self, consent_crud: ClientConsentCrud) -> None:
        self._consent_crud = consent_crud

    async def get_comment(self, consent_id: int) -> str | None:
        consent = await self._get(consent_id)
        return consent.comment

    async def get_current_comment_by_client(self, client_id: int) -> str | None:
        consent = await self._consent_crud.get_current_by_client_id(client_id=client_id)
        return consent.comment if consent is not None else None

    async def update_comment(
        self,
        consent_id: int,
        comment: str | None,
    ) -> ClientConsentModel:
        consent = await self._get(consent_id)
        return await self._consent_crud.update(consent, {"comment": comment})

    async def get_restrictions_by_client(
        self,
        client_id: int,
    ) -> ClientCommunicationRestriction:
        comment = await self.get_current_comment_by_client(client_id)
        return self.parse_restrictions(comment)

    def parse_restrictions(
        self,
        comment: str | None,
    ) -> ClientCommunicationRestriction:
        normalized = (comment or "").lower()
        return ClientCommunicationRestriction(
            no_call=any(marker in normalized for marker in self.NO_CALL_MARKERS),
            no_write=any(marker in normalized for marker in self.NO_WRITE_MARKERS),
            only_specific_time=any(
                marker in normalized for marker in self.SPECIFIC_TIME_MARKERS
            ),
            raw_comment=comment,
        )

    async def _get(self, consent_id: int) -> ClientConsentModel:
        consent = await self._consent_crud.get_by_id(consent_id)
        if consent is None:
            raise ClientConsentNotFoundError(consent_id)
        return consent
