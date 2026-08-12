from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_profile.models.recommendations import ClientRecommendationModel


class ClientRecommendationConflictError(Exception):
    pass


class ClientRecommendationCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientRecommendationModel:
        recommendation = ClientRecommendationModel(**payload)
        self._session.add(recommendation)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientRecommendationConflictError from exc

        await self._session.refresh(recommendation)
        return recommendation

    async def get_by_id(
        self,
        recommendation_id: int,
    ) -> ClientRecommendationModel | None:
        return await self._session.get(
            ClientRecommendationModel,
            recommendation_id,
        )

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientRecommendationModel]:
        stmt = (
            select(ClientRecommendationModel)
            .where(ClientRecommendationModel.client_id == client_id)
            .order_by(ClientRecommendationModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_active_by_client_id(
        self,
        *,
        client_id: int,
        now: datetime,
    ) -> Sequence[ClientRecommendationModel]:
        stmt = (
            select(ClientRecommendationModel)
            .where(
                ClientRecommendationModel.client_id == client_id,
                ClientRecommendationModel.status == "active",
                (
                    ClientRecommendationModel.expires_at.is_(None)
                    | (ClientRecommendationModel.expires_at > now)
                ),
            )
            .order_by(ClientRecommendationModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        recommendation: ClientRecommendationModel,
        payload: dict,
    ) -> ClientRecommendationModel:
        for key, value in payload.items():
            setattr(recommendation, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientRecommendationConflictError from exc

        await self._session.refresh(recommendation)
        return recommendation

    async def delete(self, recommendation: ClientRecommendationModel) -> None:
        await self._session.delete(recommendation)
        await self._session.commit()