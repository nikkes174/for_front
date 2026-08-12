from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.api_dependencies import ReviewTargetsApi, get_review_targets_api
from client_circout.backend.client_access.crud import ClientAccessScopeCrud
from client_circout.backend.client_accounts.crud.certificates import ClientCertificateCrud
from client_circout.backend.client_accounts.crud.deposits import ClientDepositCrud
from client_circout.backend.client_accounts.crud.subscriptions import ClientSubscriptionCrud
from client_circout.backend.client_communications.crud import ClientMessageDeliveryLogCrud
from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_files.crud import ClientFileCrud, ClientFileLinkCrud
from client_circout.backend.client_history.crud.client_check import ClientCheckCrud
from client_circout.backend.client_history.crud.visit_products import ClientHistoryVisitProductCrud
from client_circout.backend.client_history.crud.visit_services import ClientHistoryVisitServiceCrud
from client_circout.backend.client_history.crud.visits import ClientHistoryVisitCrud
from client_circout.backend.client_profile.crud.active_bookings import ClientActiveBookingCrud
from client_circout.backend.client_profile.crud.favorite_employees import ClientFavoriteEmployeeCrud
from client_circout.backend.client_profile.crud.favorite_services import ClientFavoriteServiceCrud
from client_circout.backend.client_profile.crud.profile_metrics import ClientProfileMetricCrud, ClientMetricSnapshotCrud
from client_circout.backend.client_profile.crud.recommendations import ClientRecommendationCrud
from client_circout.backend.client_review.crud import ClientReviewCrud
from client_circout.backend.client_review.service import ClientReviewService
from client_circout.backend.client_segments.crud import ClientSegmentCrud
from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.clients_core.crud.client_additional import ClientAdditionalFieldValueCrud, ClientAdditionalFieldCrud
from client_circout.backend.clients_core.crud.client_batch import ClientImportBatchCrud, ClientExportBatchCrud
from client_circout.backend.clients_core.crud.client_branch import ClientBranchCrud
from client_circout.backend.clients_core.crud.client_categories import ClientCategoryCrud, ClientCategoryLinkCrud
from client_circout.backend.clients_core.crud.client_import_rows import ClientImportRowCrud
from client_circout.backend.clients_core.crud.client_merge_operations import ClientMergeOperationCrud
from client_circout.backend.db.db import SessionFactory


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


async def get_client_crud(
        session: AsyncSession,
) -> ClientCrud:
    return ClientCrud(session)


async def get_client_category_crud(
        session: AsyncSession,
) -> ClientCategoryCrud:
    return ClientCategoryCrud(session)


async def get_client_category_link_crud(
        session: AsyncSession,
) -> ClientCategoryLinkCrud:
    return ClientCategoryLinkCrud(session)


async def get_client_additional_field_value_crud(
        session: AsyncSession,
) -> ClientAdditionalFieldValueCrud:
    return ClientAdditionalFieldValueCrud(session)


async def get_client_additional_field_crud(
        session: AsyncSession,
) -> ClientAdditionalFieldCrud:
    return ClientAdditionalFieldCrud(session)


async def get_client_import_batch_crud(
        session: AsyncSession,
) -> ClientImportBatchCrud:
    return ClientImportBatchCrud(session)


async def get_client_branch_crud(
        session: AsyncSession,
) -> ClientBranchCrud:
    return ClientBranchCrud(session)


async def get_client_export_batch_crud(
        session: AsyncSession,
) -> ClientExportBatchCrud:
    return ClientExportBatchCrud(session)


async def get_client_merge_operation_crud(
        session: AsyncSession,
) -> ClientMergeOperationCrud:
    return ClientMergeOperationCrud(session)


async def get_client_import_row_crud(
        session: AsyncSession,
) -> ClientImportRowCrud:
    return ClientImportRowCrud(session)


async def get_client_history_visit_crud(
        session: AsyncSession,
) -> ClientHistoryVisitCrud:
    return ClientHistoryVisitCrud(session)


async def get_client_history_visit_service_crud(
        session: AsyncSession,
) -> ClientHistoryVisitServiceCrud:
    return ClientHistoryVisitServiceCrud(session)


async def get_client_history_visit_product_crud(
        session: AsyncSession,
) -> ClientHistoryVisitProductCrud:
    return ClientHistoryVisitProductCrud(session)


async def get_client_check_crud(
        session: AsyncSession,
) -> ClientCheckCrud:
    return ClientCheckCrud(session)


async def get_client_segment_crud(
        session: AsyncSession,
) -> ClientSegmentCrud:
    return ClientSegmentCrud(session)


async def get_client_profile_metric_crud(
        session: AsyncSession,
) -> ClientProfileMetricCrud:
    return ClientProfileMetricCrud(session)


async def get_client_favorite_service_crud(
        session: AsyncSession,
) -> ClientFavoriteServiceCrud:
    return ClientFavoriteServiceCrud(session)


async def get_client_favorite_employee_crud(
        session: AsyncSession,
) -> ClientFavoriteEmployeeCrud:
    return ClientFavoriteEmployeeCrud(session)


async def get_client_active_booking_crud(
        session: AsyncSession,
) -> ClientActiveBookingCrud:
    return ClientActiveBookingCrud(session)


async def get_client_recommendation_crud(
        session: AsyncSession,
) -> ClientRecommendationCrud:
    return ClientRecommendationCrud(session)


async def get_client_message_delivery_log_crud(
        session: AsyncSession,
) -> ClientMessageDeliveryLogCrud:
    return ClientMessageDeliveryLogCrud(session)


async def get_client_deposit_crud(
        session: AsyncSession,
) -> ClientDepositCrud:
    return ClientDepositCrud(session)


async def get_client_certificate_crud(
        session: AsyncSession,
) -> ClientCertificateCrud:
    return ClientCertificateCrud(session)


async def get_client_subscription_crud(
        session: AsyncSession,
) -> ClientSubscriptionCrud:
    return ClientSubscriptionCrud(session)

async def get_client_consent_crud(
    session: AsyncSession,
) -> ClientConsentCrud:
    return ClientConsentCrud(session)

async def get_client_file_crud(
    session: AsyncSession,
) -> ClientFileCrud:
    return ClientFileCrud(session)

async def get_client_file_link_crud(
    session: AsyncSession,
) -> ClientFileLinkCrud:
    return ClientFileLinkCrud(session)

async def get_client_access_scope_crud(
    session: AsyncSession,
) -> ClientAccessScopeCrud:
    return ClientAccessScopeCrud(session)

async def get_client_metric_snapshot_crud(
    session: AsyncSession,
) -> ClientMetricSnapshotCrud:
    return ClientMetricSnapshotCrud(session)


async def get_client_review_crud(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> ClientReviewCrud:
    return ClientReviewCrud(session)


async def get_client_review_service(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    review_crud: Annotated[ClientReviewCrud, Depends(get_client_review_crud)],
    targets_api: Annotated[ReviewTargetsApi, Depends(get_review_targets_api)],
) -> ClientReviewService:
    return ClientReviewService(
        review_crud=review_crud,
        client_crud=ClientCrud(session),
        targets_api=targets_api,
    )
