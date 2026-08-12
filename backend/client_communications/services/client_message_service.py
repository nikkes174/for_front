from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from client_circout.backend.client_communications.crud import (
    ClientMessageConflictError,
    ClientMessageCrud,
)
from client_circout.backend.client_communications.models import ClientMessageModel
from client_circout.backend.client_communications.schemas import (
    ClientMessageCreateSchema,
    ClientMessageUpdateSchema,
)
from client_circout.backend.client_communications.services._utils import (
    schema_to_create_dict,
    schema_to_update_dict,
    utc_now,
)
from client_circout.backend.client_communications.services.client_message_channel_service import (
    ClientMessageChannelService,
)
from client_circout.backend.client_communications.services.client_message_consent_service import (
    ClientMessageConsentService,
)
from client_circout.backend.client_communications.services.client_message_template_service import (
    ClientMessageTemplateService,
)
from client_circout.backend.client_communications.services.exceptions import (
    ClientCommunicationConflictError,
    ClientCommunicationNotFoundError,
)


class ClientMessageService:
    def __init__(
        self,
        message_crud: ClientMessageCrud,
        channel_service: ClientMessageChannelService | None = None,
        template_service: ClientMessageTemplateService | None = None,
        consent_service: ClientMessageConsentService | None = None,
    ) -> None:
        self._message_crud = message_crud
        self._channel_service = channel_service or ClientMessageChannelService()
        self._template_service = template_service or ClientMessageTemplateService()
        self._consent_service = consent_service

    async def create_message(
        self,
        payload: ClientMessageCreateSchema,
        *,
        check_consent: bool = True,
    ) -> ClientMessageModel:
        data = schema_to_create_dict(payload)
        data["channel"] = self._channel_service.validate(data["channel"])
        data["message_type"] = self._template_service.validate(data["message_type"])

        if check_consent and self._consent_service is not None:
            await self._consent_service.ensure_can_send(
                client_id=data["client_id"],
                channel=data["channel"],
                message_type=data["message_type"],
            )

        try:
            return await self._message_crud.create(data)
        except ClientMessageConflictError as exc:
            raise ClientCommunicationConflictError from exc

    async def register_message(
        self,
        *,
        organization_id: int,
        client_id: int,
        channel: str,
        message_type: str,
        message_text: str,
        employee_id: int | None = None,
        related_visit_id: int | None = None,
        delivery_status: str = "pending",
        check_consent: bool = True,
    ) -> ClientMessageModel:
        payload = ClientMessageCreateSchema(
            organization_id=organization_id,
            client_id=client_id,
            sent_at=utc_now(),
            channel=channel,
            message_type=message_type,
            message_text=message_text,
            delivery_status=delivery_status,
            employee_id=employee_id,
            related_visit_id=related_visit_id,
        )
        return await self.create_message(payload, check_consent=check_consent)

    async def render_and_register_message(
        self,
        *,
        organization_id: int,
        client_id: int,
        channel: str,
        message_type: str,
        template: str,
        context: dict[str, Any] | None = None,
        employee_id: int | None = None,
        related_visit_id: int | None = None,
        check_consent: bool = True,
    ) -> ClientMessageModel:
        message_text = self._template_service.render_text(template, context)
        return await self.register_message(
            organization_id=organization_id,
            client_id=client_id,
            channel=channel,
            message_type=message_type,
            message_text=message_text,
            employee_id=employee_id,
            related_visit_id=related_visit_id,
            check_consent=check_consent,
        )

    async def get_message(self, message_id: int) -> ClientMessageModel:
        message = await self._message_crud.get_by_id(message_id)

        if message is None:
            raise ClientCommunicationNotFoundError("message_not_found")

        return message

    async def get_client_messages(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientMessageModel]:
        return await self._message_crud.get_by_client_id(client_id=client_id)

    async def get_messages_by_delivery_status(
        self,
        *,
        delivery_status: str,
    ) -> Sequence[ClientMessageModel]:
        return await self._message_crud.get_by_delivery_status(
            delivery_status=delivery_status,
        )

    async def update_message(
        self,
        message_id: int,
        payload: ClientMessageUpdateSchema,
    ) -> ClientMessageModel:
        message = await self.get_message(message_id)
        data = schema_to_update_dict(payload)

        if "channel" in data and data["channel"] is not None:
            data["channel"] = self._channel_service.validate(data["channel"])

        if "message_type" in data and data["message_type"] is not None:
            data["message_type"] = self._template_service.validate(data["message_type"])

        try:
            return await self._message_crud.update(message, data)
        except ClientMessageConflictError as exc:
            raise ClientCommunicationConflictError from exc

    async def set_delivery_status(
        self,
        *,
        message_id: int,
        delivery_status: str,
    ) -> ClientMessageModel:
        message = await self.get_message(message_id)

        if message.delivery_status == delivery_status:
            return message

        try:
            return await self._message_crud.update(
                message,
                {"delivery_status": delivery_status},
            )
        except ClientMessageConflictError as exc:
            raise ClientCommunicationConflictError from exc

    async def delete_message(self, message_id: int) -> None:
        message = await self.get_message(message_id)
        await self._message_crud.delete(message)
