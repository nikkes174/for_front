from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientSubscriptionBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    subscription_id: int
    name: str
    visits_total: int
    visits_left: int
    status: str = "active"
    issued_at: datetime
    expires_at: datetime | None = None


class ClientSubscriptionCreateSchema(ClientSubscriptionBaseSchema):
    pass


class ClientSubscriptionUpdateSchema(BaseModel):
    name: str | None = None
    visits_total: int | None = None
    visits_left: int | None = None
    status: str | None = None
    issued_at: datetime | None = None
    expires_at: datetime | None = None


class ClientSubscriptionReadSchema(ClientSubscriptionBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int