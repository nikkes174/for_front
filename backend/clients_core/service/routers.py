from __future__ import annotations

from collections.abc import Awaitable
from datetime import datetime
from typing import Any, TypeVar

from fastapi import APIRouter, HTTPException, Query, Response, status
from pydantic import BaseModel, Field
from sqlalchemy import or_, select

from client_circout.backend.clients_core.dependencies import (
    ClientAdditionalFieldsServiceDep,
    ClientBranchServiceDep,
    ClientCategoryServiceDep,
    ClientDuplicatesServiceDep,
    ClientImportExportServiceDep,
    ClientMergeServiceDep,
    ClientServiceDep,
    ClientsCoreSessionDep,
)
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.clients_core.schemas.client import (
    ClientCreateSchema,
    ClientReadSchema,
    ClientUpdateSchema,
)
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
from client_circout.backend.global_utils import normalize_phone
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
from client_circout.backend.clients_core.service.exceptions import (
    EntityConflictError,
    EntityNotFoundError,
    MergeServiceError,
    ValidationServiceError,
)

router = APIRouter(
    prefix="/clients-core",
    tags=["clients-core"],
)

T = TypeVar("T")


class ClientStatusChangeSchema(BaseModel):
    status: str = Field(min_length=1, max_length=50)


class ClientArchiveSchema(BaseModel):
    archived_by: int | None = None
    status: str = Field(default="archived", min_length=1, max_length=50)


class ClientRestoreSchema(BaseModel):
    status: str = Field(default="active", min_length=1, max_length=50)


class ClientBulkIdsSchema(BaseModel):
    client_ids: list[int] = Field(min_length=1)


class ClientBulkStatusChangeSchema(ClientBulkIdsSchema):
    status: str = Field(min_length=1, max_length=50)


class ClientBulkArchiveSchema(ClientBulkIdsSchema):
    archived_by: int | None = None
    status: str = Field(default="archived", min_length=1, max_length=50)


class ClientBulkRestoreSchema(ClientBulkIdsSchema):
    status: str = Field(default="active", min_length=1, max_length=50)


class BulkActionRead(BaseModel):
    processed: int
    client_ids: list[int]


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


CLIENT_SORT_COLUMNS = {
    "id": ClientModel.id,
    "full_name": ClientModel.full_name,
    "created_at": ClientModel.created_at,
    "updated_at": ClientModel.updated_at,
    "importance_class": ClientModel.importance_class,
}


async def call_service(awaitable: Awaitable[T]) -> T:
    try:
        return await awaitable
    except EntityNotFoundError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except EntityConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except (ValidationServiceError, MergeServiceError) as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc


@router.post(
    "/clients",
    response_model=ClientReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_client(
    payload: ClientCreateSchema,
    service: ClientServiceDep,
) -> ClientReadSchema:
    return await call_service(service.create(payload))


@router.get("/clients", response_model=list[ClientReadSchema])
async def list_clients(
    service: ClientServiceDep,
    organization_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientReadSchema]:
    return await call_service(
        service.list(
            organization_id=organization_id,
            status=status_value,
            offset=offset,
            limit=limit,
        ),
    )


@router.get("/clients/search", response_model=list[ClientReadSchema])
async def search_clients(
    session: ClientsCoreSessionDep,
    organization_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    query: str | None = Query(default=None),
    name: str | None = Query(default=None),
    phone: str | None = Query(default=None),
    email: str | None = Query(default=None),
    telegram_id: int | None = Query(default=None),
    max_id: int | None = Query(default=None),
    vk_id: int | None = Query(default=None),
    category_id: int | None = Query(default=None),
    sort_by: str = Query(default="id"),
    sort_desc: bool = Query(default=False),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientReadSchema]:
    stmt = select(ClientModel)

    if organization_id is not None:
        stmt = stmt.where(ClientModel.organization_id == organization_id)

    if status_value is not None:
        stmt = stmt.where(ClientModel.status == status_value)

    if query:
        normalized_query_phone = normalize_phone(query)
        phone_variants = list(dict.fromkeys(filter(None, [
            query,
            normalized_query_phone,
            f"+{normalized_query_phone}" if normalized_query_phone else "",
            f"8{normalized_query_phone[1:]}" if normalized_query_phone and len(normalized_query_phone) == 11 and normalized_query_phone.startswith("7") else "",
            normalized_query_phone[-10:] if normalized_query_phone and len(normalized_query_phone) == 11 else "",
        ])))
        like_value = f"%{query}%"
        stmt = stmt.where(
            or_(
                ClientModel.full_name.ilike(like_value),
                ClientModel.last_name.ilike(like_value),
                ClientModel.first_name.ilike(like_value),
                ClientModel.middle_name.ilike(like_value),
                ClientModel.primary_phone.in_(phone_variants) if normalized_query_phone else ClientModel.primary_phone.ilike(like_value),
                ClientModel.secondary_phone.in_(phone_variants) if normalized_query_phone else ClientModel.secondary_phone.ilike(like_value),
                ClientModel.email.ilike(like_value),
            ),
        )

    if name:
        like_name = f"%{name}%"
        stmt = stmt.where(
            or_(
                ClientModel.full_name.ilike(like_name),
                ClientModel.last_name.ilike(like_name),
                ClientModel.first_name.ilike(like_name),
                ClientModel.middle_name.ilike(like_name),
            ),
        )

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
        stmt = stmt.where(ClientModel.email.ilike(f"%{email}%"))

    if telegram_id is not None:
        stmt = stmt.where(ClientModel.telegram_id == telegram_id)

    if max_id is not None:
        stmt = stmt.where(ClientModel.max_id == max_id)

    if vk_id is not None:
        stmt = stmt.where(ClientModel.vk_id == vk_id)

    if category_id is not None:
        from client_circout.backend.clients_core.models.client_categories import ClientCategoryLinkModel

        stmt = stmt.join(
            ClientCategoryLinkModel,
            ClientCategoryLinkModel.client_id == ClientModel.id,
        ).where(ClientCategoryLinkModel.category_id == category_id)

    sort_column = CLIENT_SORT_COLUMNS.get(sort_by, ClientModel.id)
    stmt = stmt.order_by(sort_column.desc() if sort_desc else sort_column.asc())
    stmt = stmt.offset(offset).limit(limit)

    result = await session.execute(stmt)
    return list(result.scalars().all())


@router.get("/clients/by-telegram/{telegram_id}", response_model=ClientReadSchema | None)
async def get_client_by_telegram_id(
    telegram_id: int,
    service: ClientServiceDep,
) -> ClientReadSchema | None:
    return await call_service(service.get_by_telegram_id(telegram_id))


@router.get("/clients/by-max/{max_id}", response_model=ClientReadSchema | None)
async def get_client_by_max_id(
    max_id: int,
    service: ClientServiceDep,
) -> ClientReadSchema | None:
    return await call_service(service.get_by_max_id(max_id))


@router.get("/clients/by-vk/{vk_id}", response_model=ClientReadSchema | None)
async def get_client_by_vk_id(
    vk_id: int,
    service: ClientServiceDep,
) -> ClientReadSchema | None:
    return await call_service(service.get_by_vk_id(vk_id))


@router.get("/clients/by-phone/{phone}", response_model=ClientReadSchema | None)
async def get_client_by_primary_phone(
    phone: str,
    service: ClientServiceDep,
) -> ClientReadSchema | None:
    return await call_service(service.get_by_primary_phone(phone))


@router.get("/clients/by-email/{email}", response_model=ClientReadSchema | None)
async def get_client_by_email(
    email: str,
    service: ClientServiceDep,
) -> ClientReadSchema | None:
    return await call_service(service.get_by_email(email))


@router.patch("/clients/bulk/status", response_model=BulkActionRead)
async def change_clients_status_bulk(
    payload: ClientBulkStatusChangeSchema,
    service: ClientServiceDep,
) -> BulkActionRead:
    for client_id in payload.client_ids:
        await call_service(service.change_status(client_id, payload.status))

    return BulkActionRead(
        processed=len(payload.client_ids),
        client_ids=payload.client_ids,
    )


@router.patch("/clients/bulk/archive", response_model=BulkActionRead)
async def archive_clients_bulk(
    payload: ClientBulkArchiveSchema,
    service: ClientServiceDep,
) -> BulkActionRead:
    for client_id in payload.client_ids:
        await call_service(
            service.archive(
                client_id,
                archived_by=payload.archived_by,
                status=payload.status,
            ),
        )

    return BulkActionRead(
        processed=len(payload.client_ids),
        client_ids=payload.client_ids,
    )


@router.patch("/clients/bulk/restore", response_model=BulkActionRead)
async def restore_clients_bulk(
    payload: ClientBulkRestoreSchema,
    service: ClientServiceDep,
) -> BulkActionRead:
    for client_id in payload.client_ids:
        await call_service(service.restore(client_id, status=payload.status))

    return BulkActionRead(
        processed=len(payload.client_ids),
        client_ids=payload.client_ids,
    )


@router.get("/clients/{client_id}", response_model=ClientReadSchema)
async def get_client(
    client_id: int,
    service: ClientServiceDep,
) -> ClientReadSchema:
    return await call_service(service.get(client_id))


@router.patch("/clients/{client_id}", response_model=ClientReadSchema)
async def update_client(
    client_id: int,
    payload: ClientUpdateSchema,
    service: ClientServiceDep,
) -> ClientReadSchema:
    return await call_service(service.update(client_id, payload))


@router.patch("/clients/{client_id}/status", response_model=ClientReadSchema)
async def change_client_status(
    client_id: int,
    payload: ClientStatusChangeSchema,
    service: ClientServiceDep,
) -> ClientReadSchema:
    return await call_service(service.change_status(client_id, payload.status))


@router.patch("/clients/{client_id}/archive", response_model=ClientReadSchema)
async def archive_client(
    client_id: int,
    payload: ClientArchiveSchema,
    service: ClientServiceDep,
) -> ClientReadSchema:
    return await call_service(
        service.archive(
            client_id,
            archived_by=payload.archived_by,
            status=payload.status,
        ),
    )


@router.patch("/clients/{client_id}/restore", response_model=ClientReadSchema)
async def restore_client(
    client_id: int,
    payload: ClientRestoreSchema,
    service: ClientServiceDep,
) -> ClientReadSchema:
    return await call_service(service.restore(client_id, status=payload.status))


@router.delete("/clients/{client_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_client(
    client_id: int,
    service: ClientServiceDep,
) -> Response:
    await call_service(service.delete(client_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/categories",
    response_model=ClientCategoryReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    payload: ClientCategoryCreateSchema,
    service: ClientCategoryServiceDep,
) -> ClientCategoryReadSchema:
    return await call_service(service.create_category(payload))


@router.get("/categories", response_model=list[ClientCategoryReadSchema])
async def list_categories(
    service: ClientCategoryServiceDep,
    organization_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientCategoryReadSchema]:
    return await call_service(
        service.list_categories(
            organization_id=organization_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.post("/categories/filter-clients", response_model=list[ClientReadSchema])
async def filter_clients_by_categories(
    payload: CategoryFilterSchema,
    service: ClientCategoryServiceDep,
) -> list[ClientReadSchema]:
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
async def get_category(
    category_id: int,
    service: ClientCategoryServiceDep,
) -> ClientCategoryReadSchema:
    return await call_service(service.get_category(category_id))


@router.patch("/categories/{category_id}", response_model=ClientCategoryReadSchema)
async def update_category(
    category_id: int,
    payload: ClientCategoryUpdateSchema,
    service: ClientCategoryServiceDep,
) -> ClientCategoryReadSchema:
    return await call_service(service.update_category(category_id, payload))


@router.delete("/categories/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: int,
    service: ClientCategoryServiceDep,
) -> Response:
    await call_service(service.delete_category(category_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/category-links",
    response_model=ClientCategoryLinkReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def assign_category(
    payload: ClientCategoryLinkCreateSchema,
    service: ClientCategoryServiceDep,
) -> ClientCategoryLinkReadSchema:
    return await call_service(
        service.assign_category(
            client_id=payload.client_id,
            category_id=payload.category_id,
            created_by=payload.created_by,
        ),
    )


@router.get(
    "/clients/{client_id}/categories",
    response_model=list[ClientCategoryReadSchema],
)
async def list_client_categories(
    client_id: int,
    service: ClientCategoryServiceDep,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientCategoryReadSchema]:
    return await call_service(
        service.list_client_categories(
            client_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.delete("/category-links", status_code=status.HTTP_204_NO_CONTENT)
async def remove_category(
    service: ClientCategoryServiceDep,
    client_id: int,
    category_id: int,
) -> Response:
    await call_service(
        service.remove_category(
            client_id=client_id,
            category_id=category_id,
        ),
    )
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/additional-fields",
    response_model=ClientAdditionalFieldReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_additional_field(
    payload: ClientAdditionalFieldCreateSchema,
    service: ClientAdditionalFieldsServiceDep,
) -> ClientAdditionalFieldReadSchema:
    return await call_service(service.create_field(payload))


@router.get(
    "/additional-fields",
    response_model=list[ClientAdditionalFieldReadSchema],
)
async def list_additional_fields(
    service: ClientAdditionalFieldsServiceDep,
    organization_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientAdditionalFieldReadSchema]:
    return await call_service(
        service.list_fields(
            organization_id=organization_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.get(
    "/additional-fields/by-code",
    response_model=ClientAdditionalFieldReadSchema | None,
)
async def get_additional_field_by_code(
    service: ClientAdditionalFieldsServiceDep,
    organization_id: int,
    code: str,
) -> ClientAdditionalFieldReadSchema | None:
    return await call_service(
        service.get_field_by_code(
            organization_id=organization_id,
            code=code,
        ),
    )


@router.get(
    "/additional-fields/{field_id}",
    response_model=ClientAdditionalFieldReadSchema,
)
async def get_additional_field(
    field_id: int,
    service: ClientAdditionalFieldsServiceDep,
) -> ClientAdditionalFieldReadSchema:
    return await call_service(service.get_field(field_id))


@router.patch(
    "/additional-fields/{field_id}",
    response_model=ClientAdditionalFieldReadSchema,
)
async def update_additional_field(
    field_id: int,
    payload: ClientAdditionalFieldUpdateSchema,
    service: ClientAdditionalFieldsServiceDep,
) -> ClientAdditionalFieldReadSchema:
    return await call_service(service.update_field(field_id, payload))


@router.delete(
    "/additional-fields/{field_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_additional_field(
    field_id: int,
    service: ClientAdditionalFieldsServiceDep,
) -> Response:
    await call_service(service.delete_field(field_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.put(
    "/additional-field-values",
    response_model=ClientAdditionalFieldValueReadSchema,
)
async def set_additional_field_value(
    payload: ClientAdditionalFieldValueCreateSchema,
    service: ClientAdditionalFieldsServiceDep,
) -> ClientAdditionalFieldValueReadSchema:
    return await call_service(
        service.set_value(
            client_id=payload.client_id,
            field_id=payload.field_id,
            value_text=payload.value_text,
            value_json=payload.value_json,
        ),
    )


@router.put(
    "/additional-field-values/bulk",
    response_model=list[ClientAdditionalFieldValueReadSchema],
)
async def set_additional_field_values_bulk(
    payload: AdditionalFieldValueBulkSetSchema,
    service: ClientAdditionalFieldsServiceDep,
) -> list[ClientAdditionalFieldValueReadSchema]:
    return await call_service(
        service.set_values(
            client_id=payload.client_id,
            values=payload.values,
        ),
    )


@router.get(
    "/additional-field-values",
    response_model=list[ClientAdditionalFieldValueReadSchema],
)
async def list_additional_field_values(
    service: ClientAdditionalFieldsServiceDep,
    client_id: int | None = Query(default=None),
    field_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientAdditionalFieldValueReadSchema]:
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
    service: ClientAdditionalFieldsServiceDep,
    client_id: int,
    field_id: int,
) -> ClientAdditionalFieldValueReadSchema | None:
    return await call_service(
        service.get_value(
            client_id=client_id,
            field_id=field_id,
        ),
    )


@router.post("/additional-fields/missing-required", response_model=list[int])
async def get_missing_required_additional_field_ids(
    payload: RequiredAdditionalFieldsCheckSchema,
    service: ClientAdditionalFieldsServiceDep,
) -> list[int]:
    return await call_service(
        service.get_missing_required_field_ids(
            client_id=payload.client_id,
            organization_id=payload.organization_id,
        ),
    )


@router.delete(
    "/additional-field-values/{value_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_additional_field_value(
    value_id: int,
    service: ClientAdditionalFieldsServiceDep,
) -> Response:
    await call_service(service.delete_value(value_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/branches",
    response_model=ClientBranchReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def link_client_branch(
    payload: ClientBranchCreateSchema,
    service: ClientBranchServiceDep,
) -> ClientBranchReadSchema:
    return await call_service(service.link_branch(payload))


@router.post("/branches/register-visit", response_model=ClientBranchReadSchema)
async def register_branch_visit(
    payload: BranchVisitRegisterSchema,
    service: ClientBranchServiceDep,
) -> ClientBranchReadSchema:
    return await call_service(
        service.register_visit(
            client_id=payload.client_id,
            branch_id=payload.branch_id,
            visit_at=payload.visit_at,
        ),
    )


@router.get("/branches", response_model=list[ClientBranchReadSchema])
async def list_client_branch_relations(
    service: ClientBranchServiceDep,
    client_id: int | None = Query(default=None),
    branch_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientBranchReadSchema]:
    return await call_service(
        service.list_relations(
            client_id=client_id,
            branch_id=branch_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.get(
    "/branches/by-client-branch",
    response_model=ClientBranchReadSchema | None,
)
async def get_branch_relation_by_client_and_branch(
    service: ClientBranchServiceDep,
    client_id: int,
    branch_id: int,
) -> ClientBranchReadSchema | None:
    return await call_service(
        service.get_by_client_and_branch(
            client_id=client_id,
            branch_id=branch_id,
        ),
    )


@router.get("/branches/{relation_id}", response_model=ClientBranchReadSchema)
async def get_branch_relation(
    relation_id: int,
    service: ClientBranchServiceDep,
) -> ClientBranchReadSchema:
    return await call_service(service.get_relation(relation_id))


@router.patch("/branches/{relation_id}", response_model=ClientBranchReadSchema)
async def update_branch_visit_dates(
    relation_id: int,
    payload: ClientBranchUpdateSchema,
    service: ClientBranchServiceDep,
) -> ClientBranchReadSchema:
    return await call_service(service.update_visit_dates(relation_id, payload))


@router.delete("/branches/{relation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_branch_relation(
    relation_id: int,
    service: ClientBranchServiceDep,
) -> Response:
    await call_service(service.delete_relation(relation_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/import/batches",
    response_model=ClientImportBatchReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_import_batch(
    payload: ClientImportBatchCreateSchema,
    service: ClientImportExportServiceDep,
) -> ClientImportBatchReadSchema:
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
    service: ClientImportExportServiceDep,
    organization_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientImportBatchReadSchema]:
    return await call_service(
        service.list_import_batches(
            organization_id=organization_id,
            status=status_value,
            offset=offset,
            limit=limit,
        ),
    )


@router.get(
    "/import/batches/{batch_id}",
    response_model=ClientImportBatchReadSchema,
)
async def get_import_batch(
    batch_id: int,
    service: ClientImportExportServiceDep,
) -> ClientImportBatchReadSchema:
    return await call_service(service.get_import_batch(batch_id))


@router.patch(
    "/import/batches/{batch_id}/start",
    response_model=ClientImportBatchReadSchema,
)
async def start_import_batch(
    batch_id: int,
    service: ClientImportExportServiceDep,
) -> ClientImportBatchReadSchema:
    return await call_service(service.start_import_batch(batch_id))


@router.patch(
    "/import/batches/{batch_id}/finish",
    response_model=ClientImportBatchReadSchema,
)
async def finish_import_batch(
    batch_id: int,
    service: ClientImportExportServiceDep,
) -> ClientImportBatchReadSchema:
    return await call_service(service.finish_import_batch(batch_id))


@router.patch(
    "/import/batches/{batch_id}/fail",
    response_model=ClientImportBatchReadSchema,
)
async def fail_import_batch(
    batch_id: int,
    service: ClientImportExportServiceDep,
) -> ClientImportBatchReadSchema:
    return await call_service(service.fail_import_batch(batch_id))


@router.post(
    "/import/rows",
    response_model=ClientImportRowReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_import_row(
    payload: ClientImportRowCreateSchema,
    service: ClientImportExportServiceDep,
) -> ClientImportRowReadSchema:
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
    status_code=status.HTTP_201_CREATED,
)
async def create_import_rows_bulk(
    payload: ImportRowsBulkCreateSchema,
    service: ClientImportExportServiceDep,
) -> list[ClientImportRowReadSchema]:
    return await call_service(
        service.add_import_rows(
            batch_id=payload.batch_id,
            rows=payload.rows,
            start_row_number=payload.start_row_number,
        ),
    )


@router.get("/import/rows", response_model=list[ClientImportRowReadSchema])
async def list_import_rows(
    service: ClientImportExportServiceDep,
    batch_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientImportRowReadSchema]:
    return await call_service(
        service.list_import_rows(
            batch_id=batch_id,
            status=status_value,
            offset=offset,
            limit=limit,
        ),
    )


@router.get("/import/rows/{row_id}", response_model=ClientImportRowReadSchema)
async def get_import_row(
    row_id: int,
    service: ClientImportExportServiceDep,
) -> ClientImportRowReadSchema:
    return await call_service(service.get_import_row(row_id))


@router.patch(
    "/import/rows/{row_id}/success",
    response_model=ClientImportRowReadSchema,
)
async def mark_import_row_success(
    row_id: int,
    payload: ImportRowSuccessSchema,
    service: ClientImportExportServiceDep,
) -> ClientImportRowReadSchema:
    return await call_service(
        service.mark_import_row_success(
            row_id=row_id,
            client_id=payload.client_id,
        ),
    )


@router.patch(
    "/import/rows/{row_id}/failed",
    response_model=ClientImportRowReadSchema,
)
async def mark_import_row_failed(
    row_id: int,
    payload: ImportRowFailedSchema,
    service: ClientImportExportServiceDep,
) -> ClientImportRowReadSchema:
    return await call_service(
        service.mark_import_row_failed(
            row_id=row_id,
            error_text=payload.error_text,
        ),
    )


@router.post(
    "/export/batches",
    response_model=ClientExportBatchReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_export_batch(
    payload: ClientExportBatchCreateSchema,
    service: ClientImportExportServiceDep,
) -> ClientExportBatchReadSchema:
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
    service: ClientImportExportServiceDep,
    organization_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientExportBatchReadSchema]:
    return await call_service(
        service.list_export_batches(
            organization_id=organization_id,
            status=status_value,
            offset=offset,
            limit=limit,
        ),
    )


@router.get(
    "/export/batches/{batch_id}",
    response_model=ClientExportBatchReadSchema,
)
async def get_export_batch(
    batch_id: int,
    service: ClientImportExportServiceDep,
) -> ClientExportBatchReadSchema:
    return await call_service(service.get_export_batch(batch_id))


@router.patch(
    "/export/batches/{batch_id}/start",
    response_model=ClientExportBatchReadSchema,
)
async def start_export_batch(
    batch_id: int,
    service: ClientImportExportServiceDep,
) -> ClientExportBatchReadSchema:
    return await call_service(service.start_export_batch(batch_id))


@router.patch(
    "/export/batches/{batch_id}/finish",
    response_model=ClientExportBatchReadSchema,
)
async def finish_export_batch(
    batch_id: int,
    payload: ExportBatchFinishSchema,
    service: ClientImportExportServiceDep,
) -> ClientExportBatchReadSchema:
    return await call_service(
        service.finish_export_batch(
            batch_id=batch_id,
            file_id=payload.file_id,
        ),
    )


@router.patch(
    "/export/batches/{batch_id}/fail",
    response_model=ClientExportBatchReadSchema,
)
async def fail_export_batch(
    batch_id: int,
    service: ClientImportExportServiceDep,
) -> ClientExportBatchReadSchema:
    return await call_service(service.fail_export_batch(batch_id))


@router.post(
    "/duplicates/candidates",
    response_model=ClientDuplicateCandidateReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_duplicate_candidate(
    payload: ClientDuplicateCandidateCreateSchema,
    service: ClientDuplicatesServiceDep,
) -> ClientDuplicateCandidateReadSchema:
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


@router.get(
    "/duplicates/candidates",
    response_model=list[ClientDuplicateCandidateReadSchema],
)
async def list_duplicate_candidates(
    service: ClientDuplicatesServiceDep,
    organization_id: int | None = Query(default=None),
    client_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientDuplicateCandidateReadSchema]:
    return await call_service(
        service.list_candidates(
            organization_id=organization_id,
            client_id=client_id,
            status=status_value,
            offset=offset,
            limit=limit,
        ),
    )


@router.post(
    "/duplicates/candidates/find",
    response_model=list[ClientDuplicateCandidateReadSchema],
)
async def find_duplicate_candidates(
    payload: DuplicateFindSchema,
    service: ClientDuplicatesServiceDep,
) -> list[ClientDuplicateCandidateReadSchema]:
    return await call_service(
        service.find_and_save_candidates(
            organization_id=payload.organization_id,
            client_id=payload.client_id,
            min_score=payload.min_score,
            status=payload.status,
            scan_limit=payload.scan_limit,
        ),
    )


@router.get(
    "/duplicates/candidates/{candidate_id}",
    response_model=ClientDuplicateCandidateReadSchema,
)
async def get_duplicate_candidate(
    candidate_id: int,
    service: ClientDuplicatesServiceDep,
) -> ClientDuplicateCandidateReadSchema:
    return await call_service(service.get_candidate(candidate_id))


@router.patch(
    "/duplicates/candidates/{candidate_id}/approve",
    response_model=ClientDuplicateCandidateReadSchema,
)
async def approve_duplicate_candidate(
    candidate_id: int,
    service: ClientDuplicatesServiceDep,
) -> ClientDuplicateCandidateReadSchema:
    return await call_service(service.approve_candidate(candidate_id))


@router.patch(
    "/duplicates/candidates/{candidate_id}/reject",
    response_model=ClientDuplicateCandidateReadSchema,
)
async def reject_duplicate_candidate(
    candidate_id: int,
    service: ClientDuplicatesServiceDep,
) -> ClientDuplicateCandidateReadSchema:
    return await call_service(service.reject_candidate(candidate_id))


@router.patch(
    "/duplicates/candidates/{candidate_id}/ignore",
    response_model=ClientDuplicateCandidateReadSchema,
)
async def ignore_duplicate_candidate(
    candidate_id: int,
    service: ClientDuplicatesServiceDep,
) -> ClientDuplicateCandidateReadSchema:
    return await call_service(service.ignore_candidate(candidate_id))


@router.patch(
    "/duplicates/candidates/{candidate_id}/status",
    response_model=ClientDuplicateCandidateReadSchema,
)
async def change_duplicate_candidate_status(
    candidate_id: int,
    payload: DuplicateStatusChangeSchema,
    service: ClientDuplicatesServiceDep,
) -> ClientDuplicateCandidateReadSchema:
    return await call_service(
        service.change_candidate_status(
            candidate_id,
            payload.status,
        ),
    )


@router.delete(
    "/duplicates/candidates/{candidate_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_duplicate_candidate(
    candidate_id: int,
    service: ClientDuplicatesServiceDep,
) -> Response:
    await call_service(service.delete_candidate(candidate_id))
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post(
    "/merge",
    response_model=ClientMergeOperationReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def merge_clients(
    payload: MergeClientsSchema,
    service: ClientMergeServiceDep,
) -> ClientMergeOperationReadSchema:
    return await call_service(
        service.merge(
            primary_client_id=payload.primary_client_id,
            duplicate_client_id=payload.duplicate_client_id,
            merged_by=payload.merged_by,
            reason=payload.reason,
        ),
    )


@router.get(
    "/merge/operations",
    response_model=list[ClientMergeOperationReadSchema],
)
async def list_merge_operations(
    service: ClientMergeServiceDep,
    organization_id: int | None = Query(default=None),
    primary_client_id: int | None = Query(default=None),
    duplicate_client_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientMergeOperationReadSchema]:
    return await call_service(
        service.list_operations(
            organization_id=organization_id,
            primary_client_id=primary_client_id,
            duplicate_client_id=duplicate_client_id,
            offset=offset,
            limit=limit,
        ),
    )


@router.get(
    "/merge/operations/{operation_id}",
    response_model=ClientMergeOperationReadSchema,
)
async def get_merge_operation(
    operation_id: int,
    service: ClientMergeServiceDep,
) -> ClientMergeOperationReadSchema:
    return await call_service(service.get_operation(operation_id))
