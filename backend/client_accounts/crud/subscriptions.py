from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_accounts.models.subscriptions import ClientSubscriptionModel


class ClientSubscriptionConflictError(Exception):
    pass


class ClientSubscriptionCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientSubscriptionModel:
        subscription = ClientSubscriptionModel(**payload)
        self._session.add(subscription)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientSubscriptionConflictError from exc

        await self._session.refresh(subscription)
        return subscription

    async def get_by_id(
        self,
        client_subscription_id: int,
    ) -> ClientSubscriptionModel | None:
        return await self._session.get(
            ClientSubscriptionModel,
            client_subscription_id,
        )

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientSubscriptionModel]:
        stmt = (
            select(ClientSubscriptionModel)
            .where(ClientSubscriptionModel.client_id == client_id)
            .order_by(ClientSubscriptionModel.issued_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_active_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientSubscriptionModel]:
        stmt = (
            select(ClientSubscriptionModel)
            .where(
                ClientSubscriptionModel.client_id == client_id,
                ClientSubscriptionModel.status == "active",
            )
            .order_by(ClientSubscriptionModel.expires_at.asc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        subscription: ClientSubscriptionModel,
        payload: dict,
    ) -> ClientSubscriptionModel:
        for key, value in payload.items():
            setattr(subscription, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientSubscriptionConflictError from exc

        await self._session.refresh(subscription)
        return subscription

    async def update_visits_left(
        self,
        subscription: ClientSubscriptionModel,
        *,
        visits_left: int,
    ) -> ClientSubscriptionModel:
        subscription.visits_left = visits_left

        await self._session.commit()
        await self._session.refresh(subscription)

        return subscription

    async def delete(self, subscription: ClientSubscriptionModel) -> None:
        await self._session.delete(subscription)
        await self._session.commit()
