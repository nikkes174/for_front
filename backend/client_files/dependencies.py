from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_files.crud import ClientFileCrud, ClientFileLinkCrud
from client_circout.backend.client_files.service.client_file_access_service import ClientFileAccessService
from client_circout.backend.client_files.service.client_file_category_service import ClientFileCategoryService
from client_circout.backend.client_files.service.client_file_link_service import ClientFileLinkService
from client_circout.backend.client_files.service.client_file_query_service import ClientFileQueryService
from client_circout.backend.client_files.service.client_file_service import ClientFileService
from client_circout.backend.client_files.service.client_file_storage_service import (
    ClientFileStorageService
    ,
    LocalClientFileStorage,
)
from client_circout.backend.client_files.service.client_file_sync_service import ClientFileSyncService
from client_circout.backend.db.db import SessionFactory


PROJECT_ROOT = Path(__file__).resolve().parents[2]
UPLOADS_DIR = PROJECT_ROOT / "uploads"


async def get_client_files_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientFilesSessionDep = Annotated[
    AsyncSession,
    Depends(get_client_files_db_session),
]


def get_client_file_crud(
    session: ClientFilesSessionDep,
) -> ClientFileCrud:
    return ClientFileCrud(session)


ClientFileCrudDep = Annotated[
    ClientFileCrud,
    Depends(get_client_file_crud),
]


def get_client_file_link_crud(
    session: ClientFilesSessionDep,
) -> ClientFileLinkCrud:
    return ClientFileLinkCrud(session)


ClientFileLinkCrudDep = Annotated[
    ClientFileLinkCrud,
    Depends(get_client_file_link_crud),
]


def get_client_file_category_service() -> ClientFileCategoryService:
    return ClientFileCategoryService()


ClientFileCategoryServiceDep = Annotated[
    ClientFileCategoryService,
    Depends(get_client_file_category_service),
]


def get_client_file_access_service() -> ClientFileAccessService:
    return ClientFileAccessService()


ClientFileAccessServiceDep = Annotated[
    ClientFileAccessService,
    Depends(get_client_file_access_service),
]


def get_client_file_storage_service() -> ClientFileStorageService:
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

    return ClientFileStorageService(
        LocalClientFileStorage(
            base_path=UPLOADS_DIR,
            public_url_prefix="/uploads",
        )
    )


ClientFileStorageServiceDep = Annotated[
    ClientFileStorageService,
    Depends(get_client_file_storage_service),
]


def get_client_file_service(
    file_crud: ClientFileCrudDep,
    category_service: ClientFileCategoryServiceDep,
    storage_service: ClientFileStorageServiceDep,
    access_service: ClientFileAccessServiceDep,
) -> ClientFileService:
    return ClientFileService(
        file_crud=file_crud,
        category_service=category_service,
        storage_service=storage_service,
        access_service=access_service,
    )


ClientFileServiceDep = Annotated[
    ClientFileService,
    Depends(get_client_file_service),
]


def get_client_file_link_service(
    file_link_crud: ClientFileLinkCrudDep,
) -> ClientFileLinkService:
    return ClientFileLinkService(file_link_crud)


ClientFileLinkServiceDep = Annotated[
    ClientFileLinkService,
    Depends(get_client_file_link_service),
]


def get_client_file_query_service(
    session: ClientFilesSessionDep,
) -> ClientFileQueryService:
    return ClientFileQueryService(session)


ClientFileQueryServiceDep = Annotated[
    ClientFileQueryService,
    Depends(get_client_file_query_service),
]


def get_client_file_sync_service(
    file_service: ClientFileServiceDep,
    file_link_service: ClientFileLinkServiceDep,
) -> ClientFileSyncService:
    return ClientFileSyncService(
        file_service=file_service,
        file_link_service=file_link_service,
    )


ClientFileSyncServiceDep = Annotated[
    ClientFileSyncService,
    Depends(get_client_file_sync_service),
]
