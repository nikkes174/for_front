from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ClientHistoryVisitBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    visit_at: datetime

    branch_id: int | None = None
    employee_id: int | None = None

    visit_status: str = Field(min_length=1, max_length=50)
    source: str | None = Field(default=None, max_length=255)

    yclients_visit_id: str | None = Field(default=None, max_length=128)
    yclients_record_id: int | None = None
    yclients_company_id: int | None = None
    yclients_staff_id: int | None = None
    yclients_date: str | None = Field(default=None, max_length=64)
    yclients_datetime: str | None = Field(default=None, max_length=64)
    yclients_create_date: str | None = Field(default=None, max_length=64)
    yclients_last_change_date: str | None = Field(default=None, max_length=64)
    yclients_update_date: str | None = Field(default=None, max_length=64)

    online: bool | None = None
    visit_attendance: int | None = None
    attendance: int | None = None
    attendance_title: str | None = Field(default=None, max_length=255)
    confirmed: int | None = None
    seance_length: int | None = None
    length: int | None = None
    sms_before: int | None = None
    sms_now: int | None = None
    sms_now_text: str | None = Field(default=None, max_length=1000)
    email_now: int | None = None
    notified: int | None = None
    master_request: int | None = None
    api_id: str | None = Field(default=None, max_length=128)
    from_url: str | None = Field(default=None, max_length=1000)
    short_link: str | None = Field(default=None, max_length=1000)
    review_requested: int | None = None
    created_user_id: int | None = None
    deleted: bool | None = None
    paid_full: int | None = None
    prepaid: bool | None = None
    prepaid_confirmed: bool | None = None
    custom_color: str | None = Field(default=None, max_length=64)
    custom_font_color: str | None = Field(default=None, max_length=64)
    activity_id: int | None = None

    yclients_records: list[dict[str, Any]] | None = None
    yclients_services: list[dict[str, Any]] | None = None
    yclients_events: list[dict[str, Any]] | None = None
    yclients_goods_transactions: list[dict[str, Any]] | None = None
    yclients_staff: dict[str, Any] | None = None
    yclients_client: dict[str, Any] | None = None
    yclients_record_labels: list[dict[str, Any]] | None = None
    yclients_custom_fields: dict[str, Any] | None = None
    yclients_documents: list[dict[str, Any]] | None = None
    yclients_payments: list[dict[str, Any]] | None = None
    yclients_raw: dict[str, Any] | None = None
    photos_before: list[dict[str, str]] | None = None
    photos_after: list[dict[str, str]] | None = None
    photos_comment: list[dict[str, str]] | None = None

    total_cost: Decimal = Decimal("0.00")
    discount_amount: Decimal = Decimal("0.00")
    paid_amount: Decimal = Decimal("0.00")
    debt_amount: Decimal = Decimal("0.00")

    comment: str | None = Field(default=None, max_length=2000)


class ClientHistoryVisitCreateSchema(ClientHistoryVisitBaseSchema):
    pass


class ClientHistoryVisitUpdateSchema(BaseModel):
    visit_at: datetime | None = None

    branch_id: int | None = None
    employee_id: int | None = None

    visit_status: str | None = Field(default=None, min_length=1, max_length=50)
    source: str | None = Field(default=None, max_length=255)

    yclients_visit_id: str | None = Field(default=None, max_length=128)
    yclients_record_id: int | None = None
    yclients_company_id: int | None = None
    yclients_staff_id: int | None = None
    yclients_date: str | None = Field(default=None, max_length=64)
    yclients_datetime: str | None = Field(default=None, max_length=64)
    yclients_create_date: str | None = Field(default=None, max_length=64)
    yclients_last_change_date: str | None = Field(default=None, max_length=64)
    yclients_update_date: str | None = Field(default=None, max_length=64)

    online: bool | None = None
    visit_attendance: int | None = None
    attendance: int | None = None
    attendance_title: str | None = Field(default=None, max_length=255)
    confirmed: int | None = None
    seance_length: int | None = None
    length: int | None = None
    sms_before: int | None = None
    sms_now: int | None = None
    sms_now_text: str | None = Field(default=None, max_length=1000)
    email_now: int | None = None
    notified: int | None = None
    master_request: int | None = None
    api_id: str | None = Field(default=None, max_length=128)
    from_url: str | None = Field(default=None, max_length=1000)
    short_link: str | None = Field(default=None, max_length=1000)
    review_requested: int | None = None
    created_user_id: int | None = None
    deleted: bool | None = None
    paid_full: int | None = None
    prepaid: bool | None = None
    prepaid_confirmed: bool | None = None
    custom_color: str | None = Field(default=None, max_length=64)
    custom_font_color: str | None = Field(default=None, max_length=64)
    activity_id: int | None = None

    yclients_records: list[dict[str, Any]] | None = None
    yclients_services: list[dict[str, Any]] | None = None
    yclients_events: list[dict[str, Any]] | None = None
    yclients_goods_transactions: list[dict[str, Any]] | None = None
    yclients_staff: dict[str, Any] | None = None
    yclients_client: dict[str, Any] | None = None
    yclients_record_labels: list[dict[str, Any]] | None = None
    yclients_custom_fields: dict[str, Any] | None = None
    yclients_documents: list[dict[str, Any]] | None = None
    yclients_payments: list[dict[str, Any]] | None = None
    yclients_raw: dict[str, Any] | None = None
    photos_before: list[dict[str, str]] | None = None
    photos_after: list[dict[str, str]] | None = None
    photos_comment: list[dict[str, str]] | None = None

    total_cost: Decimal | None = None
    discount_amount: Decimal | None = None
    paid_amount: Decimal | None = None
    debt_amount: Decimal | None = None

    comment: str | None = Field(default=None, max_length=2000)


class ClientHistoryVisitReadSchema(ClientHistoryVisitBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
