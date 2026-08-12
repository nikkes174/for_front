from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_profile.models.favorite_services import ClientFavoriteServiceModel


class ClientFavoriteServiceConflictError(Exception):
    pass


class ClientFavoriteServiceCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientFavoriteServiceModel:
        favorite = ClientFavoriteServiceModel(**payload)
        self._session.add(favorite)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFavoriteServiceConflictError from exc

        await self._session.refresh(favorite)
        return favorite

    async def get_by_id(self, favorite_id: int) -> ClientFavoriteServiceModel | None:
        return await self._session.get(ClientFavoriteServiceModel, favorite_id)

    async def get_by_client_and_service(
        self,
        *,
        client_id: int,
        service_id: int,
    ) -> ClientFavoriteServiceModel | None:
        stmt = select(ClientFavoriteServiceModel).where(
            ClientFavoriteServiceModel.client_id == client_id,
            ClientFavoriteServiceModel.service_id == service_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        client_id: int | None = None,
        service_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientFavoriteServiceModel]:
        stmt = select(ClientFavoriteServiceModel)

        if client_id is not None:
            stmt = stmt.where(ClientFavoriteServiceModel.client_id == client_id)

        if service_id is not None:
            stmt = stmt.where(ClientFavoriteServiceModel.service_id == service_id)

        stmt = stmt.order_by(ClientFavoriteServiceModel.usage_count.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        favorite: ClientFavoriteServiceModel,
        payload: dict,
    ) -> ClientFavoriteServiceModel:
        for field, value in payload.items():
            setattr(favorite, field, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFavoriteServiceConflictError from exc

        await self._session.refresh(favorite)
        return favorite

    async def delete(self, favorite: ClientFavoriteServiceModel) -> None:
        await self._session.delete(favorite)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFavoriteServiceConflictError from exc