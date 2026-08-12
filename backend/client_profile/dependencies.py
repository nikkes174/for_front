from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from contracts.api.loyalty import LoyaltyApiClient
from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_history.crud.client_check import ClientCheckCrud
from client_circout.backend.config import LOYLYTY_API_URL
from client_circout.backend.client_profile.crud.active_bookings import ClientActiveBookingCrud
from client_circout.backend.client_profile.crud.favorite_employees import ClientFavoriteEmployeeCrud
from client_circout.backend.client_profile.crud.favorite_services import ClientFavoriteServiceCrud
from client_circout.backend.client_profile.crud.profile_metrics import (
    ClientMetricSnapshotCrud,
    ClientProfileMetricCrud,
)
from client_circout.backend.client_profile.crud.recommendations import ClientRecommendationCrud
from client_circout.backend.client_profile.service.active_booking_service import (
    ClientActiveBookingService,
)
from client_circout.backend.client_profile.service.external_data_provider import (
    LoyaltyApiExternalDataProvider,
)
from client_circout.backend.client_profile.service.favorite_service import (
    ClientFavoriteEmployeeService,
    ClientFavoriteServiceService,
)
from client_circout.backend.client_profile.service.profile_metrics_service import (
    ClientProfileMetricsService,
)
from client_circout.backend.client_profile.service.profile_read_model_service import (
    ClientProfileReadModelService,
)
from client_circout.backend.client_profile.service.recommendation_service import (
    ClientRecommendationService,
)
from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.db.db import SessionFactory


async def get_client_profile_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientProfileSessionDep = Annotated[
    AsyncSession,
    Depends(get_client_profile_db_session),
]


def get_client_crud(
    session: ClientProfileSessionDep,
) -> ClientCrud:
    return ClientCrud(session)


ClientCrudDep = Annotated[
    ClientCrud,
    Depends(get_client_crud),
]


def get_client_active_booking_crud(
    session: ClientProfileSessionDep,
) -> ClientActiveBookingCrud:
    return ClientActiveBookingCrud(session)


ClientActiveBookingCrudDep = Annotated[
    ClientActiveBookingCrud,
    Depends(get_client_active_booking_crud),
]


def get_client_favorite_service_crud(
    session: ClientProfileSessionDep,
) -> ClientFavoriteServiceCrud:
    return ClientFavoriteServiceCrud(session)


ClientFavoriteServiceCrudDep = Annotated[
    ClientFavoriteServiceCrud,
    Depends(get_client_favorite_service_crud),
]


def get_client_favorite_employee_crud(
    session: ClientProfileSessionDep,
) -> ClientFavoriteEmployeeCrud:
    return ClientFavoriteEmployeeCrud(session)


ClientFavoriteEmployeeCrudDep = Annotated[
    ClientFavoriteEmployeeCrud,
    Depends(get_client_favorite_employee_crud),
]


def get_client_profile_metric_crud(
    session: ClientProfileSessionDep,
) -> ClientProfileMetricCrud:
    return ClientProfileMetricCrud(session)


ClientProfileMetricCrudDep = Annotated[
    ClientProfileMetricCrud,
    Depends(get_client_profile_metric_crud),
]


def get_client_metric_snapshot_crud(
    session: ClientProfileSessionDep,
) -> ClientMetricSnapshotCrud:
    return ClientMetricSnapshotCrud(session)


ClientMetricSnapshotCrudDep = Annotated[
    ClientMetricSnapshotCrud,
    Depends(get_client_metric_snapshot_crud),
]


def get_client_recommendation_crud(
    session: ClientProfileSessionDep,
) -> ClientRecommendationCrud:
    return ClientRecommendationCrud(session)


ClientRecommendationCrudDep = Annotated[
    ClientRecommendationCrud,
    Depends(get_client_recommendation_crud),
]


def get_client_check_crud(
    session: ClientProfileSessionDep,
) -> ClientCheckCrud:
    return ClientCheckCrud(session)


ClientCheckCrudDep = Annotated[
    ClientCheckCrud,
    Depends(get_client_check_crud),
]


def get_client_consent_crud(
    session: ClientProfileSessionDep,
) -> ClientConsentCrud:
    return ClientConsentCrud(session)


ClientConsentCrudDep = Annotated[
    ClientConsentCrud,
    Depends(get_client_consent_crud),
]


def get_client_active_booking_service(
    booking_crud: ClientActiveBookingCrudDep,
) -> ClientActiveBookingService:
    return ClientActiveBookingService(booking_crud)


ClientActiveBookingServiceDep = Annotated[
    ClientActiveBookingService,
    Depends(get_client_active_booking_service),
]


def get_client_favorite_service_service(
    favorite_service_crud: ClientFavoriteServiceCrudDep,
) -> ClientFavoriteServiceService:
    return ClientFavoriteServiceService(favorite_service_crud)


ClientFavoriteServiceServiceDep = Annotated[
    ClientFavoriteServiceService,
    Depends(get_client_favorite_service_service),
]


def get_client_favorite_employee_service(
    favorite_employee_crud: ClientFavoriteEmployeeCrudDep,
) -> ClientFavoriteEmployeeService:
    return ClientFavoriteEmployeeService(favorite_employee_crud)


ClientFavoriteEmployeeServiceDep = Annotated[
    ClientFavoriteEmployeeService,
    Depends(get_client_favorite_employee_service),
]


def get_client_profile_metrics_service(
    metric_crud: ClientProfileMetricCrudDep,
    snapshot_crud: ClientMetricSnapshotCrudDep,
) -> ClientProfileMetricsService:
    return ClientProfileMetricsService(
        metric_crud=metric_crud,
        snapshot_crud=snapshot_crud,
    )


ClientProfileMetricsServiceDep = Annotated[
    ClientProfileMetricsService,
    Depends(get_client_profile_metrics_service),
]


def get_client_recommendation_service(
    recommendation_crud: ClientRecommendationCrudDep,
) -> ClientRecommendationService:
    return ClientRecommendationService(recommendation_crud)


ClientRecommendationServiceDep = Annotated[
    ClientRecommendationService,
    Depends(get_client_recommendation_service),
]


def get_client_profile_read_model_service(
    client_crud: ClientCrudDep,
    metric_crud: ClientProfileMetricCrudDep,
    booking_crud: ClientActiveBookingCrudDep,
    favorite_service_crud: ClientFavoriteServiceCrudDep,
    favorite_employee_crud: ClientFavoriteEmployeeCrudDep,
    recommendation_crud: ClientRecommendationCrudDep,
    check_crud: ClientCheckCrudDep,
    consent_crud: ClientConsentCrudDep,
) -> ClientProfileReadModelService:
    return ClientProfileReadModelService(
        client_crud=client_crud,
        metric_crud=metric_crud,
        booking_crud=booking_crud,
        favorite_service_crud=favorite_service_crud,
        favorite_employee_crud=favorite_employee_crud,
        recommendation_crud=recommendation_crud,
        external_data_provider=LoyaltyApiExternalDataProvider(
            loyalty_api=LoyaltyApiClient(LOYLYTY_API_URL),
            check_crud=check_crud,
            consent_crud=consent_crud,
        ),
    )


ClientProfileReadModelServiceDep = Annotated[
    ClientProfileReadModelService,
    Depends(get_client_profile_read_model_service),
]
