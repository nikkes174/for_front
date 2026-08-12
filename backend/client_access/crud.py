from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_access.models import ClientAccessScopeModel


class ClientAccessScopeConflictError(Exception):
    pass


class ClientAccessScopeCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientAccessScopeModel:
        scope = ClientAccessScopeModel(**payload)
        self._session.add(scope)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientAccessScopeConflictError from exc

        await self._session.refresh(scope)
        return scope

    async def get_by_id(
        self,
        scope_id: int,
    ) -> ClientAccessScopeModel | None:
        return await self._session.get(ClientAccessScopeModel, scope_id)

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientAccessScopeModel]:
        stmt = (
            select(ClientAccessScopeModel)
            .where(ClientAccessScopeModel.client_id == client_id)
            .order_by(ClientAccessScopeModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_employee_id(
        self,
        *,
        employee_id: int,
    ) -> Sequence[ClientAccessScopeModel]:
        stmt = (
            select(ClientAccessScopeModel)
            .where(ClientAccessScopeModel.employee_id == employee_id)
            .order_by(ClientAccessScopeModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_role_id(
        self,
        *,
        role_id: int,
    ) -> Sequence[ClientAccessScopeModel]:
        stmt = (
            select(ClientAccessScopeModel)
            .where(ClientAccessScopeModel.role_id == role_id)
            .order_by(ClientAccessScopeModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        scope: ClientAccessScopeModel,
        payload: dict,
    ) -> ClientAccessScopeModel:
        for key, value in payload.items():
            setattr(scope, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientAccessScopeConflictError from exc

        await self._session.refresh(scope)
        return scope

    async def delete(self, scope: ClientAccessScopeModel) -> None:
        await self._session.delete(scope)
        await self._session.commit()
