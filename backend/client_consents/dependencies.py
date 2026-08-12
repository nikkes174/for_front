from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_consents.services import (
    ClientConsentCommentService,
    ClientConsentHistoryService,
    ClientConsentQueryService,
    ClientConsentService,
    ClientConsentSourceService,
    ClientConsentStatusService,
    ClientConsentSyncService,
)
from client_circout.backend.db.db import SessionFactory


async def get_client_consents_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientConsentsSessionDep = Annotated[
    AsyncSession,
    Depends(get_client_consents_db_session),
]


def get_client_consent_crud(
    session: ClientConsentsSessionDep,
) -> ClientConsentCrud:
    return ClientConsentCrud(session)


ClientConsentCrudDep = Annotated[
    ClientConsentCrud,
    Depends(get_client_consent_crud),
]


def get_client_consent_source_service() -> ClientConsentSourceService:
    return ClientConsentSourceService()


ClientConsentSourceServiceDep = Annotated[
    ClientConsentSourceService,
    Depends(get_client_consent_source_service),
]


def get_client_consent_service(
    consent_crud: ClientConsentCrudDep,
    source_service: ClientConsentSourceServiceDep,
) -> ClientConsentService:
    return ClientConsentService(
        consent_crud=consent_crud,
        source_service=source_service,
    )


ClientConsentServiceDep = Annotated[
    ClientConsentService,
    Depends(get_client_consent_service),
]


def get_client_consent_query_service(
    session: ClientConsentsSessionDep,
) -> ClientConsentQueryService:
    return ClientConsentQueryService(session)


ClientConsentQueryServiceDep = Annotated[
    ClientConsentQueryService,
    Depends(get_client_consent_query_service),
]


def get_client_consent_status_service(
    consent_crud: ClientConsentCrudDep,
) -> ClientConsentStatusService:
    return ClientConsentStatusService(consent_crud)


ClientConsentStatusServiceDep = Annotated[
    ClientConsentStatusService,
    Depends(get_client_consent_status_service),
]


def get_client_consent_comment_service(
    consent_crud: ClientConsentCrudDep,
) -> ClientConsentCommentService:
    return ClientConsentCommentService(consent_crud)


ClientConsentCommentServiceDep = Annotated[
    ClientConsentCommentService,
    Depends(get_client_consent_comment_service),
]


def get_client_consent_history_service(
    consent_crud: ClientConsentCrudDep,
    consent_service: ClientConsentServiceDep,
) -> ClientConsentHistoryService:
    return ClientConsentHistoryService(
        consent_crud=consent_crud,
        consent_service=consent_service,
    )


ClientConsentHistoryServiceDep = Annotated[
    ClientConsentHistoryService,
    Depends(get_client_consent_history_service),
]


def get_client_consent_sync_service(
    consent_service: ClientConsentServiceDep,
    source_service: ClientConsentSourceServiceDep,
) -> ClientConsentSyncService:
    return ClientConsentSyncService(
        consent_service=consent_service,
        source_service=source_service,
    )


ClientConsentSyncServiceDep = Annotated[
    ClientConsentSyncService,
    Depends(get_client_consent_sync_service),
]