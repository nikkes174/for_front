from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from pydantic import BaseModel

from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.clients_core.crud.client_categories import (
    ClientCategoryConflictError,
    ClientCategoryCrud,
    ClientCategoryLinkConflictError,
    ClientCategoryLinkCrud,
)
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.clients_core.models.client_categories import ClientCategoryLinkModel, ClientCategoryModel
from client_circout.backend.clients_core.service._utils import payload_to_dict, utc_now
from client_circout.backend.clients_core.service.exceptions import EntityConflictError, EntityNotFoundError


class ClientCategoryService:
    def __init__(
        self,
        client_crud: ClientCrud,
        category_crud: ClientCategoryCrud,
        category_link_crud: ClientCategoryLinkCrud,
    ) -> None:
        self._client_crud = client_crud
        self._category_crud = category_crud
        self._category_link_crud = category_link_crud

    async def create_category(
        self,
        payload: BaseModel | Mapping[str, Any],
    ) -> ClientCategoryModel:
        data = payload_to_dict(payload, exclude_unset=False)
        data["name"] = data["name"].strip()
        data.setdefault("created_at", utc_now())

        existing = await self._category_crud.get_by_name(
            organization_id=data["organization_id"],
            name=data["name"],
        )
        if existing is not None:
            raise EntityConflictError("client category already exists")

        try:
            return await self._category_crud.create(data)
        except ClientCategoryConflictError as exc:
            raise EntityConflictError("client category create conflict") from exc

    async def get_category(self, category_id: int) -> ClientCategoryModel:
        category = await self._category_crud.get_by_id(category_id)
        if category is None:
            raise EntityNotFoundError("client_category", category_id)

        return category

    async def list_categories(
        self,
        *,
        organization_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientCategoryModel]:
        return await self._category_crud.list(
            organization_id=organization_id,
            offset=offset,
            limit=limit,
        )

    async def update_category(
        self,
        category_id: int,
        payload: BaseModel | Mapping[str, Any],
    ) -> ClientCategoryModel:
        category = await self.get_category(category_id)
        data = payload_to_dict(payload)

        if not data:
            return category

        if "name" in data and data["name"] is not None:
            data["name"] = data["name"].strip()
            existing = await self._category_crud.get_by_name(
                organization_id=category.organization_id,
                name=data["name"],
            )
            if existing is not None and existing.id != category.id:
                raise EntityConflictError("client category already exists")

        data["updated_at"] = utc_now()

        try:
            return await self._category_crud.update(category, data)
        except ClientCategoryConflictError as exc:
            raise EntityConflictError("client category update conflict") from exc

    async def delete_category(self, category_id: int) -> None:
        category = await self.get_category(category_id)

        try:
            await self._category_crud.delete(category)
        except ClientCategoryConflictError as exc:
            raise EntityConflictError("client category delete conflict") from exc

    async def assign_category(
        self,
        *,
        client_id: int,
        category_id: int,
        created_by: int | None = None,
    ) -> ClientCategoryLinkModel:
        await self._ensure_client_exists(client_id)
        await self.get_category(category_id)

        existing = await self._category_link_crud.get_by_client_and_category(
            client_id=client_id,
            category_id=category_id,
        )
        if existing is not None:
            return existing

        try:
            return await self._category_link_crud.create(
                {
                    "client_id": client_id,
                    "category_id": category_id,
                    "created_at": utc_now(),
                    "created_by": created_by,
                },
            )
        except ClientCategoryLinkConflictError as exc:
            existing = await self._category_link_crud.get_by_client_and_category(
                client_id=client_id,
                category_id=category_id,
            )
            if existing is not None:
                return existing
            raise EntityConflictError("client category assign conflict") from exc

    async def remove_category(
        self,
        *,
        client_id: int,
        category_id: int,
    ) -> None:
        link = await self._category_link_crud.get_by_client_and_category(
            client_id=client_id,
            category_id=category_id,
        )
        if link is None:
            return

        try:
            await self._category_link_crud.delete(link)
        except ClientCategoryLinkConflictError as exc:
            raise EntityConflictError("client category remove conflict") from exc

    async def list_client_categories(
        self,
        client_id: int,
        *,
        offset: int = 0,
        limit: int = 100,
    ) -> list[ClientCategoryModel]:
        await self._ensure_client_exists(client_id)

        links = await self._category_link_crud.list(
            client_id=client_id,
            offset=offset,
            limit=limit,
        )

        categories: list[ClientCategoryModel] = []
        for link in links:
            category = await self._category_crud.get_by_id(link.category_id)
            if category is not None:
                categories.append(category)

        return categories

    async def filter_clients_by_categories(
        self,
        category_ids: Sequence[int],
        *,
        organization_id: int | None = None,
        status: str | None = None,
        match_all: bool = False,
        offset: int = 0,
        limit: int = 100,
    ) -> list[ClientModel]:
        if not category_ids:
            clients = await self._client_crud.list(
                organization_id=organization_id,
                status=status,
                offset=offset,
                limit=limit,
            )
            return list(clients)

        client_id_sets: list[set[int]] = []

        for category_id in category_ids:
            links = await self._category_link_crud.list(
                category_id=category_id,
                offset=0,
                limit=max(limit * 20, 1000),
            )
            client_id_sets.append({link.client_id for link in links})

        client_ids = set.intersection(*client_id_sets) if match_all else set.union(*client_id_sets)

        clients: list[ClientModel] = []
        for client_id in sorted(client_ids):
            client = await self._client_crud.get_by_id(client_id)
            if client is None:
                continue

            if organization_id is not None and client.organization_id != organization_id:
                continue

            if status is not None and client.status != status:
                continue

            clients.append(client)

        return clients[offset : offset + limit]

    async def _ensure_client_exists(self, client_id: int) -> None:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise EntityNotFoundError("client", client_id)
