from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from pydantic import BaseModel

from client_circout.backend.clients_core.crud.client import ClientConflictError, ClientCrud
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.clients_core.service._utils import (
    build_full_name,
    normalize_email,
    normalize_phone,
    payload_to_dict,
    utc_now,
)
from client_circout.backend.clients_core.service.exceptions import EntityConflictError, EntityNotFoundError


class ClientService:
    def __init__(self, client_crud: ClientCrud) -> None:
        self._client_crud = client_crud

    async def create(
        self,
        payload: BaseModel | Mapping[str, Any],
    ) -> ClientModel:
        data = payload_to_dict(payload, exclude_unset=False)
        data.setdefault("created_at", utc_now())
        data.setdefault("status", "active")
        self._normalize_identity_fields(data)

        if not data.get("full_name"):
            data["full_name"] = build_full_name(data)

        await self._ensure_create_unique_fields(data)

        try:
            return await self._client_crud.create(data)
        except ClientConflictError as exc:
            raise EntityConflictError(f"client create conflict: {exc}") from exc

    async def get(self, client_id: int) -> ClientModel:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise EntityNotFoundError("client", client_id)

        return client

    async def get_optional(self, client_id: int) -> ClientModel | None:
        return await self._client_crud.get_by_id(client_id)

    async def get_by_telegram_id(self, telegram_id: int) -> ClientModel | None:
        return await self._client_crud.get_by_telegram_id(telegram_id)

    async def get_by_max_id(self, max_id: int) -> ClientModel | None:
        return await self._client_crud.get_by_max_id(max_id)

    async def get_by_vk_id(self, vk_id: int) -> ClientModel | None:
        return await self._client_crud.get_by_vk_id(vk_id)

    async def get_by_primary_phone(self, phone: str) -> ClientModel | None:
        return await self._client_crud.get_by_primary_phone(phone)

    async def get_by_email(self, email: str) -> ClientModel | None:
        return await self._client_crud.get_by_email(email)

    async def list(
        self,
        *,
        organization_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientModel]:
        return await self._client_crud.list(
            organization_id=organization_id,
            status=status,
            offset=offset,
            limit=limit,
        )

    async def update(
        self,
        client_id: int,
        payload: BaseModel | Mapping[str, Any],
    ) -> ClientModel:
        client = await self.get(client_id)
        data = payload_to_dict(payload)

        if not data:
            return client

        data["updated_at"] = utc_now()
        self._normalize_identity_fields(data)

        if "full_name" not in data and {
            "last_name",
            "first_name",
            "middle_name",
        }.intersection(data):
            name_data = {
                "last_name": client.last_name,
                "first_name": client.first_name,
                "middle_name": client.middle_name,
            }
            name_data.update(data)
            data["full_name"] = build_full_name(name_data)

        try:
            return await self._client_crud.update(client, data)
        except ClientConflictError as exc:
            raise EntityConflictError(f"client update conflict: {exc}") from exc

    async def change_status(
        self,
        client_id: int,
        status: str,
    ) -> ClientModel:
        return await self.update(client_id, {"status": status})

    async def archive(
        self,
        client_id: int,
        *,
        archived_by: int | None = None,
        status: str = "archived",
    ) -> ClientModel:
        now = utc_now()
        return await self.update(
            client_id,
            {
                "status": status,
                "archived_at": now,
                "archived_by": archived_by,
                "updated_at": now,
            },
        )

    async def restore(
        self,
        client_id: int,
        *,
        status: str = "active",
    ) -> ClientModel:
        return await self.update(
            client_id,
            {
                "status": status,
                "archived_at": None,
                "archived_by": None,
            },
        )

    async def delete(self, client_id: int) -> None:
        client = await self.get(client_id)

        try:
            await self._client_crud.delete(client)
        except ClientConflictError as exc:
            raise EntityConflictError(f"client delete conflict: {exc}") from exc

    async def add_organization(self, client_id: int, organization_id: int) -> ClientModel:
        client = await self.get(client_id)
        try:
            return await self._client_crud.add_organization(client, organization_id)
        except ClientConflictError as exc:
            raise EntityConflictError(f"client organization link conflict: {exc}") from exc

    async def _ensure_create_unique_fields(self, data: dict[str, Any]) -> None:
        organization_id = data.get("organization_id")
        if not organization_id:
            return

        email = data.get("email")
        if email:
            existing = await self._client_crud.get_by_org_and_email(organization_id, email)
            if existing is not None:
                raise EntityConflictError("client with this email already exists in the organization")

        telegram_id = data.get("telegram_id")
        if telegram_id is not None:
            existing = await self._client_crud.get_by_org_and_telegram_id(organization_id, telegram_id)
            if existing is not None:
                raise EntityConflictError("client with this Telegram ID already exists in the organization")

        max_id = data.get("max_id")
        if max_id is not None:
            existing = await self._client_crud.get_by_org_and_max_id(organization_id, max_id)
            if existing is not None:
                raise EntityConflictError("client with this MAX ID already exists in the organization")

        vk_id = data.get("vk_id")
        if vk_id is not None:
            existing = await self._client_crud.get_by_org_and_vk_id(organization_id, vk_id)
            if existing is not None:
                raise EntityConflictError("client with this VK ID already exists in the organization")

    @staticmethod
    def _normalize_identity_fields(data: dict[str, Any]) -> None:
        if "primary_phone" in data:
            data["primary_phone"] = normalize_phone(data.get("primary_phone"))

        if "secondary_phone" in data:
            data["secondary_phone"] = normalize_phone(data.get("secondary_phone"))

        if "email" in data:
            data["email"] = normalize_email(data.get("email"))
