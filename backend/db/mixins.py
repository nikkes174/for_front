from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import BIGINT, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, declared_attr, mapped_column


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class IdMixin:
    id: Mapped[int] = mapped_column(
        primary_key=True,
        autoincrement=True,
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=utc_now,
    )

    updated_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
        onupdate=utc_now,
    )


class DBMIXIN(IdMixin, TimestampMixin):
    pass


class ArchiveMixin:
    archived_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
        default=None,
    )

    archived_by: Mapped[int | None] = mapped_column(
        BIGINT,
        nullable=True,
        default=None,
    )


class OrganizationMixin:
    @declared_attr
    def organization_id(cls) -> Mapped[int]:
        return mapped_column(
            ForeignKey("organizations.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )


class ClientCoreMixin:
    @declared_attr
    def client_id(cls) -> Mapped[int]:
        return mapped_column(
            ForeignKey("clients_core.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )


class ClientMixin:
    @declared_attr
    def client_id(cls) -> Mapped[int]:
        return mapped_column(
            ForeignKey("clients_core.id", ondelete="CASCADE"),
            nullable=False,
            index=True,
        )
