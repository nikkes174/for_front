from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_history.crud.client_check import ClientCheckCrud
from client_circout.backend.client_history.crud.visit_products import ClientHistoryVisitProductCrud
from client_circout.backend.client_history.crud.visit_services import ClientHistoryVisitServiceCrud
from client_circout.backend.client_history.crud.visits import ClientHistoryVisitCrud
from client_circout.backend.client_history.service.client_history_comment_service import (
    ClientHistoryCommentService,
)
from client_circout.backend.client_history.service.client_history_metrics_source_service import (
    ClientHistoryMetricsSourceService,
)
from client_circout.backend.client_history.service.client_history_query_service import (
    ClientHistoryQueryService,
)
from client_circout.backend.client_history.service.client_history_sync_service import (
    ClientHistorySyncService,
)
from client_circout.backend.client_history.service.client_visit_history_service import (
    ClientVisitHistoryService,
)
from client_circout.backend.client_history.service.client_visit_products_service import (
    ClientVisitProductsService,
)
from client_circout.backend.client_history.service.client_visit_services_service import (
    ClientVisitServicesService,
)
from client_circout.backend.db.db import SessionFactory


async def get_client_history_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientHistorySessionDep = Annotated[
    AsyncSession,
    Depends(get_client_history_db_session),
]


def get_client_history_visit_crud(
    session: ClientHistorySessionDep,
) -> ClientHistoryVisitCrud:
    return ClientHistoryVisitCrud(session)


ClientHistoryVisitCrudDep = Annotated[
    ClientHistoryVisitCrud,
    Depends(get_client_history_visit_crud),
]


def get_client_history_visit_service_crud(
    session: ClientHistorySessionDep,
) -> ClientHistoryVisitServiceCrud:
    return ClientHistoryVisitServiceCrud(session)


ClientHistoryVisitServiceCrudDep = Annotated[
    ClientHistoryVisitServiceCrud,
    Depends(get_client_history_visit_service_crud),
]


def get_client_history_visit_product_crud(
    session: ClientHistorySessionDep,
) -> ClientHistoryVisitProductCrud:
    return ClientHistoryVisitProductCrud(session)


ClientHistoryVisitProductCrudDep = Annotated[
    ClientHistoryVisitProductCrud,
    Depends(get_client_history_visit_product_crud),
]


def get_client_check_crud(
    session: ClientHistorySessionDep,
) -> ClientCheckCrud:
    return ClientCheckCrud(session)


ClientCheckCrudDep = Annotated[
    ClientCheckCrud,
    Depends(get_client_check_crud),
]


def get_client_visit_history_service(
    visit_crud: ClientHistoryVisitCrudDep,
) -> ClientVisitHistoryService:
    return ClientVisitHistoryService(visit_crud)


ClientVisitHistoryServiceDep = Annotated[
    ClientVisitHistoryService,
    Depends(get_client_visit_history_service),
]


def get_client_visit_services_service(
    visit_service_crud: ClientHistoryVisitServiceCrudDep,
) -> ClientVisitServicesService:
    return ClientVisitServicesService(visit_service_crud)


ClientVisitServicesServiceDep = Annotated[
    ClientVisitServicesService,
    Depends(get_client_visit_services_service),
]


def get_client_visit_products_service(
    visit_product_crud: ClientHistoryVisitProductCrudDep,
) -> ClientVisitProductsService:
    return ClientVisitProductsService(visit_product_crud)


ClientVisitProductsServiceDep = Annotated[
    ClientVisitProductsService,
    Depends(get_client_visit_products_service),
]


def get_client_history_comment_service(
    visit_history_service: ClientVisitHistoryServiceDep,
) -> ClientHistoryCommentService:
    return ClientHistoryCommentService(visit_history_service)


ClientHistoryCommentServiceDep = Annotated[
    ClientHistoryCommentService,
    Depends(get_client_history_comment_service),
]


def get_client_history_metrics_source_service(
    visit_crud: ClientHistoryVisitCrudDep,
) -> ClientHistoryMetricsSourceService:
    return ClientHistoryMetricsSourceService(visit_crud)


ClientHistoryMetricsSourceServiceDep = Annotated[
    ClientHistoryMetricsSourceService,
    Depends(get_client_history_metrics_source_service),
]


def get_client_history_query_service(
    session: ClientHistorySessionDep,
) -> ClientHistoryQueryService:
    return ClientHistoryQueryService(session)


ClientHistoryQueryServiceDep = Annotated[
    ClientHistoryQueryService,
    Depends(get_client_history_query_service),
]


def get_client_history_sync_service(
    visit_service: ClientVisitHistoryServiceDep,
    visit_services_service: ClientVisitServicesServiceDep,
    visit_products_service: ClientVisitProductsServiceDep,
) -> ClientHistorySyncService:
    return ClientHistorySyncService(
        visit_service=visit_service,
        visit_services_service=visit_services_service,
        visit_products_service=visit_products_service,
    )


ClientHistorySyncServiceDep = Annotated[
    ClientHistorySyncService,
    Depends(get_client_history_sync_service),
]