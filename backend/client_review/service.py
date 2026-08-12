from __future__ import annotations

import httpx

from client_circout.backend.api_dependencies import ReviewTargetsApi
from client_circout.backend.client_review.crud import ClientReviewCrud
from client_circout.backend.client_review.models import ClientReviewModel
from client_circout.backend.client_review.schemas import (
    ClientReviewCreateSchema,
    ClientReviewUpdateSchema,
    ReviewTargetType,
    TargetRatingSchema,
)
from client_circout.backend.clients_core.crud.client import ClientCrud


class ReviewNotFoundError(Exception):
    pass


class ReviewClientNotFoundError(Exception):
    pass


class ReviewTargetNotFoundError(Exception):
    pass


class ReviewTargetServiceUnavailableError(Exception):
    pass


class ClientReviewService:
    def __init__(
        self,
        review_crud: ClientReviewCrud,
        client_crud: ClientCrud,
        targets_api: ReviewTargetsApi,
    ) -> None:
        self._reviews = review_crud
        self._clients = client_crud
        self._targets = targets_api

    async def create(self, payload: ClientReviewCreateSchema) -> ClientReviewModel:
        client = await self._clients.get_by_id(payload.client_id)
        if client is None or client.organization_id != payload.organization_id:
            raise ReviewClientNotFoundError

        try:
            if payload.branch_id is not None:
                target_exists = (
                    await self._reviews.visit_matches_branch(
                        visit_id=payload.visit_id,
                        organization_id=payload.organization_id,
                        client_id=payload.client_id,
                        branch_id=payload.branch_id,
                    )
                    if payload.visit_id is not None
                    else await self._targets.branch_exists(
                        payload.organization_id,
                        payload.branch_id,
                    )
                )
            else:
                target_exists = await self._targets.employee_exists(
                    payload.organization_id,
                    payload.employee_id,
                )
        except httpx.HTTPError as error:
            raise ReviewTargetServiceUnavailableError from error
        if not target_exists:
            raise ReviewTargetNotFoundError

        client_name = client.full_name or " ".join(
            part for part in (client.last_name, client.first_name, client.middle_name) if part
        )
        return await self._reviews.create(
            {
                **payload.model_dump(exclude={"visit_id"}),
                "client_name": client_name or f"Клиент #{client.id}",
            }
        )

    async def get(self, review_id: int) -> ClientReviewModel:
        review = await self._reviews.get_by_id(review_id)
        if review is None:
            raise ReviewNotFoundError
        return review

    async def list(
        self,
        *,
        organization_id: int,
        branch_id: int | None,
        employee_id: int | None,
        offset: int,
        limit: int,
    ):
        if branch_id is not None and employee_id is not None:
            raise ValueError("branch_id and employee_id cannot be used together")
        return await self._reviews.list(
            organization_id=organization_id,
            branch_id=branch_id,
            employee_id=employee_id,
            offset=offset,
            limit=limit,
        )

    async def update(
        self,
        review_id: int,
        payload: ClientReviewUpdateSchema,
    ) -> ClientReviewModel:
        review = await self.get(review_id)
        return await self._reviews.update(
            review,
            payload.model_dump(exclude_none=True),
        )

    async def delete(self, review_id: int) -> None:
        await self._reviews.delete(await self.get(review_id))

    async def get_rating(
        self,
        *,
        organization_id: int,
        target_type: ReviewTargetType,
        target_id: int,
    ) -> TargetRatingSchema:
        branch_id = target_id if target_type is ReviewTargetType.BRANCH else None
        employee_id = target_id if target_type is ReviewTargetType.EMPLOYEE else None
        rating, count = await self._reviews.get_rating(
            organization_id=organization_id,
            branch_id=branch_id,
            employee_id=employee_id,
        )
        return TargetRatingSchema(
            organization_id=organization_id,
            target_type=target_type,
            target_id=target_id,
            rating=rating,
            reviews_count=count,
        )

    async def get_employee_ratings(self, organization_id: int) -> list[TargetRatingSchema]:
        rows = await self._reviews.get_employee_ratings(organization_id)
        return [
            TargetRatingSchema(
                organization_id=organization_id,
                target_type=ReviewTargetType.EMPLOYEE,
                target_id=employee_id,
                rating=rating,
                reviews_count=count,
            )
            for employee_id, rating, count in rows
        ]

