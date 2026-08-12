from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel
from client_circout.backend.client_review.models import ClientReviewModel


class ClientReviewCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientReviewModel:
        review = ClientReviewModel(**payload)
        self._session.add(review)
        try:
            await self._session.commit()
        except Exception:
            await self._session.rollback()
            raise
        await self._session.refresh(review)
        return review

    async def get_by_id(self, review_id: int) -> ClientReviewModel | None:
        return await self._session.get(ClientReviewModel, review_id)

    async def visit_matches_branch(
        self,
        *,
        visit_id: int,
        organization_id: int,
        client_id: int,
        branch_id: int,
    ) -> bool:
        statement = select(ClientHistoryVisitModel.id).where(
            ClientHistoryVisitModel.id == visit_id,
            ClientHistoryVisitModel.organization_id == organization_id,
            ClientHistoryVisitModel.client_id == client_id,
            ClientHistoryVisitModel.branch_id == branch_id,
        )
        return await self._session.scalar(statement) is not None

    async def list(
        self,
        *,
        organization_id: int,
        branch_id: int | None,
        employee_id: int | None,
        offset: int,
        limit: int,
    ) -> Sequence[ClientReviewModel]:
        statement = select(ClientReviewModel).where(
            ClientReviewModel.organization_id == organization_id,
        )
        if branch_id is not None:
            statement = statement.where(ClientReviewModel.branch_id == branch_id)
        if employee_id is not None:
            statement = statement.where(ClientReviewModel.employee_id == employee_id)
        statement = statement.order_by(
            ClientReviewModel.created_at.desc(),
            ClientReviewModel.id.desc(),
        ).offset(offset).limit(limit)
        return (await self._session.scalars(statement)).all()

    async def update(self, review: ClientReviewModel, payload: dict) -> ClientReviewModel:
        for field, value in payload.items():
            setattr(review, field, value)
        try:
            await self._session.commit()
        except Exception:
            await self._session.rollback()
            raise
        await self._session.refresh(review)
        return review

    async def delete(self, review: ClientReviewModel) -> None:
        await self._session.delete(review)
        try:
            await self._session.commit()
        except Exception:
            await self._session.rollback()
            raise

    async def get_rating(
        self,
        *,
        organization_id: int,
        branch_id: int | None = None,
        employee_id: int | None = None,
    ) -> tuple[float | None, int]:
        filters = [ClientReviewModel.organization_id == organization_id]
        if branch_id is not None:
            filters.append(ClientReviewModel.branch_id == branch_id)
        else:
            filters.append(ClientReviewModel.employee_id == employee_id)
        statement = select(
            func.avg(ClientReviewModel.rating),
            func.count(ClientReviewModel.id),
        ).where(*filters)
        average, count = (await self._session.execute(statement)).one()
        return (round(float(average), 2) if average is not None else None, int(count))

    async def get_employee_ratings(self, organization_id: int) -> list[tuple[int, float, int]]:
        statement = (
            select(
                ClientReviewModel.employee_id,
                func.avg(ClientReviewModel.rating),
                func.count(ClientReviewModel.id),
            )
            .where(
                ClientReviewModel.organization_id == organization_id,
                ClientReviewModel.employee_id.is_not(None),
            )
            .group_by(ClientReviewModel.employee_id)
        )
        rows = (await self._session.execute(statement)).all()
        return [
            (int(employee_id), round(float(average), 2), int(count))
            for employee_id, average, count in rows
        ]

