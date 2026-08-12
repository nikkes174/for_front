from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from decimal import Decimal

from client_circout.backend.client_history.crud.visits import (
    ClientHistoryVisitConflictError as VisitCrudConflictError,
    ClientHistoryVisitCrud,
)
from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel
from client_circout.backend.client_history.schemas.visits import (
    ClientHistoryVisitCreateSchema,
    ClientHistoryVisitUpdateSchema,
)
from client_circout.backend.client_history.service._utils import to_payload, utc_now, calc_debt_amount, require_found, \
    clean_update_payload
from client_circout.backend.client_history.service.exceptions import ClientHistoryConflictError


class ClientVisitHistoryService:
    def __init__(self, visit_crud: ClientHistoryVisitCrud) -> None:
        self._visit_crud = visit_crud

    async def create_visit(
        self,
        data: ClientHistoryVisitCreateSchema | dict,
        *,
        recalculate_debt: bool = True,
        auto_commit: bool = True,
        postprocess_actor_id: int | None = None,
    ) -> ClientHistoryVisitModel:
        payload = to_payload(data)
        payload.setdefault("created_at", utc_now())

        if recalculate_debt:
            payload["debt_amount"] = calc_debt_amount(
                payload.get("total_cost"),
                payload.get("paid_amount"),
            )

        try:
            return await self._visit_crud.create(
                payload,
                auto_commit=auto_commit,
                postprocess_actor_id=postprocess_actor_id,
            )
        except VisitCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit history record already exists or violates constraints") from exc

    async def get_visit(self, visit_id: int) -> ClientHistoryVisitModel:
        visit = await self._visit_crud.get_by_id(visit_id)
        return require_found(visit, "client_history_visit", visit_id)

    async def list_client_visits(
        self,
        *,
        client_id: int,
        organization_id: int | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        branch_id: int | None = None,
        employee_id: int | None = None,
        visit_status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientHistoryVisitModel]:
        return await self._visit_crud.list(
            organization_id=organization_id,
            client_id=client_id,
            branch_id=branch_id,
            employee_id=employee_id,
            visit_status=visit_status,
            date_from=date_from,
            date_to=date_to,
            offset=offset,
            limit=limit,
        )

    async def update_visit(
        self,
        visit_id: int,
        data: ClientHistoryVisitUpdateSchema | dict,
        *,
        recalculate_debt: bool = True,
    ) -> ClientHistoryVisitModel:
        visit = await self.get_visit(visit_id)
        payload = clean_update_payload(data)
        payload["updated_at"] = utc_now()

        if recalculate_debt and (
            "total_cost" in payload or "paid_amount" in payload
        ):
            total_cost = payload.get("total_cost", visit.total_cost)
            paid_amount = payload.get("paid_amount", visit.paid_amount)
            payload["debt_amount"] = calc_debt_amount(total_cost, paid_amount)

        try:
            return await self._visit_crud.update(visit, payload)
        except VisitCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit history record update violates constraints") from exc

    async def update_visit_status(
        self,
        visit_id: int,
        *,
        visit_status: str,
    ) -> ClientHistoryVisitModel:
        return await self.update_visit(
            visit_id,
            {"visit_status": visit_status},
            recalculate_debt=False,
        )

    async def update_financial_snapshot(
        self,
        visit_id: int,
        *,
        total_cost: Decimal | None = None,
        discount_amount: Decimal | None = None,
        paid_amount: Decimal | None = None,
        debt_amount: Decimal | None = None,
    ) -> ClientHistoryVisitModel:
        payload: dict[str, Decimal] = {}

        if total_cost is not None:
            payload["total_cost"] = total_cost
        if discount_amount is not None:
            payload["discount_amount"] = discount_amount
        if paid_amount is not None:
            payload["paid_amount"] = paid_amount
        if debt_amount is not None:
            payload["debt_amount"] = debt_amount

        return await self.update_visit(
            visit_id,
            payload,
            recalculate_debt=debt_amount is None,
        )

    async def delete_visit_projection(self, visit_id: int) -> None:
        visit = await self.get_visit(visit_id)

        try:
            await self._visit_crud.delete(visit)
        except VisitCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit history record delete violates constraints") from exc
