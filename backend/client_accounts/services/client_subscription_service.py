from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from client_circout.backend.client_accounts.crud.subscriptions import ClientSubscriptionConflictError, ClientSubscriptionCrud
from client_circout.backend.client_accounts.models.subscriptions import ClientSubscriptionModel
from client_circout.backend.client_accounts.schemas.subscriptions import ClientSubscriptionCreateSchema, ClientSubscriptionUpdateSchema
from client_circout.backend.client_accounts.services._utils import ACTIVE_STATUS, ARCHIVED_STATUS, schema_to_dict
from client_circout.backend.client_accounts.services.exceptions import ClientAccountNotFoundError, ClientAccountReadOnlyError, ClientAccountSyncError


class ClientSubscriptionService:
    def __init__(self, subscription_crud: ClientSubscriptionCrud) -> None:
        self._subscription_crud = subscription_crud

    async def create_projection(
        self,
        payload: ClientSubscriptionCreateSchema | dict[str, Any],
    ) -> ClientSubscriptionModel:
        try:
            return await self._subscription_crud.create(schema_to_dict(payload))
        except ClientSubscriptionConflictError as exc:
            raise ClientAccountSyncError("Subscription projection conflict.") from exc

    async def get(self, client_subscription_id: int) -> ClientSubscriptionModel:
        subscription = await self._subscription_crud.get_by_id(client_subscription_id)
        if subscription is None:
            raise ClientAccountNotFoundError("Subscription not found.")
        return subscription

    async def list_by_client(
        self,
        *,
        client_id: int,
        active_only: bool = False,
    ) -> Sequence[ClientSubscriptionModel]:
        if active_only:
            return await self._subscription_crud.get_active_by_client_id(client_id=client_id)
        return await self._subscription_crud.get_by_client_id(client_id=client_id)

    async def get_active_total_visits_left(self, *, client_id: int) -> int:
        subscriptions = await self._subscription_crud.get_active_by_client_id(client_id=client_id)
        return sum(subscription.visits_left for subscription in subscriptions)

    async def refresh_projection(
        self,
        *,
        client_subscription_id: int,
        payload: ClientSubscriptionUpdateSchema | dict[str, Any],
    ) -> ClientSubscriptionModel:
        subscription = await self.get(client_subscription_id)
        data = schema_to_dict(payload)
        if not data:
            return subscription

        try:
            return await self._subscription_crud.update(subscription, data)
        except ClientSubscriptionConflictError as exc:
            raise ClientAccountSyncError("Subscription projection update conflict.") from exc

    async def archive_projection(self, client_subscription_id: int) -> ClientSubscriptionModel:
        subscription = await self.get(client_subscription_id)
        if subscription.status == ARCHIVED_STATUS:
            return subscription
        return await self.refresh_projection(
            client_subscription_id=client_subscription_id,
            payload={"status": ARCHIVED_STATUS},
        )

    async def delete_projection(self, client_subscription_id: int) -> None:
        subscription = await self.get(client_subscription_id)
        try:
            await self._subscription_crud.delete(subscription)
        except ClientSubscriptionConflictError as exc:
            raise ClientAccountSyncError("Subscription projection delete conflict.") from exc

    async def is_active(self, client_subscription_id: int) -> bool:
        subscription = await self.get(client_subscription_id)
        return subscription.status == ACTIVE_STATUS

    async def write_off_visit(self, *_: Any, **__: Any) -> None:
        raise ClientAccountReadOnlyError(
            "Subscription visits are owned by subscription service. Use projection sync only.",
        )

