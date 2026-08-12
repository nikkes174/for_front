from __future__ import annotations

from datetime import date, datetime

from typing import Any
from sqlalchemy import BIGINT, Boolean, Date, DateTime, ForeignKey, Integer, String, UniqueConstraint, select
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base
from client_circout.backend.db.mixins import DBMIXIN


class ClientOrganizationModel(Base):
    __tablename__ = "client_organizations"

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        primary_key=True,
    )
    organization_id: Mapped[int] = mapped_column(
        BIGINT,
        primary_key=True,
        index=True,
    )


def client_organization_filter(organization_id: int):
    return ClientModel.id.in_(
        select(ClientOrganizationModel.client_id).where(
            ClientOrganizationModel.organization_id == organization_id,
        ),
    )

class ClientModel(Base, DBMIXIN):
    __tablename__ = "clients_core"
    __table_args__ = (
        UniqueConstraint("organization_id", "email", name="uq_clients_core_org_email"),
        UniqueConstraint("organization_id", "telegram_id", name="uq_clients_core_org_telegram_id"),
        UniqueConstraint("organization_id", "max_id", name="uq_clients_core_org_max_id"),
        UniqueConstraint("organization_id", "vk_id", name="uq_clients_core_org_vk_id"),
    )

    organization_id: Mapped[int] = mapped_column(
        BIGINT,
        nullable=False,
        index=True,
    )

    last_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    first_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    middle_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    full_name: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    telegram_id: Mapped[int | None] = mapped_column(
        BIGINT,
        nullable=True,
        index=True,
    )

    max_id: Mapped[int | None] = mapped_column(
        BIGINT,
        nullable=True,
        index=True,
    )

    vk_id: Mapped[int | None] = mapped_column(
        BIGINT,
        nullable=True,
        index=True,
    )

    primary_phone: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
        index=True,
    )

    secondary_phone: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )

    email: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    birth_date: Mapped[date | None] = mapped_column(
        Date,
        nullable=True,
    )

    gender: Mapped[str | None] = mapped_column(
        String(16),
        nullable=True,
    )

    photo_file_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    comment: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True,
    )

    note: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True,
    )

    importance_class: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
    )

    online_booking_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    referrer_client_id: Mapped[int | None] = mapped_column(
        ForeignKey("clients_core.id", ondelete="SET NULL"),
        nullable=True,
    )

    api_field_1: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    api_field_2: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    api_field_3: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    created_by: Mapped[int | None] = mapped_column(
        BIGINT,
        nullable=True,
    )

    creation_source: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    status: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True,
        index=True,
    )

    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    archived_by: Mapped[int | None] = mapped_column(
        BIGINT,
        nullable=True,
    )
