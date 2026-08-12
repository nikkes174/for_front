from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel
from client_circout.backend.client_history.postprocessing import enqueue_visit_created_postprocessing
from client_circout.backend.db.external_refs import BranchRefModel, EmployeeRefModel, OrganizationRefModel


class ClientHistoryVisitConflictError(Exception):
    pass


class ClientHistoryVisitCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def ensure_refs(
        self,
        *,
        organization_id: int,
        branch_id: int | None = None,
        employee_id: int | None = None,
    ) -> None:
        organization = await self._session.get(OrganizationRefModel, organization_id)
        if organization is None:
            self._session.add(OrganizationRefModel(id=organization_id))
            await self._session.flush()

        if branch_id is not None:
            branch = await self._session.get(BranchRefModel, branch_id)
            if branch is None:
                self._session.add(BranchRefModel(id=branch_id))
                await self._session.flush()

        if employee_id is not None:
            employee = await self._session.get(EmployeeRefModel, employee_id)
            if employee is None:
                self._session.add(EmployeeRefModel(id=employee_id))
                await self._session.flush()

    async def create(
        self,
        payload: dict,
        *,
        auto_commit: bool = True,
        postprocess_actor_id: int | None = None,
    ) -> ClientHistoryVisitModel:
        await self.ensure_refs(
            organization_id=payload["organization_id"],
            branch_id=payload.get("branch_id"),
            employee_id=payload.get("employee_id"),
        )
        visit = ClientHistoryVisitModel(**payload)
        self._session.add(visit)

        try:
            await self._session.flush()
            await enqueue_visit_created_postprocessing(
                self._session,
                visit_id=visit.id,
                actor_id=postprocess_actor_id,
            )
            if auto_commit:
                await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitConflictError from exc

        if auto_commit:
            await self._session.refresh(visit)
        return visit

    async def get_by_id(self, visit_id: int) -> ClientHistoryVisitModel | None:
        return await self._session.get(ClientHistoryVisitModel, visit_id)

    async def list(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        branch_id: int | None = None,
        employee_id: int | None = None,
        visit_status: str | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientHistoryVisitModel]:
        stmt = select(ClientHistoryVisitModel)

        if organization_id is not None:
            stmt = stmt.where(ClientHistoryVisitModel.organization_id == organization_id)

        if client_id is not None:
            stmt = stmt.where(ClientHistoryVisitModel.client_id == client_id)

        if branch_id is not None:
            stmt = stmt.where(ClientHistoryVisitModel.branch_id == branch_id)

        if employee_id is not None:
            stmt = stmt.where(ClientHistoryVisitModel.employee_id == employee_id)

        if visit_status is not None:
            stmt = stmt.where(ClientHistoryVisitModel.visit_status == visit_status)

        if date_from is not None:
            stmt = stmt.where(ClientHistoryVisitModel.visit_at >= date_from)

        if date_to is not None:
            stmt = stmt.where(ClientHistoryVisitModel.visit_at <= date_to)

        stmt = stmt.order_by(ClientHistoryVisitModel.visit_at.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        visit: ClientHistoryVisitModel,
        payload: dict,
    ) -> ClientHistoryVisitModel:
        await self.ensure_refs(
            organization_id=payload.get("organization_id", visit.organization_id),
            branch_id=payload.get("branch_id", visit.branch_id),
            employee_id=payload.get("employee_id", visit.employee_id),
        )
        for field, value in payload.items():
            setattr(visit, field, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitConflictError from exc

        await self._session.refresh(visit)
        return visit

    async def delete(self, visit: ClientHistoryVisitModel) -> None:
        await self._session.delete(visit)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitConflictError from exc
