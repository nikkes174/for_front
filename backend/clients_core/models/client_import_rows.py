from __future__ import annotations

from typing import Any

from sqlalchemy import ForeignKey, Integer, JSON, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base
from client_circout.backend.db.mixins import DBMIXIN

class ClientImportRowModel(Base, DBMIXIN):
    __tablename__ = "client_import_rows"
    __table_args__ = (
        UniqueConstraint("batch_id", "row_number", name="uq_client_import_rows_batch_row_number"),
    )

    batch_id: Mapped[int] = mapped_column(
        ForeignKey("client_import_batches.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    row_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    raw_data_json: Mapped[dict[str, Any] | None] = mapped_column(
        JSON,
        nullable=True,
    )

    client_id: Mapped[int | None] = mapped_column(
        ForeignKey("clients_core.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    status: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        index=True,
    )

    error_text: Mapped[str | None] = mapped_column(
        String(2000),
        nullable=True,
    )
