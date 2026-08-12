from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from client_circout.backend.client_segments.crud import (
    ClientSegmentConflictError,
    ClientSegmentMemberConflictError,
)
from client_circout.backend.client_segments.dependencies import (
    SegmentDataProviderDep,
    SegmentMembershipServiceDep,
    SegmentPreviewServiceDep,
    SegmentQueryServiceDep,
    SegmentRecalculationServiceDep,
    SegmentRulesServiceDep,
    SegmentServiceDep,
    SegmentTableServiceDep,
    SegmentTriggerServiceDep,
)
from client_circout.backend.client_segments.schemas import (
    ClientSegmentCreateSchema,
    ClientSegmentMemberCreateSchema,
    ClientSegmentMemberReadSchema,
    ClientSegmentMemberUpdateSchema,
    ClientSegmentReadSchema,
    ClientSegmentUpdateSchema,
    SegmentTableClientRead,
)
from client_circout.backend.client_segments.service.exceptions import (
    SegmentMemberNotFoundError,
    SegmentNotFoundError,
    SegmentRecalculationError,
    SegmentRuleUnsupportedError,
    SegmentRuleValidationError,
    SegmentServiceError,
)
from client_circout.backend.client_segments.service.segment_trigger_service import (
    SegmentEventType,
    SegmentTriggerEvent,
)

router = APIRouter(
    prefix="/client-segments",
    tags=["client-segments"],
)


class DeleteRead(BaseModel):
    deleted: bool


class CountRead(BaseModel):
    count: int


class BooleanRead(BaseModel):
    result: bool


class ClientIdsRead(BaseModel):
    client_ids: list[int]


class ReplaceSegmentMembersRequest(BaseModel):
    client_ids: list[int]


class ReplaceSegmentMembersRead(BaseModel):
    added: int
    removed: int
    active_total: int


class SegmentRulesRequest(BaseModel):
    rules_json: dict[str, Any] | None = None


class SegmentRulesRead(BaseModel):
    normalized_rules: dict[str, Any]
    rule_types: list[str]
    external_rule_types: list[str]


class SegmentRuleTypesRead(BaseModel):
    client_only_rule_types: list[str]
    external_rule_types: list[str]
    allowed_rule_types: list[str]


class SegmentPreviewRequest(BaseModel):
    organization_id: int
    rules_json: dict[str, Any] | None = None
    client_status: str | None = Field(default=None, max_length=50)
    sample_limit: int = Field(default=50, ge=1, le=1000)
    scan_limit: int = Field(default=50_000, ge=1, le=100_000)


class SegmentPreviewRead(BaseModel):
    matched_total: int
    sample_client_ids: list[int]
    external_rule_types: list[str]


class SegmentRecalculationRead(BaseModel):
    segment_id: int
    matched_total: int
    added: int
    removed: int
    active_total: int


class RecalculateSegmentRequest(BaseModel):
    scan_limit: int = Field(default=50_000, ge=1, le=100_000)


class RecalculateDynamicSegmentsRequest(BaseModel):
    organization_id: int | None = None
    scan_limit: int = Field(default=50_000, ge=1, le=100_000)


class SegmentTriggerRequest(BaseModel):
    event_type: SegmentEventType
    organization_id: int
    client_id: int | None = None
    payload: dict[str, Any] | None = None


def _segment_read(segment) -> ClientSegmentReadSchema:
    return ClientSegmentReadSchema.model_validate(segment)


def _member_read(member) -> ClientSegmentMemberReadSchema:
    return ClientSegmentMemberReadSchema.model_validate(member)


def _model_to_dict(model: Any) -> dict[str, Any]:
    return {
        column.name: getattr(model, column.name)
        for column in model.__table__.columns
    }


def _recalculation_read(result) -> SegmentRecalculationRead:
    return SegmentRecalculationRead(
        segment_id=result.segment_id,
        matched_total=result.matched_total,
        added=result.added,
        removed=result.removed,
        active_total=result.active_total,
    )


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, SegmentNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc) or "Сегмент не найден",
        ) from exc

    if isinstance(exc, SegmentMemberNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc) or "Участник сегмента не найден",
        ) from exc

    if isinstance(exc, (ClientSegmentConflictError, ClientSegmentMemberConflictError)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc) or "Конфликт сегмента",
        ) from exc

    if isinstance(exc, (SegmentRuleValidationError, SegmentRuleUnsupportedError)):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Некорректные правила сегмента",
        ) from exc

    if isinstance(exc, SegmentRecalculationError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc) or "Ошибка пересчёта сегмента",
        ) from exc

    if isinstance(exc, SegmentServiceError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Ошибка сервиса сегментов",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc) or "Ошибка сегментов",
    ) from exc


@router.get(
    "/rules/types",
    response_model=SegmentRuleTypesRead,
)
async def get_segment_rule_types(
    service: SegmentRulesServiceDep,
) -> SegmentRuleTypesRead:
    return SegmentRuleTypesRead(
        client_only_rule_types=sorted(service.CLIENT_ONLY_RULE_TYPES),
        external_rule_types=sorted(service.EXTERNAL_RULE_TYPES),
        allowed_rule_types=sorted(service.ALLOWED_RULE_TYPES),
    )


@router.post(
    "/rules/validate",
    response_model=SegmentRulesRead,
)
async def validate_segment_rules(
    payload: SegmentRulesRequest,
    service: SegmentRulesServiceDep,
) -> SegmentRulesRead:
    try:
        normalized_rules = service.validate_rules(payload.rules_json)
        rule_types = service.collect_rule_types(normalized_rules)
        external_rule_types = service.collect_external_rule_types(normalized_rules)
    except Exception as exc:
        _raise_http_error(exc)

    return SegmentRulesRead(
        normalized_rules=normalized_rules,
        rule_types=sorted(rule_types),
        external_rule_types=sorted(external_rule_types),
    )


@router.post(
    "/preview",
    response_model=SegmentPreviewRead,
)
async def preview_segment_rules(
    payload: SegmentPreviewRequest,
    service: SegmentPreviewServiceDep,
    context: SegmentDataProviderDep,
) -> SegmentPreviewRead:
    try:
        preview = await service.preview_rules(
            organization_id=payload.organization_id,
            rules_json=payload.rules_json,
            client_status=payload.client_status,
            context=context,
            sample_limit=payload.sample_limit,
            scan_limit=payload.scan_limit,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return SegmentPreviewRead(**preview)


@router.post(
    "/segments",
    response_model=ClientSegmentReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_segment(
    payload: ClientSegmentCreateSchema,
    service: SegmentServiceDep,
) -> ClientSegmentReadSchema:
    try:
        segment = await service.create(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _segment_read(segment)


@router.get(
    "/segments",
    response_model=list[ClientSegmentReadSchema],
)
async def list_segments(
    service: SegmentServiceDep,
    organization_id: int | None = Query(default=None),
    status_value: str | None = Query(default=None, alias="status"),
    is_dynamic: bool | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientSegmentReadSchema]:
    segments = await service.list(
        organization_id=organization_id,
        status=status_value,
        is_dynamic=is_dynamic,
        offset=offset,
        limit=limit,
    )
    return [_segment_read(segment) for segment in segments]


@router.post(
    "/segments/recalculate-dynamic",
    response_model=list[SegmentRecalculationRead],
)
async def recalculate_dynamic_segments(
    payload: RecalculateDynamicSegmentsRequest,
    service: SegmentRecalculationServiceDep,
    context: SegmentDataProviderDep,
) -> list[SegmentRecalculationRead]:
    try:
        results = await service.recalculate_dynamic_segments(
            organization_id=payload.organization_id,
            context=context,
            scan_limit=payload.scan_limit,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_recalculation_read(result) for result in results]


@router.get(
    "/table/clients",
    response_model=list[SegmentTableClientRead],
)
async def list_segment_table_clients(
    service: SegmentTableServiceDep,
    organization_id: int = Query(..., ge=1),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=10000, ge=1, le=10000),
) -> list[SegmentTableClientRead]:
    rows = await service.list_clients(
        organization_id=organization_id,
        offset=offset,
        limit=limit,
    )
    return [
        SegmentTableClientRead.model_validate(row)
        for row in rows
    ]


@router.get(
    "/segments/{segment_id}",
    response_model=ClientSegmentReadSchema,
)
async def get_segment(
    segment_id: int,
    service: SegmentServiceDep,
) -> ClientSegmentReadSchema:
    try:
        segment = await service.get(segment_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _segment_read(segment)


@router.patch(
    "/segments/{segment_id}",
    response_model=ClientSegmentReadSchema,
)
async def update_segment(
    segment_id: int,
    payload: ClientSegmentUpdateSchema,
    service: SegmentServiceDep,
) -> ClientSegmentReadSchema:
    try:
        segment = await service.update(segment_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _segment_read(segment)


@router.post(
    "/segments/{segment_id}/archive",
    response_model=ClientSegmentReadSchema,
)
async def archive_segment(
    segment_id: int,
    service: SegmentServiceDep,
) -> ClientSegmentReadSchema:
    try:
        segment = await service.archive(segment_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _segment_read(segment)


@router.post(
    "/segments/{segment_id}/restore",
    response_model=ClientSegmentReadSchema,
)
async def restore_segment(
    segment_id: int,
    service: SegmentServiceDep,
) -> ClientSegmentReadSchema:
    try:
        segment = await service.restore(segment_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _segment_read(segment)


@router.delete(
    "/segments/{segment_id}",
    response_model=DeleteRead,
)
async def delete_segment(
    segment_id: int,
    service: SegmentServiceDep,
) -> DeleteRead:
    try:
        await service.delete(segment_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.post(
    "/segments/{segment_id}/preview",
    response_model=SegmentPreviewRead,
)
async def preview_segment(
    segment_id: int,
    segment_service: SegmentServiceDep,
    recalculation_service: SegmentRecalculationServiceDep,
    context: SegmentDataProviderDep,
    scan_limit: int = Query(default=50_000, ge=1, le=100_000),
) -> SegmentPreviewRead:
    try:
        segment = await segment_service.get(segment_id)
        preview = await recalculation_service.preview_segment(
            segment=segment,
            context=context,
            scan_limit=scan_limit,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return SegmentPreviewRead(**preview)


@router.post(
    "/segments/{segment_id}/recalculate",
    response_model=SegmentRecalculationRead,
)
async def recalculate_segment(
    segment_id: int,
    payload: RecalculateSegmentRequest,
    service: SegmentRecalculationServiceDep,
    context: SegmentDataProviderDep,
) -> SegmentRecalculationRead:
    try:
        result = await service.recalculate_segment(
            segment_id=segment_id,
            context=context,
            scan_limit=payload.scan_limit,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _recalculation_read(result)


@router.get(
    "/segments/{segment_id}/members",
    response_model=list[ClientSegmentMemberReadSchema],
)
async def list_segment_members(
    segment_id: int,
    service: SegmentMembershipServiceDep,
    membership_status: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientSegmentMemberReadSchema]:
    members = await service.list(
        segment_id=segment_id,
        membership_status=membership_status,
        offset=offset,
        limit=limit,
    )
    return [_member_read(member) for member in members]


@router.put(
    "/segments/{segment_id}/members/replace",
    response_model=ReplaceSegmentMembersRead,
)
async def replace_segment_members(
    segment_id: int,
    payload: ReplaceSegmentMembersRequest,
    service: SegmentMembershipServiceDep,
) -> ReplaceSegmentMembersRead:
    try:
        result = await service.replace_segment_members(
            segment_id=segment_id,
            client_ids=payload.client_ids,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return ReplaceSegmentMembersRead(**result)


@router.post(
    "/segments/{segment_id}/members/{client_id}",
    response_model=ClientSegmentMemberReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def add_client_to_segment(
    segment_id: int,
    client_id: int,
    service: SegmentMembershipServiceDep,
) -> ClientSegmentMemberReadSchema:
    try:
        member = await service.add_client(
            segment_id=segment_id,
            client_id=client_id,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _member_read(member)


@router.delete(
    "/segments/{segment_id}/members/{client_id}",
    response_model=ClientSegmentMemberReadSchema,
)
async def remove_client_from_segment(
    segment_id: int,
    client_id: int,
    service: SegmentMembershipServiceDep,
) -> ClientSegmentMemberReadSchema:
    try:
        member = await service.remove_client(
            segment_id=segment_id,
            client_id=client_id,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _member_read(member)


@router.get(
    "/segments/{segment_id}/client-ids",
    response_model=ClientIdsRead,
)
async def list_segment_client_ids(
    segment_id: int,
    service: SegmentQueryServiceDep,
    membership_status: str = Query(default="active"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> ClientIdsRead:
    client_ids = await service.list_client_ids(
        segment_id=segment_id,
        membership_status=membership_status,
        offset=offset,
        limit=limit,
    )
    return ClientIdsRead(client_ids=client_ids)


@router.get(
    "/segments/{segment_id}/clients",
    response_model=list[dict[str, Any]],
)
async def list_segment_clients(
    segment_id: int,
    service: SegmentQueryServiceDep,
    organization_id: int | None = Query(default=None),
    membership_status: str = Query(default="active"),
    client_status: str | None = Query(default=None),
    search: str | None = Query(default=None),
    sort_by: str = Query(default="id"),
    sort_desc: bool = Query(default=False),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[dict[str, Any]]:
    clients = await service.list_clients(
        segment_id=segment_id,
        organization_id=organization_id,
        membership_status=membership_status,
        client_status=client_status,
        search=search,
        sort_by=sort_by,
        sort_desc=sort_desc,
        offset=offset,
        limit=limit,
    )
    return [jsonable_encoder(_model_to_dict(client)) for client in clients]


@router.get(
    "/segments/{segment_id}/clients/count",
    response_model=CountRead,
)
async def count_segment_clients(
    segment_id: int,
    service: SegmentQueryServiceDep,
    organization_id: int | None = Query(default=None),
    membership_status: str = Query(default="active"),
    client_status: str | None = Query(default=None),
    search: str | None = Query(default=None),
) -> CountRead:
    count = await service.count_clients(
        segment_id=segment_id,
        organization_id=organization_id,
        membership_status=membership_status,
        client_status=client_status,
        search=search,
    )
    return CountRead(count=count)


@router.post(
    "/members",
    response_model=ClientSegmentMemberReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_segment_member(
    payload: ClientSegmentMemberCreateSchema,
    service: SegmentMembershipServiceDep,
) -> ClientSegmentMemberReadSchema:
    try:
        member = await service.create(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _member_read(member)


@router.get(
    "/members",
    response_model=list[ClientSegmentMemberReadSchema],
)
async def list_members(
    service: SegmentMembershipServiceDep,
    segment_id: int | None = Query(default=None),
    client_id: int | None = Query(default=None),
    membership_status: str | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientSegmentMemberReadSchema]:
    members = await service.list(
        segment_id=segment_id,
        client_id=client_id,
        membership_status=membership_status,
        offset=offset,
        limit=limit,
    )
    return [_member_read(member) for member in members]


@router.get(
    "/members/{member_id}",
    response_model=ClientSegmentMemberReadSchema,
)
async def get_segment_member(
    member_id: int,
    service: SegmentMembershipServiceDep,
) -> ClientSegmentMemberReadSchema:
    try:
        member = await service.get(member_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _member_read(member)


@router.patch(
    "/members/{member_id}",
    response_model=ClientSegmentMemberReadSchema,
)
async def update_segment_member(
    member_id: int,
    payload: ClientSegmentMemberUpdateSchema,
    service: SegmentMembershipServiceDep,
) -> ClientSegmentMemberReadSchema:
    try:
        member = await service.update(member_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _member_read(member)


@router.delete(
    "/members/{member_id}",
    response_model=DeleteRead,
)
async def hard_delete_segment_member(
    member_id: int,
    service: SegmentMembershipServiceDep,
) -> DeleteRead:
    try:
        await service.hard_delete(member_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.post(
    "/triggers",
    response_model=list[SegmentRecalculationRead],
)
async def handle_segment_trigger(
    payload: SegmentTriggerRequest,
    service: SegmentTriggerServiceDep,
    context: SegmentDataProviderDep,
) -> list[SegmentRecalculationRead]:
    try:
        results = await service.handle_event(
            SegmentTriggerEvent(
                event_type=payload.event_type,
                organization_id=payload.organization_id,
                client_id=payload.client_id,
                payload=payload.payload,
            ),
            context=context,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_recalculation_read(result) for result in results]


@router.post(
    "/triggers/client-created",
    response_model=list[SegmentRecalculationRead],
)
async def trigger_client_created(
    payload: SegmentTriggerRequest,
    service: SegmentTriggerServiceDep,
    context: SegmentDataProviderDep,
) -> list[SegmentRecalculationRead]:
    if payload.client_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="client_id обязателен",
        )

    try:
        results = await service.on_client_created(
            organization_id=payload.organization_id,
            client_id=payload.client_id,
            context=context,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_recalculation_read(result) for result in results]


@router.post(
    "/triggers/client-updated",
    response_model=list[SegmentRecalculationRead],
)
async def trigger_client_updated(
    payload: SegmentTriggerRequest,
    service: SegmentTriggerServiceDep,
    context: SegmentDataProviderDep,
) -> list[SegmentRecalculationRead]:
    if payload.client_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="client_id обязателен",
        )

    try:
        results = await service.on_client_updated(
            organization_id=payload.organization_id,
            client_id=payload.client_id,
            context=context,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_recalculation_read(result) for result in results]


@router.post(
    "/triggers/visit-changed",
    response_model=list[SegmentRecalculationRead],
)
async def trigger_visit_changed(
    payload: SegmentTriggerRequest,
    service: SegmentTriggerServiceDep,
    context: SegmentDataProviderDep,
    is_cancelled: bool = Query(default=False),
) -> list[SegmentRecalculationRead]:
    if payload.client_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="client_id обязателен",
        )

    try:
        results = await service.on_visit_changed(
            organization_id=payload.organization_id,
            client_id=payload.client_id,
            is_cancelled=is_cancelled,
            context=context,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_recalculation_read(result) for result in results]


@router.post(
    "/triggers/certificate-changed",
    response_model=list[SegmentRecalculationRead],
)
async def trigger_certificate_changed(
    payload: SegmentTriggerRequest,
    service: SegmentTriggerServiceDep,
    context: SegmentDataProviderDep,
) -> list[SegmentRecalculationRead]:
    if payload.client_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="client_id обязателен",
        )

    try:
        results = await service.on_certificate_changed(
            organization_id=payload.organization_id,
            client_id=payload.client_id,
            context=context,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_recalculation_read(result) for result in results]
