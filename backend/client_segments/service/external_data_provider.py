from __future__ import annotations

from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_history.models.client_check import ClientCheckModel
from client_circout.backend.client_history.models.visit_services import (
    ClientHistoryVisitServiceModel,
)
from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel
from client_circout.backend.client_history.service._utils import (
    CANCELLED_STATUSES,
    COMPLETED_STATUSES,
)
from client_circout.backend.client_segments.service.segment_rules_service import (
    SegmentRuleDataProvider,
)
from contracts.api.loyalty import LoyaltyApiClient


class SegmentExternalDataProvider(SegmentRuleDataProvider):
    def __init__(
        self,
        session: AsyncSession,
        loyalty_api: LoyaltyApiClient,
    ) -> None:
        self._session = session
        self._loyalty_api = loyalty_api

    async def get_average_check(self, client_id: int) -> float | None:
        stmt = select(func.avg(ClientCheckModel.total_amount)).where(
            ClientCheckModel.client_id == client_id,
        )
        value = (await self._session.execute(stmt)).scalar_one_or_none()
        if value is None:
            return None
        return float(value)

    async def get_days_since_last_visit(self, client_id: int) -> int | None:
        stmt = (
            select(func.max(ClientHistoryVisitModel.visit_at))
            .where(ClientHistoryVisitModel.client_id == client_id)
            .where(func.lower(ClientHistoryVisitModel.visit_status).in_(tuple(COMPLETED_STATUSES)))
        )
        last_visit_at = (await self._session.execute(stmt)).scalar_one_or_none()
        if last_visit_at is None:
            return None

        now = datetime.now(UTC)
        if last_visit_at.tzinfo is None:
            last_visit_at = last_visit_at.replace(tzinfo=UTC)
        return max((now.date() - last_visit_at.date()).days, 0)

    async def get_cancelled_visits_count(
        self,
        client_id: int,
        *,
        days: int | None = None,
    ) -> int:
        stmt = (
            select(func.count())
            .select_from(ClientHistoryVisitModel)
            .where(ClientHistoryVisitModel.client_id == client_id)
            .where(func.lower(ClientHistoryVisitModel.visit_status).in_(tuple(CANCELLED_STATUSES)))
        )
        if days is not None:
            stmt = stmt.where(
                ClientHistoryVisitModel.visit_at >= datetime.now(UTC) - timedelta(days=days),
            )

        return int((await self._session.execute(stmt)).scalar_one() or 0)

    async def has_bought_service(self, client_id: int, service_id: int) -> bool:
        stmt = (
            select(ClientHistoryVisitServiceModel.id)
            .join(
                ClientHistoryVisitModel,
                ClientHistoryVisitModel.id == ClientHistoryVisitServiceModel.visit_id,
            )
            .where(ClientHistoryVisitModel.client_id == client_id)
            .where(ClientHistoryVisitServiceModel.service_id == service_id)
            .limit(1)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none() is not None

    async def has_unused_certificate(self, client_id: int) -> bool:
        certificates = await self._loyalty_api.list_active_client_certificates(client_id)
        return any(Decimal(str(item.balance_amount)) > 0 for item in certificates)

    async def has_visited_employee(self, client_id: int, employee_id: int) -> bool:
        stmt = (
            select(ClientHistoryVisitModel.id)
            .where(ClientHistoryVisitModel.client_id == client_id)
            .where(ClientHistoryVisitModel.employee_id == employee_id)
            .limit(1)
        )
        return (await self._session.execute(stmt)).scalar_one_or_none() is not None
