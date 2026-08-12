from __future__ import annotations

from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base

from client_circout.backend.db.mixins import DBMIXIN
class ClientConsentModel(Base, DBMIXIN):
    __tablename__ = "client_consents"

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

    service_messages_allowed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    marketing_messages_allowed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    sms_allowed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    email_allowed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    telegram_allowed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
    )

    consent_given_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    consent_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    consent_source: Mapped[str | None] = mapped_column(
        String(64),
        nullable=True,
        index=True,
    )

    consent_revoked_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        index=True,
    )

    comment: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
