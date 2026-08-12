from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_history.models.client_check import ClientCheckModel


class ClientCheckConflictError(Exception):
    pass

class ClientCheckCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientCheckModel:
        check = ClientCheckModel(**payload)
        self._session.add(check)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCheckConflictError from exc

        await self._session.refresh(check)
        return check

    async def get_by_id(self, check_id: int) -> ClientCheckModel | None:
        return await self._session.get(ClientCheckModel, check_id)

    async def get_by_check_number(
        self,
        *,
        organization_id: int,
        check_number: str,
    ) -> ClientCheckModel | None:
        stmt = select(ClientCheckModel).where(
            ClientCheckModel.organization_id == organization_id,
            ClientCheckModel.check_number == check_number,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        visit_id: int | None = None,
        sale_id: int | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientCheckModel]:
        stmt = select(ClientCheckModel)

        if organization_id is not None:
            stmt = stmt.where(ClientCheckModel.organization_id == organization_id)

        if client_id is not None:
            stmt = stmt.where(ClientCheckModel.client_id == client_id)

        if visit_id is not None:
            stmt = stmt.where(ClientCheckModel.visit_id == visit_id)

        if sale_id is not None:
            stmt = stmt.where(ClientCheckModel.sale_id == sale_id)

        if date_from is not None:
            stmt = stmt.where(ClientCheckModel.issued_at >= date_from)

        if date_to is not None:
            stmt = stmt.where(ClientCheckModel.issued_at <= date_to)

        stmt = stmt.order_by(ClientCheckModel.issued_at.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        check: ClientCheckModel,
        payload: dict,
    ) -> ClientCheckModel:
        for field, value in payload.items():
            setattr(check, field, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCheckConflictError from exc

        await self._session.refresh(check)
        return check

    async def delete(self, check: ClientCheckModel) -> None:
        await self._session.delete(check)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCheckConflictError from exc