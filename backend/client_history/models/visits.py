from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, JSON, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base
from client_circout.backend.db.mixins import DBMIXIN

class ClientHistoryVisitModel(Base, DBMIXIN):
    __tablename__ = "client_history_visits"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    visit_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    branch_id: Mapped[int | None] = mapped_column(
        ForeignKey("branches.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    visit_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    source: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    yclients_visit_id: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
        index=True,
    )

    yclients_record_id: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        index=True,
    )

    yclients_company_id: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        index=True,
    )

    yclients_staff_id: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
        index=True,
    )

    yclients_date: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    yclients_datetime: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    yclients_create_date: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    yclients_last_change_date: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    yclients_update_date: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    online: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    visit_attendance: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    attendance: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    attendance_title: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    confirmed: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    seance_length: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    length: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    sms_before: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    sms_now: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    sms_now_text: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    email_now: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    notified: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    master_request: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    api_id: Mapped[str | None] = mapped_column(
        String(128),
        nullable=True,
    )

    from_url: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    short_link: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    review_requested: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    created_user_id: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    deleted: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    paid_full: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    prepaid: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    prepaid_confirmed: Mapped[bool | None] = mapped_column(
        Boolean,
        nullable=True,
    )

    custom_color: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    custom_font_color: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
    )

    activity_id: Mapped[int | None] = mapped_column(
        BigInteger,
        nullable=True,
    )

    yclients_records: Mapped[list[dict[str, object]] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_services: Mapped[list[dict[str, object]] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_events: Mapped[list[dict[str, object]] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_goods_transactions: Mapped[list[dict[str, object]] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_staff: Mapped[dict[str, object] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_client: Mapped[dict[str, object] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_record_labels: Mapped[list[dict[str, object]] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_custom_fields: Mapped[dict[str, object] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_documents: Mapped[list[dict[str, object]] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_payments: Mapped[list[dict[str, object]] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    yclients_raw: Mapped[dict[str, object] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    photos_before: Mapped[list[dict[str, str]] | None] = mapped_column(JSON, nullable=True)
    photos_after: Mapped[list[dict[str, str]] | None] = mapped_column(JSON, nullable=True)
    photos_comment: Mapped[list[dict[str, str]] | None] = mapped_column(JSON, nullable=True)

    total_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    discount_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    paid_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    debt_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    comment: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
