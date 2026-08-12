from __future__ import annotations

from datetime import datetime
from pathlib import Path
from typing import Annotated, Any, Awaitable, TypeVar

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status as http_status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.api_dependencies import get_auth_logging_publisher
from client_circout.backend.clients_core.service.client_additional_fields_service import ClientAdditionalFieldsService
from client_circout.backend.clients_core.service.client_branch_service import ClientBranchService
from client_circout.backend.clients_core.service.client_category_service import ClientCategoryService
from client_circout.backend.clients_core.service.client_duplicates_service import ClientDuplicatesService
from client_circout.backend.clients_core.service.client_import_export_service import ClientDownloadPhoto, ClientImportExportService
from client_circout.backend.clients_core.service.client_merge_service import ClientMergeService
from client_circout.backend.clients_core.service.client_service import ClientService
from client_circout.backend.clients_core.service.exceptions import EntityNotFoundError, EntityConflictError, ValidationServiceError, \
    MergeServiceError
from client_circout.backend.depencises import get_db_session
from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.clients_core.crud.client_additional import (
    ClientAdditionalFieldCrud,
    ClientAdditionalFieldValueCrud,
)
from client_circout.backend.clients_core.crud.client_batch import ClientExportBatchCrud, ClientImportBatchCrud
from client_circout.backend.clients_core.crud.client_branch import ClientBranchCrud
from client_circout.backend.clients_core.crud.client_categories import ClientCategoryCrud, ClientCategoryLinkCrud
from client_circout.backend.clients_core.crud.client_duplicate_candidates import ClientDuplicateCandidateCrud
from client_circout.backend.clients_core.crud.client_import_rows import ClientImportRowCrud
from client_circout.backend.clients_core.crud.client_merge_operations import ClientMergeOperationCrud
from client_circout.backend.clients_core.schemas.client import (
    ClientCreateSchema,
    ClientReadSchema,
    ClientUpdateSchema,
)
from client_circout.backend.global_utils import normalize_phone
from client_circout.backend.clients_core.models.client import (
    ClientModel,
    ClientOrganizationModel,
    client_organization_filter,
)
from client_circout.backend.clients_core.models.client_achievements import ClientAchievementModel
from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel
from client_circout.backend.clients_core.schemas.client_additional import (
    ClientAdditionalFieldCreateSchema,
    ClientAdditionalFieldReadSchema,
    ClientAdditionalFieldUpdateSchema,
    ClientAdditionalFieldValueCreateSchema,
    ClientAdditionalFieldValueReadSchema,
)
from client_circout.backend.clients_core.schemas.client_batch import (
    ClientExportBatchCreateSchema,
    ClientExportBatchReadSchema,
    ClientImportBatchCreateSchema,
    ClientImportBatchReadSchema,
)
from client_circout.backend.clients_core.schemas.client_branch import (
    ClientBranchCreateSchema,
    ClientBranchReadSchema,
    ClientBranchUpdateSchema,
)
from client_circout.backend.clients_core.schemas.client_categories import (
    ClientCategoryCreateSchema,
    ClientCategoryLinkCreateSchema,
    ClientCategoryLinkReadSchema,
    ClientCategoryReadSchema,
    ClientCategoryUpdateSchema,
)
from client_circout.backend.clients_core.schemas.client_duplicate_candidates import (
    ClientDuplicateCandidateCreateSchema,
    ClientDuplicateCandidateReadSchema,
)
from client_circout.backend.clients_core.schemas.client_import_rows import (
    ClientImportRowCreateSchema,
    ClientImportRowReadSchema,
)
from client_circout.backend.clients_core.schemas.client_merge_operations import (
    ClientMergeOperationReadSchema,
)
from client_circout.backend.logger import get_logger
from client_circout.backend.integrations.auth_logging import AuthLoggingPublishError, AuthLoggingPublisher
from client_circout.backend.integrations.loyalty import create_loyalty_client_projection_service
from client_circout.backend.client_segments.dependencies import (
    SegmentDataProviderDep,
    SegmentTriggerServiceDep,
)


router = APIRouter(prefix="/clients-core", tags=["clients-core"])
logger = get_logger(__name__)

T = TypeVar("T")
SessionDep = Annotated[AsyncSession, Depends(get_db_session)]
CLIENT_PHOTOS_DIR = Path(__file__).resolve().parents[2] / "uploads" / "client-photos"


class ClientStatusChangeSchema(BaseModel):
    status: str = Field(min_length=1, max_length=50)


class ClientArchiveSchema(BaseModel):
    archived_by: int | None = None
    status: str = Field(default="archived", min_length=1, max_length=50)


class ClientRestoreSchema(BaseModel):
    status: str = Field(default="active", min_length=1, max_length=50)


class CategoryFilterSchema(BaseModel):
    category_ids: list[int] = Field(min_length=1)
    organization_id: int | None = None
    status: str | None = Field(default=None, max_length=50)
    match_all: bool = False
    offset: int = Field(default=0, ge=0)
    limit: int = Field(default=100, ge=1, le=1000)


class AdditionalFieldValueBulkSetSchema(BaseModel):
    client_id: int
    values: dict[int, str | dict[str, Any] | None]


class RequiredAdditionalFieldsCheckSchema(BaseModel):
    client_id: int
    organization_id: int


class BranchVisitRegisterSchema(BaseModel):
    client_id: int
    branch_id: int
    visit_at: datetime | None = None


class ImportRowsBulkCreateSchema(BaseModel):
    batch_id: int
    rows: list[dict[str, Any]] = Field(min_length=1)
    start_row_number: int = Field(default=1, ge=1)


class ImportRowSuccessSchema(BaseModel):
    client_id: int


class ImportRowFailedSchema(BaseModel):
    error_text: str = Field(min_length=1, max_length=2000)


class ExportBatchFinishSchema(BaseModel):
    file_id: int


class DuplicateFindSchema(BaseModel):
    organization_id: int
    client_id: int
    min_score: float = Field(default=0.75, ge=0, le=1)
    status: str | None = Field(default="active", max_length=50)
    scan_limit: int = Field(default=1000, ge=1, le=10000)


class DuplicateStatusChangeSchema(BaseModel):
    status: str = Field(min_length=1, max_length=50)


class MergeClientsSchema(BaseModel):
    primary_client_id: int
    duplicate_client_id: int
    merged_by: int | None = None
    reason: str | None = Field(default=None, max_length=1000)


async def call_service(awaitable: Awaitable[T]) -> T:
    try:
        return await awaitable
    except EntityNotFoundError as exc:
        logger.warning("clients_core not found: %s", exc)
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except EntityConflictError as exc:
        logger.warning("clients_core conflict: %s", exc)
        raise HTTPException(
            status_code=http_status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except (ValidationServiceError, MergeServiceError) as exc:
        logger.warning("clients_core validation error: %s", exc)
        raise HTTPException(
            status_code=http_status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


def _client_payload(client: ClientReadSchema) -> dict[str, Any]:
    client_name = client.full_name or " ".join(
        part for part in (client.last_name, client.first_name, client.middle_name) if part
    )
    details = [
        f"Клиент: {client_name or f'#{client.id}'}",
        f"ID клиента: {client.id}",
    ]
    if client.primary_phone:
        details.append(f"Телефон: {client.primary_phone}")
    return {
        **client.model_dump(mode="json"),
        "summary": f"Создан клиент {client_name or f'#{client.id}'}",
        "details": details,
    }


async def _publish_client_created(
    publisher: AuthLoggingPublisher,
    client: ClientReadSchema,
) -> None:
    try:
        await publisher.publish_event_and_audit(
            event_type="client.created",
            action="client.create",
            entity_type="client",
            entity_id=client.id,
            organization_id=client.organization_id,
            client_id=client.id,
            actor_id=client.created_by,
            payload=_client_payload(client),
            source="external_integration",
        )
    except AuthLoggingPublishError as exc:
        logger.warning("client created, but audit/event publishing failed for client_id=%s: %s", client.id, exc)


def get_client_service(session: SessionDep) -> ClientService:
    return ClientService(ClientCrud(session))


def get_category_service(session: SessionDep) -> ClientCategoryService:
    return ClientCategoryService(
        client_crud=ClientCrud(session),
        category_crud=ClientCategoryCrud(session),
        category_link_crud=ClientCategoryLinkCrud(session),
    )


def get_additional_fields_service(session: SessionDep) -> ClientAdditionalFieldsService:
    return ClientAdditionalFieldsService(
        client_crud=ClientCrud(session),
        field_crud=ClientAdditionalFieldCrud(session),
        value_crud=ClientAdditionalFieldValueCrud(session),
    )


def get_branch_service(session: SessionDep) -> ClientBranchService:
    return ClientBranchService(
        client_crud=ClientCrud(session),
        client_branch_crud=ClientBranchCrud(session),
    )


def get_import_export_service(session: SessionDep) -> ClientImportExportService:
    return ClientImportExportService(
        import_batch_crud=ClientImportBatchCrud(session),
        import_row_crud=ClientImportRowCrud(session),
        export_batch_crud=ClientExportBatchCrud(session),
    )


def get_client_photo_service(session: SessionDep) -> ClientDownloadPhoto:
    return ClientDownloadPhoto(
        client_crud=ClientCrud(session),
        storage_dir=CLIENT_PHOTOS_DIR,
    )


def get_duplicates_service(session: SessionDep) -> ClientDuplicatesService:
    return ClientDuplicatesService(
        client_crud=ClientCrud(session),
        duplicate_candidate_crud=ClientDuplicateCandidateCrud(session),
    )


def get_merge_service(session: SessionDep) -> ClientMergeService:
    return ClientMergeService(
        client_crud=ClientCrud(session),
        merge_operation_crud=ClientMergeOperationCrud(session),
        category_link_crud=ClientCategoryLinkCrud(session),
        additional_value_crud=ClientAdditionalFieldValueCrud(session),
        branch_crud=ClientBranchCrud(session),
    )


ClientServiceDep = Annotated[ClientService, Depends(get_client_service)]
CategoryServiceDep = Annotated[ClientCategoryService, Depends(get_category_service)]
AdditionalFieldsServiceDep = Annotated[
    ClientAdditionalFieldsService,
    Depends(get_additional_fields_service),
]
BranchServiceDep = Annotated[ClientBranchService, Depends(get_branch_service)]
ImportExportServiceDep = Annotated[ClientImportExportService, Depends(get_import_export_service)]
ClientPhotoServiceDep = Annotated[ClientDownloadPhoto, Depends(get_client_photo_service)]
DuplicatesServiceDep = Annotated[ClientDuplicatesService, Depends(get_duplicates_service)]
MergeServiceDep = Annotated[ClientMergeService, Depends(get_merge_service)]
@router.post("/clients", response_model=ClientReadSchema, status_code=http_status.HTTP_201_CREATED)
async def create_client(
    payload: ClientCreateSchema,
    service: ClientServiceDep,
    segment_trigger_service: SegmentTriggerServiceDep,
    segment_data_provider: SegmentDataProviderDep,
    publisher: AuthLoggingPublisher = Depends(get_auth_logging_publisher),
):
    client = await call_service(service.create(payload))
    client_read = ClientReadSchema.model_validate(client)
    try:
        await segment_trigger_service.on_client_created(
            organization_id=client.organization_id,
            client_id=client.id,
            context=segment_data_provider,
        )
    except Exception as exc:
        logger.warning("client created, but segment recalculation failed for client_id=%s: %s", client.id, exc)
    loyalty_service = create_loyalty_client_projection_service()
    try:
        await loyalty_service.create_client_projection(client)
        await loyalty_service.apply_created_event(client_id=client.id, organization_id=client.organization_id)
    except Exception as exc:
        logger.warning("client created, but loyalty event processing failed for client_id=%s: %s", client.id, exc)
    finally:
        await loyalty_service.aclose()
    await _publish_client_created(publisher, client_read)
    return client_read


@router.get("/clients", response_model=list[ClientReadSchema])
async def list_clients(
    service: ClientServiceDep,
    organization_id: int | None = None,
    status: str | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list(
            organization_id=organization_id,
            status=status,
            offset=offset,
            limit=limit,
        ),
    )


@router.post("/clients/{client_id}/organizations/{organization_id}", response_model=ClientReadSchema)
async def add_client_organization(
    client_id: int,
    organization_id: int,
    service: ClientServiceDep,
):
    return await call_service(service.add_organization(client_id, organization_id))


@router.get("/clients/{client_id}/organizations", response_model=list[int])
async def list_client_organizations(client_id: int, session: SessionDep) -> list[int]:
    client_exists = await session.scalar(select(ClientModel.id).where(ClientModel.id == client_id))
    if client_exists is None:
        raise HTTPException(http_status.HTTP_404_NOT_FOUND, "Клиент не найден")
    return list((await session.scalars(
        select(ClientOrganizationModel.organization_id)
        .where(ClientOrganizationModel.client_id == client_id)
        .order_by(ClientOrganizationModel.organization_id.asc())
    )).all())


@router.get("/clients/search", response_model=list[ClientReadSchema])
async def search_clients(
    service: ClientServiceDep,
    session: SessionDep,
    query: str | None = None,
    organization_id: int | None = None,
    status: str | None = None,
    phone: str | None = None,
    email: str | None = None,
    telegram_id: int | None = None,
    max_id: int | None = None,
    vk_id: int | None = None,
    offset: int = 0,
    limit: int = 100,
) -> list[ClientReadSchema]:
    stmt = select(ClientModel)
    if organization_id is not None:
        stmt = stmt.where(client_organization_filter(organization_id))
    if status is not None:
        stmt = stmt.where(ClientModel.status == status)

    if query:
        query_value = query.strip()
        like_value = f"%{query_value}%"
        normalized_query_phone = normalize_phone(query_value)
        phone_variants = list(dict.fromkeys(filter(None, [
            query_value,
            normalized_query_phone,
            f"+{normalized_query_phone}" if normalized_query_phone else "",
            f"8{normalized_query_phone[1:]}" if normalized_query_phone and len(normalized_query_phone) == 11 and normalized_query_phone.startswith("7") else "",
            normalized_query_phone[-10:] if normalized_query_phone and len(normalized_query_phone) == 11 else "",
        ])))
        identity_conditions = [
            ClientModel.full_name.ilike(like_value),
            ClientModel.first_name.ilike(like_value),
            ClientModel.last_name.ilike(like_value),
            ClientModel.middle_name.ilike(like_value),
            ClientModel.primary_phone.in_(phone_variants) if len(normalized_query_phone or "") == 11 else ClientModel.primary_phone.ilike(like_value),
            ClientModel.secondary_phone.in_(phone_variants) if len(normalized_query_phone or "") == 11 else ClientModel.secondary_phone.ilike(like_value),
            ClientModel.email.ilike(like_value),
        ]
        if query_value.isdigit():
            identity_conditions.extend(
                [
                    ClientModel.telegram_id == int(query_value),
                    ClientModel.max_id == int(query_value),
                    ClientModel.vk_id == int(query_value),
                ],
            )
        stmt = stmt.where(or_(*identity_conditions))

    if phone:
        normalized_phone = normalize_phone(phone)
        phone_variants = list(dict.fromkeys(filter(None, [
            phone,
            normalized_phone,
            f"+{normalized_phone}" if normalized_phone else "",
            f"8{normalized_phone[1:]}" if normalized_phone and len(normalized_phone) == 11 and normalized_phone.startswith("7") else "",
            normalized_phone[-10:] if normalized_phone and len(normalized_phone) == 11 else "",
        ])))
        stmt = stmt.where(or_(ClientModel.primary_phone.in_(phone_variants), ClientModel.secondary_phone.in_(phone_variants)))
    if email:
        stmt = stmt.where(ClientModel.email.ilike(f"%{email.strip()}%"))
    if telegram_id is not None:
        stmt = stmt.where(ClientModel.telegram_id == telegram_id)
    if max_id is not None:
        stmt = stmt.where(ClientModel.max_id == max_id)
    if vk_id is not None:
        stmt = stmt.where(ClientModel.vk_id == vk_id)

    result = await session.execute(stmt.order_by(ClientModel.id.asc()).offset(offset).limit(limit))
    page_items = list(result.scalars().all())
    client_ids = [item.id for item in page_items]
    last_visits: dict[int, datetime] = {}
    if client_ids:
        result = await session.execute(
            select(
                ClientHistoryVisitModel.client_id,
                func.max(ClientHistoryVisitModel.visit_at),
            )
            .where(ClientHistoryVisitModel.client_id.in_(client_ids))
            .group_by(ClientHistoryVisitModel.client_id),
        )
        last_visits = {client_id: last_visit_at for client_id, last_visit_at in result.all()}

    return [
        ClientReadSchema.model_validate(item).model_copy(
            update={"last_visit_at": last_visits.get(item.id)},
        )
        for item in page_items
    ]


@router.get("/clients/by-telegram/{telegram_id}", response_model=ClientReadSchema | None)
async def get_client_by_telegram_id(telegram_id: int, service: ClientServiceDep):
    return await call_service(service.get_by_telegram_id(telegram_id))


@router.get("/clients/by-max/{max_id}", response_model=ClientReadSchema | None)
async def get_client_by_max_id(max_id: int, service: ClientServiceDep):
    return await call_service(service.get_by_max_id(max_id))


@router.get("/clients/by-vk/{vk_id}", response_model=ClientReadSchema | None)
async def get_client_by_vk_id(vk_id: int, service: ClientServiceDep):
    return await call_service(service.get_by_vk_id(vk_id))


@router.get("/clients/by-phone/{phone}", response_model=ClientReadSchema | None)
async def get_client_by_primary_phone(phone: str, service: ClientServiceDep):
    return await call_service(service.get_by_primary_phone(phone))


@router.get("/clients/by-email/{email}", response_model=ClientReadSchema | None)
async def get_client_by_email(email: str, service: ClientServiceDep):
    return await call_service(service.get_by_email(email))


@router.get("/clients/{client_id}", response_model=ClientReadSchema)
async def get_client(client_id: int, service: ClientServiceDep):
    return await call_service(service.get(client_id))


class ClientAchievementCreateSchema(BaseModel):
    organization_id: int
    achievement_id: int
    name: str
    level_name: str


@router.get("/clients/{client_id}/achievements")
async def list_client_achievements(client_id: int, session: SessionDep) -> list[dict[str, Any]]:
    items = (await session.scalars(
        select(ClientAchievementModel)
        .where(ClientAchievementModel.client_id == client_id)
        .order_by(ClientAchievementModel.awarded_at.desc())
    )).all()
    seen_achievement_ids: set[int] = set()
    result = []
    for item in items:
        if item.achievement_id in seen_achievement_ids:
            continue
        seen_achievement_ids.add(item.achievement_id)
        result.append({"id": item.id, "achievement_id": item.achievement_id, "name": item.name, "level_name": item.level_name, "awarded_at": item.awarded_at})
    return result


@router.post("/clients/{client_id}/achievements", status_code=http_status.HTTP_201_CREATED)
async def create_client_achievement(
    client_id: int,
    payload: ClientAchievementCreateSchema,
    session: SessionDep,
) -> dict[str, Any]:
    client = await session.get(ClientModel, client_id)
    if client is None or client.organization_id != payload.organization_id:
        raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Клиент не найден")
    item = await session.scalar(select(ClientAchievementModel).where(
        ClientAchievementModel.client_id == client_id,
        ClientAchievementModel.achievement_id == payload.achievement_id,
    ))
    if item is None:
        item = ClientAchievementModel(
            client_id=client_id,
            organization_id=payload.organization_id,
            achievement_id=payload.achievement_id,
            name=payload.name,
            level_name=payload.level_name,
            awarded_at=datetime.utcnow(),
        )
        session.add(item)
        await session.commit()
        await session.refresh(item)
    return {"id": item.id, "created": item.name == payload.name}


@router.patch("/clients/{client_id}", response_model=ClientReadSchema)
async def update_client(
    client_id: int,
    payload: ClientUpdateSchema,
    service: ClientServiceDep,
    segment_trigger_service: SegmentTriggerServiceDep,
    segment_data_provider: SegmentDataProviderDep,
):
    client = await call_service(service.update(client_id, payload))
    await segment_trigger_service.on_client_updated(
        organization_id=client.organization_id,
        client_id=client.id,
        context=segment_data_provider,
    )
    return client


@router.post("/clients/{client_id}/photo", response_model=ClientReadSchema)
async def upload_client_photo(
    client_id: int,
    service: ClientPhotoServiceDep,
    file: UploadFile = File(...),
):
    return await call_service(service.upload_photo(client_id=client_id, file=file))


@router.get("/clients/{client_id}/photo")
async def get_client_photo(
    client_id: int,
    service: ClientPhotoServiceDep,
):
    path = await call_service(service.get_photo_path(client_id=client_id))
    if path is None:
        return Response(status_code=http_status.HTTP_204_NO_CONTENT)
    return FileResponse(path)


@router.patch("/clients/{client_id}/status", response_model=ClientReadSchema)
async def change_client_status(
    client_id: int,
    payload: ClientStatusChangeSchema,
    service: ClientServiceDep,
    segment_trigger_service: SegmentTriggerServiceDep,
    segment_data_provider: SegmentDataProviderDep,
):
    client = await call_service(service.change_status(client_id, payload.status))
    await segment_trigger_service.on_client_updated(
        organization_id=client.organization_id,
        client_id=client.id,
        context=segment_data_provider,
    )
    return client


@router.patch("/clients/{client_id}/archive", response_model=ClientReadSchema)
async def archive_client(
    client_id: int,
    payload: ClientArchiveSchema,
    service: ClientServiceDep,
    segment_trigger_service: SegmentTriggerServiceDep,
    segment_data_provider: SegmentDataProviderDep,
):
    client = await call_service(
        service.archive(
            client_id,
            archived_by=payload.archived_by,
            status=payload.status,
        ),
    )
    await segment_trigger_service.on_client_updated(
        organization_id=client.organization_id,
        client_id=client.id,
        context=segment_data_provider,
    )
    return client


@router.patch("/clients/{client_id}/restore", response_model=ClientReadSchema)
async def restore_client(
    client_id: int,
    payload: ClientRestoreSchema,
    service: ClientServiceDep,
    segment_trigger_service: SegmentTriggerServiceDep,
    segment_data_provider: SegmentDataProviderDep,
):
    client = await call_service(service.restore(client_id, status=payload.status))
    await segment_trigger_service.on_client_updated(
        organization_id=client.organization_id,
        client_id=client.id,
        context=segment_data_provider,
    )
    return client


@router.delete("/clients/{client_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_client(client_id: int, service: ClientServiceDep):
    await call_service(service.delete(client_id))
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)


@router.post(
    "/categories",
    response_model=ClientCategoryReadSchema,
    status_code=http_status.HTTP_201_CREATED,
)
async def create_category(payload: ClientCategoryCreateSchema, service: CategoryServiceDep):
    return await call_service(service.create_category(payload))


@router.get("/categories", response_model=list[ClientCategoryReadSchema])
async def list_categories(
    service: CategoryServiceDep,
    organization_id: int | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_categories(
            organization_id=organization_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.post("/categories/filter-clients", response_model=list[ClientReadSchema])
async def filter_clients_by_categories(payload: CategoryFilterSchema, service: CategoryServiceDep):
    return await call_service(
        service.filter_clients_by_categories(
            payload.category_ids,
            organization_id=payload.organization_id,
            status=payload.status,
            match_all=payload.match_all,
            offset=payload.offset,
            limit=payload.limit,
        ),
    )


@router.get("/categories/{category_id}", response_model=ClientCategoryReadSchema)
async def get_category(category_id: int, service: CategoryServiceDep):
    return await call_service(service.get_category(category_id))


@router.patch("/categories/{category_id}", response_model=ClientCategoryReadSchema)
async def update_category(
    category_id: int,
    payload: ClientCategoryUpdateSchema,
    service: CategoryServiceDep,
):
    return await call_service(service.update_category(category_id, payload))


@router.delete("/categories/{category_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: int, service: CategoryServiceDep):
    await call_service(service.delete_category(category_id))
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)


@router.post(
    "/category-links",
    response_model=ClientCategoryLinkReadSchema,
    status_code=http_status.HTTP_201_CREATED,
)
async def assign_category(payload: ClientCategoryLinkCreateSchema, service: CategoryServiceDep):
    return await call_service(
        service.assign_category(
            client_id=payload.client_id,
            category_id=payload.category_id,
            created_by=payload.created_by,
        ),
    )


@router.get("/clients/{client_id}/categories", response_model=list[ClientCategoryReadSchema])
async def list_client_categories(
    client_id: int,
    service: CategoryServiceDep,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_client_categories(client_id, offset=offset, limit=limit),
    )


@router.delete("/category-links", status_code=http_status.HTTP_204_NO_CONTENT)
async def remove_category(
    service: CategoryServiceDep,
    client_id: int,
    category_id: int,
):
    await call_service(
        service.remove_category(client_id=client_id, category_id=category_id),
    )
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)


@router.post(
    "/additional-fields",
    response_model=ClientAdditionalFieldReadSchema,
    status_code=http_status.HTTP_201_CREATED,
)
async def create_additional_field(
    payload: ClientAdditionalFieldCreateSchema,
    service: AdditionalFieldsServiceDep,
):
    return await call_service(service.create_field(payload))


@router.get("/additional-fields", response_model=list[ClientAdditionalFieldReadSchema])
async def list_additional_fields(
    service: AdditionalFieldsServiceDep,
    organization_id: int | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_fields(
            organization_id=organization_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.get("/additional-fields/by-code", response_model=ClientAdditionalFieldReadSchema | None)
async def get_additional_field_by_code(
    service: AdditionalFieldsServiceDep,
    organization_id: int,
    code: str,
):
    return await call_service(
        service.get_field_by_code(organization_id=organization_id, code=code),
    )


@router.get("/additional-fields/{field_id}", response_model=ClientAdditionalFieldReadSchema)
async def get_additional_field(field_id: int, service: AdditionalFieldsServiceDep):
    return await call_service(service.get_field(field_id))


@router.patch("/additional-fields/{field_id}", response_model=ClientAdditionalFieldReadSchema)
async def update_additional_field(
    field_id: int,
    payload: ClientAdditionalFieldUpdateSchema,
    service: AdditionalFieldsServiceDep,
):
    return await call_service(service.update_field(field_id, payload))


@router.delete("/additional-fields/{field_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_additional_field(field_id: int, service: AdditionalFieldsServiceDep):
    await call_service(service.delete_field(field_id))
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)


@router.put("/additional-field-values", response_model=ClientAdditionalFieldValueReadSchema)
async def set_additional_field_value(
    payload: ClientAdditionalFieldValueCreateSchema,
    service: AdditionalFieldsServiceDep,
):
    return await call_service(
        service.set_value(
            client_id=payload.client_id,
            field_id=payload.field_id,
            value_text=payload.value_text,
            value_json=payload.value_json,
        ),
    )


@router.put("/additional-field-values/bulk", response_model=list[ClientAdditionalFieldValueReadSchema])
async def set_additional_field_values_bulk(
    payload: AdditionalFieldValueBulkSetSchema,
    service: AdditionalFieldsServiceDep,
):
    return await call_service(service.set_values(client_id=payload.client_id, values=payload.values))


@router.get("/additional-field-values", response_model=list[ClientAdditionalFieldValueReadSchema])
async def list_additional_field_values(
    service: AdditionalFieldsServiceDep,
    client_id: int | None = None,
    field_id: int | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_values(
            client_id=client_id,
            field_id=field_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.get(
    "/additional-field-values/by-client-field",
    response_model=ClientAdditionalFieldValueReadSchema | None,
)
async def get_additional_field_value(
    service: AdditionalFieldsServiceDep,
    client_id: int,
    field_id: int,
):
    return await call_service(service.get_value(client_id=client_id, field_id=field_id))


@router.post("/additional-fields/missing-required", response_model=list[int])
async def get_missing_required_additional_field_ids(
    payload: RequiredAdditionalFieldsCheckSchema,
    service: AdditionalFieldsServiceDep,
):
    return await call_service(
        service.get_missing_required_field_ids(
            client_id=payload.client_id,
            organization_id=payload.organization_id,
        ),
    )


@router.delete("/additional-field-values/{value_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_additional_field_value(value_id: int, service: AdditionalFieldsServiceDep):
    await call_service(service.delete_value(value_id))
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)


@router.post("/branches", response_model=ClientBranchReadSchema, status_code=http_status.HTTP_201_CREATED)
async def link_client_branch(payload: ClientBranchCreateSchema, service: BranchServiceDep):
    return await call_service(service.link_branch(payload))


@router.post("/branches/register-visit", response_model=ClientBranchReadSchema)
async def register_branch_visit(payload: BranchVisitRegisterSchema, service: BranchServiceDep):
    return await call_service(
        service.register_visit(
            client_id=payload.client_id,
            branch_id=payload.branch_id,
            visit_at=payload.visit_at,
        ),
    )


@router.get("/branches", response_model=list[ClientBranchReadSchema])
async def list_client_branch_relations(
    service: BranchServiceDep,
    client_id: int | None = None,
    branch_id: int | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_relations(
            client_id=client_id,
            branch_id=branch_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.get("/branches/by-client-branch", response_model=ClientBranchReadSchema | None)
async def get_branch_relation_by_client_and_branch(
    service: BranchServiceDep,
    client_id: int,
    branch_id: int,
):
    return await call_service(service.get_by_client_and_branch(client_id=client_id, branch_id=branch_id))


@router.get("/branches/{relation_id}", response_model=ClientBranchReadSchema)
async def get_branch_relation(relation_id: int, service: BranchServiceDep):
    return await call_service(service.get_relation(relation_id))


@router.patch("/branches/{relation_id}", response_model=ClientBranchReadSchema)
async def update_branch_visit_dates(
    relation_id: int,
    payload: ClientBranchUpdateSchema,
    service: BranchServiceDep,
):
    return await call_service(service.update_visit_dates(relation_id, payload))


@router.delete("/branches/{relation_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_branch_relation(relation_id: int, service: BranchServiceDep):
    await call_service(service.delete_relation(relation_id))
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)


@router.post(
    "/import/batches",
    response_model=ClientImportBatchReadSchema,
    status_code=http_status.HTTP_201_CREATED,
)
async def create_import_batch(
    payload: ClientImportBatchCreateSchema,
    service: ImportExportServiceDep,
):
    return await call_service(
        service.create_import_batch(
            organization_id=payload.organization_id,
            file_id=payload.file_id,
            total_rows=payload.total_rows,
            created_by=payload.created_by,
            status=payload.status,
        ),
    )


@router.get("/import/batches", response_model=list[ClientImportBatchReadSchema])
async def list_import_batches(
    service: ImportExportServiceDep,
    organization_id: int | None = None,
    status: str | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_import_batches(
            organization_id=organization_id,
            status=status,
            offset=offset,
            limit=limit,
        ),
    )


@router.get("/import/batches/{batch_id}", response_model=ClientImportBatchReadSchema)
async def get_import_batch(batch_id: int, service: ImportExportServiceDep):
    return await call_service(service.get_import_batch(batch_id))


@router.patch("/import/batches/{batch_id}/start", response_model=ClientImportBatchReadSchema)
async def start_import_batch(batch_id: int, service: ImportExportServiceDep):
    return await call_service(service.start_import_batch(batch_id))


@router.patch("/import/batches/{batch_id}/finish", response_model=ClientImportBatchReadSchema)
async def finish_import_batch(batch_id: int, service: ImportExportServiceDep):
    return await call_service(service.finish_import_batch(batch_id))


@router.patch("/import/batches/{batch_id}/fail", response_model=ClientImportBatchReadSchema)
async def fail_import_batch(batch_id: int, service: ImportExportServiceDep):
    return await call_service(service.fail_import_batch(batch_id))


@router.post(
    "/import/rows",
    response_model=ClientImportRowReadSchema,
    status_code=http_status.HTTP_201_CREATED,
)
async def create_import_row(payload: ClientImportRowCreateSchema, service: ImportExportServiceDep):
    return await call_service(
        service.create_import_row(
            batch_id=payload.batch_id,
            row_number=payload.row_number,
            raw_data_json=payload.raw_data_json,
            status=payload.status,
            client_id=payload.client_id,
            error_text=payload.error_text,
        ),
    )


@router.post(
    "/import/rows/bulk",
    response_model=list[ClientImportRowReadSchema],
    status_code=http_status.HTTP_201_CREATED,
)
async def create_import_rows_bulk(
    payload: ImportRowsBulkCreateSchema,
    service: ImportExportServiceDep,
):
    return await call_service(
        service.add_import_rows(
            batch_id=payload.batch_id,
            rows=payload.rows,
            start_row_number=payload.start_row_number,
        ),
    )


@router.get("/import/rows", response_model=list[ClientImportRowReadSchema])
async def list_import_rows(
    service: ImportExportServiceDep,
    batch_id: int | None = None,
    status: str | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_import_rows(
            batch_id=batch_id,
            status=status,
            offset=offset,
            limit=limit,
        ),
    )


@router.get("/import/rows/{row_id}", response_model=ClientImportRowReadSchema)
async def get_import_row(row_id: int, service: ImportExportServiceDep):
    return await call_service(service.get_import_row(row_id))


@router.patch("/import/rows/{row_id}/success", response_model=ClientImportRowReadSchema)
async def mark_import_row_success(
    row_id: int,
    payload: ImportRowSuccessSchema,
    service: ImportExportServiceDep,
):
    return await call_service(service.mark_import_row_success(row_id=row_id, client_id=payload.client_id))


@router.patch("/import/rows/{row_id}/failed", response_model=ClientImportRowReadSchema)
async def mark_import_row_failed(
    row_id: int,
    payload: ImportRowFailedSchema,
    service: ImportExportServiceDep,
):
    return await call_service(service.mark_import_row_failed(row_id=row_id, error_text=payload.error_text))


@router.post(
    "/export/batches",
    response_model=ClientExportBatchReadSchema,
    status_code=http_status.HTTP_201_CREATED,
)
async def create_export_batch(
    payload: ClientExportBatchCreateSchema,
    service: ImportExportServiceDep,
):
    return await call_service(
        service.create_export_batch(
            organization_id=payload.organization_id,
            filters_json=payload.filters_json,
            created_by=payload.created_by,
            status=payload.status,
        ),
    )


@router.get("/export/batches", response_model=list[ClientExportBatchReadSchema])
async def list_export_batches(
    service: ImportExportServiceDep,
    organization_id: int | None = None,
    status: str | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_export_batches(
            organization_id=organization_id,
            status=status,
            offset=offset,
            limit=limit,
        ),
    )


@router.get("/export/batches/{batch_id}", response_model=ClientExportBatchReadSchema)
async def get_export_batch(batch_id: int, service: ImportExportServiceDep):
    return await call_service(service.get_export_batch(batch_id))


@router.patch("/export/batches/{batch_id}/start", response_model=ClientExportBatchReadSchema)
async def start_export_batch(batch_id: int, service: ImportExportServiceDep):
    return await call_service(service.start_export_batch(batch_id))


@router.patch("/export/batches/{batch_id}/finish", response_model=ClientExportBatchReadSchema)
async def finish_export_batch(
    batch_id: int,
    payload: ExportBatchFinishSchema,
    service: ImportExportServiceDep,
):
    return await call_service(service.finish_export_batch(batch_id=batch_id, file_id=payload.file_id))


@router.patch("/export/batches/{batch_id}/fail", response_model=ClientExportBatchReadSchema)
async def fail_export_batch(batch_id: int, service: ImportExportServiceDep):
    return await call_service(service.fail_export_batch(batch_id))


@router.post(
    "/duplicates/candidates",
    response_model=ClientDuplicateCandidateReadSchema,
    status_code=http_status.HTTP_201_CREATED,
)
async def create_duplicate_candidate(
    payload: ClientDuplicateCandidateCreateSchema,
    service: DuplicatesServiceDep,
):
    return await call_service(
        service.create_candidate(
            organization_id=payload.organization_id,
            client_id=payload.client_id,
            duplicate_client_id=payload.duplicate_client_id,
            match_score=payload.match_score,
            match_reason=payload.match_reason,
            status=payload.status,
        ),
    )


@router.get("/duplicates/candidates", response_model=list[ClientDuplicateCandidateReadSchema])
async def list_duplicate_candidates(
    service: DuplicatesServiceDep,
    organization_id: int | None = None,
    client_id: int | None = None,
    status: str | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_candidates(
            organization_id=organization_id,
            client_id=client_id,
            status=status,
            offset=offset,
            limit=limit,
        ),
    )


@router.post("/duplicates/candidates/find", response_model=list[ClientDuplicateCandidateReadSchema])
async def find_duplicate_candidates(payload: DuplicateFindSchema, service: DuplicatesServiceDep):
    return await call_service(
        service.find_and_save_candidates(
            organization_id=payload.organization_id,
            client_id=payload.client_id,
            min_score=payload.min_score,
            status=payload.status,
            scan_limit=payload.scan_limit,
        ),
    )


@router.get("/duplicates/candidates/{candidate_id}", response_model=ClientDuplicateCandidateReadSchema)
async def get_duplicate_candidate(candidate_id: int, service: DuplicatesServiceDep):
    return await call_service(service.get_candidate(candidate_id))


@router.patch("/duplicates/candidates/{candidate_id}/approve", response_model=ClientDuplicateCandidateReadSchema)
async def approve_duplicate_candidate(candidate_id: int, service: DuplicatesServiceDep):
    return await call_service(service.approve_candidate(candidate_id))


@router.patch("/duplicates/candidates/{candidate_id}/reject", response_model=ClientDuplicateCandidateReadSchema)
async def reject_duplicate_candidate(candidate_id: int, service: DuplicatesServiceDep):
    return await call_service(service.reject_candidate(candidate_id))


@router.patch("/duplicates/candidates/{candidate_id}/ignore", response_model=ClientDuplicateCandidateReadSchema)
async def ignore_duplicate_candidate(candidate_id: int, service: DuplicatesServiceDep):
    return await call_service(service.ignore_candidate(candidate_id))


@router.patch("/duplicates/candidates/{candidate_id}/status", response_model=ClientDuplicateCandidateReadSchema)
async def change_duplicate_candidate_status(
    candidate_id: int,
    payload: DuplicateStatusChangeSchema,
    service: DuplicatesServiceDep,
):
    return await call_service(service.change_candidate_status(candidate_id, payload.status))


@router.delete("/duplicates/candidates/{candidate_id}", status_code=http_status.HTTP_204_NO_CONTENT)
async def delete_duplicate_candidate(candidate_id: int, service: DuplicatesServiceDep):
    await call_service(service.delete_candidate(candidate_id))
    return Response(status_code=http_status.HTTP_204_NO_CONTENT)


@router.post("/merge", response_model=ClientMergeOperationReadSchema, status_code=http_status.HTTP_201_CREATED)
async def merge_clients(payload: MergeClientsSchema, service: MergeServiceDep):
    return await call_service(
        service.merge(
            primary_client_id=payload.primary_client_id,
            duplicate_client_id=payload.duplicate_client_id,
            merged_by=payload.merged_by,
            reason=payload.reason,
        ),
    )


@router.get("/merge/operations", response_model=list[ClientMergeOperationReadSchema])
async def list_merge_operations(
    service: MergeServiceDep,
    organization_id: int | None = None,
    primary_client_id: int | None = None,
    duplicate_client_id: int | None = None,
    offset: int = 0,
    limit: int = 100,
):
    return await call_service(
        service.list_operations(
            organization_id=organization_id,
            primary_client_id=primary_client_id,
            duplicate_client_id=duplicate_client_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.get("/merge/operations/{operation_id}", response_model=ClientMergeOperationReadSchema)
async def get_merge_operation(operation_id: int, service: MergeServiceDep):
    return await call_service(service.get_operation(operation_id))
