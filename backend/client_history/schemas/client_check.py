from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ClientCheckBaseSchema(BaseModel):
    organization_id: int
    client_id: int

    visit_id: int | None = None
    sale_id: int | None = None

    check_number: str = Field(min_length=1, max_length=100)

    total_amount: Decimal = Decimal("0.00")
    paid_amount: Decimal = Decimal("0.00")
    discount_amount: Decimal = Decimal("0.00")

    issued_at: datetime

    file_id: int | None = None


class ClientCheckCreateSchema(ClientCheckBaseSchema):
    pass


class ClientCheckUpdateSchema(BaseModel):
    visit_id: int | None = None
    sale_id: int | None = None

    check_number: str | None = Field(default=None, min_length=1, max_length=100)

    total_amount: Decimal | None = None
    paid_amount: Decimal | None = None
    discount_amount: Decimal | None = None

    issued_at: datetime | None = None

    file_id: int | None = None


class ClientCheckReadSchema(ClientCheckBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int