from __future__ import annotations

from datetime import datetime

from sqlalchemy import BIGINT, DateTime, ForeignKey, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.db.db import Base
from client_circout.backend.db.mixins import DBMIXIN


class ClientAchievementModel(Base, DBMIXIN):
    __tablename__ = "client_achievements"
    __table_args__ = (UniqueConstraint("client_id", "achievement_id", name="uq_client_achievement"),)

    client_id: Mapped[int] = mapped_column(ForeignKey("clients_core.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id: Mapped[int] = mapped_column(BIGINT, nullable=False, index=True)
    achievement_id: Mapped[int] = mapped_column(BIGINT, nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    level_name: Mapped[str] = mapped_column(String(100), nullable=False)
    awarded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
