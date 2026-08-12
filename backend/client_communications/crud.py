from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_communications.models import (
    ClientMessageDeliveryLogModel,
    ClientMessageModel,
)


class ClientMessageConflictError(Exception):
    pass


class ClientMessageCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientMessageModel:
        message = ClientMessageModel(**payload)
        self._session.add(message)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientMessageConflictError from exc

        await self._session.refresh(message)
        return message

    async def get_by_id(self, message_id: int) -> ClientMessageModel | None:
        return await self._session.get(ClientMessageModel, message_id)

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientMessageModel]:
        stmt = (
            select(ClientMessageModel)
            .where(ClientMessageModel.client_id == client_id)
            .order_by(ClientMessageModel.sent_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_delivery_status(
        self,
        *,
        delivery_status: str,
    ) -> Sequence[ClientMessageModel]:
        stmt = (
            select(ClientMessageModel)
            .where(ClientMessageModel.delivery_status == delivery_status)
            .order_by(ClientMessageModel.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        message: ClientMessageModel,
        payload: dict,
    ) -> ClientMessageModel:
        for key, value in payload.items():
            setattr(message, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientMessageConflictError from exc

        await self._session.refresh(message)
        return message

    async def delete(self, message: ClientMessageModel) -> None:
        await self._session.delete(message)
        await self._session.commit()


class ClientMessageDeliveryLogConflictError(Exception):
    pass


class ClientMessageDeliveryLogCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientMessageDeliveryLogModel:
        log = ClientMessageDeliveryLogModel(**payload)
        self._session.add(log)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientMessageDeliveryLogConflictError from exc

        await self._session.refresh(log)
        return log

    async def get_by_id(
        self,
        log_id: int,
    ) -> ClientMessageDeliveryLogModel | None:
        return await self._session.get(ClientMessageDeliveryLogModel, log_id)

    async def get_by_message_id(
        self,
        *,
        message_id: int,
    ) -> Sequence[ClientMessageDeliveryLogModel]:
        stmt = (
            select(ClientMessageDeliveryLogModel)
            .where(ClientMessageDeliveryLogModel.message_id == message_id)
            .order_by(ClientMessageDeliveryLogModel.status_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_provider_message_id(
        self,
        *,
        provider_message_id: str,
    ) -> ClientMessageDeliveryLogModel | None:
        stmt = select(ClientMessageDeliveryLogModel).where(
            ClientMessageDeliveryLogModel.provider_message_id == provider_message_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(
        self,
        log: ClientMessageDeliveryLogModel,
        payload: dict,
    ) -> ClientMessageDeliveryLogModel:
        for key, value in payload.items():
            setattr(log, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientMessageDeliveryLogConflictError from exc

        await self._session.refresh(log)
        return log

    async def delete(self, log: ClientMessageDeliveryLogModel) -> None:
        await self._session.delete(log)
        await self._session.commit()
