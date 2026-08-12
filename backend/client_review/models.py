from __future__ import annotations

from sqlalchemy import BIGINT, CheckConstraint, ForeignKey, Index, SmallInteger, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base
from client_circout.backend.db.mixins import DBMIXIN


class ClientReviewModel(Base, DBMIXIN):
    __tablename__ = "client_reviews"
    __table_args__ = (
        CheckConstraint("rating BETWEEN 1 AND 5", name="ck_client_reviews_rating"),
        CheckConstraint(
            "(branch_id IS NOT NULL AND employee_id IS NULL) OR "
            "(branch_id IS NULL AND employee_id IS NOT NULL)",
            name="ck_client_reviews_single_target",
        ),
        Index("ix_client_reviews_branch_target", "organization_id", "branch_id"),
        Index("ix_client_reviews_employee_target", "organization_id", "employee_id"),
    )

    organization_id: Mapped[int] = mapped_column(BIGINT, nullable=False, index=True)
    client_id: Mapped[int] = mapped_column(
        BIGINT,
        ForeignKey("clients_core.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    client_name: Mapped[str] = mapped_column(String(255), nullable=False)
    text: Mapped[str] = mapped_column(Text, nullable=False)
    rating: Mapped[int] = mapped_column(SmallInteger, nullable=False)
    branch_id: Mapped[int | None] = mapped_column(BIGINT, nullable=True)
    employee_id: Mapped[int | None] = mapped_column(BIGINT, nullable=True)

    @property
    def target_type(self) -> str:
        return "branch" if self.branch_id is not None else "employee"
