from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

from client_circout.backend.client_review.schemas import (
    ClientReviewCreateSchema,
    ClientReviewReadSchema,
    ClientReviewUpdateSchema,
    ReviewTargetType,
    TargetRatingSchema,
)
from client_circout.backend.client_review.service import (
    ClientReviewService,
    ReviewClientNotFoundError,
    ReviewNotFoundError,
    ReviewTargetNotFoundError,
    ReviewTargetServiceUnavailableError,
)
from client_circout.backend.depencises import get_client_review_service
from client_circout.backend.api_dependencies import get_auth_logging_publisher
from client_circout.backend.integrations.auth_logging import AuthLoggingPublishError, AuthLoggingPublisher
from client_circout.backend.logger import get_logger

router = APIRouter(prefix="/client-reviews", tags=["client-reviews"])
ReviewServiceDep = Annotated[ClientReviewService, Depends(get_client_review_service)]
logger = get_logger(__name__)


def _translate_service_error(error: Exception) -> None:
    if isinstance(error, ReviewNotFoundError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Отзыв не найден")
    if isinstance(error, ReviewClientNotFoundError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Клиент не найден в организации")
    if isinstance(error, ReviewTargetNotFoundError):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Сотрудник или филиал не найден")
    if isinstance(error, ReviewTargetServiceUnavailableError):
        raise HTTPException(
            status.HTTP_503_SERVICE_UNAVAILABLE,
            "Сервис сотрудников и филиалов временно недоступен",
        )
    raise error


@router.post("", response_model=ClientReviewReadSchema, status_code=status.HTTP_201_CREATED)
async def create_review(
    payload: ClientReviewCreateSchema,
    service: ReviewServiceDep,
    publisher: AuthLoggingPublisher = Depends(get_auth_logging_publisher),
) -> ClientReviewReadSchema:
    try:
        review = await service.create(payload)
        review_read = ClientReviewReadSchema.model_validate(review)
        try:
            await publisher.publish_event_and_audit(
                event_type="review.created",
                action="review.create",
                entity_type="client_review",
                entity_id=review_read.id,
                organization_id=review_read.organization_id,
                branch_id=review_read.branch_id,
                client_id=review_read.client_id,
                actor_type="client",
                actor_id=review_read.client_id,
                payload={
                    "review_id": review_read.id,
                    "client_id": review_read.client_id,
                    "client_name": review_read.client_name,
                    "employee_id": review_read.employee_id,
                    "rating": review_read.rating,
                    "text": review_read.text,
                },
            )
        except AuthLoggingPublishError as error:
            logger.warning(
                "review created, but audit/event publishing failed for review_id=%s: %s",
                review_read.id,
                error,
            )
        return review_read
    except (
        ReviewClientNotFoundError,
        ReviewTargetNotFoundError,
        ReviewTargetServiceUnavailableError,
    ) as error:
        _translate_service_error(error)


@router.get("", response_model=list[ClientReviewReadSchema])
async def list_reviews(
    service: ReviewServiceDep,
    organization_id: int = Query(gt=0),
    branch_id: int | None = Query(default=None, gt=0),
    employee_id: int | None = Query(default=None, gt=0),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[ClientReviewReadSchema]:
    try:
        return await service.list(
            organization_id=organization_id,
            branch_id=branch_id,
            employee_id=employee_id,
            offset=offset,
            limit=limit,
        )
    except ValueError as error:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_ENTITY, str(error)) from error


@router.get("/ratings/employees", response_model=list[TargetRatingSchema])
async def get_employee_ratings(
    service: ReviewServiceDep,
    organization_id: int = Query(gt=0),
) -> list[TargetRatingSchema]:
    return await service.get_employee_ratings(organization_id)


@router.get(
    "/ratings/{target_type}/{target_id}",
    response_model=TargetRatingSchema,
)
async def get_target_rating(
    target_type: ReviewTargetType,
    target_id: int,
    service: ReviewServiceDep,
    organization_id: int = Query(gt=0),
) -> TargetRatingSchema:
    return await service.get_rating(
        organization_id=organization_id,
        target_type=target_type,
        target_id=target_id,
    )


@router.get("/{review_id}", response_model=ClientReviewReadSchema)
async def get_review(review_id: int, service: ReviewServiceDep) -> ClientReviewReadSchema:
    try:
        return await service.get(review_id)
    except ReviewNotFoundError as error:
        _translate_service_error(error)


@router.patch("/{review_id}", response_model=ClientReviewReadSchema)
async def update_review(
    review_id: int,
    payload: ClientReviewUpdateSchema,
    service: ReviewServiceDep,
) -> ClientReviewReadSchema:
    try:
        return await service.update(review_id, payload)
    except ReviewNotFoundError as error:
        _translate_service_error(error)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(review_id: int, service: ReviewServiceDep) -> Response:
    try:
        await service.delete(review_id)
    except ReviewNotFoundError as error:
        _translate_service_error(error)
    return Response(status_code=status.HTTP_204_NO_CONTENT)
