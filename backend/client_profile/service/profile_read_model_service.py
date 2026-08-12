from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from client_circout.backend.client_profile.crud.active_bookings import ClientActiveBookingCrud
from client_circout.backend.client_profile.crud.favorite_employees import ClientFavoriteEmployeeCrud
from client_circout.backend.client_profile.crud.favorite_services import ClientFavoriteServiceCrud
from client_circout.backend.client_profile.crud.profile_metrics import ClientProfileMetricCrud
from client_circout.backend.client_profile.crud.recommendations import ClientRecommendationCrud
from client_circout.backend.client_profile.models.active_bookings import ClientActiveBookingModel
from client_circout.backend.client_profile.models.favorite_employees import ClientFavoriteEmployeeModel
from client_circout.backend.client_profile.models.favorite_services import ClientFavoriteServiceModel
from client_circout.backend.client_profile.models.profile_metrics import ClientProfileMetricModel
from client_circout.backend.client_profile.models.recommendations import ClientRecommendationModel
from client_circout.backend.client_profile.service._utils import utc_now
from client_circout.backend.client_profile.service.exceptions import ProfileEntityNotFoundError
from client_circout.backend.client_profile.service.external_data_provider import ClientProfileExternalData, \
    ClientProfileExternalDataProvider, EmptyClientProfileExternalDataProvider

from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.clients_core.models.client import ClientModel


@dataclass(slots=True)
class ClientProfileReadModel:
    client: ClientModel
    metrics: ClientProfileMetricModel | None
    active_bookings: list[ClientActiveBookingModel]
    favorite_services: list[ClientFavoriteServiceModel]
    favorite_employees: list[ClientFavoriteEmployeeModel]
    recommendations: list[ClientRecommendationModel]
    external: ClientProfileExternalData

    def as_dict(self) -> dict[str, Any]:
        return {
            "client": self.client,
            "metrics": self.metrics,
            "active_bookings": self.active_bookings,
            "favorite_services": self.favorite_services,
            "favorite_employees": self.favorite_employees,
            "recommendations": self.recommendations,
            "external": self.external.as_dict(),
        }


class ClientProfileReadModelService:
    def __init__(
        self,
        *,
        client_crud: ClientCrud,
        metric_crud: ClientProfileMetricCrud,
        booking_crud: ClientActiveBookingCrud,
        favorite_service_crud: ClientFavoriteServiceCrud,
        favorite_employee_crud: ClientFavoriteEmployeeCrud,
        recommendation_crud: ClientRecommendationCrud,
        external_data_provider: ClientProfileExternalDataProvider | None = None,
    ) -> None:
        self._client_crud = client_crud
        self._metric_crud = metric_crud
        self._booking_crud = booking_crud
        self._favorite_service_crud = favorite_service_crud
        self._favorite_employee_crud = favorite_employee_crud
        self._recommendation_crud = recommendation_crud
        self._external_data_provider = (
            external_data_provider or EmptyClientProfileExternalDataProvider()
        )

    async def get_profile(
        self,
        *,
        organization_id: int,
        client_id: int,
        favorite_limit: int = 10,
    ) -> ClientProfileReadModel:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise ProfileEntityNotFoundError("client", client_id)

        if client.organization_id != organization_id:
            raise ProfileEntityNotFoundError("client", client_id)

        metrics = await self._metric_crud.get_by_client_id(client_id)
        active_bookings = await self._booking_crud.get_active_by_client_id(
            client_id=client_id,
        )
        favorite_services = await self._favorite_service_crud.list(
            client_id=client_id,
            limit=favorite_limit,
        )
        favorite_employees = await self._favorite_employee_crud.list(
            client_id=client_id,
            limit=favorite_limit,
        )
        recommendations = await self._recommendation_crud.get_active_by_client_id(
            client_id=client_id,
            now=utc_now(),
        )
        external = await self._external_data_provider.get_profile_data(
            organization_id=organization_id,
            client_id=client_id,
        )

        return ClientProfileReadModel(
            client=client,
            metrics=metrics,
            active_bookings=list(active_bookings),
            favorite_services=list(favorite_services),
            favorite_employees=list(favorite_employees),
            recommendations=list(recommendations),
            external=external,
        )
