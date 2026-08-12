from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from client_circout.backend.client_segments.models import ClientSegmentModel
from client_circout.backend.client_segments.service.exceptions import SegmentRecalculationError
from client_circout.backend.client_segments.service.segment_membership_service import SegmentMembershipService
from client_circout.backend.client_segments.service.segment_preview_service import SegmentPreviewService
from client_circout.backend.client_segments.service.segment_rules_service import SegmentRuleDataProvider
from client_circout.backend.client_segments.service.segment_service import SegmentService


@dataclass(slots=True, frozen=True)
class SegmentRecalculationResult:
    segment_id: int
    matched_total: int
    added: int
    removed: int
    active_total: int


class SegmentRecalculationService:
    def __init__(
        self,
        segment_service: SegmentService,
        membership_service: SegmentMembershipService,
        preview_service: SegmentPreviewService,
    ) -> None:
        self._segment_service = segment_service
        self._membership_service = membership_service
        self._preview_service = preview_service

    async def recalculate_segment(
        self,
        *,
        segment_id: int,
        context: SegmentRuleDataProvider | None = None,
        scan_limit: int = 50_000,
    ) -> SegmentRecalculationResult:
        segment = await self._segment_service.get(segment_id)

        if not segment.is_dynamic:
            raise SegmentRecalculationError("Only dynamic segments can be recalculated")

        preview = await self._preview_service.preview_rules(
            organization_id=segment.organization_id,
            rules_json=segment.rules_json,
            context=context,
            sample_limit=scan_limit,
            scan_limit=scan_limit,
        )

        result = await self._membership_service.replace_segment_members(
            segment_id=segment.id,
            client_ids=preview["sample_client_ids"],
        )

        return SegmentRecalculationResult(
            segment_id=segment.id,
            matched_total=preview["matched_total"],
            added=result["added"],
            removed=result["removed"],
            active_total=result["active_total"],
        )

    async def recalculate_dynamic_segments(
        self,
        *,
        organization_id: int | None = None,
        context: SegmentRuleDataProvider | None = None,
        scan_limit: int = 50_000,
    ) -> list[SegmentRecalculationResult]:
        segments = await self._segment_service.list(
            organization_id=organization_id,
            status=SegmentService.ACTIVE_STATUS,
            is_dynamic=True,
            limit=10_000,
        )

        results: list[SegmentRecalculationResult] = []
        for segment in segments:
            results.append(
                await self.recalculate_segment(
                    segment_id=segment.id,
                    context=context,
                    scan_limit=scan_limit,
                ),
            )

        return results

    async def preview_segment(
        self,
        *,
        segment: ClientSegmentModel,
        context: SegmentRuleDataProvider | None = None,
        scan_limit: int = 50_000,
    ) -> dict[str, Any]:
        return await self._preview_service.preview_rules(
            organization_id=segment.organization_id,
            rules_json=segment.rules_json,
            context=context,
            scan_limit=scan_limit,
        )
