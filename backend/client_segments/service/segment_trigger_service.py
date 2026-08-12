from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Literal

from client_circout.backend.client_segments.service.segment_recalculation_service import SegmentRecalculationService, \
    SegmentRecalculationResult
from client_circout.backend.client_segments.service.segment_rules_service import SegmentRuleDataProvider

SegmentEventType = Literal[
    "client_created",
    "client_updated",
    "client_category_changed",
    "visit_created",
    "visit_cancelled",
    "check_changed",
    "certificate_changed",
    "employee_changed",
    "birthday_window_changed",
]


@dataclass(slots=True, frozen=True)
class SegmentTriggerEvent:
    event_type: SegmentEventType
    organization_id: int
    client_id: int | None = None
    payload: dict[str, Any] | None = None


class SegmentTriggerService:
    def __init__(self, recalculation_service: SegmentRecalculationService) -> None:
        self._recalculation_service = recalculation_service

    async def handle_event(
        self,
        event: SegmentTriggerEvent,
        *,
        context: SegmentRuleDataProvider | None = None,
    ) -> list[SegmentRecalculationResult]:
        return await self._recalculation_service.recalculate_dynamic_segments(
            organization_id=event.organization_id,
            context=context,
        )

    async def on_client_created(
        self,
        *,
        organization_id: int,
        client_id: int,
        context: SegmentRuleDataProvider | None = None,
    ) -> list[SegmentRecalculationResult]:
        return await self.handle_event(
            SegmentTriggerEvent(
                event_type="client_created",
                organization_id=organization_id,
                client_id=client_id,
            ),
            context=context,
        )

    async def on_client_updated(
        self,
        *,
        organization_id: int,
        client_id: int,
        context: SegmentRuleDataProvider | None = None,
    ) -> list[SegmentRecalculationResult]:
        return await self.handle_event(
            SegmentTriggerEvent(
                event_type="client_updated",
                organization_id=organization_id,
                client_id=client_id,
            ),
            context=context,
        )

    async def on_visit_changed(
        self,
        *,
        organization_id: int,
        client_id: int,
        is_cancelled: bool = False,
        context: SegmentRuleDataProvider | None = None,
    ) -> list[SegmentRecalculationResult]:
        return await self.handle_event(
            SegmentTriggerEvent(
                event_type="visit_cancelled" if is_cancelled else "visit_created",
                organization_id=organization_id,
                client_id=client_id,
            ),
            context=context,
        )

    async def on_certificate_changed(
        self,
        *,
        organization_id: int,
        client_id: int,
        context: SegmentRuleDataProvider | None = None,
    ) -> list[SegmentRecalculationResult]:
        return await self.handle_event(
            SegmentTriggerEvent(
                event_type="certificate_changed",
                organization_id=organization_id,
                client_id=client_id,
            ),
            context=context,
        )
