from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_segments.models import ClientSegmentMemberModel
from client_circout.backend.clients_core.models.client import ClientModel


class SegmentQueryService:
    ACTIVE_STATUS = "active"
    ALLOWED_SORT_FIELDS = {
        "id": ClientModel.id,
        "full_name": ClientModel.full_name,
        "created_at": ClientModel.created_at,
        "updated_at": ClientModel.updated_at,
    }

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_clients(
        self,
        *,
        segment_id: int,
        organization_id: int | None = None,
        membership_status: str = ACTIVE_STATUS,
        client_status: str | None = None,
        search: str | None = None,
        sort_by: str = "id",
        sort_desc: bool = False,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientModel]:
        stmt = self._base_clients_stmt(
            segment_id=segment_id,
            organization_id=organization_id,
            membership_status=membership_status,
            client_status=client_status,
            search=search,
        )

        sort_column = self.ALLOWED_SORT_FIELDS.get(sort_by, ClientModel.id)
        stmt = stmt.order_by(sort_column.desc() if sort_desc else sort_column.asc())
        stmt = stmt.offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def list_client_ids(
        self,
        *,
        segment_id: int,
        membership_status: str = ACTIVE_STATUS,
        offset: int = 0,
        limit: int = 100,
    ) -> list[int]:
        stmt = (
            select(ClientSegmentMemberModel.client_id)
            .where(
                ClientSegmentMemberModel.segment_id == segment_id,
                ClientSegmentMemberModel.membership_status == membership_status,
            )
            .order_by(ClientSegmentMemberModel.client_id.asc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return list(result.scalars().all())

    async def count_clients(
        self,
        *,
        segment_id: int,
        organization_id: int | None = None,
        membership_status: str = ACTIVE_STATUS,
        client_status: str | None = None,
        search: str | None = None,
    ) -> int:
        clients_stmt = self._base_clients_stmt(
            segment_id=segment_id,
            organization_id=organization_id,
            membership_status=membership_status,
            client_status=client_status,
            search=search,
        ).subquery()

        stmt = select(func.count()).select_from(clients_stmt)
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    def _base_clients_stmt(
        self,
        *,
        segment_id: int,
        organization_id: int | None,
        membership_status: str,
        client_status: str | None,
        search: str | None,
    ) -> Select[tuple[ClientModel]]:
        stmt = (
            select(ClientModel)
            .join(
                ClientSegmentMemberModel,
                ClientSegmentMemberModel.client_id == ClientModel.id,
            )
            .where(
                ClientSegmentMemberModel.segment_id == segment_id,
                ClientSegmentMemberModel.membership_status == membership_status,
            )
        )

        if organization_id is not None:
            stmt = stmt.where(ClientModel.organization_id == organization_id)

        if client_status is not None:
            stmt = stmt.where(ClientModel.status == client_status)

        if search:
            like_value = f"%{search}%"
            stmt = stmt.where(
                (ClientModel.full_name.ilike(like_value))
                | (ClientModel.primary_phone.ilike(like_value))
                | (ClientModel.email.ilike(like_value)),
            )

        return stmt
