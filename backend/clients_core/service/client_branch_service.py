from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import datetime
from typing import Any

from pydantic import BaseModel

from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.clients_core.crud.client_branch import ClientBranchConflictError, ClientBranchCrud
from client_circout.backend.clients_core.models.client_branch import ClientBranchModel
from client_circout.backend.clients_core.service._utils import payload_to_dict, utc_now
from client_circout.backend.clients_core.service.exceptions import EntityConflictError, EntityNotFoundError


class ClientBranchService:
    def __init__(
        self,
        client_crud: ClientCrud,
        client_branch_crud: ClientBranchCrud,
    ) -> None:
        self._client_crud = client_crud
        self._client_branch_crud = client_branch_crud

    async def link_branch(
        self,
        payload: BaseModel | Mapping[str, Any],
    ) -> ClientBranchModel:
        data = payload_to_dict(payload, exclude_unset=False)
        await self._ensure_client_exists(data["client_id"])

        existing = await self._client_branch_crud.get_by_client_and_branch(
            client_id=data["client_id"],
            branch_id=data["branch_id"],
        )
        if existing is not None:
            return await self.update_visit_dates(existing.id, payload=data)

        try:
            return await self._client_branch_crud.create(data)
        except ClientBranchConflictError as exc:
            existing = await self._client_branch_crud.get_by_client_and_branch(
                client_id=data["client_id"],
                branch_id=data["branch_id"],
            )
            if existing is not None:
                return await self.update_visit_dates(existing.id, payload=data)
            raise EntityConflictError("client branch create conflict") from exc

    async def register_visit(
        self,
        *,
        client_id: int,
        branch_id: int,
        visit_at: datetime | None = None,
    ) -> ClientBranchModel:
        await self._ensure_client_exists(client_id)
        visit_at = visit_at or utc_now()

        existing = await self._client_branch_crud.get_by_client_and_branch(
            client_id=client_id,
            branch_id=branch_id,
        )

        if existing is None:
            try:
                return await self._client_branch_crud.create(
                    {
                        "client_id": client_id,
                        "branch_id": branch_id,
                        "first_visit_at": visit_at,
                        "last_visit_at": visit_at,
                    },
                )
            except ClientBranchConflictError:
                existing = await self._client_branch_crud.get_by_client_and_branch(
                    client_id=client_id,
                    branch_id=branch_id,
                )
                if existing is None:
                    raise

        first_visit_at = existing.first_visit_at
        last_visit_at = existing.last_visit_at

        if first_visit_at is None or visit_at < first_visit_at:
            first_visit_at = visit_at

        if last_visit_at is None or visit_at > last_visit_at:
            last_visit_at = visit_at

        return await self._client_branch_crud.update(
            existing,
            {
                "first_visit_at": first_visit_at,
                "last_visit_at": last_visit_at,
            },
        )

    async def get_relation(self, relation_id: int) -> ClientBranchModel:
        relation = await self._client_branch_crud.get_by_id(relation_id)
        if relation is None:
            raise EntityNotFoundError("client_branch", relation_id)

        return relation

    async def get_by_client_and_branch(
        self,
        *,
        client_id: int,
        branch_id: int,
    ) -> ClientBranchModel | None:
        return await self._client_branch_crud.get_by_client_and_branch(
            client_id=client_id,
            branch_id=branch_id,
        )

    async def list_relations(
        self,
        *,
        client_id: int | None = None,
        branch_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientBranchModel]:
        return await self._client_branch_crud.list(
            client_id=client_id,
            branch_id=branch_id,
            offset=offset,
            limit=limit,
        )

    async def update_visit_dates(
        self,
        relation_id: int,
        payload: BaseModel | Mapping[str, Any],
    ) -> ClientBranchModel:
        relation = await self.get_relation(relation_id)
        data = payload_to_dict(payload)

        if not data:
            return relation

        try:
            return await self._client_branch_crud.update(relation, data)
        except ClientBranchConflictError as exc:
            raise EntityConflictError("client branch update conflict") from exc

    async def delete_relation(self, relation_id: int) -> None:
        relation = await self.get_relation(relation_id)

        try:
            await self._client_branch_crud.delete(relation)
        except ClientBranchConflictError as exc:
            raise EntityConflictError("client branch delete conflict") from exc

    async def _ensure_client_exists(self, client_id: int) -> None:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise EntityNotFoundError("client", client_id)
