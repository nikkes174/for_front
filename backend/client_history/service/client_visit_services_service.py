from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_history.crud.visit_services import (
    ClientHistoryVisitServiceConflictError as VisitServiceCrudConflictError,
    ClientHistoryVisitServiceCrud,
)
from client_circout.backend.client_history.models.visit_services import ClientHistoryVisitServiceModel
from client_circout.backend.client_history.schemas.visit_services import (
    ClientHistoryVisitServiceCreateSchema,
    ClientHistoryVisitServiceUpdateSchema,
)
from client_circout.backend.client_history.service._utils import to_payload, require_found, clean_update_payload
from client_circout.backend.client_history.service.exceptions import ClientHistoryConflictError


class ClientVisitServicesService:
    def __init__(self, visit_service_crud: ClientHistoryVisitServiceCrud) -> None:
        self._visit_service_crud = visit_service_crud

    async def add_service_to_visit(
        self,
        data: ClientHistoryVisitServiceCreateSchema | dict,
    ) -> ClientHistoryVisitServiceModel:
        try:
            return await self._visit_service_crud.create(to_payload(data))
        except VisitServiceCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit service record already exists or violates constraints") from exc

    async def get_visit_service(self, visit_service_id: int) -> ClientHistoryVisitServiceModel:
        visit_service = await self._visit_service_crud.get_by_id(visit_service_id)
        return require_found(visit_service, "client_history_visit_service", visit_service_id)

    async def list_visit_services(
        self,
        *,
        visit_id: int,
        service_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientHistoryVisitServiceModel]:
        return await self._visit_service_crud.list(
            visit_id=visit_id,
            service_id=service_id,
            offset=offset,
            limit=limit,
        )

    async def update_visit_service(
        self,
        visit_service_id: int,
        data: ClientHistoryVisitServiceUpdateSchema | dict,
    ) -> ClientHistoryVisitServiceModel:
        visit_service = await self.get_visit_service(visit_service_id)
        payload = clean_update_payload(data)

        try:
            return await self._visit_service_crud.update(visit_service, payload)
        except VisitServiceCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit service record update violates constraints") from exc

    async def remove_service_from_visit(self, visit_service_id: int) -> None:
        visit_service = await self.get_visit_service(visit_service_id)

        try:
            await self._visit_service_crud.delete(visit_service)
        except VisitServiceCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit service record delete violates constraints") from exc
