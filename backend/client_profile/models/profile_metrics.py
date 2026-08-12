from __future__ import annotations

from datetime import datetime, date
from decimal import Decimal
from client_circout.backend.db.mixins import DBMIXIN
from sqlalchemy import Date, DateTime, Float, ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base



class ClientProfileMetricModel(Base, DBMIXIN):
    __tablename__ = "client_profile_metrics"
    __table_args__ = (
        UniqueConstraint("client_id", name="uq_client_profile_metrics_client"),
    )

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

    visits_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    completed_visits_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    cancelled_visits_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    no_show_visits_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    sold_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    paid_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    average_check: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    last_visit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    next_visit_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    favorite_branch_id: Mapped[int | None] = mapped_column(
        ForeignKey("branches.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    visit_frequency: Mapped[float | None] = mapped_column(Float, nullable=True)

    ltv: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)
    profit_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    average_visit_interval_days: Mapped[float | None] = mapped_column(Float, nullable=True)
    days_since_last_visit: Mapped[int | None] = mapped_column(Integer, nullable=True)
    churn_probability: Mapped[float | None] = mapped_column(Float, nullable=True)

    acquisition_cost: Mapped[Decimal] = mapped_column(Numeric(12, 2), nullable=False, default=0)

    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class ClientMetricSnapshotModel(Base, DBMIXIN):
    __tablename__ = "client_metric_snapshots"
    __table_args__ = (
        UniqueConstraint("client_id", "snapshot_date", name="uq_client_metric_snapshots_client_date"),
    )

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

    snapshot_date: Mapped[date] = mapped_column(
        Date,
        nullable=False,
        index=True,
    )

    ltv: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    visit_frequency: Mapped[Decimal] = mapped_column(
        Numeric(8, 2),
        nullable=False,
        default=0,
    )

    average_check: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    days_since_last_visit: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    churn_probability: Mapped[Decimal] = mapped_column(
        Numeric(5, 4),
        nullable=False,
        default=0,
    )

    profit_amount: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )

    acquisition_cost: Mapped[Decimal] = mapped_column(
        Numeric(12, 2),
        nullable=False,
        default=0,
    )
