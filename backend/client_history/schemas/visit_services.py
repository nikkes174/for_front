from __future__ import annotations

from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ClientHistoryVisitServiceBaseSchema(BaseModel):
    visit_id: int
    service_id: int
    quantity: int = 1
    price: Decimal = Decimal("0.00")
    discount_amount: Decimal = Decimal("0.00")
    total_amount: Decimal = Decimal("0.00")


class ClientHistoryVisitServiceCreateSchema(ClientHistoryVisitServiceBaseSchema):
    pass


class ClientHistoryVisitServiceUpdateSchema(BaseModel):
    quantity: int | None = None
    price: Decimal | None = None
    discount_amount: Decimal | None = None
    total_amount: Decimal | None = None


class ClientHistoryVisitServiceReadSchema(ClientHistoryVisitServiceBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int