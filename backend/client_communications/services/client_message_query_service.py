from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime
from typing import Any

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_communications.models import (
    ClientMessageDeliveryLogModel,
    ClientMessageModel,
)
from client_circout.backend.client_communications.services._utils import normalize_pagination


class ClientMessageQueryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    def _base_stmt(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        channel: str | None = None,
        message_type: str | None = None,
        delivery_status: str | None = None,
        employee_id: int | None = None,
        related_visit_id: int | None = None,
    ):
        stmt = select(ClientMessageModel)

        if organization_id is not None:
            stmt = stmt.where(ClientMessageModel.organization_id == organization_id)

        if client_id is not None:
            stmt = stmt.where(ClientMessageModel.client_id == client_id)

        if date_from is not None:
            stmt = stmt.where(ClientMessageModel.sent_at >= date_from)

        if date_to is not None:
            stmt = stmt.where(ClientMessageModel.sent_at <= date_to)

        if channel is not None:
            stmt = stmt.where(ClientMessageModel.channel == channel)

        if message_type is not None:
            stmt = stmt.where(ClientMessageModel.message_type == message_type)

        if delivery_status is not None:
            stmt = stmt.where(ClientMessageModel.delivery_status == delivery_status)

        if employee_id is not None:
            stmt = stmt.where(ClientMessageModel.employee_id == employee_id)

        if related_visit_id is not None:
            stmt = stmt.where(ClientMessageModel.related_visit_id == related_visit_id)

        return stmt

    async def list_messages(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        channel: str | None = None,
        message_type: str | None = None,
        delivery_status: str | None = None,
        employee_id: int | None = None,
        related_visit_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
        sort_desc: bool = True,
    ) -> Sequence[ClientMessageModel]:
        offset, limit = normalize_pagination(offset, limit)
        stmt = self._base_stmt(
            organization_id=organization_id,
            client_id=client_id,
            date_from=date_from,
            date_to=date_to,
            channel=channel,
            message_type=message_type,
            delivery_status=delivery_status,
            employee_id=employee_id,
            related_visit_id=related_visit_id,
        )

        order_column = ClientMessageModel.sent_at.desc() if sort_desc else ClientMessageModel.sent_at.asc()
        stmt = stmt.order_by(order_column).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def count_messages(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        channel: str | None = None,
        message_type: str | None = None,
        delivery_status: str | None = None,
        employee_id: int | None = None,
        related_visit_id: int | None = None,
    ) -> int:
        subquery = self._base_stmt(
            organization_id=organization_id,
            client_id=client_id,
            date_from=date_from,
            date_to=date_to,
            channel=channel,
            message_type=message_type,
            delivery_status=delivery_status,
            employee_id=employee_id,
            related_visit_id=related_visit_id,
        ).subquery()

        result = await self._session.execute(select(func.count()).select_from(subquery))
        return int(result.scalar_one())

    async def list_messages_with_delivery_logs(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        date_from: datetime | None = None,
        date_to: datetime | None = None,
        channel: str | None = None,
        message_type: str | None = None,
        delivery_status: str | None = None,
        employee_id: int | None = None,
        related_visit_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> list[dict[str, Any]]:
        messages = await self.list_messages(
            organization_id=organization_id,
            client_id=client_id,
            date_from=date_from,
            date_to=date_to,
            channel=channel,
            message_type=message_type,
            delivery_status=delivery_status,
            employee_id=employee_id,
            related_visit_id=related_visit_id,
            offset=offset,
            limit=limit,
        )

        if not messages:
            return []

        message_ids = [message.id for message in messages]

        logs_result = await self._session.execute(
            select(ClientMessageDeliveryLogModel)
            .where(ClientMessageDeliveryLogModel.message_id.in_(message_ids))
            .order_by(ClientMessageDeliveryLogModel.status_at.desc()),
        )
        logs = logs_result.scalars().all()

        logs_by_message_id: dict[int, list[ClientMessageDeliveryLogModel]] = {}

        for log in logs:
            logs_by_message_id.setdefault(log.message_id, []).append(log)

        return [
            {
                "message": message,
                "delivery_logs": logs_by_message_id.get(message.id, []),
            }
            for message in messages
        ]
