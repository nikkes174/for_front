from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_segments.crud import ClientSegmentCrud, ClientSegmentMemberCrud
from client_circout.backend.client_segments.service.external_data_provider import (
    SegmentExternalDataProvider,
)
from client_circout.backend.client_segments.service.segment_membership_service import (
    SegmentMembershipService,
)
from client_circout.backend.client_segments.service.segment_preview_service import SegmentPreviewService
from client_circout.backend.client_segments.service.segment_query_service import SegmentQueryService
from client_circout.backend.client_segments.service.segment_recalculation_service import (
    SegmentRecalculationService,
)
from client_circout.backend.client_segments.service.segment_rules_service import SegmentRulesService
from client_circout.backend.client_segments.service.segment_service import SegmentService
from client_circout.backend.client_segments.service.segment_trigger_service import SegmentTriggerService
from client_circout.backend.config import LOYLYTY_API_URL
from client_circout.backend.db.db import SessionFactory
from contracts.api.loyalty import LoyaltyApiClient


async def get_client_segments_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientSegmentsSessionDep = Annotated[
    AsyncSession,
    Depends(get_client_segments_db_session),
]


def get_client_segment_crud(
    session: ClientSegmentsSessionDep,
) -> ClientSegmentCrud:
    return ClientSegmentCrud(session)


ClientSegmentCrudDep = Annotated[
    ClientSegmentCrud,
    Depends(get_client_segment_crud),
]


def get_client_segment_member_crud(
    session: ClientSegmentsSessionDep,
) -> ClientSegmentMemberCrud:
    return ClientSegmentMemberCrud(session)


ClientSegmentMemberCrudDep = Annotated[
    ClientSegmentMemberCrud,
    Depends(get_client_segment_member_crud),
]


def get_segment_rules_service() -> SegmentRulesService:
    return SegmentRulesService()


SegmentRulesServiceDep = Annotated[
    SegmentRulesService,
    Depends(get_segment_rules_service),
]


def get_segment_service(
    segment_crud: ClientSegmentCrudDep,
    rules_service: SegmentRulesServiceDep,
) -> SegmentService:
    return SegmentService(
        segment_crud=segment_crud,
        rules_service=rules_service,
    )


SegmentServiceDep = Annotated[
    SegmentService,
    Depends(get_segment_service),
]


def get_segment_membership_service(
    member_crud: ClientSegmentMemberCrudDep,
) -> SegmentMembershipService:
    return SegmentMembershipService(member_crud)


SegmentMembershipServiceDep = Annotated[
    SegmentMembershipService,
    Depends(get_segment_membership_service),
]


def get_segment_preview_service(
    session: ClientSegmentsSessionDep,
    rules_service: SegmentRulesServiceDep,
) -> SegmentPreviewService:
    return SegmentPreviewService(
        session=session,
        rules_service=rules_service,
    )


SegmentPreviewServiceDep = Annotated[
    SegmentPreviewService,
    Depends(get_segment_preview_service),
]


def get_segment_query_service(
    session: ClientSegmentsSessionDep,
) -> SegmentQueryService:
    return SegmentQueryService(session)


SegmentQueryServiceDep = Annotated[
    SegmentQueryService,
    Depends(get_segment_query_service),
]


def get_segment_recalculation_service(
    segment_service: SegmentServiceDep,
    membership_service: SegmentMembershipServiceDep,
    preview_service: SegmentPreviewServiceDep,
) -> SegmentRecalculationService:
    return SegmentRecalculationService(
        segment_service=segment_service,
        membership_service=membership_service,
        preview_service=preview_service,
    )


SegmentRecalculationServiceDep = Annotated[
    SegmentRecalculationService,
    Depends(get_segment_recalculation_service),
]


def get_segment_trigger_service(
    recalculation_service: SegmentRecalculationServiceDep,
) -> SegmentTriggerService:
    return SegmentTriggerService(recalculation_service)


SegmentTriggerServiceDep = Annotated[
    SegmentTriggerService,
    Depends(get_segment_trigger_service),
]


def get_segment_data_provider(
    session: ClientSegmentsSessionDep,
) -> SegmentExternalDataProvider:
    return SegmentExternalDataProvider(
        session=session,
        loyalty_api=LoyaltyApiClient(LOYLYTY_API_URL),
    )


SegmentDataProviderDep = Annotated[
    SegmentExternalDataProvider,
    Depends(get_segment_data_provider),
]
