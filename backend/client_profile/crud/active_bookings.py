# crud.py/active_bookings.py
from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_profile.models.active_bookings import ClientActiveBookingModel


class ClientActiveBookingConflictError(Exception):
    pass


class ClientActiveBookingCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientActiveBookingModel:
        booking = ClientActiveBookingModel(**payload)
        self._session.add(booking)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientActiveBookingConflictError from exc

        await self._session.refresh(booking)
        return booking

    async def get_by_id(self, booking_id: int) -> ClientActiveBookingModel | None:
        return await self._session.get(ClientActiveBookingModel, booking_id)

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientActiveBookingModel]:
        stmt = (
            select(ClientActiveBookingModel)
            .where(ClientActiveBookingModel.client_id == client_id)
            .order_by(ClientActiveBookingModel.starts_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_active_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientActiveBookingModel]:
        stmt = (
            select(ClientActiveBookingModel)
            .where(
                ClientActiveBookingModel.client_id == client_id,
                ClientActiveBookingModel.status == "active",
            )
            .order_by(ClientActiveBookingModel.starts_at.asc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        booking: ClientActiveBookingModel,
        payload: dict,
    ) -> ClientActiveBookingModel:
        for key, value in payload.items():
            setattr(booking, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientActiveBookingConflictError from exc

        await self._session.refresh(booking)
        return booking

    async def cancel(
        self,
        booking: ClientActiveBookingModel,
        *,
        cancel_reason: str | None = None,
    ) -> ClientActiveBookingModel:
        booking.status = "cancelled"
        booking.cancelled_at = datetime.now(tz=booking.starts_at.tzinfo)
        booking.cancel_reason = cancel_reason

        await self._session.commit()
        await self._session.refresh(booking)
        return booking

    async def delete(self, booking: ClientActiveBookingModel) -> None:
        await self._session.delete(booking)
        await self._session.commit()