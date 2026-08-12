from __future__ import annotations

from datetime import datetime
from typing import Any
from client_circout.backend.db.mixins import DBMIXIN
from sqlalchemy import BIGINT, Boolean, DateTime, ForeignKey, JSON, String
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base



class ClientSegmentModel(Base, DBMIXIN):
    __tablename__ = "client_segments"

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(120), nullable=False, index=True)

    description: Mapped[str | None] = mapped_column(String(1000), nullable=True)

    is_dynamic: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    rules_json: Mapped[dict[str, Any] | None] = mapped_column(JSON, nullable=True)

    created_by: Mapped[int | None] = mapped_column(BIGINT, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    updated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)


class ClientSegmentMemberModel(Base, DBMIXIN):
    __tablename__ = "client_segment_members"

    segment_id: Mapped[int] = mapped_column(
        ForeignKey("client_segments.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    entered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    exited_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )

    membership_status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )