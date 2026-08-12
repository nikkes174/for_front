from __future__ import annotations

from datetime import datetime

from sqlalchemy import BIGINT, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base
from client_circout.backend.db.mixins import DBMIXIN

class ClientCategoryModel(Base, DBMIXIN):
    __tablename__ = "client_categories"
    __table_args__ = (
        UniqueConstraint("organization_id", "name", name="uq_client_categories_org_name"),
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(
        String(120),
        nullable=False,
        index=True,
    )

    description: Mapped[str | None] = mapped_column(
        String(1000),
        nullable=True,
    )

    color: Mapped[str | None] = mapped_column(
        String(32),
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

class ClientCategoryLinkModel(Base, DBMIXIN):
    __tablename__ = "client_category_links"
    __table_args__ = (
        UniqueConstraint("client_id", "category_id", name="uq_client_category_links_client_category"),
    )

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    category_id: Mapped[int] = mapped_column(
        ForeignKey("client_categories.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
    )

    created_by: Mapped[int | None] = mapped_column(
        BIGINT,
        nullable=True,
    )
