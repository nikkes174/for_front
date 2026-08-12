from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal

from client_circout.backend.client_history.crud.visits import ClientHistoryVisitCrud
from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel
from client_circout.backend.client_history.service._utils import COMPLETED_STATUSES, normalize_status, CANCELLED_STATUSES, \
    decimal_or_zero, ACTIVE_FUTURE_STATUSES, NO_SHOW_STATUSES


@dataclass(slots=True, frozen=True)
class ClientHistoryMetricsSnapshot:
    visits_count: int
    completed_visits_count: int
    cancelled_visits_count: int
    no_show_visits_count: int
    sold_amount: Decimal
    paid_amount: Decimal
    average_check: Decimal
    last_visit_at: datetime | None
    next_visit_at: datetime | None
    visit_frequency: float | None
    average_visit_interval_days: float | None
    days_since_last_visit: int | None


class ClientHistoryMetricsSourceService:
    def __init__(self, visit_crud: ClientHistoryVisitCrud) -> None:
        self._visit_crud = visit_crud

    async def build_client_metrics_source(
        self,
        *,
        client_id: int,
        organization_id: int | None = None,
        now: datetime,
        limit: int = 10_000,
    ) -> ClientHistoryMetricsSnapshot:
        visits = list(
            await self._visit_crud.list(
                organization_id=organization_id,
                client_id=client_id,
                offset=0,
                limit=limit,
            ),
        )

        return self._calculate(visits=visits, now=now)

    def _calculate(
        self,
        *,
        visits: list[ClientHistoryVisitModel],
        now: datetime,
    ) -> ClientHistoryMetricsSnapshot:
        past_visits = [visit for visit in visits if visit.visit_at <= now]
        future_visits = [visit for visit in visits if visit.visit_at > now]

        completed = [
            visit
            for visit in past_visits
            if normalize_status(visit.visit_status) in COMPLETED_STATUSES
        ]
        cancelled = [
            visit
            for visit in past_visits
            if normalize_status(visit.visit_status) in CANCELLED_STATUSES
        ]
        no_show = [
            visit
            for visit in past_visits
            if normalize_status(visit.visit_status) in NO_SHOW_STATUSES
        ]

        sold_amount = sum(
            (decimal_or_zero(visit.total_cost) for visit in completed),
            Decimal("0.00"),
        )
        paid_amount = sum(
            (decimal_or_zero(visit.paid_amount) for visit in completed),
            Decimal("0.00"),
        )

        average_check = (
            sold_amount / len(completed)
            if completed
            else Decimal("0.00")
        )

        completed_sorted = sorted(completed, key=lambda visit: visit.visit_at)
        last_visit_at = completed_sorted[-1].visit_at if completed_sorted else None

        active_future = [
            visit
            for visit in future_visits
            if normalize_status(visit.visit_status) in ACTIVE_FUTURE_STATUSES
        ]
        next_visit_at = min(
            (visit.visit_at for visit in active_future),
            default=None,
        )

        average_interval = self._average_interval_days(completed_sorted)
        days_since_last_visit = (
            (now.date() - last_visit_at.date()).days
            if last_visit_at is not None
            else None
        )

        visit_frequency = (
            30 / average_interval
            if average_interval and average_interval > 0
            else None
        )

        return ClientHistoryMetricsSnapshot(
            visits_count=len(past_visits),
            completed_visits_count=len(completed),
            cancelled_visits_count=len(cancelled),
            no_show_visits_count=len(no_show),
            sold_amount=sold_amount,
            paid_amount=paid_amount,
            average_check=average_check,
            last_visit_at=last_visit_at,
            next_visit_at=next_visit_at,
            visit_frequency=visit_frequency,
            average_visit_interval_days=average_interval,
            days_since_last_visit=days_since_last_visit,
        )

    def _average_interval_days(
        self,
        visits: list[ClientHistoryVisitModel],
    ) -> float | None:
        if len(visits) < 2:
            return None

        intervals = [
            (current.visit_at - previous.visit_at).days
            for previous, current in zip(visits, visits[1:], strict=True)
        ]

        if not intervals:
            return None

        return sum(intervals) / len(intervals)
