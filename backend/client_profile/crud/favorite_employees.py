from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_profile.models.favorite_employees import ClientFavoriteEmployeeModel


class ClientFavoriteEmployeeConflictError(Exception):
    pass


class ClientFavoriteEmployeeCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientFavoriteEmployeeModel:
        favorite = ClientFavoriteEmployeeModel(**payload)
        self._session.add(favorite)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFavoriteEmployeeConflictError from exc

        await self._session.refresh(favorite)
        return favorite

    async def get_by_id(self, favorite_id: int) -> ClientFavoriteEmployeeModel | None:
        return await self._session.get(ClientFavoriteEmployeeModel, favorite_id)

    async def get_by_client_and_employee(
        self,
        *,
        client_id: int,
        employee_id: int,
    ) -> ClientFavoriteEmployeeModel | None:
        stmt = select(ClientFavoriteEmployeeModel).where(
            ClientFavoriteEmployeeModel.client_id == client_id,
            ClientFavoriteEmployeeModel.employee_id == employee_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        client_id: int | None = None,
        employee_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientFavoriteEmployeeModel]:
        stmt = select(ClientFavoriteEmployeeModel)

        if client_id is not None:
            stmt = stmt.where(ClientFavoriteEmployeeModel.client_id == client_id)

        if employee_id is not None:
            stmt = stmt.where(ClientFavoriteEmployeeModel.employee_id == employee_id)

        stmt = (
            stmt.order_by(ClientFavoriteEmployeeModel.usage_count.desc())
            .offset(offset)
            .limit(limit)
        )

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        favorite: ClientFavoriteEmployeeModel,
        payload: dict,
    ) -> ClientFavoriteEmployeeModel:
        for field, value in payload.items():
            setattr(favorite, field, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFavoriteEmployeeConflictError from exc

        await self._session.refresh(favorite)
        return favorite

    async def delete(self, favorite: ClientFavoriteEmployeeModel) -> None:
        await self._session.delete(favorite)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFavoriteEmployeeConflictError from exc