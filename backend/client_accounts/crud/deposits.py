
from __future__ import annotations

from collections.abc import Sequence
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_accounts.models.deposits import ClientDepositModel


class ClientDepositConflictError(Exception):
    pass


class ClientDepositCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientDepositModel:
        deposit = ClientDepositModel(**payload)
        self._session.add(deposit)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientDepositConflictError from exc

        await self._session.refresh(deposit)
        return deposit

    async def get_by_id(
        self,
        deposit_id: int,
    ) -> ClientDepositModel | None:
        return await self._session.get(ClientDepositModel, deposit_id)

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientDepositModel]:
        stmt = (
            select(ClientDepositModel)
            .where(ClientDepositModel.client_id == client_id)
            .order_by(ClientDepositModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_active_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientDepositModel]:
        stmt = select(ClientDepositModel).where(
            ClientDepositModel.client_id == client_id,
            ClientDepositModel.status == "active",
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        deposit: ClientDepositModel,
        payload: dict,
    ) -> ClientDepositModel:
        for key, value in payload.items():
            setattr(deposit, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientDepositConflictError from exc

        await self._session.refresh(deposit)
        return deposit

    async def update_balance(
        self,
        deposit: ClientDepositModel,
        *,
        balance: Decimal,
    ) -> ClientDepositModel:
        deposit.balance = balance

        await self._session.commit()
        await self._session.refresh(deposit)

        return deposit

    async def delete(self, deposit: ClientDepositModel) -> None:
        await self._session.delete(deposit)
        await self._session.commit()
