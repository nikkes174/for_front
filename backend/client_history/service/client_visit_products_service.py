from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_history.crud.visit_products import (
    ClientHistoryVisitProductConflictError as VisitProductCrudConflictError,
    ClientHistoryVisitProductCrud,
)
from client_circout.backend.client_history.models.visit_products import ClientHistoryVisitProductModel
from client_circout.backend.client_history.schemas.visit_products import (
    ClientHistoryVisitProductCreateSchema,
    ClientHistoryVisitProductUpdateSchema,
)
from client_circout.backend.client_history.service._utils import to_payload, require_found, clean_update_payload
from client_circout.backend.client_history.service.exceptions import ClientHistoryConflictError


class ClientVisitProductsService:
    def __init__(self, visit_product_crud: ClientHistoryVisitProductCrud) -> None:
        self._visit_product_crud = visit_product_crud

    async def add_product_to_visit(
        self,
        data: ClientHistoryVisitProductCreateSchema | dict,
    ) -> ClientHistoryVisitProductModel:
        try:
            return await self._visit_product_crud.create(to_payload(data))
        except VisitProductCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit product record already exists or violates constraints") from exc

    async def get_visit_product(self, visit_product_id: int) -> ClientHistoryVisitProductModel:
        visit_product = await self._visit_product_crud.get_by_id(visit_product_id)
        return require_found(visit_product, "client_history_visit_product", visit_product_id)

    async def list_visit_products(
        self,
        *,
        visit_id: int,
        product_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientHistoryVisitProductModel]:
        return await self._visit_product_crud.list(
            visit_id=visit_id,
            product_id=product_id,
            offset=offset,
            limit=limit,
        )

    async def update_visit_product(
        self,
        visit_product_id: int,
        data: ClientHistoryVisitProductUpdateSchema | dict,
    ) -> ClientHistoryVisitProductModel:
        visit_product = await self.get_visit_product(visit_product_id)
        payload = clean_update_payload(data)

        try:
            return await self._visit_product_crud.update(visit_product, payload)
        except VisitProductCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit product record update violates constraints") from exc

    async def remove_product_from_visit(self, visit_product_id: int) -> None:
        visit_product = await self.get_visit_product(visit_product_id)

        try:
            await self._visit_product_crud.delete(visit_product)
        except VisitProductCrudConflictError as exc:
            raise ClientHistoryConflictError("Visit product record delete violates constraints") from exc
