from __future__ import annotations

from collections.abc import Sequence
from typing import Any

from client_circout.backend.client_segments.crud import ClientSegmentCrud
from client_circout.backend.client_segments.models import ClientSegmentModel
from client_circout.backend.client_segments.schemas import ClientSegmentCreateSchema, ClientSegmentUpdateSchema
from client_circout.backend.client_segments.service._utils import to_payload, utcnow
from client_circout.backend.client_segments.service.exceptions import SegmentNotFoundError
from client_circout.backend.client_segments.service.segment_rules_service import SegmentRulesService


class SegmentService:
    ACTIVE_STATUS = "active"
    ARCHIVED_STATUS = "archived"

    def __init__(
        self,
        segment_crud: ClientSegmentCrud,
        rules_service: SegmentRulesService | None = None,
    ) -> None:
        self._segment_crud = segment_crud
        self._rules_service = rules_service or SegmentRulesService()

    async def create(
        self,
        payload: ClientSegmentCreateSchema | dict[str, Any],
    ) -> ClientSegmentModel:
        data = to_payload(payload)
        data["created_at"] = data.get("created_at") or utcnow()
        data["status"] = data.get("status") or self.ACTIVE_STATUS

        if data.get("rules_json") is not None:
            data["rules_json"] = self._rules_service.validate_rules(data["rules_json"])

        return await self._segment_crud.create(data)

    async def get(self, segment_id: int) -> ClientSegmentModel:
        segment = await self._segment_crud.get_by_id(segment_id)
        if segment is None:
            raise SegmentNotFoundError(f"Segment {segment_id} not found")
        return segment

    async def list(
        self,
        *,
        organization_id: int | None = None,
        status: str | None = None,
        is_dynamic: bool | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientSegmentModel]:
        return await self._segment_crud.list(
            organization_id=organization_id,
            status=status,
            is_dynamic=is_dynamic,
            offset=offset,
            limit=limit,
        )

    async def update(
        self,
        segment_id: int,
        payload: ClientSegmentUpdateSchema | dict[str, Any],
    ) -> ClientSegmentModel:
        segment = await self.get(segment_id)
        data = to_payload(payload, exclude_unset=True)

        if "rules_json" in data and data["rules_json"] is not None:
            data["rules_json"] = self._rules_service.validate_rules(data["rules_json"])

        data["updated_at"] = utcnow()
        return await self._segment_crud.update(segment, data)

    async def archive(self, segment_id: int) -> ClientSegmentModel:
        segment = await self.get(segment_id)
        return await self._segment_crud.update(
            segment,
            {
                "status": self.ARCHIVED_STATUS,
                "updated_at": utcnow(),
            },
        )

    async def restore(self, segment_id: int) -> ClientSegmentModel:
        segment = await self.get(segment_id)
        return await self._segment_crud.update(
            segment,
            {
                "status": self.ACTIVE_STATUS,
                "updated_at": utcnow(),
            },
        )

    async def delete(self, segment_id: int) -> None:
        segment = await self.get(segment_id)
        await self._segment_crud.delete(segment)
