from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_history.models.visit_products import ClientHistoryVisitProductModel


class ClientHistoryVisitProductConflictError(Exception):
    pass

class ClientHistoryVisitProductCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientHistoryVisitProductModel:
        visit_product = ClientHistoryVisitProductModel(**payload)
        self._session.add(visit_product)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitProductConflictError from exc

        await self._session.refresh(visit_product)
        return visit_product

    async def get_by_id(
        self,
        visit_product_id: int,
    ) -> ClientHistoryVisitProductModel | None:
        return await self._session.get(
            ClientHistoryVisitProductModel,
            visit_product_id,
        )

    async def list(
        self,
        *,
        visit_id: int | None = None,
        product_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientHistoryVisitProductModel]:
        stmt = select(ClientHistoryVisitProductModel)

        if visit_id is not None:
            stmt = stmt.where(ClientHistoryVisitProductModel.visit_id == visit_id)

        if product_id is not None:
            stmt = stmt.where(ClientHistoryVisitProductModel.product_id == product_id)

        stmt = stmt.order_by(ClientHistoryVisitProductModel.id).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        visit_product: ClientHistoryVisitProductModel,
        payload: dict,
    ) -> ClientHistoryVisitProductModel:
        for field, value in payload.items():
            setattr(visit_product, field, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitProductConflictError from exc

        await self._session.refresh(visit_product)
        return visit_product

    async def delete(
        self,
        visit_product: ClientHistoryVisitProductModel,
    ) -> None:
        await self._session.delete(visit_product)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitProductConflictError from exc