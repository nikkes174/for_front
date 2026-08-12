from __future__ import annotations

from collections.abc import Iterable
from typing import Any

from client_circout.backend.client_history.schemas.visit_products import ClientHistoryVisitProductCreateSchema
from client_circout.backend.client_history.schemas.visit_services import ClientHistoryVisitServiceCreateSchema
from client_circout.backend.client_history.schemas.visits import ClientHistoryVisitCreateSchema
from client_circout.backend.client_history.service.client_visit_history_service import ClientVisitHistoryService
from client_circout.backend.client_history.service.client_visit_products_service import ClientVisitProductsService
from client_circout.backend.client_history.service.client_visit_services_service import ClientVisitServicesService
from client_circout.backend.client_history.service.exceptions import ClientHistoryExternalSourceError


class ClientHistorySyncService:
    def __init__(
        self,
        *,
        visit_service: ClientVisitHistoryService,
        visit_services_service: ClientVisitServicesService,
        visit_products_service: ClientVisitProductsService,
    ) -> None:
        self._visit_service = visit_service
        self._visit_services_service = visit_services_service
        self._visit_products_service = visit_products_service

    async def sync_visit_projection(
        self,
        payload: ClientHistoryVisitCreateSchema | dict[str, Any],
        *,
        visit_id: int | None = None,
    ):
        if visit_id is None:
            return await self._visit_service.create_visit(payload)

        return await self._visit_service.update_visit(visit_id, payload)

    async def sync_visit_services_projection(
        self,
        *,
        visit_id: int,
        services: Iterable[ClientHistoryVisitServiceCreateSchema | dict[str, Any]],
        replace_existing: bool = False,
    ) -> list:
        if replace_existing:
            existing_items = await self._visit_services_service.list_visit_services(
                visit_id=visit_id,
                limit=10_000,
            )
            for item in existing_items:
                await self._visit_services_service.remove_service_from_visit(item.id)

        created_items = []
        for item in services:
            payload = dict(item.model_dump() if hasattr(item, "model_dump") else item)
            payload["visit_id"] = visit_id
            created_items.append(
                await self._visit_services_service.add_service_to_visit(payload),
            )

        return created_items

    async def sync_visit_products_projection(
        self,
        *,
        visit_id: int,
        products: Iterable[ClientHistoryVisitProductCreateSchema | dict[str, Any]],
        replace_existing: bool = False,
    ) -> list:
        if replace_existing:
            existing_items = await self._visit_products_service.list_visit_products(
                visit_id=visit_id,
                limit=10_000,
            )
            for item in existing_items:
                await self._visit_products_service.remove_product_from_visit(item.id)

        created_items = []
        for item in products:
            payload = dict(item.model_dump() if hasattr(item, "model_dump") else item)
            payload["visit_id"] = visit_id
            created_items.append(
                await self._visit_products_service.add_product_to_visit(payload),
            )

        return created_items

    async def rebuild_visit_projection(
        self,
        *,
        visit_payload: ClientHistoryVisitCreateSchema | dict[str, Any],
        services: Iterable[ClientHistoryVisitServiceCreateSchema | dict[str, Any]] = (),
        products: Iterable[ClientHistoryVisitProductCreateSchema | dict[str, Any]] = (),
        visit_id: int | None = None,
    ) -> dict:
        visit = await self.sync_visit_projection(visit_payload, visit_id=visit_id)

        if visit.id is None:
            raise ClientHistoryExternalSourceError("Visit projection was saved without id")

        synced_services = await self.sync_visit_services_projection(
            visit_id=visit.id,
            services=services,
            replace_existing=visit_id is not None,
        )
        synced_products = await self.sync_visit_products_projection(
            visit_id=visit.id,
            products=products,
            replace_existing=visit_id is not None,
        )

        return {
            "visit": visit,
            "services": synced_services,
            "products": synced_products,
        }
