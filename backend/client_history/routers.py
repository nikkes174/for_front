from __future__ import annotations

import asyncio
from dataclasses import asdict
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal
from pathlib import Path
import re
from typing import Any
from uuid import uuid4
from zoneinfo import ZoneInfo

import httpx
from sqlalchemy import func, select
from fastapi import APIRouter, Depends, File, HTTPException, Query, Request, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field

from client_circout.backend.api_dependencies import get_auth_logging_publisher, get_current_actor_id
from client_circout.backend.client_history.crud.client_check import ClientCheckConflictError
from client_circout.backend.client_history.dependencies import (
    ClientCheckCrudDep,
    ClientHistoryCommentServiceDep,
    ClientHistoryMetricsSourceServiceDep,
    ClientHistoryQueryServiceDep,
    ClientHistorySyncServiceDep,
    ClientVisitHistoryServiceDep,
    ClientVisitProductsServiceDep,
    ClientVisitServicesServiceDep,
)
from client_circout.backend.client_history.schemas.client_check import (
    ClientCheckCreateSchema,
    ClientCheckReadSchema,
    ClientCheckUpdateSchema,
)
from client_circout.backend.client_history.schemas.visit_products import (
    ClientHistoryVisitProductCreateSchema,
    ClientHistoryVisitProductReadSchema,
    ClientHistoryVisitProductUpdateSchema,
)
from client_circout.backend.client_history.schemas.visit_services import (
    ClientHistoryVisitServiceCreateSchema,
    ClientHistoryVisitServiceReadSchema,
    ClientHistoryVisitServiceUpdateSchema,
)
from client_circout.backend.client_history.schemas.visits import (
    ClientHistoryVisitCreateSchema,
    ClientHistoryVisitReadSchema,
    ClientHistoryVisitUpdateSchema,
)
from client_circout.backend.clients_core.service.dependencies import ClientServiceDep
from client_circout.backend.clients_core.models.client_achievements import ClientAchievementModel
from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel
from client_circout.backend.client_communications.schemas import ClientPushSendSchema
from client_circout.backend.client_communications.services.push_broadcast_service import send_push_broadcast
from client_circout.backend.client_history.service.client_history_query_service import (
    ClientHistoryFilters,
    HistorySortField,
    SortDirection,
)
from client_circout.backend.client_history.service.exceptions import (
    ClientHistoryConflictError,
    ClientHistoryExternalSourceError,
    ClientHistoryNotFoundError,
    ClientHistoryServiceError,
    ClientHistoryValidationError,
)
from client_circout.backend.client_history.service._utils import utc_now
from client_circout.backend.client_segments.dependencies import (
    SegmentDataProviderDep,
    SegmentTriggerServiceDep,
)
from client_circout.backend.integrations.auth_logging import AuthLoggingPublishError, AuthLoggingPublisher
from client_circout.backend.integrations.loyalty import create_loyalty_client_projection_service
from client_circout.backend.logger import get_logger
from client_circout.backend.config import AUTH_AND_LOGGING_API_URL
from client_circout.backend.db.db import SessionFactory

router = APIRouter(
    prefix="/client-history",
    tags=["client-history"],
)
logger = get_logger(__name__)
VISIT_PHOTOS_DIR = Path(__file__).resolve().parents[2] / "uploads" / "visit-photos"
IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


def _achievement_condition_matches(actual: Decimal, condition: dict[str, Any]) -> bool:
    try:
        expected = Decimal(str(condition.get("value")))
    except Exception:
        return False
    return {
        "gt": actual > expected,
        "gte": actual >= expected,
        "lt": actual < expected,
        "lte": actual <= expected,
        "eq": actual == expected,
        "neq": actual != expected,
    }.get(condition.get("operator"), False)


def _visit_product_quantities(comment: str | None) -> dict[str, int]:
    products_line = next((line for line in str(comment or "").splitlines() if line.startswith("__products:")), "")
    quantities: dict[str, int] = {}
    for value in products_line.removeprefix("__products:").split(","):
        match = re.match(r"^(.*?)(?:\s*×\s*(\d+))?$", value.strip())
        name = match.group(1).strip() if match else ""
        if name:
            quantities[name.lower()] = quantities.get(name.lower(), 0) + max(int(match.group(2) or 1), 1)
    return quantities


async def _reserve_visit_product_stock(payload: ClientHistoryVisitCreateSchema) -> list[tuple[int, list[dict[str, Any]]]]:
    quantities = _visit_product_quantities(payload.comment)
    if not quantities or payload.branch_id is None:
        return []
    async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
        response = await client.post(
            f"{AUTH_AND_LOGGING_API_URL.rstrip('/')}/organizations/internal/product-stock/consume",
            json={"organization_id": payload.organization_id, "branch_id": payload.branch_id, "products": quantities},
        )
        if response.status_code == 422:
            raise ClientHistoryValidationError(response.json().get("detail") or "???????????? ?????? ?? ??????")
        response.raise_for_status()
    return []


async def _ensure_employee_booking_available(
    payload: ClientHistoryVisitCreateSchema,
    cookie: str | None = None,
) -> None:
    if payload.employee_id is None:
        return
    headers = {"cookie": cookie} if cookie else {}
    async with httpx.AsyncClient(timeout=10.0, headers=headers, trust_env=False) as client:
        user_url = f"{AUTH_AND_LOGGING_API_URL.rstrip('/')}/users-access/users/{payload.employee_id}"
        public_reference_url = f"{AUTH_AND_LOGGING_API_URL.rstrip('/')}/public-api/organizations/{payload.organization_id}/booking-reference"
        if payload.online:
            user_response, public_reference_response = await asyncio.gather(
                client.get(user_url),
                client.get(public_reference_url),
            )
            public_reference_response.raise_for_status()
            branches = public_reference_response.json().get("branches") or []
        else:
            user_response, branches_response = await asyncio.gather(
                client.get(user_url),
                client.get(f"{AUTH_AND_LOGGING_API_URL.rstrip('/')}/organizations/{payload.organization_id}/branches"),
            )
            if branches_response.status_code in {401, 403, 404}:
                public_reference_response = await client.get(public_reference_url)
                public_reference_response.raise_for_status()
                branches = public_reference_response.json().get("branches") or []
            else:
                branches_response.raise_for_status()
                branches = branches_response.json()
    user_response.raise_for_status()
    user = user_response.json()
    branch = next(
        (item for item in branches if str(item.get("id")) == str(payload.branch_id)),
        {},
    )
    try:
        branch_tz = ZoneInfo(str(branch.get("timezone") or "Europe/Moscow"))
    except Exception:
        branch_tz = timezone(timedelta(hours=3), name="Europe/Moscow")
    starts_at = payload.visit_at
    starts_at = starts_at.replace(tzinfo=branch_tz) if starts_at.tzinfo is None else starts_at.astimezone(branch_tz)
    ends_at = starts_at + timedelta(seconds=int(payload.seance_length or payload.length or 1))
    for block in user.get("booking_blocks") or []:
        if block.get("organization_id") is not None and int(block["organization_id"]) != payload.organization_id:
            continue
        try:
            date_from = date.fromisoformat(str(block.get("date_from") or ""))
            date_to = date.fromisoformat(str(block.get("date_to") or block.get("date_from") or ""))
        except (TypeError, ValueError):
            continue
        if not date_from <= starts_at.date() <= date_to:
            continue
        time_from_value = str(block.get("time_from") or "").strip()
        time_to_value = str(block.get("time_to") or "").strip()
        if not time_from_value and not time_to_value:
            raise ClientHistoryValidationError("На выбранный день запись к сотруднику перекрыта")
        try:
            time_from = time.fromisoformat(time_from_value)
            time_to = time.fromisoformat(time_to_value)
        except ValueError:
            continue
        blocked_from = datetime.combine(starts_at.date(), time_from, tzinfo=branch_tz)
        blocked_to = datetime.combine(starts_at.date(), time_to, tzinfo=branch_tz)
        if starts_at < blocked_to and ends_at > blocked_from:
            raise ClientHistoryValidationError("На выбранное время запись к сотруднику перекрыта")


async def _apply_product_stock_updates(updates: list[tuple[int, list[dict[str, Any]]]]) -> None:
    if not updates:
        return
    async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
        for product_id, actual_amounts in updates:
            response = await client.patch(
                f"{AUTH_AND_LOGGING_API_URL.rstrip('/')}/organizations/product-items/{product_id}",
                json={"actual_amounts": actual_amounts},
            )
            response.raise_for_status()


async def _award_metric_achievements(client_id: int, organization_id: int) -> None:
    async with SessionFactory() as session:
        completed_visits_count = await session.scalar(
            select(func.count())
            .select_from(ClientHistoryVisitModel)
            .where(
                ClientHistoryVisitModel.client_id == client_id,
                ClientHistoryVisitModel.organization_id == organization_id,
                ClientHistoryVisitModel.visit_status == "completed",
            )
        )
        client_profit = await session.scalar(
            select(func.coalesce(func.sum(ClientHistoryVisitModel.paid_amount), 0))
            .where(
                ClientHistoryVisitModel.client_id == client_id,
                ClientHistoryVisitModel.organization_id == organization_id,
                ClientHistoryVisitModel.visit_status == "completed",
            )
        )
        metric_values = {
            "client_profit": Decimal(client_profit or 0),
            "visit_frequency": Decimal(completed_visits_count or 0),
        }
        async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
            response = await client.get(f"{AUTH_AND_LOGGING_API_URL.rstrip('/')}/organizations/{organization_id}/achievements")
            response.raise_for_status()
            achievements = response.json()
        for achievement in achievements:
            conditions = [item for item in achievement.get("conditions", []) if item.get("parameter") in metric_values]
            if not conditions:
                continue
            matches = [_achievement_condition_matches(metric_values[item["parameter"]], item) for item in conditions]
            if (achievement.get("logic", "and") == "and" and not all(matches)) or (achievement.get("logic") == "or" and not any(matches)):
                continue
            exists = await session.scalar(select(ClientAchievementModel.id).where(
                ClientAchievementModel.client_id == client_id,
                ClientAchievementModel.achievement_id == achievement["id"],
            ))
            if exists is not None:
                continue
            session.add(ClientAchievementModel(
                client_id=client_id,
                organization_id=organization_id,
                achievement_id=achievement["id"],
                name=achievement["name"],
                level_name=achievement["name"],
                awarded_at=datetime.utcnow(),
            ))
            await session.commit()
            if achievement.get("notification_enabled", True):
                await send_push_broadcast(session, ClientPushSendSchema(
                    organization_id=organization_id,
                    client_ids=[client_id],
                    title="Новое достижение",
                    message=f"Поздравляем вы достигли уровня {achievement['name']}",
                ))


async def _apply_loyalty_after_visit(
    *,
    client_id: int,
    organization_id: int,
    visit_id: int,
    visit_status: str,
    total_cost: Decimal,
    paid_amount: Decimal,
    comment: str | None,
    visit_at: object,
    branch_id: int | None,
    raise_errors: bool = False,
) -> None:
    loyalty_service = create_loyalty_client_projection_service()
    try:
        await loyalty_service.process_referral_first_visit(
            client_id=client_id, organization_id=organization_id, visit_id=visit_id,
            visit_status=visit_status, total_cost=total_cost, paid_amount=paid_amount,
            visit_at=visit_at, branch_id=branch_id,
        )
        await loyalty_service.accrue_completed_visit_cashback(
            client_id=client_id,
            organization_id=organization_id,
            visit_id=visit_id,
            visit_status=visit_status,
            total_cost=total_cost,
            paid_amount=paid_amount,
            comment=comment,
        )
        if visit_status.strip().lower() == "completed":
            await _award_metric_achievements(client_id, organization_id)
    except Exception as exc:
        logger.warning("visit saved, but loyalty processing failed visit_id=%s: %s", visit_id, exc)
        if raise_errors:
            raise
    finally:
        await loyalty_service.aclose()


async def _process_loyalty_after_visit(visit: object, *, raise_errors: bool = False) -> None:
    await _apply_loyalty_after_visit(
        client_id=visit.client_id,
        organization_id=visit.organization_id,
        visit_id=visit.id,
        visit_status=visit.visit_status,
        total_cost=visit.total_cost,
        paid_amount=visit.paid_amount,
        comment=visit.comment,
        visit_at=visit.visit_at,
        branch_id=visit.branch_id,
        raise_errors=raise_errors,
    )


class DeleteRead(BaseModel):
    deleted: bool


class CountRead(BaseModel):
    count: int


class VisitCommentRead(BaseModel):
    visit_id: int
    comment: str | None = None


class VisitCommentUpdateRequest(BaseModel):
    comment: str | None = Field(default=None, max_length=2000)


class VisitStatusUpdateRequest(BaseModel):
    visit_status: str = Field(min_length=1, max_length=50)


class VisitFinancialUpdateRequest(BaseModel):
    total_cost: Decimal | None = None
    discount_amount: Decimal | None = None
    paid_amount: Decimal | None = None
    debt_amount: Decimal | None = None


class VisitDetailsRead(BaseModel):
    visit: ClientHistoryVisitReadSchema
    services: list[ClientHistoryVisitServiceReadSchema] = []
    products: list[ClientHistoryVisitProductReadSchema] = []
    service_ids: list[int] = []
    product_ids: list[int] = []


class VisitListItemRead(BaseModel):
    visit: ClientHistoryVisitReadSchema
    services: list[ClientHistoryVisitServiceReadSchema] = []
    products: list[ClientHistoryVisitProductReadSchema] = []
    service_ids: list[int] = []
    product_ids: list[int] = []


class ClientHistoryMetricsRead(BaseModel):
    visits_count: int
    completed_visits_count: int
    cancelled_visits_count: int
    no_show_visits_count: int
    sold_amount: Decimal
    paid_amount: Decimal
    average_check: Decimal
    last_visit_at: datetime | None = None
    next_visit_at: datetime | None = None
    visit_frequency: float | None = None
    average_visit_interval_days: float | None = None
    days_since_last_visit: int | None = None


class SyncVisitServicesRequest(BaseModel):
    services: list[ClientHistoryVisitServiceCreateSchema]
    replace_existing: bool = False


class SyncVisitProductsRequest(BaseModel):
    products: list[ClientHistoryVisitProductCreateSchema]
    replace_existing: bool = False


class RebuildVisitProjectionRequest(BaseModel):
    visit: ClientHistoryVisitCreateSchema
    services: list[ClientHistoryVisitServiceCreateSchema] = []
    products: list[ClientHistoryVisitProductCreateSchema] = []


def _visit_read(visit) -> ClientHistoryVisitReadSchema:
    return ClientHistoryVisitReadSchema.model_validate(visit)


def _visit_payload(visit: ClientHistoryVisitReadSchema, client_name: str | None = None) -> dict[str, Any]:
    visit_client = visit.yclients_client or {}
    visit_client_name = str(
        visit_client.get("name")
        or visit_client.get("full_name")
        or ""
    ).strip() or None
    client_label = visit_client_name or client_name or f"#{visit.client_id}"
    details = [
        f"Визит: #{visit.id}",
        f"Клиент: {client_label}",
        f"Статус: {visit.visit_status}",
        f"Дата визита: {visit.visit_at.isoformat()}",
    ]
    if visit.branch_id is not None:
        details.append(f"Филиал: #{visit.branch_id}")
    if visit.employee_id is not None:
        details.append(f"Сотрудник: #{visit.employee_id}")
    details.append(f"Стоимость: {visit.total_cost}")
    details.append(f"Оплачено: {visit.paid_amount}")
    return {
        **visit.model_dump(mode="json"),
        "full_name": visit_client_name or client_name,
        "summary": f"Создан визит #{visit.id} для клиента {client_label}",
        "details": details,
    }


async def _publish_visit_created(
    publisher: AuthLoggingPublisher,
    visit: ClientHistoryVisitReadSchema,
    actor_id: int | None = None,
    client_name: str | None = None,
    raise_errors: bool = False,
) -> None:
    try:
        await publisher.publish_event_and_audit(
            event_type="visit.created",
            action="visit.create",
            entity_type="client_visit",
            entity_id=visit.id,
            organization_id=visit.organization_id,
            branch_id=visit.branch_id,
            client_id=visit.client_id,
            actor_type="user" if actor_id is not None else "system",
            actor_id=actor_id,
            payload=_visit_payload(visit, client_name),
        )
    except AuthLoggingPublishError as exc:
        logger.warning("visit created, but audit/event publishing failed for visit_id=%s: %s", visit.id, exc)
        if raise_errors:
            raise


async def _publish_visit_completed(
    publisher: AuthLoggingPublisher,
    visit: ClientHistoryVisitReadSchema,
    actor_id: int | None = None,
    client_name: str | None = None,
) -> None:
    try:
        await publisher.publish_event_and_audit(
            event_type="visit.completed",
            action="visit.complete",
            entity_type="client_visit",
            entity_id=visit.id,
            organization_id=visit.organization_id,
            branch_id=visit.branch_id,
            client_id=visit.client_id,
            actor_type="user" if actor_id is not None else "system",
            actor_id=actor_id,
            payload=_visit_payload(visit, client_name),
        )
    except AuthLoggingPublishError as exc:
        logger.warning("visit completed, but audit/event publishing failed for visit_id=%s: %s", visit.id, exc)


async def _publish_visit_cancelled(
    publisher: AuthLoggingPublisher,
    visit: ClientHistoryVisitReadSchema,
    actor_id: int | None = None,
    client_name: str | None = None,
) -> None:
    try:
        await publisher.publish_event_and_audit(
            event_type="visit.cancelled",
            action="visit.cancel",
            entity_type="client_visit",
            entity_id=visit.id,
            organization_id=visit.organization_id,
            branch_id=visit.branch_id,
            client_id=visit.client_id,
            actor_type="user" if actor_id is not None else "system",
            actor_id=actor_id,
            payload=_visit_payload(visit, client_name),
        )
    except AuthLoggingPublishError as exc:
        logger.warning("visit cancelled, but audit/event publishing failed for visit_id=%s: %s", visit.id, exc)


def _visit_service_read(item) -> ClientHistoryVisitServiceReadSchema:
    return ClientHistoryVisitServiceReadSchema.model_validate(item)


def _visit_product_read(item) -> ClientHistoryVisitProductReadSchema:
    return ClientHistoryVisitProductReadSchema.model_validate(item)


def _check_read(check) -> ClientCheckReadSchema:
    return ClientCheckReadSchema.model_validate(check)


def _details_read(item: dict) -> VisitDetailsRead:
    services = [
        _visit_service_read(service)
        for service in item.get("services", [])
    ]
    products = [
        _visit_product_read(product)
        for product in item.get("products", [])
    ]
    return VisitDetailsRead(
        visit=_visit_read(item["visit"]),
        services=services,
        products=products,
        service_ids=[service.service_id for service in services],
        product_ids=[product.product_id for product in products],
    )


def _list_item_read(item: dict) -> VisitListItemRead:
    services = [
        _visit_service_read(service)
        for service in item.get("services", [])
    ]
    products = [
        _visit_product_read(product)
        for product in item.get("products", [])
    ]
    return VisitListItemRead(
        visit=_visit_read(item["visit"]),
        services=services,
        products=products,
        service_ids=[service.service_id for service in services],
        product_ids=[product.product_id for product in products],
    )


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, ClientHistoryNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc) or "Запись истории клиента не найдена",
        ) from exc

    if isinstance(exc, (ClientHistoryConflictError, ClientCheckConflictError)):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc) or "Конфликт записи истории клиента",
        ) from exc

    if isinstance(exc, ClientHistoryValidationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Некорректные данные истории клиента",
        ) from exc

    if isinstance(exc, ClientHistoryExternalSourceError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc) or "Ошибка внешнего источника истории клиента",
        ) from exc

    if isinstance(exc, ClientHistoryServiceError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Ошибка сервиса истории клиента",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc) or "Ошибка истории клиента",
    ) from exc


@router.post(
    "/visits",
    response_model=ClientHistoryVisitReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_visit(
    payload: ClientHistoryVisitCreateSchema,
    request: Request,
    service: ClientVisitHistoryServiceDep,
    current_actor_id: int | None = Depends(get_current_actor_id),
) -> ClientHistoryVisitReadSchema:
    try:
        await _ensure_employee_booking_available(payload, request.headers.get("cookie"))
        stock_updates = await _reserve_visit_product_stock(payload)
        visit = await service.create_visit(
            payload,
            postprocess_actor_id=current_actor_id,
        )
        await _apply_product_stock_updates(stock_updates)
        visit_read = _visit_read(visit)
    except Exception as exc:
        _raise_http_error(exc)
    return visit_read


@router.get(
    "/visits",
    response_model=list[VisitListItemRead],
)
async def list_visits(
    service: ClientHistoryQueryServiceDep,
    client_id: int | None = Query(default=None),
    organization_id: int | None = Query(default=None),
    branch_id: int | None = Query(default=None),
    employee_id: int | None = Query(default=None),
    visit_status: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    include_services: bool = Query(default=False),
    include_products: bool = Query(default=False),
    sort_by: HistorySortField = Query(default="visit_at"),
    sort_direction: SortDirection = Query(default="desc"),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[VisitListItemRead]:
    items = await service.list_visits(
        filters=ClientHistoryFilters(
            client_id=client_id,
            organization_id=organization_id,
            branch_id=branch_id,
            employee_id=employee_id,
            visit_status=visit_status,
            date_from=date_from,
            date_to=date_to,
        ),
        include_services=include_services,
        include_products=include_products,
        sort_by=sort_by,
        sort_direction=sort_direction,
        offset=offset,
        limit=limit,
    )
    return [_list_item_read(item) for item in items]


@router.get(
    "/visits/count",
    response_model=CountRead,
)
async def count_visits(
    service: ClientHistoryQueryServiceDep,
    client_id: int | None = Query(default=None),
    organization_id: int | None = Query(default=None),
    branch_id: int | None = Query(default=None),
    employee_id: int | None = Query(default=None),
    visit_status: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
) -> CountRead:
    count = await service.count_visits(
        filters=ClientHistoryFilters(
            client_id=client_id,
            organization_id=organization_id,
            branch_id=branch_id,
            employee_id=employee_id,
            visit_status=visit_status,
            date_from=date_from,
            date_to=date_to,
        ),
    )
    return CountRead(count=count)


@router.get(
    "/visits/{visit_id}",
    response_model=ClientHistoryVisitReadSchema,
)
async def get_visit(
    visit_id: int,
    service: ClientVisitHistoryServiceDep,
) -> ClientHistoryVisitReadSchema:
    try:
        visit = await service.get_visit(visit_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_read(visit)


@router.get(
    "/visits/{visit_id}/details",
    response_model=VisitDetailsRead,
)
async def get_visit_details(
    visit_id: int,
    service: ClientHistoryQueryServiceDep,
) -> VisitDetailsRead:
    item = await service.get_visit_details(visit_id=visit_id)

    if item is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Визит не найден",
        )

    return _details_read(item)


@router.patch(
    "/visits/{visit_id}",
    response_model=ClientHistoryVisitReadSchema,
)
async def update_visit(
    visit_id: int,
    payload: ClientHistoryVisitUpdateSchema,
    service: ClientVisitHistoryServiceDep,
    segment_trigger_service: SegmentTriggerServiceDep,
    segment_data_provider: SegmentDataProviderDep,
    client_service: ClientServiceDep,
    publisher: AuthLoggingPublisher = Depends(get_auth_logging_publisher),
    current_actor_id: int | None = Depends(get_current_actor_id),
) -> ClientHistoryVisitReadSchema:
    try:
        previous_visit = await service.get_visit(visit_id)
        previous_status = previous_visit.visit_status.strip().lower()
        visit = await service.update_visit(visit_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    visit_read = _visit_read(visit)
    client_name = None
    if visit_read.visit_status.strip().lower() in {"completed", "cancelled", "canceled", "cancel"}:
        try:
            client = await client_service.get(visit_read.client_id)
            client_name = client.full_name or " ".join(
                part for part in (client.last_name, client.first_name, client.middle_name) if part
            ) or None
        except Exception:
            client_name = None
    if previous_status != "completed" and visit_read.visit_status.strip().lower() == "completed":
        await _publish_visit_completed(publisher, visit_read, current_actor_id, client_name)
    if previous_status not in {"cancelled", "canceled", "cancel"} and visit_read.visit_status.strip().lower() in {"cancelled", "canceled", "cancel"}:
        await _publish_visit_cancelled(publisher, visit_read, current_actor_id, client_name)

    try:
        await segment_trigger_service.on_visit_changed(
            organization_id=visit.organization_id,
            client_id=visit.client_id,
            is_cancelled=False,
            context=segment_data_provider,
        )
        await _process_loyalty_after_visit(visit)
    except Exception as exc:
        logger.warning("visit saved, but post-update processing failed visit_id=%s: %s", visit.id, exc)

    return visit_read


def _visit_photo_field(stage: str) -> str:
    if stage not in {"before", "after", "comment"}:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Альбом не найден")
    return f"photos_{stage}"


@router.post("/visits/{visit_id}/photos/{stage}", response_model=ClientHistoryVisitReadSchema)
async def upload_visit_photos(
    visit_id: int,
    stage: str,
    service: ClientVisitHistoryServiceDep,
    files: list[UploadFile] = File(...),
) -> ClientHistoryVisitReadSchema:
    field = _visit_photo_field(stage)
    try:
        visit = await service.get_visit(visit_id)
        existing = list(getattr(visit, field) or [])
        if not files or len(existing) + len(files) > 10:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="В альбоме может быть не более 10 фотографий")
        VISIT_PHOTOS_DIR.mkdir(parents=True, exist_ok=True)
        added: list[dict[str, str]] = []
        for file in files:
            suffix = Path(file.filename or "").suffix.lower()
            if suffix not in IMAGE_SUFFIXES:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Поддерживаются только изображения")
            suffix = ".jpg" if suffix == ".jpeg" else suffix
            photo_id = uuid4().hex
            file_name = f"{visit_id}-{stage}-{photo_id}{suffix}"
            (VISIT_PHOTOS_DIR / file_name).write_bytes(await file.read())
            added.append({"id": photo_id, "file_name": file_name})
        return _visit_read(await service.update_visit(visit_id, ClientHistoryVisitUpdateSchema(**{field: [*existing, *added]})))
    except HTTPException:
        raise
    except Exception as exc:
        _raise_http_error(exc)


@router.get("/visits/{visit_id}/photos/{stage}/{photo_id}")
async def get_visit_photo(
    visit_id: int,
    stage: str,
    photo_id: str,
    service: ClientVisitHistoryServiceDep,
) -> FileResponse:
    field = _visit_photo_field(stage)
    try:
        visit = await service.get_visit(visit_id)
    except Exception as exc:
        _raise_http_error(exc)
    photo = next((item for item in (getattr(visit, field) or []) if item.get("id") == photo_id), None)
    path = VISIT_PHOTOS_DIR / str(photo.get("file_name") if photo else "")
    if not photo or not path.exists():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Фотография визита не найдена")
    return FileResponse(path)


@router.delete("/visits/{visit_id}/photos/{stage}/{photo_id}", response_model=ClientHistoryVisitReadSchema)
async def delete_visit_photo(
    visit_id: int,
    stage: str,
    photo_id: str,
    service: ClientVisitHistoryServiceDep,
) -> ClientHistoryVisitReadSchema:
    field = _visit_photo_field(stage)
    try:
        visit = await service.get_visit(visit_id)
        existing = list(getattr(visit, field) or [])
        removed = next((item for item in existing if item.get("id") == photo_id), None)
        if removed is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Фотография визита не найдена")
        updated = await service.update_visit(visit_id, ClientHistoryVisitUpdateSchema(**{field: [item for item in existing if item.get("id") != photo_id]}))
        (VISIT_PHOTOS_DIR / str(removed.get("file_name") or "")).unlink(missing_ok=True)
        return _visit_read(updated)
    except HTTPException:
        raise
    except Exception as exc:
        _raise_http_error(exc)


@router.patch(
    "/visits/{visit_id}/status",
    response_model=ClientHistoryVisitReadSchema,
)
async def update_visit_status(
    visit_id: int,
    payload: VisitStatusUpdateRequest,
    service: ClientVisitHistoryServiceDep,
    segment_trigger_service: SegmentTriggerServiceDep,
    segment_data_provider: SegmentDataProviderDep,
    client_service: ClientServiceDep,
    publisher: AuthLoggingPublisher = Depends(get_auth_logging_publisher),
    current_actor_id: int | None = Depends(get_current_actor_id),
) -> ClientHistoryVisitReadSchema:
    try:
        previous_visit = await service.get_visit(visit_id)
        previous_status = previous_visit.visit_status.strip().lower()
        visit = await service.update_visit_status(
            visit_id,
            visit_status=payload.visit_status,
        )
    except Exception as exc:
        _raise_http_error(exc)

    visit_read = _visit_read(visit)
    client_name = None
    if visit_read.visit_status.strip().lower() in {"completed", "cancelled", "canceled", "cancel"}:
        try:
            client = await client_service.get(visit_read.client_id)
            client_name = client.full_name or " ".join(
                part for part in (client.last_name, client.first_name, client.middle_name) if part
            ) or None
        except Exception:
            client_name = None
    if previous_status != "completed" and visit_read.visit_status.strip().lower() == "completed":
        await _publish_visit_completed(publisher, visit_read, current_actor_id, client_name)
    if previous_status not in {"cancelled", "canceled", "cancel"} and visit_read.visit_status.strip().lower() in {"cancelled", "canceled", "cancel"}:
        await _publish_visit_cancelled(publisher, visit_read, current_actor_id, client_name)

    try:
        await segment_trigger_service.on_visit_changed(
            organization_id=visit.organization_id,
            client_id=visit.client_id,
            is_cancelled=payload.visit_status.strip().lower() in {"cancelled", "canceled", "cancel"},
            context=segment_data_provider,
        )
        await _process_loyalty_after_visit(visit)
    except Exception as exc:
        logger.warning("visit saved, but post-update processing failed visit_id=%s: %s", visit.id, exc)

    return visit_read


@router.patch(
    "/visits/{visit_id}/financial",
    response_model=ClientHistoryVisitReadSchema,
)
async def update_visit_financial_snapshot(
    visit_id: int,
    payload: VisitFinancialUpdateRequest,
    service: ClientVisitHistoryServiceDep,
    segment_trigger_service: SegmentTriggerServiceDep,
    segment_data_provider: SegmentDataProviderDep,
) -> ClientHistoryVisitReadSchema:
    try:
        visit = await service.update_financial_snapshot(
            visit_id,
            total_cost=payload.total_cost,
            discount_amount=payload.discount_amount,
            paid_amount=payload.paid_amount,
            debt_amount=payload.debt_amount,
        )
        await segment_trigger_service.on_visit_changed(
            organization_id=visit.organization_id,
            client_id=visit.client_id,
            is_cancelled=False,
            context=segment_data_provider,
        )
        await _process_loyalty_after_visit(visit)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_read(visit)


@router.delete(
    "/visits/{visit_id}",
    response_model=DeleteRead,
)
async def delete_visit_projection(
    visit_id: int,
    service: ClientVisitHistoryServiceDep,
) -> DeleteRead:
    try:
        await service.delete_visit_projection(visit_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.get(
    "/clients/{client_id}/visits",
    response_model=list[ClientHistoryVisitReadSchema],
)
async def list_client_visits(
    client_id: int,
    service: ClientVisitHistoryServiceDep,
    organization_id: int | None = Query(default=None),
    branch_id: int | None = Query(default=None),
    employee_id: int | None = Query(default=None),
    visit_status: str | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientHistoryVisitReadSchema]:
    visits = await service.list_client_visits(
        client_id=client_id,
        organization_id=organization_id,
        branch_id=branch_id,
        employee_id=employee_id,
        visit_status=visit_status,
        date_from=date_from,
        date_to=date_to,
        offset=offset,
        limit=limit,
    )
    return [_visit_read(visit) for visit in visits]


@router.get(
    "/visits/{visit_id}/comment",
    response_model=VisitCommentRead,
)
async def get_visit_comment(
    visit_id: int,
    service: ClientHistoryCommentServiceDep,
) -> VisitCommentRead:
    try:
        comment = await service.get_comment(visit_id)
    except Exception as exc:
        _raise_http_error(exc)

    return VisitCommentRead(visit_id=visit_id, comment=comment)


@router.patch(
    "/visits/{visit_id}/comment",
    response_model=ClientHistoryVisitReadSchema,
)
async def set_visit_comment(
    visit_id: int,
    payload: VisitCommentUpdateRequest,
    service: ClientHistoryCommentServiceDep,
) -> ClientHistoryVisitReadSchema:
    try:
        visit = await service.set_comment(
            visit_id=visit_id,
            comment=payload.comment,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_read(visit)


@router.delete(
    "/visits/{visit_id}/comment",
    response_model=ClientHistoryVisitReadSchema,
)
async def clear_visit_comment(
    visit_id: int,
    service: ClientHistoryCommentServiceDep,
) -> ClientHistoryVisitReadSchema:
    try:
        visit = await service.clear_comment(visit_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_read(visit)


@router.post(
    "/visit-services",
    response_model=ClientHistoryVisitServiceReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def add_service_to_visit(
    payload: ClientHistoryVisitServiceCreateSchema,
    service: ClientVisitServicesServiceDep,
) -> ClientHistoryVisitServiceReadSchema:
    try:
        item = await service.add_service_to_visit(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_service_read(item)


@router.get(
    "/visit-services",
    response_model=list[ClientHistoryVisitServiceReadSchema],
)
async def list_visit_services(
    service: ClientVisitServicesServiceDep,
    visit_id: int,
    service_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientHistoryVisitServiceReadSchema]:
    items = await service.list_visit_services(
        visit_id=visit_id,
        service_id=service_id,
        offset=offset,
        limit=limit,
    )
    return [_visit_service_read(item) for item in items]


@router.get(
    "/visit-services/{visit_service_id}",
    response_model=ClientHistoryVisitServiceReadSchema,
)
async def get_visit_service(
    visit_service_id: int,
    service: ClientVisitServicesServiceDep,
) -> ClientHistoryVisitServiceReadSchema:
    try:
        item = await service.get_visit_service(visit_service_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_service_read(item)


@router.patch(
    "/visit-services/{visit_service_id}",
    response_model=ClientHistoryVisitServiceReadSchema,
)
async def update_visit_service(
    visit_service_id: int,
    payload: ClientHistoryVisitServiceUpdateSchema,
    service: ClientVisitServicesServiceDep,
) -> ClientHistoryVisitServiceReadSchema:
    try:
        item = await service.update_visit_service(visit_service_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_service_read(item)


@router.delete(
    "/visit-services/{visit_service_id}",
    response_model=DeleteRead,
)
async def remove_service_from_visit(
    visit_service_id: int,
    service: ClientVisitServicesServiceDep,
) -> DeleteRead:
    try:
        await service.remove_service_from_visit(visit_service_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.post(
    "/visit-products",
    response_model=ClientHistoryVisitProductReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def add_product_to_visit(
    payload: ClientHistoryVisitProductCreateSchema,
    service: ClientVisitProductsServiceDep,
) -> ClientHistoryVisitProductReadSchema:
    try:
        item = await service.add_product_to_visit(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_product_read(item)


@router.get(
    "/visit-products",
    response_model=list[ClientHistoryVisitProductReadSchema],
)
async def list_visit_products(
    service: ClientVisitProductsServiceDep,
    visit_id: int,
    product_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientHistoryVisitProductReadSchema]:
    items = await service.list_visit_products(
        visit_id=visit_id,
        product_id=product_id,
        offset=offset,
        limit=limit,
    )
    return [_visit_product_read(item) for item in items]


@router.get(
    "/visit-products/{visit_product_id}",
    response_model=ClientHistoryVisitProductReadSchema,
)
async def get_visit_product(
    visit_product_id: int,
    service: ClientVisitProductsServiceDep,
) -> ClientHistoryVisitProductReadSchema:
    try:
        item = await service.get_visit_product(visit_product_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_product_read(item)


@router.patch(
    "/visit-products/{visit_product_id}",
    response_model=ClientHistoryVisitProductReadSchema,
)
async def update_visit_product(
    visit_product_id: int,
    payload: ClientHistoryVisitProductUpdateSchema,
    service: ClientVisitProductsServiceDep,
) -> ClientHistoryVisitProductReadSchema:
    try:
        item = await service.update_visit_product(visit_product_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_product_read(item)


@router.delete(
    "/visit-products/{visit_product_id}",
    response_model=DeleteRead,
)
async def remove_product_from_visit(
    visit_product_id: int,
    service: ClientVisitProductsServiceDep,
) -> DeleteRead:
    try:
        await service.remove_product_from_visit(visit_product_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.post(
    "/checks",
    response_model=ClientCheckReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_check(
    payload: ClientCheckCreateSchema,
    crud: ClientCheckCrudDep,
) -> ClientCheckReadSchema:
    try:
        check = await crud.create(payload.model_dump())
    except Exception as exc:
        _raise_http_error(exc)

    return _check_read(check)


@router.get(
    "/checks",
    response_model=list[ClientCheckReadSchema],
)
async def list_checks(
    crud: ClientCheckCrudDep,
    organization_id: int | None = Query(default=None),
    client_id: int | None = Query(default=None),
    visit_id: int | None = Query(default=None),
    sale_id: int | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientCheckReadSchema]:
    checks = await crud.list(
        organization_id=organization_id,
        client_id=client_id,
        visit_id=visit_id,
        sale_id=sale_id,
        date_from=date_from,
        date_to=date_to,
        offset=offset,
        limit=limit,
    )
    return [_check_read(check) for check in checks]


@router.get(
    "/checks/by-number/{check_number}",
    response_model=ClientCheckReadSchema,
)
async def get_check_by_number(
    check_number: str,
    crud: ClientCheckCrudDep,
    organization_id: int,
) -> ClientCheckReadSchema:
    check = await crud.get_by_check_number(
        organization_id=organization_id,
        check_number=check_number,
    )

    if check is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чек не найден",
        )

    return _check_read(check)


@router.get(
    "/checks/{check_id}",
    response_model=ClientCheckReadSchema,
)
async def get_check(
    check_id: int,
    crud: ClientCheckCrudDep,
) -> ClientCheckReadSchema:
    check = await crud.get_by_id(check_id)

    if check is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чек не найден",
        )

    return _check_read(check)


@router.patch(
    "/checks/{check_id}",
    response_model=ClientCheckReadSchema,
)
async def update_check(
    check_id: int,
    payload: ClientCheckUpdateSchema,
    crud: ClientCheckCrudDep,
) -> ClientCheckReadSchema:
    check = await crud.get_by_id(check_id)

    if check is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чек не найден",
        )

    try:
        updated_check = await crud.update(
            check,
            payload.model_dump(exclude_unset=True),
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _check_read(updated_check)


@router.delete(
    "/checks/{check_id}",
    response_model=DeleteRead,
)
async def delete_check(
    check_id: int,
    crud: ClientCheckCrudDep,
) -> DeleteRead:
    check = await crud.get_by_id(check_id)

    if check is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Чек не найден",
        )

    try:
        await crud.delete(check)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.get(
    "/clients/{client_id}/metrics-source",
    response_model=ClientHistoryMetricsRead,
)
async def get_client_history_metrics_source(
    client_id: int,
    service: ClientHistoryMetricsSourceServiceDep,
    organization_id: int | None = Query(default=None),
    now: datetime | None = Query(default=None),
    limit: int = Query(default=10_000, ge=1, le=100_000),
) -> ClientHistoryMetricsRead:
    metrics = await service.build_client_metrics_source(
        client_id=client_id,
        organization_id=organization_id,
        now=now or utc_now(),
        limit=limit,
    )
    return ClientHistoryMetricsRead(**asdict(metrics))


@router.post(
    "/sync/visits",
    response_model=ClientHistoryVisitReadSchema,
)
async def sync_visit_projection(
    payload: ClientHistoryVisitCreateSchema,
    service: ClientHistorySyncServiceDep,
    visit_id: int | None = Query(default=None),
) -> ClientHistoryVisitReadSchema:
    try:
        visit = await service.sync_visit_projection(
            payload,
            visit_id=visit_id,
        )
        await _process_loyalty_after_visit(visit)
    except Exception as exc:
        _raise_http_error(exc)

    return _visit_read(visit)


@router.post(
    "/sync/visits/{visit_id}/services",
    response_model=list[ClientHistoryVisitServiceReadSchema],
)
async def sync_visit_services_projection(
    visit_id: int,
    payload: SyncVisitServicesRequest,
    service: ClientHistorySyncServiceDep,
) -> list[ClientHistoryVisitServiceReadSchema]:
    try:
        items = await service.sync_visit_services_projection(
            visit_id=visit_id,
            services=payload.services,
            replace_existing=payload.replace_existing,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_visit_service_read(item) for item in items]


@router.post(
    "/sync/visits/{visit_id}/products",
    response_model=list[ClientHistoryVisitProductReadSchema],
)
async def sync_visit_products_projection(
    visit_id: int,
    payload: SyncVisitProductsRequest,
    service: ClientHistorySyncServiceDep,
) -> list[ClientHistoryVisitProductReadSchema]:
    try:
        items = await service.sync_visit_products_projection(
            visit_id=visit_id,
            products=payload.products,
            replace_existing=payload.replace_existing,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_visit_product_read(item) for item in items]


@router.post(
    "/sync/rebuild-visit",
    response_model=VisitDetailsRead,
)
async def rebuild_visit_projection(
    payload: RebuildVisitProjectionRequest,
    service: ClientHistorySyncServiceDep,
    visit_id: int | None = Query(default=None),
) -> VisitDetailsRead:
    try:
        item = await service.rebuild_visit_projection(
            visit_payload=payload.visit,
            services=payload.services,
            products=payload.products,
            visit_id=visit_id,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _details_read(item)
