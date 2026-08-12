from __future__ import annotations

from datetime import datetime, date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ClientProfileMetricBaseSchema(BaseModel):
    organization_id: int
    client_id: int

    visits_count: int = 0
    completed_visits_count: int = 0
    cancelled_visits_count: int = 0
    no_show_visits_count: int = 0

    sold_amount: Decimal = Decimal("0.00")
    paid_amount: Decimal = Decimal("0.00")
    average_check: Decimal = Decimal("0.00")

    last_visit_at: datetime | None = None
    next_visit_at: datetime | None = None

    favorite_branch_id: int | None = None
    visit_frequency: float | None = None

    ltv: Decimal = Decimal("0.00")
    profit_amount: Decimal = Decimal("0.00")

    average_visit_interval_days: float | None = None
    days_since_last_visit: int | None = None
    churn_probability: float | None = None

    acquisition_cost: Decimal = Decimal("0.00")


class ClientProfileMetricCreateSchema(ClientProfileMetricBaseSchema):
    pass


class ClientProfileMetricUpdateSchema(BaseModel):
    visits_count: int | None = None
    completed_visits_count: int | None = None
    cancelled_visits_count: int | None = None
    no_show_visits_count: int | None = None

    sold_amount: Decimal | None = None
    paid_amount: Decimal | None = None
    average_check: Decimal | None = None

    last_visit_at: datetime | None = None
    next_visit_at: datetime | None = None

    favorite_branch_id: int | None = None
    visit_frequency: float | None = None

    ltv: Decimal | None = None
    profit_amount: Decimal | None = None

    average_visit_interval_days: float | None = None
    days_since_last_visit: int | None = None
    churn_probability: float | None = None

    acquisition_cost: Decimal | None = None


class ClientProfileMetricReadSchema(ClientProfileMetricBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    updated_at: datetime | None = None


class ClientMetricSnapshotBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    snapshot_date: date
    ltv: Decimal = Decimal("0")
    visit_frequency: Decimal = Decimal("0")
    average_check: Decimal = Decimal("0")
    days_since_last_visit: int | None = None
    churn_probability: Decimal = Decimal("0")
    profit_amount: Decimal = Decimal("0")
    acquisition_cost: Decimal = Decimal("0")


class ClientMetricSnapshotCreateSchema(ClientMetricSnapshotBaseSchema):
    pass


class ClientMetricSnapshotUpdateSchema(BaseModel):
    snapshot_date: date | None = None
    ltv: Decimal | None = None
    visit_frequency: Decimal | None = None
    average_check: Decimal | None = None
    days_since_last_visit: int | None = None
    churn_probability: Decimal | None = None
    profit_amount: Decimal | None = None
    acquisition_cost: Decimal | None = None


class ClientMetricSnapshotReadSchema(ClientMetricSnapshotBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int