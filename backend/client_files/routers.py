from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile, status
from fastapi.responses import Response
from pydantic import BaseModel

from client_circout.backend.client_files.dependencies import (
    ClientFileCategoryServiceDep,
    ClientFileLinkServiceDep,
    ClientFileQueryServiceDep,
    ClientFileServiceDep,

    ClientFileSyncServiceDep,
)
from client_circout.backend.client_files.schemas import (
    ClientFileCreateSchema,
    ClientFileLinkCreateSchema,
    ClientFileLinkReadSchema,
    ClientFileLinkUpdateSchema,
    ClientFileReadSchema,
    ClientFileUpdateSchema,
)
from client_circout.backend.client_files.service.client_file_category_service import ClientFileCategory
from client_circout.backend.client_files.service.client_file_query_service import (
    ClientFileFilters,
    ClientFileSortField,
    SortDirection,
)
from client_circout.backend.client_files.service.client_file_sync_service import ExternalFileMetadata
from client_circout.backend.client_files.service.exceptions import (
    ClientFileAccessDeniedError,
    ClientFileConflictError,
    ClientFileNotFoundError,
    ClientFilesError,
    ClientFileStorageError,
    ClientFileValidationError,
)

router = APIRouter(
    prefix="/client-files",
    tags=["client-files"],
)


class DeleteRead(BaseModel):
    deleted: bool


class CountRead(BaseModel):
    count: int


class StorageSizeRead(BaseModel):
    client_id: int
    size: int


class DownloadUrlRead(BaseModel):
    file_id: int
    url: str | None


class FileCategoryRead(BaseModel):
    code: str
    title: str
    description: str


class FileWithLinksRead(BaseModel):
    file: ClientFileReadSchema
    links: list[ClientFileLinkReadSchema]


class SyncFileMetadataRequest(BaseModel):
    file_category: str | None = None
    file_name: str | None = None
    mime_type: str | None = None
    size: int | None = None
    storage_key: str | None = None
    uploaded_by: int | None = None


class SyncVisitLinkRequest(BaseModel):
    client_id: int
    file_id: int
    related_visit_id: int
    file_role: str


class SyncProcedureLinkRequest(BaseModel):
    client_id: int
    file_id: int
    related_procedure_id: int
    file_role: str


class UnlinkExternalEntityRequest(BaseModel):
    file_id: int
    related_visit_id: int | None = None
    related_procedure_id: int | None = None


class BooleanRead(BaseModel):
    result: bool


def _to_file_read(file) -> ClientFileReadSchema:
    return ClientFileReadSchema.model_validate(file)


def _to_link_read(link) -> ClientFileLinkReadSchema:
    return ClientFileLinkReadSchema.model_validate(link)


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, ClientFileNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc) or "Файл клиента не найден",
        ) from exc

    if isinstance(exc, ClientFileAccessDeniedError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc) or "Доступ к файлу запрещён",
        ) from exc

    if isinstance(exc, ClientFileConflictError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc) or "Конфликт файла клиента",
        ) from exc

    if isinstance(exc, ClientFileValidationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Некорректные данные файла",
        ) from exc

    if isinstance(exc, ClientFileStorageError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc) or "Ошибка файлового хранилища",
        ) from exc

    if isinstance(exc, ClientFilesError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Ошибка файлов клиента",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc) or "Ошибка файлов клиента",
    ) from exc


@router.get("/categories", response_model=list[FileCategoryRead])
async def list_file_categories(
    service: ClientFileCategoryServiceDep,
) -> list[FileCategoryRead]:
    categories: tuple[ClientFileCategory, ...] = service.list_categories()
    return [
        FileCategoryRead(
            code=category.code,
            title=category.title,
            description=category.description,
        )
        for category in categories
    ]


@router.post(
    "",
    response_model=ClientFileReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_file_metadata(
    payload: ClientFileCreateSchema,
    service: ClientFileServiceDep,
) -> ClientFileReadSchema:
    try:
        file = await service.create_file_record(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_file_read(file)


@router.post(
    "/upload",
    response_model=ClientFileReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def upload_client_file(
    service: ClientFileServiceDep,
    organization_id: int = Form(...),
    client_id: int = Form(...),
    file_category: str = Form(...),
    uploaded_by: int | None = Form(default=None),
    file: UploadFile = File(...),
) -> ClientFileReadSchema:
    try:
        content = await file.read()
        created_file = await service.upload_file(
            organization_id=organization_id,
            client_id=client_id,
            file_category=file_category,
            file_name=file.filename or "file",
            mime_type=file.content_type or "application/octet-stream",
            content=content,
            uploaded_by=uploaded_by,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_file_read(created_file)


@router.get("", response_model=list[ClientFileReadSchema])
async def list_files(
    service: ClientFileQueryServiceDep,
    client_id: int | None = Query(default=None),
    organization_id: int | None = Query(default=None),
    file_category: str | None = Query(default=None),
    mime_type: str | None = Query(default=None),
    uploaded_by: int | None = Query(default=None),
    created_from: datetime | None = Query(default=None),
    created_to: datetime | None = Query(default=None),
    related_visit_id: int | None = Query(default=None),
    related_procedure_id: int | None = Query(default=None),
    file_role: str | None = Query(default=None),
    sort_by: ClientFileSortField = Query(default="created_at"),
    sort_direction: SortDirection = Query(default="desc"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientFileReadSchema]:
    files = await service.list_files(
        filters=ClientFileFilters(
            client_id=client_id,
            organization_id=organization_id,
            file_category=file_category,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            created_from=created_from,
            created_to=created_to,
            related_visit_id=related_visit_id,
            related_procedure_id=related_procedure_id,
            file_role=file_role,
        ),
        sort_by=sort_by,
        sort_direction=sort_direction,
        offset=offset,
        limit=limit,
    )
    return [_to_file_read(file) for file in files]


@router.get("/with-links", response_model=list[FileWithLinksRead])
async def list_files_with_links(
    service: ClientFileQueryServiceDep,
    client_id: int | None = Query(default=None),
    organization_id: int | None = Query(default=None),
    file_category: str | None = Query(default=None),
    mime_type: str | None = Query(default=None),
    uploaded_by: int | None = Query(default=None),
    created_from: datetime | None = Query(default=None),
    created_to: datetime | None = Query(default=None),
    related_visit_id: int | None = Query(default=None),
    related_procedure_id: int | None = Query(default=None),
    file_role: str | None = Query(default=None),
    sort_by: ClientFileSortField = Query(default="created_at"),
    sort_direction: SortDirection = Query(default="desc"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[FileWithLinksRead]:
    items = await service.list_files_with_links(
        filters=ClientFileFilters(
            client_id=client_id,
            organization_id=organization_id,
            file_category=file_category,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            created_from=created_from,
            created_to=created_to,
            related_visit_id=related_visit_id,
            related_procedure_id=related_procedure_id,
            file_role=file_role,
        ),
        sort_by=sort_by,
        sort_direction=sort_direction,
        offset=offset,
        limit=limit,
    )

    return [
        FileWithLinksRead(
            file=_to_file_read(item["file"]),
            links=[_to_link_read(link) for link in item["links"]],
        )
        for item in items
    ]


@router.get("/count", response_model=CountRead)
async def count_files(
    service: ClientFileQueryServiceDep,
    client_id: int | None = Query(default=None),
    organization_id: int | None = Query(default=None),
    file_category: str | None = Query(default=None),
    mime_type: str | None = Query(default=None),
    uploaded_by: int | None = Query(default=None),
    created_from: datetime | None = Query(default=None),
    created_to: datetime | None = Query(default=None),
    related_visit_id: int | None = Query(default=None),
    related_procedure_id: int | None = Query(default=None),
    file_role: str | None = Query(default=None),
) -> CountRead:
    count = await service.count_files(
        filters=ClientFileFilters(
            client_id=client_id,
            organization_id=organization_id,
            file_category=file_category,
            mime_type=mime_type,
            uploaded_by=uploaded_by,
            created_from=created_from,
            created_to=created_to,
            related_visit_id=related_visit_id,
            related_procedure_id=related_procedure_id,
            file_role=file_role,
        ),
    )
    return CountRead(count=count)


@router.get(
    "/clients/{client_id}",
    response_model=list[ClientFileReadSchema],
)
async def list_client_files(
    client_id: int,
    service: ClientFileServiceDep,
) -> list[ClientFileReadSchema]:
    files = await service.list_client_files(client_id=client_id)
    return [_to_file_read(file) for file in files]


@router.get(
    "/clients/{client_id}/categories/{file_category}",
    response_model=list[ClientFileReadSchema],
)
async def list_client_files_by_category(
    client_id: int,
    file_category: str,
    service: ClientFileServiceDep,
) -> list[ClientFileReadSchema]:
    try:
        files = await service.list_client_files_by_category(
            client_id=client_id,
            file_category=file_category,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_to_file_read(file) for file in files]


@router.get(
    "/clients/{client_id}/storage-size",
    response_model=StorageSizeRead,
)
async def get_client_storage_size(
    client_id: int,
    service: ClientFileQueryServiceDep,
    organization_id: int | None = Query(default=None),
) -> StorageSizeRead:
    size = await service.get_client_storage_size(
        client_id=client_id,
        organization_id=organization_id,
    )
    return StorageSizeRead(client_id=client_id, size=size)


@router.get(
    "/storage-key",
    response_model=ClientFileReadSchema,
)
async def get_file_by_storage_key(
    service: ClientFileServiceDep,
    storage_key: str = Query(...),
) -> ClientFileReadSchema:
    try:
        file = await service.get_file_by_storage_key(storage_key=storage_key)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_file_read(file)


@router.get(
    "/{file_id}",
    response_model=ClientFileReadSchema,
)
async def get_file(
    file_id: int,
    service: ClientFileServiceDep,
) -> ClientFileReadSchema:
    try:
        file = await service.get_file(file_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_file_read(file)


@router.patch(
    "/{file_id}",
    response_model=ClientFileReadSchema,
)
async def update_file_metadata(
    file_id: int,
    payload: ClientFileUpdateSchema,
    service: ClientFileServiceDep,
) -> ClientFileReadSchema:
    try:
        file = await service.update_file_metadata(file_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_file_read(file)


@router.post(
    "/{file_id}/archive",
    response_model=ClientFileReadSchema,
)
async def archive_file(
    file_id: int,
    service: ClientFileServiceDep,
) -> ClientFileReadSchema:
    try:
        file = await service.archive_file(file_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_file_read(file)


@router.get(
    "/{file_id}/download-url",
    response_model=DownloadUrlRead,
)
async def get_file_download_url(
    file_id: int,
    service: ClientFileServiceDep,
) -> DownloadUrlRead:
    try:
        url = await service.get_download_url(file_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DownloadUrlRead(file_id=file_id, url=url)


@router.get("/{file_id}/content")
async def read_file_content(
    file_id: int,
    service: ClientFileServiceDep,
) -> Response:
    try:
        file = await service.get_file(file_id)
        content = await service.read_file_content(file_id)
    except Exception as exc:
        _raise_http_error(exc)

    return Response(
        content=content,
        media_type=file.mime_type,
        headers={
            "Content-Disposition": f'attachment; filename="{file.file_name}"',
        },
    )


@router.delete(
    "/{file_id}",
    response_model=DeleteRead,
)
async def delete_file_metadata(
    file_id: int,
    service: ClientFileServiceDep,
    with_storage: bool = Query(default=False),
) -> DeleteRead:
    try:
        if with_storage:
            await service.delete_file_with_storage(file_id)
        else:
            await service.delete_file_metadata(file_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.get(
    "/storage/{storage_key:path}/exists",
    response_model=BooleanRead,
)
async def file_exists_in_storage(
    storage_key: str,
    service: ClientFileStorageServiceDep,
) -> BooleanRead:
    try:
        result = await service.file_exists(storage_key=storage_key)
    except Exception as exc:
        _raise_http_error(exc)

    return BooleanRead(result=result)


@router.post(
    "/links",
    response_model=ClientFileLinkReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_file_link(
    payload: ClientFileLinkCreateSchema,
    service: ClientFileLinkServiceDep,
) -> ClientFileLinkReadSchema:
    try:
        link = await service.create_link(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_link_read(link)


@router.post(
    "/links/client",
    response_model=ClientFileLinkReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def link_file_to_client(
    payload: ClientFileLinkCreateSchema,
    service: ClientFileLinkServiceDep,
) -> ClientFileLinkReadSchema:
    try:
        link = await service.link_to_client(
            client_id=payload.client_id,
            file_id=payload.file_id,
            file_role=payload.file_role,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_link_read(link)


@router.post(
    "/links/visit",
    response_model=ClientFileLinkReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def link_file_to_visit(
    payload: ClientFileLinkCreateSchema,
    service: ClientFileLinkServiceDep,
) -> ClientFileLinkReadSchema:
    if payload.related_visit_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="related_visit_id обязателен",
        )

    try:
        link = await service.link_to_visit(
            client_id=payload.client_id,
            file_id=payload.file_id,
            related_visit_id=payload.related_visit_id,
            file_role=payload.file_role,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_link_read(link)


@router.post(
    "/links/procedure",
    response_model=ClientFileLinkReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def link_file_to_procedure(
    payload: ClientFileLinkCreateSchema,
    service: ClientFileLinkServiceDep,
) -> ClientFileLinkReadSchema:
    if payload.related_procedure_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="related_procedure_id обязателен",
        )

    try:
        link = await service.link_to_procedure(
            client_id=payload.client_id,
            file_id=payload.file_id,
            related_procedure_id=payload.related_procedure_id,
            file_role=payload.file_role,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_link_read(link)


@router.get(
    "/links/{link_id}",
    response_model=ClientFileLinkReadSchema,
)
async def get_file_link(
    link_id: int,
    service: ClientFileLinkServiceDep,
) -> ClientFileLinkReadSchema:
    try:
        link = await service.get_link(link_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_link_read(link)


@router.patch(
    "/links/{link_id}",
    response_model=ClientFileLinkReadSchema,
)
async def update_file_link(
    link_id: int,
    payload: ClientFileLinkUpdateSchema,
    service: ClientFileLinkServiceDep,
) -> ClientFileLinkReadSchema:
    try:
        link = await service.update_link(link_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_link_read(link)


@router.delete(
    "/links/{link_id}",
    response_model=DeleteRead,
)
async def delete_file_link(
    link_id: int,
    service: ClientFileLinkServiceDep,
) -> DeleteRead:
    try:
        await service.delete_link(link_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.delete(
    "/files/{file_id}/links",
    response_model=CountRead,
)
async def delete_links_for_file(
    file_id: int,
    service: ClientFileLinkServiceDep,
) -> CountRead:
    try:
        count = await service.delete_links_for_file(file_id=file_id)
    except Exception as exc:
        _raise_http_error(exc)

    return CountRead(count=count)


@router.get(
    "/clients/{client_id}/links",
    response_model=list[ClientFileLinkReadSchema],
)
async def list_client_file_links(
    client_id: int,
    service: ClientFileLinkServiceDep,
) -> list[ClientFileLinkReadSchema]:
    links = await service.list_client_links(client_id=client_id)
    return [_to_link_read(link) for link in links]


@router.get(
    "/files/{file_id}/links",
    response_model=list[ClientFileLinkReadSchema],
)
async def list_file_links(
    file_id: int,
    service: ClientFileLinkServiceDep,
) -> list[ClientFileLinkReadSchema]:
    links = await service.list_file_links(file_id=file_id)
    return [_to_link_read(link) for link in links]


@router.get(
    "/visits/{related_visit_id}/links",
    response_model=list[ClientFileLinkReadSchema],
)
async def list_visit_file_links(
    related_visit_id: int,
    service: ClientFileLinkServiceDep,
) -> list[ClientFileLinkReadSchema]:
    links = await service.list_visit_links(related_visit_id=related_visit_id)
    return [_to_link_read(link) for link in links]


@router.get(
    "/procedures/{related_procedure_id}/links",
    response_model=list[ClientFileLinkReadSchema],
)
async def list_procedure_file_links(
    related_procedure_id: int,
    service: ClientFileLinkServiceDep,
) -> list[ClientFileLinkReadSchema]:
    links = await service.list_procedure_links(
        related_procedure_id=related_procedure_id,
    )
    return [_to_link_read(link) for link in links]


@router.patch(
    "/sync/files/{file_id}/metadata",
    response_model=ClientFileReadSchema,
)
async def sync_file_metadata(
    file_id: int,
    payload: SyncFileMetadataRequest,
    service: ClientFileSyncServiceDep,
) -> ClientFileReadSchema:
    try:
        file = await service.sync_file_metadata(
            file_id=file_id,
            metadata=ExternalFileMetadata(**payload.model_dump()),
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_file_read(file)


@router.post(
    "/sync/visit-link",
    response_model=ClientFileLinkReadSchema,
)
async def sync_visit_link(
    payload: SyncVisitLinkRequest,
    service: ClientFileSyncServiceDep,
) -> ClientFileLinkReadSchema:
    try:
        link = await service.sync_visit_link(**payload.model_dump())
    except Exception as exc:
        _raise_http_error(exc)

    return _to_link_read(link)


@router.post(
    "/sync/procedure-link",
    response_model=ClientFileLinkReadSchema,
)
async def sync_procedure_link(
    payload: SyncProcedureLinkRequest,
    service: ClientFileSyncServiceDep,
) -> ClientFileLinkReadSchema:
    try:
        link = await service.sync_procedure_link(**payload.model_dump())
    except Exception as exc:
        _raise_http_error(exc)

    return _to_link_read(link)


@router.post(
    "/sync/unlink-external",
    response_model=BooleanRead,
)
async def unlink_file_from_external_entity(
    payload: UnlinkExternalEntityRequest,
    service: ClientFileSyncServiceDep,
) -> BooleanRead:
    try:
        result = await service.unlink_file_from_external_entity(**payload.model_dump())
    except Exception as exc:
        _raise_http_error(exc)

    return BooleanRead(result=result)