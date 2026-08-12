from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime
from typing import Literal

from sqlalchemy import Select, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_files.models import ClientFileLinkModel, ClientFileModel


ClientFileSortField = Literal["id", "created_at", "file_name", "file_category", "mime_type", "size"]
SortDirection = Literal["asc", "desc"]


@dataclass(frozen=True, slots=True)
class ClientFileFilters:
    client_id: int | None = None
    organization_id: int | None = None
    file_category: str | None = None
    mime_type: str | None = None
    uploaded_by: int | None = None
    created_from: datetime | None = None
    created_to: datetime | None = None
    related_visit_id: int | None = None
    related_procedure_id: int | None = None
    file_role: str | None = None


class ClientFileQueryService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_files(
        self,
        *,
        filters: ClientFileFilters,
        sort_by: ClientFileSortField = "created_at",
        sort_direction: SortDirection = "desc",
        offset: int = 0,
        limit: int = 100,
    ) -> list[ClientFileModel]:
        stmt = self._apply_filters(select(ClientFileModel), filters)
        stmt = self._apply_sort(stmt, sort_by=sort_by, sort_direction=sort_direction)
        stmt = stmt.offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return list(result.scalars().unique().all())

    async def list_files_with_links(
        self,
        *,
        filters: ClientFileFilters,
        sort_by: ClientFileSortField = "created_at",
        sort_direction: SortDirection = "desc",
        offset: int = 0,
        limit: int = 100,
    ) -> list[dict]:
        files = await self.list_files(
            filters=filters,
            sort_by=sort_by,
            sort_direction=sort_direction,
            offset=offset,
            limit=limit,
        )
        file_ids = [file.id for file in files]
        links_map = await self._load_links_map(file_ids)

        return [
            {
                "file": file,
                "links": links_map.get(file.id, []),
            }
            for file in files
        ]

    async def count_files(self, *, filters: ClientFileFilters) -> int:
        stmt = self._apply_filters(
            select(func.count(func.distinct(ClientFileModel.id))),
            filters,
        )
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    async def get_client_storage_size(
        self,
        *,
        client_id: int,
        organization_id: int | None = None,
    ) -> int:
        filters = ClientFileFilters(client_id=client_id, organization_id=organization_id)
        stmt = self._apply_filters(select(func.coalesce(func.sum(ClientFileModel.size), 0)), filters)
        result = await self._session.execute(stmt)
        return int(result.scalar_one())

    def _apply_filters(self, stmt: Select, filters: ClientFileFilters) -> Select:
        if self._need_link_join(filters):
            stmt = stmt.join(ClientFileLinkModel, ClientFileLinkModel.file_id == ClientFileModel.id)

        if filters.client_id is not None:
            stmt = stmt.where(ClientFileModel.client_id == filters.client_id)

        if filters.organization_id is not None:
            stmt = stmt.where(ClientFileModel.organization_id == filters.organization_id)

        if filters.file_category is not None:
            stmt = stmt.where(ClientFileModel.file_category == filters.file_category)

        if filters.mime_type is not None:
            stmt = stmt.where(ClientFileModel.mime_type == filters.mime_type)

        if filters.uploaded_by is not None:
            stmt = stmt.where(ClientFileModel.uploaded_by == filters.uploaded_by)

        if filters.created_from is not None:
            stmt = stmt.where(ClientFileModel.created_at >= filters.created_from)

        if filters.created_to is not None:
            stmt = stmt.where(ClientFileModel.created_at <= filters.created_to)

        if filters.related_visit_id is not None:
            stmt = stmt.where(ClientFileLinkModel.related_visit_id == filters.related_visit_id)

        if filters.related_procedure_id is not None:
            stmt = stmt.where(ClientFileLinkModel.related_procedure_id == filters.related_procedure_id)

        if filters.file_role is not None:
            stmt = stmt.where(ClientFileLinkModel.file_role == filters.file_role)

        return stmt

    def _apply_sort(
        self,
        stmt: Select,
        *,
        sort_by: ClientFileSortField,
        sort_direction: SortDirection,
    ) -> Select:
        column = getattr(ClientFileModel, sort_by)
        order_expr = column.asc() if sort_direction == "asc" else column.desc()
        return stmt.order_by(order_expr, ClientFileModel.id.desc())

    def _need_link_join(self, filters: ClientFileFilters) -> bool:
        return any(
            value is not None
            for value in (
                filters.related_visit_id,
                filters.related_procedure_id,
                filters.file_role,
            )
        )

    async def _load_links_map(self, file_ids: list[int]) -> dict[int, list[ClientFileLinkModel]]:
        if not file_ids:
            return {}

        stmt = (
            select(ClientFileLinkModel)
            .where(ClientFileLinkModel.file_id.in_(file_ids))
            .order_by(ClientFileLinkModel.created_at.desc())
        )
        result = await self._session.execute(stmt)

        links_map: dict[int, list[ClientFileLinkModel]] = {}
        for link in result.scalars().all():
            links_map.setdefault(link.file_id, []).append(link)

        return links_map
