from __future__ import annotations

from datetime import date, datetime
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from pydantic import BaseModel, Field

from client_circout.backend.client_profile.dependencies import (
    ClientActiveBookingServiceDep,
    ClientFavoriteEmployeeServiceDep,
    ClientFavoriteServiceServiceDep,
    ClientProfileMetricsServiceDep,
    ClientProfileReadModelServiceDep,
    ClientRecommendationServiceDep,
)
from client_circout.backend.client_profile.schemas.active_bookings import (
    ClientActiveBookingCreateSchema,
    ClientActiveBookingReadSchema,
    ClientActiveBookingUpdateSchema,
)
from client_circout.backend.client_profile.schemas.favorite_employees import (
    ClientFavoriteEmployeeReadSchema,
)
from client_circout.backend.client_profile.schemas.favorite_services import (
    ClientFavoriteServiceReadSchema,
)
from client_circout.backend.client_profile.schemas.profile_metrics import (
    ClientMetricSnapshotCreateSchema,
    ClientMetricSnapshotReadSchema,
    ClientMetricSnapshotUpdateSchema,
    ClientProfileMetricCreateSchema,
    ClientProfileMetricReadSchema,
    ClientProfileMetricUpdateSchema,
)
from client_circout.backend.client_profile.schemas.recommendations import (
    ClientRecommendationCreateSchema,
    ClientRecommendationReadSchema,
    ClientRecommendationUpdateSchema,
)
from client_circout.backend.client_profile.service.exceptions import (
    ClientProfileServiceError,
    ProfileEntityConflictError,
    ProfileEntityNotFoundError,
    ProfileIntegrationError,
    ProfileValidationError,
)

router = APIRouter(
    prefix="/client-profile",
    tags=["client-profile"],
)


class DeleteRead(BaseModel):
    deleted: bool


class CancelBookingRequest(BaseModel):
    cancel_reason: str | None = None


class RepeatBookingRequest(BaseModel):
    starts_at: datetime
    ends_at: datetime
    branch_id: int | None = None
    employee_id: int | None = None
    service_id: int | None = None


class MarkFavoriteServiceUsedRequest(BaseModel):
    client_id: int
    service_id: int
    used_at: datetime | None = None


class MarkFavoriteEmployeeUsedRequest(BaseModel):
    client_id: int
    employee_id: int
    used_at: datetime | None = None


class UpsertClientMetricRequest(BaseModel):
    organization_id: int
    data: ClientProfileMetricUpdateSchema


class UpsertMetricSnapshotRequest(BaseModel):
    organization_id: int
    snapshot_date: date | None = None
    data: ClientMetricSnapshotUpdateSchema


class ClientProfileRead(BaseModel):
    client: dict[str, Any]
    metrics: ClientProfileMetricReadSchema | None = None
    active_bookings: list[ClientActiveBookingReadSchema]
    favorite_services: list[ClientFavoriteServiceReadSchema]
    favorite_employees: list[ClientFavoriteEmployeeReadSchema]
    recommendations: list[ClientRecommendationReadSchema]
    external: dict[str, Any]


def _model_to_dict(model: Any) -> dict[str, Any]:
    return {
        column.name: getattr(model, column.name)
        for column in model.__table__.columns
    }


def _booking_read(booking) -> ClientActiveBookingReadSchema:
    return ClientActiveBookingReadSchema.model_validate(booking)


def _favorite_service_read(favorite) -> ClientFavoriteServiceReadSchema:
    return ClientFavoriteServiceReadSchema.model_validate(favorite)


def _favorite_employee_read(favorite) -> ClientFavoriteEmployeeReadSchema:
    return ClientFavoriteEmployeeReadSchema.model_validate(favorite)


def _metric_read(metric) -> ClientProfileMetricReadSchema:
    return ClientProfileMetricReadSchema.model_validate(metric)


def _snapshot_read(snapshot) -> ClientMetricSnapshotReadSchema:
    return ClientMetricSnapshotReadSchema.model_validate(snapshot)


def _recommendation_read(recommendation) -> ClientRecommendationReadSchema:
    return ClientRecommendationReadSchema.model_validate(recommendation)


def _profile_read(profile) -> ClientProfileRead:
    return ClientProfileRead(
        client=jsonable_encoder(_model_to_dict(profile.client)),
        metrics=None if profile.metrics is None else _metric_read(profile.metrics),
        active_bookings=[
            _booking_read(booking)
            for booking in profile.active_bookings
        ],
        favorite_services=[
            _favorite_service_read(favorite)
            for favorite in profile.favorite_services
        ],
        favorite_employees=[
            _favorite_employee_read(favorite)
            for favorite in profile.favorite_employees
        ],
        recommendations=[
            _recommendation_read(recommendation)
            for recommendation in profile.recommendations
        ],
        external=jsonable_encoder(profile.external.as_dict()),
    )


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, ProfileEntityNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc) or "Сущность профиля клиента не найдена",
        ) from exc

    if isinstance(exc, ProfileEntityConflictError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc) or "Конфликт профиля клиента",
        ) from exc

    if isinstance(exc, ProfileValidationError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Некорректные данные профиля клиента",
        ) from exc

    if isinstance(exc, ProfileIntegrationError):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc) or "Ошибка интеграции профиля клиента",
        ) from exc

    if isinstance(exc, ClientProfileServiceError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Ошибка сервиса профиля клиента",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc) or "Ошибка профиля клиента",
    ) from exc


@router.get(
    "/clients/{client_id}",
    response_model=ClientProfileRead,
)
async def get_client_profile(
    client_id: int,
    service: ClientProfileReadModelServiceDep,
    organization_id: int = Query(...),
    favorite_limit: int = Query(default=10, ge=1, le=100),
) -> ClientProfileRead:
    try:
        profile = await service.get_profile(
            organization_id=organization_id,
            client_id=client_id,
            favorite_limit=favorite_limit,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _profile_read(profile)


@router.post(
    "/bookings",
    response_model=ClientActiveBookingReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_booking(
    payload: ClientActiveBookingCreateSchema,
    service: ClientActiveBookingServiceDep,
) -> ClientActiveBookingReadSchema:
    try:
        booking = await service.create(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _booking_read(booking)


@router.get(
    "/bookings/{booking_id}",
    response_model=ClientActiveBookingReadSchema,
)
async def get_booking(
    booking_id: int,
    service: ClientActiveBookingServiceDep,
) -> ClientActiveBookingReadSchema:
    try:
        booking = await service.get(booking_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _booking_read(booking)


@router.patch(
    "/bookings/{booking_id}",
    response_model=ClientActiveBookingReadSchema,
)
async def update_booking(
    booking_id: int,
    payload: ClientActiveBookingUpdateSchema,
    service: ClientActiveBookingServiceDep,
) -> ClientActiveBookingReadSchema:
    try:
        booking = await service.update(booking_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _booking_read(booking)


@router.post(
    "/bookings/{booking_id}/cancel",
    response_model=ClientActiveBookingReadSchema,
)
async def cancel_booking(
    booking_id: int,
    payload: CancelBookingRequest,
    service: ClientActiveBookingServiceDep,
) -> ClientActiveBookingReadSchema:
    try:
        booking = await service.cancel(
            booking_id,
            cancel_reason=payload.cancel_reason,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _booking_read(booking)


@router.post(
    "/bookings/{booking_id}/reschedule",
    response_model=ClientActiveBookingReadSchema,
)
async def reschedule_booking(
    booking_id: int,
    payload: RepeatBookingRequest,
    service: ClientActiveBookingServiceDep,
) -> ClientActiveBookingReadSchema:
    try:
        booking = await service.reschedule(booking_id, payload.model_dump())
    except Exception as exc:
        _raise_http_error(exc)

    return _booking_read(booking)


@router.post(
    "/bookings/{booking_id}/repeat",
    response_model=ClientActiveBookingReadSchema,
)
async def repeat_booking(
    booking_id: int,
    payload: RepeatBookingRequest,
    service: ClientActiveBookingServiceDep,
) -> ClientActiveBookingReadSchema:
    try:
        booking = await service.repeat(booking_id, payload.model_dump())
    except Exception as exc:
        _raise_http_error(exc)

    return _booking_read(booking)


@router.delete(
    "/bookings/{booking_id}",
    response_model=DeleteRead,
)
async def delete_booking(
    booking_id: int,
    service: ClientActiveBookingServiceDep,
) -> DeleteRead:
    try:
        await service.delete(booking_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.get(
    "/clients/{client_id}/bookings",
    response_model=list[ClientActiveBookingReadSchema],
)
async def list_client_bookings(
    client_id: int,
    service: ClientActiveBookingServiceDep,
    active_only: bool = Query(default=False),
) -> list[ClientActiveBookingReadSchema]:
    if active_only:
        bookings = await service.list_active_by_client(client_id=client_id)
    else:
        bookings = await service.list_by_client(client_id=client_id)

    return [_booking_read(booking) for booking in bookings]


@router.post(
    "/favorite-services/mark-used",
    response_model=ClientFavoriteServiceReadSchema,
)
async def mark_favorite_service_used(
    payload: MarkFavoriteServiceUsedRequest,
    service: ClientFavoriteServiceServiceDep,
) -> ClientFavoriteServiceReadSchema:
    try:
        favorite = await service.mark_used(
            client_id=payload.client_id,
            service_id=payload.service_id,
            used_at=payload.used_at,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _favorite_service_read(favorite)


@router.get(
    "/clients/{client_id}/favorite-services",
    response_model=list[ClientFavoriteServiceReadSchema],
)
async def list_client_favorite_services(
    client_id: int,
    service: ClientFavoriteServiceServiceDep,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientFavoriteServiceReadSchema]:
    favorites = await service.list_by_client(
        client_id=client_id,
        offset=offset,
        limit=limit,
    )
    return [_favorite_service_read(favorite) for favorite in favorites]


@router.get(
    "/favorite-services/{favorite_id}",
    response_model=ClientFavoriteServiceReadSchema,
)
async def get_favorite_service(
    favorite_id: int,
    service: ClientFavoriteServiceServiceDep,
) -> ClientFavoriteServiceReadSchema:
    try:
        favorite = await service.get(favorite_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _favorite_service_read(favorite)


@router.delete(
    "/favorite-services/{favorite_id}",
    response_model=DeleteRead,
)
async def remove_favorite_service(
    favorite_id: int,
    service: ClientFavoriteServiceServiceDep,
) -> DeleteRead:
    try:
        await service.remove(favorite_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.post(
    "/favorite-employees/mark-used",
    response_model=ClientFavoriteEmployeeReadSchema,
)
async def mark_favorite_employee_used(
    payload: MarkFavoriteEmployeeUsedRequest,
    service: ClientFavoriteEmployeeServiceDep,
) -> ClientFavoriteEmployeeReadSchema:
    try:
        favorite = await service.mark_used(
            client_id=payload.client_id,
            employee_id=payload.employee_id,
            used_at=payload.used_at,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _favorite_employee_read(favorite)


@router.get(
    "/clients/{client_id}/favorite-employees",
    response_model=list[ClientFavoriteEmployeeReadSchema],
)
async def list_client_favorite_employees(
    client_id: int,
    service: ClientFavoriteEmployeeServiceDep,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientFavoriteEmployeeReadSchema]:
    favorites = await service.list_by_client(
        client_id=client_id,
        offset=offset,
        limit=limit,
    )
    return [_favorite_employee_read(favorite) for favorite in favorites]


@router.get(
    "/favorite-employees/{favorite_id}",
    response_model=ClientFavoriteEmployeeReadSchema,
)
async def get_favorite_employee(
    favorite_id: int,
    service: ClientFavoriteEmployeeServiceDep,
) -> ClientFavoriteEmployeeReadSchema:
    try:
        favorite = await service.get(favorite_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _favorite_employee_read(favorite)


@router.delete(
    "/favorite-employees/{favorite_id}",
    response_model=DeleteRead,
)
async def remove_favorite_employee(
    favorite_id: int,
    service: ClientFavoriteEmployeeServiceDep,
) -> DeleteRead:
    try:
        await service.remove(favorite_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.post(
    "/metrics",
    response_model=ClientProfileMetricReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_profile_metric(
    payload: ClientProfileMetricCreateSchema,
    service: ClientProfileMetricsServiceDep,
) -> ClientProfileMetricReadSchema:
    try:
        metric = await service.create(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _metric_read(metric)


@router.get(
    "/metrics",
    response_model=list[ClientProfileMetricReadSchema],
)
async def list_profile_metrics(
    service: ClientProfileMetricsServiceDep,
    organization_id: int | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientProfileMetricReadSchema]:
    metrics = await service.list(
        organization_id=organization_id,
        offset=offset,
        limit=limit,
    )
    return [_metric_read(metric) for metric in metrics]


@router.get(
    "/clients/{client_id}/metrics",
    response_model=ClientProfileMetricReadSchema | None,
)
async def get_client_profile_metric(
    client_id: int,
    service: ClientProfileMetricsServiceDep,
) -> ClientProfileMetricReadSchema | None:
    metric = await service.get_by_client(client_id)

    if metric is None:
        return None

    return _metric_read(metric)


@router.put(
    "/clients/{client_id}/metrics",
    response_model=ClientProfileMetricReadSchema,
)
async def upsert_client_profile_metric(
    client_id: int,
    payload: UpsertClientMetricRequest,
    service: ClientProfileMetricsServiceDep,
) -> ClientProfileMetricReadSchema:
    try:
        metric = await service.upsert_by_client(
            organization_id=payload.organization_id,
            client_id=client_id,
            payload=payload.data,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _metric_read(metric)


@router.get(
    "/metrics/{metric_id}",
    response_model=ClientProfileMetricReadSchema,
)
async def get_profile_metric(
    metric_id: int,
    service: ClientProfileMetricsServiceDep,
) -> ClientProfileMetricReadSchema:
    try:
        metric = await service.get(metric_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _metric_read(metric)


@router.patch(
    "/metrics/{metric_id}",
    response_model=ClientProfileMetricReadSchema,
)
async def update_profile_metric(
    metric_id: int,
    payload: ClientProfileMetricUpdateSchema,
    service: ClientProfileMetricsServiceDep,
) -> ClientProfileMetricReadSchema:
    try:
        metric = await service.update(metric_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _metric_read(metric)


@router.delete(
    "/metrics/{metric_id}",
    response_model=DeleteRead,
)
async def delete_profile_metric(
    metric_id: int,
    service: ClientProfileMetricsServiceDep,
) -> DeleteRead:
    try:
        await service.delete(metric_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.post(
    "/metric-snapshots",
    response_model=ClientMetricSnapshotReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_metric_snapshot(
    payload: ClientMetricSnapshotCreateSchema,
    service: ClientProfileMetricsServiceDep,
) -> ClientMetricSnapshotReadSchema:
    try:
        snapshot = await service.create_snapshot(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _snapshot_read(snapshot)


@router.get(
    "/clients/{client_id}/metric-snapshots",
    response_model=list[ClientMetricSnapshotReadSchema],
)
async def list_client_metric_snapshots(
    client_id: int,
    service: ClientProfileMetricsServiceDep,
) -> list[ClientMetricSnapshotReadSchema]:
    snapshots = await service.list_snapshots_by_client(client_id=client_id)
    return [_snapshot_read(snapshot) for snapshot in snapshots]


@router.put(
    "/clients/{client_id}/metric-snapshots",
    response_model=ClientMetricSnapshotReadSchema,
)
async def upsert_client_metric_snapshot(
    client_id: int,
    payload: UpsertMetricSnapshotRequest,
    service: ClientProfileMetricsServiceDep,
) -> ClientMetricSnapshotReadSchema:
    try:
        snapshot = await service.upsert_snapshot(
            organization_id=payload.organization_id,
            client_id=client_id,
            snapshot_date=payload.snapshot_date,
            payload=payload.data,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _snapshot_read(snapshot)


@router.get(
    "/metric-snapshots/{snapshot_id}",
    response_model=ClientMetricSnapshotReadSchema,
)
async def get_metric_snapshot(
    snapshot_id: int,
    service: ClientProfileMetricsServiceDep,
) -> ClientMetricSnapshotReadSchema:
    try:
        snapshot = await service.get_snapshot(snapshot_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _snapshot_read(snapshot)


@router.patch(
    "/metric-snapshots/{snapshot_id}",
    response_model=ClientMetricSnapshotReadSchema,
)
async def update_metric_snapshot(
    snapshot_id: int,
    payload: ClientMetricSnapshotUpdateSchema,
    service: ClientProfileMetricsServiceDep,
) -> ClientMetricSnapshotReadSchema:
    try:
        current = await service.get_snapshot(snapshot_id)
        snapshot = await service.upsert_snapshot(
            organization_id=current.organization_id,
            client_id=current.client_id,
            snapshot_date=current.snapshot_date,
            payload=payload,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _snapshot_read(snapshot)


@router.delete(
    "/metric-snapshots/{snapshot_id}",
    response_model=DeleteRead,
)
async def delete_metric_snapshot(
    snapshot_id: int,
    service: ClientProfileMetricsServiceDep,
) -> DeleteRead:
    try:
        await service.delete_snapshot(snapshot_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.post(
    "/recommendations",
    response_model=ClientRecommendationReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_recommendation(
    payload: ClientRecommendationCreateSchema,
    service: ClientRecommendationServiceDep,
) -> ClientRecommendationReadSchema:
    try:
        recommendation = await service.create(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _recommendation_read(recommendation)


@router.get(
    "/clients/{client_id}/recommendations",
    response_model=list[ClientRecommendationReadSchema],
)
async def list_client_recommendations(
    client_id: int,
    service: ClientRecommendationServiceDep,
    active_only: bool = Query(default=False),
) -> list[ClientRecommendationReadSchema]:
    if active_only:
        recommendations = await service.list_active_by_client(client_id=client_id)
    else:
        recommendations = await service.list_by_client(client_id=client_id)

    return [
        _recommendation_read(recommendation)
        for recommendation in recommendations
    ]


@router.get(
    "/recommendations/{recommendation_id}",
    response_model=ClientRecommendationReadSchema,
)
async def get_recommendation(
    recommendation_id: int,
    service: ClientRecommendationServiceDep,
) -> ClientRecommendationReadSchema:
    try:
        recommendation = await service.get(recommendation_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _recommendation_read(recommendation)


@router.patch(
    "/recommendations/{recommendation_id}",
    response_model=ClientRecommendationReadSchema,
)
async def update_recommendation(
    recommendation_id: int,
    payload: ClientRecommendationUpdateSchema,
    service: ClientRecommendationServiceDep,
) -> ClientRecommendationReadSchema:
    try:
        recommendation = await service.update(recommendation_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _recommendation_read(recommendation)


@router.post(
    "/recommendations/{recommendation_id}/dismiss",
    response_model=ClientRecommendationReadSchema,
)
async def dismiss_recommendation(
    recommendation_id: int,
    service: ClientRecommendationServiceDep,
) -> ClientRecommendationReadSchema:
    try:
        recommendation = await service.dismiss(recommendation_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _recommendation_read(recommendation)


@router.post(
    "/recommendations/{recommendation_id}/expire",
    response_model=ClientRecommendationReadSchema,
)
async def expire_recommendation(
    recommendation_id: int,
    service: ClientRecommendationServiceDep,
) -> ClientRecommendationReadSchema:
    try:
        recommendation = await service.expire(recommendation_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _recommendation_read(recommendation)


@router.delete(
    "/recommendations/{recommendation_id}",
    response_model=DeleteRead,
)
async def delete_recommendation(
    recommendation_id: int,
    service: ClientRecommendationServiceDep,
) -> DeleteRead:
    try:
        await service.delete(recommendation_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)
