from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.clients_core.crud.client_duplicate_candidates import (
    ClientDuplicateCandidateConflictError,
    ClientDuplicateCandidateCrud,
)
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.clients_core.models.client_duplicate_candidates import ClientDuplicateCandidateModel
from client_circout.backend.clients_core.service._utils import utc_now, normalize_email
from client_circout.backend.clients_core.service.exceptions import EntityConflictError, EntityNotFoundError
from client_circout.backend.global_utils import normalize_phone

CANDIDATE_STATUS_NEW = "new"
CANDIDATE_STATUS_APPROVED = "approved"
CANDIDATE_STATUS_REJECTED = "rejected"
CANDIDATE_STATUS_IGNORED = "ignored"


class ClientDuplicatesService:
    def __init__(
        self,
        client_crud: ClientCrud,
        duplicate_candidate_crud: ClientDuplicateCandidateCrud,
    ) -> None:
        self._client_crud = client_crud
        self._duplicate_candidate_crud = duplicate_candidate_crud

    async def create_candidate(
        self,
        *,
        organization_id: int,
        client_id: int,
        duplicate_client_id: int,
        match_score: float,
        match_reason: str | None = None,
        status: str = CANDIDATE_STATUS_NEW,
    ) -> ClientDuplicateCandidateModel:
        client_id, duplicate_client_id = sorted((client_id, duplicate_client_id))
        await self._ensure_client_exists(client_id)
        await self._ensure_client_exists(duplicate_client_id)

        existing = await self._get_existing_candidate(
            client_id=client_id,
            duplicate_client_id=duplicate_client_id,
        )
        if existing is not None:
            return existing

        try:
            return await self._duplicate_candidate_crud.create(
                {
                    "organization_id": organization_id,
                    "client_id": client_id,
                    "duplicate_client_id": duplicate_client_id,
                    "match_score": match_score,
                    "match_reason": match_reason,
                    "status": status,
                    "created_at": utc_now(),
                },
            )
        except ClientDuplicateCandidateConflictError as exc:
            existing = await self._get_existing_candidate(
                client_id=client_id,
                duplicate_client_id=duplicate_client_id,
            )
            if existing is not None:
                return existing
            raise EntityConflictError("client duplicate candidate create conflict") from exc

    async def get_candidate(self, candidate_id: int) -> ClientDuplicateCandidateModel:
        candidate = await self._duplicate_candidate_crud.get_by_id(candidate_id)
        if candidate is None:
            raise EntityNotFoundError("client_duplicate_candidate", candidate_id)

        return candidate

    async def list_candidates(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientDuplicateCandidateModel]:
        return await self._duplicate_candidate_crud.list(
            organization_id=organization_id,
            client_id=client_id,
            status=status,
            offset=offset,
            limit=limit,
        )

    async def find_and_save_candidates(
        self,
        *,
        organization_id: int,
        client_id: int,
        min_score: float = 0.75,
        status: str | None = "active",
        scan_limit: int = 1000,
    ) -> list[ClientDuplicateCandidateModel]:
        source_client = await self._ensure_client_exists(client_id)

        clients = await self._client_crud.list(
            organization_id=organization_id,
            status=status,
            offset=0,
            limit=scan_limit,
        )

        candidates: list[ClientDuplicateCandidateModel] = []

        for client in clients:
            if client.id == source_client.id:
                continue

            score, reason = self._calculate_match_score(source_client, client)
            if score < min_score:
                continue

            candidates.append(
                await self.create_candidate(
                    organization_id=organization_id,
                    client_id=source_client.id,
                    duplicate_client_id=client.id,
                    match_score=score,
                    match_reason=reason,
                ),
            )

        return candidates

    async def approve_candidate(self, candidate_id: int) -> ClientDuplicateCandidateModel:
        return await self.change_candidate_status(candidate_id, CANDIDATE_STATUS_APPROVED)

    async def reject_candidate(self, candidate_id: int) -> ClientDuplicateCandidateModel:
        return await self.change_candidate_status(candidate_id, CANDIDATE_STATUS_REJECTED)

    async def ignore_candidate(self, candidate_id: int) -> ClientDuplicateCandidateModel:
        return await self.change_candidate_status(candidate_id, CANDIDATE_STATUS_IGNORED)

    async def change_candidate_status(
        self,
        candidate_id: int,
        status: str,
    ) -> ClientDuplicateCandidateModel:
        candidate = await self.get_candidate(candidate_id)

        try:
            return await self._duplicate_candidate_crud.update(candidate, {"status": status})
        except ClientDuplicateCandidateConflictError as exc:
            raise EntityConflictError("client duplicate candidate update conflict") from exc

    async def delete_candidate(self, candidate_id: int) -> None:
        candidate = await self.get_candidate(candidate_id)

        try:
            await self._duplicate_candidate_crud.delete(candidate)
        except ClientDuplicateCandidateConflictError as exc:
            raise EntityConflictError("client duplicate candidate delete conflict") from exc

    async def _ensure_client_exists(self, client_id: int) -> ClientModel:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise EntityNotFoundError("client", client_id)

        return client

    async def _get_existing_candidate(
        self,
        *,
        client_id: int,
        duplicate_client_id: int,
    ) -> ClientDuplicateCandidateModel | None:
        existing = await self._duplicate_candidate_crud.get_by_clients(
            client_id=client_id,
            duplicate_client_id=duplicate_client_id,
        )
        if existing is not None:
            return existing

        return await self._duplicate_candidate_crud.get_by_clients(
            client_id=duplicate_client_id,
            duplicate_client_id=client_id,
        )

    @staticmethod
    def _calculate_match_score(
        client: ClientModel,
        other_client: ClientModel,
    ) -> tuple[float, str | None]:
        score = 0.0
        reasons: list[str] = []

        for field_name in ("telegram_id", "max_id", "vk_id"):
            value = getattr(client, field_name)
            other_value = getattr(other_client, field_name)
            if value is not None and value == other_value:
                score = max(score, 1.0)
                reasons.append(field_name)

        phone = normalize_phone(client.primary_phone)
        other_phone = normalize_phone(other_client.primary_phone)
        if phone and other_phone:
            if phone == other_phone:
                score = max(score, 0.95)
                reasons.append("primary_phone")
            elif len(phone) >= 10 and len(other_phone) >= 10 and phone[-10:] == other_phone[-10:]:
                score = max(score, 0.9)
                reasons.append("primary_phone_last_10")

        email = normalize_email(client.email)
        other_email = normalize_email(other_client.email)
        if email and other_email and email == other_email:
            score = max(score, 0.9)
            reasons.append("email")

        full_name = (client.full_name or "").strip().lower()
        other_full_name = (other_client.full_name or "").strip().lower()
        if full_name and full_name == other_full_name:
            if client.birth_date and client.birth_date == other_client.birth_date:
                score = max(score, 0.85)
                reasons.append("full_name_birth_date")
            else:
                score = max(score, 0.65)
                reasons.append("full_name")

        return score, ", ".join(reasons) or None
