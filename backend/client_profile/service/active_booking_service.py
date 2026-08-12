from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from pydantic import BaseModel

from client_circout.backend.client_profile.crud.active_bookings import (
    ClientActiveBookingConflictError,
    ClientActiveBookingCrud,
)
from client_circout.backend.client_profile.models.active_bookings import ClientActiveBookingModel
from client_circout.backend.client_profile.schemas.active_bookings import (
    ClientActiveBookingCreateSchema,
    ClientActiveBookingUpdateSchema,
)
from client_circout.backend.client_profile.service._utils import payload_to_dict
from client_circout.backend.client_profile.service.exceptions import ProfileEntityConflictError, ProfileEntityNotFoundError, \
    ProfileValidationError


class ClientActiveBookingService:
    ACTIVE_STATUS = "active"
    CANCELLED_STATUS = "cancelled"

    def __init__(self, booking_crud: ClientActiveBookingCrud) -> None:
        self._booking_crud = booking_crud

    async def create(
        self,
        payload: ClientActiveBookingCreateSchema | Mapping[str, Any],
    ) -> ClientActiveBookingModel:
        data = payload_to_dict(payload, exclude_unset=False)
        data.setdefault("status", self.ACTIVE_STATUS)
        self._validate_period(data)

        try:
            return await self._booking_crud.create(data)
        except ClientActiveBookingConflictError as exc:
            raise ProfileEntityConflictError("active booking already exists") from exc

    async def get(self, booking_id: int) -> ClientActiveBookingModel:
        booking = await self._booking_crud.get_by_id(booking_id)
        if booking is None:
            raise ProfileEntityNotFoundError("client_active_booking", booking_id)
        return booking

    async def list_by_client(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientActiveBookingModel]:
        return await self._booking_crud.get_by_client_id(client_id=client_id)

    async def list_active_by_client(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientActiveBookingModel]:
        return await self._booking_crud.get_active_by_client_id(client_id=client_id)

    async def update(
        self,
        booking_id: int,
        payload: ClientActiveBookingUpdateSchema | BaseModel | Mapping[str, Any],
    ) -> ClientActiveBookingModel:
        booking = await self.get(booking_id)
        data = payload_to_dict(payload)

        if not data:
            return booking

        period_data = {
            "starts_at": booking.starts_at,
            "ends_at": booking.ends_at,
        }
        period_data.update(data)
        self._validate_period(period_data)

        try:
            return await self._booking_crud.update(booking, data)
        except ClientActiveBookingConflictError as exc:
            raise ProfileEntityConflictError("active booking update conflict") from exc

    async def cancel(
        self,
        booking_id: int,
        *,
        cancel_reason: str | None = None,
    ) -> ClientActiveBookingModel:
        booking = await self.get(booking_id)
        return await self._booking_crud.cancel(
            booking,
            cancel_reason=cancel_reason,
        )

    async def reschedule(
        self,
        booking_id: int,
        payload: ClientActiveBookingUpdateSchema | BaseModel | Mapping[str, Any],
    ) -> ClientActiveBookingModel:
        booking = await self.get(booking_id)
        data = payload_to_dict(payload)
        starts_at = data.get("starts_at", booking.starts_at)
        ends_at = data.get("ends_at", booking.ends_at)
        self._validate_period({"starts_at": starts_at, "ends_at": ends_at})

        new_booking = await self.create(
            {
                "organization_id": booking.organization_id,
                "client_id": booking.client_id,
                "branch_id": data.get("branch_id", booking.branch_id),
                "employee_id": data.get("employee_id", booking.employee_id),
                "service_id": data.get("service_id", booking.service_id),
                "starts_at": starts_at,
                "ends_at": ends_at,
                "status": self.ACTIVE_STATUS,
                "rescheduled_from_booking_id": booking.id,
            },
        )
        await self.cancel(booking.id, cancel_reason="rescheduled")
        return new_booking

    async def repeat(
        self,
        booking_id: int,
        payload: ClientActiveBookingUpdateSchema | BaseModel | Mapping[str, Any],
    ) -> ClientActiveBookingModel:
        booking = await self.get(booking_id)
        data = payload_to_dict(payload)
        starts_at = data.get("starts_at", booking.starts_at)
        ends_at = data.get("ends_at", booking.ends_at)
        self._validate_period({"starts_at": starts_at, "ends_at": ends_at})

        return await self.create(
            {
                "organization_id": booking.organization_id,
                "client_id": booking.client_id,
                "branch_id": data.get("branch_id", booking.branch_id),
                "employee_id": data.get("employee_id", booking.employee_id),
                "service_id": data.get("service_id", booking.service_id),
                "starts_at": starts_at,
                "ends_at": ends_at,
                "status": self.ACTIVE_STATUS,
                "rescheduled_from_booking_id": booking.id,
            },
        )

    async def delete(self, booking_id: int) -> None:
        booking = await self.get(booking_id)
        await self._booking_crud.delete(booking)

    @staticmethod
    def _validate_period(data: Mapping[str, Any]) -> None:
        starts_at = data.get("starts_at")
        ends_at = data.get("ends_at")

        if starts_at is None or ends_at is None:
            return

        if starts_at >= ends_at:
            raise ProfileValidationError("booking starts_at must be earlier than ends_at")
