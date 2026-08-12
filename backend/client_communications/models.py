from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text, JSON, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from client_circout.backend.db.mixins import DBMIXIN
from client_circout.backend.db.db import Base


class ClientMessageModel(Base, DBMIXIN):
    __tablename__ = "client_messages"

    organization_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    sent_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    channel: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
    )

    message_type: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    message_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    message_title: Mapped[str | None] = mapped_column(
        String(120),
        nullable=True,
    )

    image_urls: Mapped[list[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list,
    )

    delivery_status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        default="pending",
        index=True,
    )

    employee_id: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    related_visit_id: Mapped[int | None] = mapped_column(
        ForeignKey("client_history_visits.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )


class ClientMessageDeliveryLogModel(Base, DBMIXIN):
    __tablename__ = "client_message_delivery_logs"

    message_id: Mapped[int] = mapped_column(
        ForeignKey("client_messages.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    provider_name: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    provider_message_id: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(32),
        nullable=False,
        index=True,
    )

    status_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True,
    )

    error_text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    payload_json: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )


class ClientPushSubscriptionModel(Base, DBMIXIN):
    __tablename__ = "client_push_subscriptions"
    __table_args__ = (
        UniqueConstraint("endpoint", name="uq_client_push_subscriptions_endpoint"),
    )

    organization_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    endpoint: Mapped[str] = mapped_column(Text, nullable=False)
    p256dh: Mapped[str] = mapped_column(Text, nullable=False)
    auth: Mapped[str] = mapped_column(Text, nullable=False)
    platform: Mapped[str] = mapped_column(String(64), default="")
    user_agent: Mapped[str] = mapped_column(Text, default="")
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, index=True)
    last_sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    last_error: Mapped[str] = mapped_column(Text, default="")


class ClientPushPreferenceModel(Base, DBMIXIN):
    __tablename__ = "client_push_preferences"
    __table_args__ = (
        UniqueConstraint("client_id", name="uq_client_push_preferences_client_id"),
    )

    organization_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        index=True,
    )

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False, index=True)

class ClientPushJobModel(Base):
    __tablename__ = "client_push_jobs"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    organization_id: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    type: Mapped[str] = mapped_column(String(100), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, index=True)
    checked: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    total: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    sent: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    channels: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    image_urls: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    single_delivery: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    error_text: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
