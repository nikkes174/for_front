from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from client_circout.backend.client_profile.crud.favorite_employees import (
    ClientFavoriteEmployeeConflictError,
    ClientFavoriteEmployeeCrud,
)
from client_circout.backend.client_profile.crud.favorite_services import (
    ClientFavoriteServiceConflictError,
    ClientFavoriteServiceCrud,
)
from client_circout.backend.client_profile.models.favorite_employees import ClientFavoriteEmployeeModel
from client_circout.backend.client_profile.models.favorite_services import ClientFavoriteServiceModel
from client_circout.backend.client_profile.service._utils import utc_now
from client_circout.backend.client_profile.service.exceptions import ProfileEntityNotFoundError, ProfileEntityConflictError


class ClientFavoriteServiceService:
    def __init__(self, favorite_service_crud: ClientFavoriteServiceCrud) -> None:
        self._favorite_service_crud = favorite_service_crud

    async def get(self, favorite_id: int) -> ClientFavoriteServiceModel:
        favorite = await self._favorite_service_crud.get_by_id(favorite_id)
        if favorite is None:
            raise ProfileEntityNotFoundError("client_favorite_service", favorite_id)
        return favorite

    async def list_by_client(
        self,
        *,
        client_id: int,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientFavoriteServiceModel]:
        return await self._favorite_service_crud.list(
            client_id=client_id,
            offset=offset,
            limit=limit,
        )

    async def mark_used(
        self,
        *,
        client_id: int,
        service_id: int,
        used_at: datetime | None = None,
    ) -> ClientFavoriteServiceModel:
        used_at = used_at or utc_now()
        favorite = await self._favorite_service_crud.get_by_client_and_service(
            client_id=client_id,
            service_id=service_id,
        )

        if favorite is None:
            try:
                return await self._favorite_service_crud.create(
                    {
                        "client_id": client_id,
                        "service_id": service_id,
                        "usage_count": 1,
                        "last_used_at": used_at,
                    },
                )
            except ClientFavoriteServiceConflictError as exc:
                raise ProfileEntityConflictError("favorite service create conflict") from exc

        try:
            return await self._favorite_service_crud.update(
                favorite,
                {
                    "usage_count": favorite.usage_count + 1,
                    "last_used_at": used_at,
                },
            )
        except ClientFavoriteServiceConflictError as exc:
            raise ProfileEntityConflictError("favorite service update conflict") from exc

    async def remove(self, favorite_id: int) -> None:
        favorite = await self.get(favorite_id)
        await self._favorite_service_crud.delete(favorite)


class ClientFavoriteEmployeeService:
    def __init__(self, favorite_employee_crud: ClientFavoriteEmployeeCrud) -> None:
        self._favorite_employee_crud = favorite_employee_crud

    async def get(self, favorite_id: int) -> ClientFavoriteEmployeeModel:
        favorite = await self._favorite_employee_crud.get_by_id(favorite_id)
        if favorite is None:
            raise ProfileEntityNotFoundError("client_favorite_employee", favorite_id)
        return favorite

    async def list_by_client(
        self,
        *,
        client_id: int,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientFavoriteEmployeeModel]:
        return await self._favorite_employee_crud.list(
            client_id=client_id,
            offset=offset,
            limit=limit,
        )

    async def mark_used(
        self,
        *,
        client_id: int,
        employee_id: int,
        used_at: datetime | None = None,
    ) -> ClientFavoriteEmployeeModel:
        used_at = used_at or utc_now()
        favorite = await self._favorite_employee_crud.get_by_client_and_employee(
            client_id=client_id,
            employee_id=employee_id,
        )

        if favorite is None:
            try:
                return await self._favorite_employee_crud.create(
                    {
                        "client_id": client_id,
                        "employee_id": employee_id,
                        "usage_count": 1,
                        "last_used_at": used_at,
                    },
                )
            except ClientFavoriteEmployeeConflictError as exc:
                raise ProfileEntityConflictError("favorite employee create conflict") from exc

        try:
            return await self._favorite_employee_crud.update(
                favorite,
                {
                    "usage_count": favorite.usage_count + 1,
                    "last_used_at": used_at,
                },
            )
        except ClientFavoriteEmployeeConflictError as exc:
            raise ProfileEntityConflictError("favorite employee update conflict") from exc

    async def remove(self, favorite_id: int) -> None:
        favorite = await self.get(favorite_id)
        await self._favorite_employee_crud.delete(favorite)
