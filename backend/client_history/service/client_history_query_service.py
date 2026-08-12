from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_history.models.visit_products import ClientHistoryVisitProductModel
from client_circout.backend.client_history.models.visit_services import ClientHistoryVisitServiceModel
from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel


HistorySortField = Literal["visit_at", "total_cost", "paid_amount", "debt_amount", "created_at"]
SortDirection = Literal["asc", "desc"]


@dataclass(slots=True, frozen=True)
class ClientHistoryFilters:
    client_id: int | None = None
    organization_id: int | None = None
    date_from: datetime | None = None
    date_to: datetime | None = None
    branch_id: int | None = None
    employee_id: int | None = None
    visit_status: str | None = None


class ClientHistoryQueryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_visits(
        self,
        *,
        filters: ClientHistoryFilters,
        include_services: bool = False,
        include_products: bool = False,
        sort_by: HistorySortField = "visit_at",
        sort_direction: SortDirection = "desc",
        offset: int = 0,
        limit: int = 100,
    ) -> list[dict]:
        stmt = self._apply_filters(select(ClientHistoryVisitModel), filters)
        stmt = self._apply_sort(stmt, sort_by=sort_by, sort_direction=sort_direction)
        stmt = stmt.offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        visits = list(result.scalars().all())

        if not include_services and not include_products:
            return [{"visit": visit} for visit in visits]

        visit_ids = [visit.id for visit in visits]
        services_map = (
            await self._load_services_map(visit_ids)
            if include_services
            else {}
        )
        products_map = (
            await self._load_products_map(visit_ids)
            if include_products
            else {}
        )

        return [
            {
                "visit": visit,
                "services": services_map.get(visit.id, []),
                "products": products_map.get(visit.id, []),
            }
            for visit in visits
        ]

    async def get_visit_details(
        self,
        *,
        visit_id: int,
    ) -> dict | None:
        visit = await self._session.get(ClientHistoryVisitModel, visit_id)

        if visit is None:
            return None

        return {
            "visit": visit,
            "services": (await self._load_services_map([visit_id])).get(visit_id, []),
            "products": (await self._load_products_map([visit_id])).get(visit_id, []),
        }

    async def count_visits(
        self,
        *,
        filters: ClientHistoryFilters,
    ) -> int:
        stmt = self._apply_filters(
            select(func.count(ClientHistoryVisitModel.id)),
            filters,
        )
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    def _apply_filters(
        self,
        stmt: Select,
        filters: ClientHistoryFilters,
    ) -> Select:
        if filters.organization_id is not None:
            stmt = stmt.where(ClientHistoryVisitModel.organization_id == filters.organization_id)

        if filters.client_id is not None:
            stmt = stmt.where(ClientHistoryVisitModel.client_id == filters.client_id)

        if filters.branch_id is not None:
            stmt = stmt.where(ClientHistoryVisitModel.branch_id == filters.branch_id)

        if filters.employee_id is not None:
            stmt = stmt.where(ClientHistoryVisitModel.employee_id == filters.employee_id)

        if filters.visit_status is not None:
            stmt = stmt.where(ClientHistoryVisitModel.visit_status == filters.visit_status)

        if filters.date_from is not None:
            stmt = stmt.where(ClientHistoryVisitModel.visit_at >= filters.date_from)

        if filters.date_to is not None:
            stmt = stmt.where(ClientHistoryVisitModel.visit_at <= filters.date_to)

        return stmt

    def _apply_sort(
        self,
        stmt: Select,
        *,
        sort_by: HistorySortField,
        sort_direction: SortDirection,
    ) -> Select:
        column = getattr(ClientHistoryVisitModel, sort_by)
        order_expr = column.asc() if sort_direction == "asc" else column.desc()
        return stmt.order_by(order_expr, ClientHistoryVisitModel.id.desc())

    async def _load_services_map(
        self,
        visit_ids: list[int],
    ) -> dict[int, list[ClientHistoryVisitServiceModel]]:
        if not visit_ids:
            return {}

        stmt = (
            select(ClientHistoryVisitServiceModel)
            .where(ClientHistoryVisitServiceModel.visit_id.in_(visit_ids))
            .order_by(ClientHistoryVisitServiceModel.id)
        )
        result = await self._session.execute(stmt)

        services_map: dict[int, list[ClientHistoryVisitServiceModel]] = {}
        for item in result.scalars().all():
            services_map.setdefault(item.visit_id, []).append(item)

        return services_map

    async def _load_products_map(
        self,
        visit_ids: list[int],
    ) -> dict[int, list[ClientHistoryVisitProductModel]]:
        if not visit_ids:
            return {}

        stmt = (
            select(ClientHistoryVisitProductModel)
            .where(ClientHistoryVisitProductModel.visit_id.in_(visit_ids))
            .order_by(ClientHistoryVisitProductModel.id)
        )
        result = await self._session.execute(stmt)

        products_map: dict[int, list[ClientHistoryVisitProductModel]] = {}
        for item in result.scalars().all():
            products_map.setdefault(item.visit_id, []).append(item)

        return products_map
