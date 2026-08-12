from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from typing import Any

from client_circout.backend.client_communications.crud import (
    ClientMessageDeliveryLogConflictError,
    ClientMessageDeliveryLogCrud,
)
from client_circout.backend.client_communications.models import ClientMessageDeliveryLogModel
from client_circout.backend.client_communications.schemas import (
    ClientMessageDeliveryLogCreateSchema,
    ClientMessageDeliveryLogUpdateSchema,
)
from client_circout.backend.client_communications.services._utils import (
    schema_to_create_dict,
    schema_to_update_dict,
    utc_now,
)
from client_circout.backend.client_communications.services.client_message_service import (
    ClientMessageService,
)
from client_circout.backend.client_communications.services.exceptions import (
    ClientCommunicationConflictError,
    ClientCommunicationNotFoundError,
)


class ClientMessageDeliveryService:
    FINAL_STATUSES: frozenset[str] = frozenset(
        {
            "delivered",
            "failed",
            "cancelled",
            "rejected",
        },
    )

    def __init__(
        self,
        delivery_log_crud: ClientMessageDeliveryLogCrud,
        message_service: ClientMessageService,
    ) -> None:
        self._delivery_log_crud = delivery_log_crud
        self._message_service = message_service

    async def create_log(
        self,
        payload: ClientMessageDeliveryLogCreateSchema,
        *,
        update_message_status: bool = True,
    ) -> ClientMessageDeliveryLogModel:
        await self._message_service.get_message(payload.message_id)

        try:
            log = await self._delivery_log_crud.create(schema_to_create_dict(payload))
        except ClientMessageDeliveryLogConflictError as exc:
            raise ClientCommunicationConflictError from exc

        if update_message_status:
            await self._message_service.set_delivery_status(
                message_id=payload.message_id,
                delivery_status=payload.status,
            )

        return log

    async def register_status(
        self,
        *,
        message_id: int,
        provider_name: str,
        status: str,
        provider_message_id: str | None = None,
        status_at: datetime | None = None,
        error_text: str | None = None,
        payload_json: dict[str, Any] | None = None,
    ) -> ClientMessageDeliveryLogModel:
        if provider_message_id is not None:
            existing = await self._delivery_log_crud.get_by_provider_message_id(
                provider_message_id=provider_message_id,
            )

            if existing is not None:
                return await self.update_log_idempotent(
                    log_id=existing.id,
                    payload=ClientMessageDeliveryLogUpdateSchema(
                        provider_name=provider_name,
                        provider_message_id=provider_message_id,
                        status=status,
                        status_at=status_at or utc_now(),
                        error_text=error_text,
                        payload_json=payload_json,
                    ),
                    update_message_status=True,
                )

        return await self.create_log(
            ClientMessageDeliveryLogCreateSchema(
                message_id=message_id,
                provider_name=provider_name,
                provider_message_id=provider_message_id,
                status=status,
                status_at=status_at or utc_now(),
                error_text=error_text,
                payload_json=payload_json,
            ),
            update_message_status=True,
        )

    async def get_log(self, log_id: int) -> ClientMessageDeliveryLogModel:
        log = await self._delivery_log_crud.get_by_id(log_id)

        if log is None:
            raise ClientCommunicationNotFoundError("delivery_log_not_found")

        return log

    async def get_logs_by_message(
        self,
        *,
        message_id: int,
    ) -> Sequence[ClientMessageDeliveryLogModel]:
        return await self._delivery_log_crud.get_by_message_id(message_id=message_id)

    async def get_by_provider_message_id(
        self,
        *,
        provider_message_id: str,
    ) -> ClientMessageDeliveryLogModel:
        log = await self._delivery_log_crud.get_by_provider_message_id(
            provider_message_id=provider_message_id,
        )

        if log is None:
            raise ClientCommunicationNotFoundError("delivery_log_not_found")

        return log

    async def update_log_idempotent(
        self,
        *,
        log_id: int,
        payload: ClientMessageDeliveryLogUpdateSchema,
        update_message_status: bool = True,
    ) -> ClientMessageDeliveryLogModel:
        log = await self.get_log(log_id)
        data = schema_to_update_dict(payload)

        if not data:
            return log

        has_changes = any(getattr(log, key) != value for key, value in data.items())

        if not has_changes:
            if update_message_status and payload.status is not None:
                await self._message_service.set_delivery_status(
                    message_id=log.message_id,
                    delivery_status=payload.status,
                )
            return log

        try:
            updated = await self._delivery_log_crud.update(log, data)
        except ClientMessageDeliveryLogConflictError as exc:
            raise ClientCommunicationConflictError from exc

        if update_message_status and updated.status:
            await self._message_service.set_delivery_status(
                message_id=updated.message_id,
                delivery_status=updated.status,
            )

        return updated

    async def delete_log(self, log_id: int) -> None:
        log = await self.get_log(log_id)
        await self._delivery_log_crud.delete(log)
