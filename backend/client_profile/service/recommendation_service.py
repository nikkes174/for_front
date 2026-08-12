from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from pydantic import BaseModel

from client_circout.backend.client_profile.crud.recommendations import (
    ClientRecommendationConflictError,
    ClientRecommendationCrud,
)
from client_circout.backend.client_profile.models.recommendations import ClientRecommendationModel
from client_circout.backend.client_profile.schemas.recommendations import (
    ClientRecommendationCreateSchema,
    ClientRecommendationUpdateSchema,
)
from client_circout.backend.client_profile.service._utils import payload_to_dict, utc_now
from client_circout.backend.client_profile.service.exceptions import ProfileEntityConflictError, ProfileEntityNotFoundError


class ClientRecommendationService:
    ACTIVE_STATUS = "active"
    DISMISSED_STATUS = "dismissed"
    EXPIRED_STATUS = "expired"

    def __init__(self, recommendation_crud: ClientRecommendationCrud) -> None:
        self._recommendation_crud = recommendation_crud

    async def create(
        self,
        payload: ClientRecommendationCreateSchema | Mapping[str, Any],
    ) -> ClientRecommendationModel:
        data = payload_to_dict(payload, exclude_unset=False)
        data.setdefault("status", self.ACTIVE_STATUS)

        try:
            return await self._recommendation_crud.create(data)
        except ClientRecommendationConflictError as exc:
            raise ProfileEntityConflictError("recommendation create conflict") from exc

    async def get(self, recommendation_id: int) -> ClientRecommendationModel:
        recommendation = await self._recommendation_crud.get_by_id(recommendation_id)
        if recommendation is None:
            raise ProfileEntityNotFoundError("client_recommendation", recommendation_id)
        return recommendation

    async def list_by_client(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientRecommendationModel]:
        return await self._recommendation_crud.get_by_client_id(client_id=client_id)

    async def list_active_by_client(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientRecommendationModel]:
        return await self._recommendation_crud.get_active_by_client_id(
            client_id=client_id,
            now=utc_now(),
        )

    async def update(
        self,
        recommendation_id: int,
        payload: ClientRecommendationUpdateSchema | BaseModel | Mapping[str, Any],
    ) -> ClientRecommendationModel:
        recommendation = await self.get(recommendation_id)
        data = payload_to_dict(payload)

        if not data:
            return recommendation

        try:
            return await self._recommendation_crud.update(recommendation, data)
        except ClientRecommendationConflictError as exc:
            raise ProfileEntityConflictError("recommendation update conflict") from exc

    async def dismiss(self, recommendation_id: int) -> ClientRecommendationModel:
        return await self.update(recommendation_id, {"status": self.DISMISSED_STATUS})

    async def expire(self, recommendation_id: int) -> ClientRecommendationModel:
        return await self.update(recommendation_id, {"status": self.EXPIRED_STATUS})

    async def delete(self, recommendation_id: int) -> None:
        recommendation = await self.get(recommendation_id)
        await self._recommendation_crud.delete(recommendation)
