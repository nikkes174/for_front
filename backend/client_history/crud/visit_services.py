from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_history.models.visit_services import ClientHistoryVisitServiceModel
from client_circout.backend.db.external_refs import ServiceRefModel


class ClientHistoryVisitServiceConflictError(Exception):
   pass


class ClientHistoryVisitServiceCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientHistoryVisitServiceModel:
        service_id = int(payload["service_id"])
        service_ref = await self._session.get(ServiceRefModel, service_id)
        if service_ref is None:
            self._session.add(ServiceRefModel(id=service_id))
            await self._session.flush()

        visit_service = ClientHistoryVisitServiceModel(**payload)
        self._session.add(visit_service)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitServiceConflictError from exc

        await self._session.refresh(visit_service)
        return visit_service

    async def get_by_id(
        self,
        visit_service_id: int,
    ) -> ClientHistoryVisitServiceModel | None:
        return await self._session.get(
            ClientHistoryVisitServiceModel,
            visit_service_id,
        )

    async def list(
        self,
        *,
        visit_id: int | None = None,
        service_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientHistoryVisitServiceModel]:
        stmt = select(ClientHistoryVisitServiceModel)

        if visit_id is not None:
            stmt = stmt.where(ClientHistoryVisitServiceModel.visit_id == visit_id)

        if service_id is not None:
            stmt = stmt.where(ClientHistoryVisitServiceModel.service_id == service_id)

        stmt = stmt.order_by(ClientHistoryVisitServiceModel.id).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        visit_service: ClientHistoryVisitServiceModel,
        payload: dict,
    ) -> ClientHistoryVisitServiceModel:
        for field, value in payload.items():
            setattr(visit_service, field, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitServiceConflictError from exc

        await self._session.refresh(visit_service)
        return visit_service

    async def delete(
        self,
        visit_service: ClientHistoryVisitServiceModel,
    ) -> None:
        await self._session.delete(visit_service)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientHistoryVisitServiceConflictError from exc
