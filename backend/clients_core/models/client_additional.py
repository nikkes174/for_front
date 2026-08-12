from __future__ import annotations

from datetime import datetime

from typing import Any
from sqlalchemy import Boolean, DateTime, ForeignKey, String, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base
from client_circout.backend.db.mixins import DBMIXIN


class ClientAdditionalFieldValueModel(Base, DBMIXIN):
    __tablename__ = "client_additional_field_values"
    __table_args__ = (
        UniqueConstraint("client_id", "field_id", name="uq_client_additional_field_values_client_field"),
    )

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    field_id: Mapped[int] = mapped_column(
        ForeignKey("client_additional_fields.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    value_text: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True,
    )

    value_json: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

class ClientAdditionalFieldModel(Base, DBMIXIN):
    __tablename__ = "client_additional_fields"
    __table_args__ = (
        UniqueConstraint("organization_id", "code", name="uq_client_additional_fields_org_code"),
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    code: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    field_type: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
    )

    is_required: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    options_json: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
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

