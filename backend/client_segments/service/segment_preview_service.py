from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_segments.service.segment_rules_service import SegmentRulesService, SegmentRuleDataProvider
from client_circout.backend.clients_core.models.client import ClientModel


class SegmentPreviewService:
    def __init__(
        self,
        session: AsyncSession,
        rules_service: SegmentRulesService | None = None,
    ) -> None:
        self._session = session
        self._rules_service = rules_service or SegmentRulesService()

    async def preview_rules(
        self,
        *,
        organization_id: int,
        rules_json: dict[str, Any] | None,
        client_status: str | None = None,
        context: SegmentRuleDataProvider | None = None,
        sample_limit: int = 50,
        scan_limit: int = 50_000,
    ) -> dict[str, Any]:
        rules = self._rules_service.validate_rules(rules_json)
        matched_ids: list[int] = []
        matched_total = 0

        stmt = (
            select(ClientModel)
            .where(ClientModel.organization_id == organization_id)
            .order_by(ClientModel.id.asc())
            .limit(scan_limit)
        )

        if client_status is not None:
            stmt = stmt.where(ClientModel.status == client_status)

        result = await self._session.stream_scalars(stmt)

        async for client in result:
            if await self._rules_service.matches_client(
                client=client,
                rules=rules,
                context=context,
            ):
                matched_total += 1
                if len(matched_ids) < sample_limit:
                    matched_ids.append(client.id)

        return {
            "matched_total": matched_total,
            "sample_client_ids": matched_ids,
            "external_rule_types": sorted(self._rules_service.collect_external_rule_types(rules)),
        }
