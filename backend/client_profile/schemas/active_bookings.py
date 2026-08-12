# schemas.py/active_bookings.py
from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientActiveBookingBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    branch_id: int
    employee_id: int | None = None
    service_id: int
    starts_at: datetime
    ends_at: datetime
    status: str = "active"
    cancelled_at: datetime | None = None
    cancel_reason: str | None = None
    rescheduled_from_booking_id: int | None = None


class ClientActiveBookingCreateSchema(ClientActiveBookingBaseSchema):
    pass


class ClientActiveBookingUpdateSchema(BaseModel):
    branch_id: int | None = None
    employee_id: int | None = None
    service_id: int | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    status: str | None = None
    cancelled_at: datetime | None = None
    cancel_reason: str | None = None
    rescheduled_from_booking_id: int | None = None


class ClientActiveBookingReadSchema(ClientActiveBookingBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime