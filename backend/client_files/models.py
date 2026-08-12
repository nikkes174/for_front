from __future__ import annotations

from sqlalchemy import BigInteger, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base
from client_circout.backend.db.mixins import DBMIXIN


class ClientFileModel(Base, DBMIXIN):
    __tablename__ = "client_files"

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    organization_id: Mapped[int] = mapped_column(
        ForeignKey("organizations.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    file_category: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )

    file_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    mime_type: Mapped[str] = mapped_column(
        String(128),
        nullable=False,
    )

    size: Mapped[int] = mapped_column(
        BigInteger,
        nullable=False,
    )

    storage_key: Mapped[str] = mapped_column(
        String(512),
        nullable=False,
        unique=True,
        index=True,
    )

    uploaded_by: Mapped[int | None] = mapped_column(
        ForeignKey("employees.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )


class ClientFileLinkModel(Base, DBMIXIN):
    __tablename__ = "client_file_links"

    client_id: Mapped[int] = mapped_column(
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    file_id: Mapped[int] = mapped_column(
        ForeignKey("client_files.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    related_visit_id: Mapped[int | None] = mapped_column(
        ForeignKey("client_visits.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    related_procedure_id: Mapped[int | None] = mapped_column(
        ForeignKey("client_procedures.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    file_role: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
    )
