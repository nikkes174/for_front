from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ClientDepositBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    amount: Decimal
    currency: str = "RUB"
    balance: Decimal
    status: str = "active"
    expires_at: datetime | None = None


class ClientDepositCreateSchema(ClientDepositBaseSchema):
    pass


class ClientDepositUpdateSchema(BaseModel):
    amount: Decimal | None = None
    currency: str | None = None
    balance: Decimal | None = None
    status: str | None = None
    expires_at: datetime | None = None


class ClientDepositReadSchema(ClientDepositBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime