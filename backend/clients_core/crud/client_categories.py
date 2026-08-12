from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client_categories import ClientCategoryModel, ClientCategoryLinkModel


class ClientCategoryConflictError(Exception):
    pass


class ClientCategoryCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientCategoryModel:
        category = ClientCategoryModel(**payload)
        self._session.add(category)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCategoryConflictError from exc

        if auto_commit:
            await self._session.refresh(category)
        return category

    async def get_by_id(self, category_id: int) -> ClientCategoryModel | None:
        return await self._session.get(ClientCategoryModel, category_id)

    async def get_by_name(
        self,
        *,
        organization_id: int,
        name: str,
    ) -> ClientCategoryModel | None:
        stmt = select(ClientCategoryModel).where(
            ClientCategoryModel.organization_id == organization_id,
            ClientCategoryModel.name == name,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        organization_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientCategoryModel]:
        stmt = select(ClientCategoryModel)

        if organization_id is not None:
            stmt = stmt.where(ClientCategoryModel.organization_id == organization_id)

        stmt = stmt.order_by(ClientCategoryModel.id).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        category: ClientCategoryModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientCategoryModel:
        for field, value in payload.items():
            setattr(category, field, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCategoryConflictError from exc

        if auto_commit:
            await self._session.refresh(category)
        return category

    async def delete(self, category: ClientCategoryModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(category)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCategoryConflictError from exc


class ClientCategoryLinkConflictError(Exception):
    pass


class ClientCategoryLinkCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientCategoryLinkModel:
        link = ClientCategoryLinkModel(**payload)
        self._session.add(link)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCategoryLinkConflictError from exc

        if auto_commit:
            await self._session.refresh(link)
        return link

    async def get_by_id(self, link_id: int) -> ClientCategoryLinkModel | None:
        return await self._session.get(ClientCategoryLinkModel, link_id)

    async def get_by_client_and_category(
        self,
        *,
        client_id: int,
        category_id: int,
    ) -> ClientCategoryLinkModel | None:
        stmt = select(ClientCategoryLinkModel).where(
            ClientCategoryLinkModel.client_id == client_id,
            ClientCategoryLinkModel.category_id == category_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        client_id: int | None = None,
        category_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientCategoryLinkModel]:
        stmt = select(ClientCategoryLinkModel)

        if client_id is not None:
            stmt = stmt.where(ClientCategoryLinkModel.client_id == client_id)

        if category_id is not None:
            stmt = stmt.where(ClientCategoryLinkModel.category_id == category_id)

        stmt = stmt.order_by(ClientCategoryLinkModel.id).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def delete(self, link: ClientCategoryLinkModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(link)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCategoryLinkConflictError from exc
