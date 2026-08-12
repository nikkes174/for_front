from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_access.crud import (
    ClientAccessScopeConflictError,
    ClientAccessScopeCrud,
)
from client_circout.backend.client_access.models import ClientAccessScopeModel
from client_circout.backend.client_access.schemas import (
    ClientAccessScopeCreateSchema,
    ClientAccessScopeUpdateSchema,
)

from ._utils import (
    ALLOWED_SCOPE_PERMISSIONS,
    compact_none,
    dump_schema,
    normalize_permission,
)
from .exceptions import (
    ClientAccessInvalidPermissionError,
    ClientAccessScopeConflictServiceError,
    ClientAccessScopeNotFoundError,
)


class ClientAccessScopeService:
    def __init__(self, scope_crud: ClientAccessScopeCrud) -> None:
        self._scope_crud = scope_crud

    async def create_scope(
        self,
        payload: ClientAccessScopeCreateSchema,
    ) -> ClientAccessScopeModel:
        data = dump_schema(payload)
        data["permission_type"] = self._validate_permission(data["permission_type"])

        try:
            return await self._scope_crud.create(data)
        except ClientAccessScopeConflictError as exc:
            raise ClientAccessScopeConflictServiceError from exc

    async def get_scope(self, scope_id: int) -> ClientAccessScopeModel:
        scope = await self._scope_crud.get_by_id(scope_id)

        if scope is None:
            raise ClientAccessScopeNotFoundError

        return scope

    async def list_client_scopes(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientAccessScopeModel]:
        return await self._scope_crud.get_by_client_id(client_id=client_id)

    async def list_employee_scopes(
        self,
        *,
        employee_id: int,
    ) -> Sequence[ClientAccessScopeModel]:
        return await self._scope_crud.get_by_employee_id(employee_id=employee_id)

    async def list_role_scopes(
        self,
        *,
        role_id: int,
    ) -> Sequence[ClientAccessScopeModel]:
        return await self._scope_crud.get_by_role_id(role_id=role_id)

    async def update_scope(
        self,
        *,
        scope_id: int,
        payload: ClientAccessScopeUpdateSchema,
    ) -> ClientAccessScopeModel:
        scope = await self.get_scope(scope_id)
        data = compact_none(dump_schema(payload))

        if "permission_type" in data:
            data["permission_type"] = self._validate_permission(data["permission_type"])

        if not data:
            return scope

        try:
            return await self._scope_crud.update(scope, data)
        except ClientAccessScopeConflictError as exc:
            raise ClientAccessScopeConflictServiceError from exc

    async def revoke_scope(self, scope_id: int) -> None:
        scope = await self.get_scope(scope_id)
        await self._scope_crud.delete(scope)

    async def replace_employee_client_scopes(
        self,
        *,
        client_id: int,
        employee_id: int,
        permission_types: Sequence[str],
    ) -> list[ClientAccessScopeModel]:
        current_scopes = await self._scope_crud.get_by_client_id(client_id=client_id)

        for scope in current_scopes:
            if scope.employee_id == employee_id:
                await self._scope_crud.delete(scope)

        created_scopes: list[ClientAccessScopeModel] = []

        for permission_type in permission_types:
            created_scopes.append(
                await self.create_scope(
                    ClientAccessScopeCreateSchema(
                        client_id=client_id,
                        employee_id=employee_id,
                        permission_type=permission_type,
                    ),
                ),
            )

        return created_scopes

    async def grant_employee_permission(
        self,
        *,
        client_id: int,
        employee_id: int,
        permission_type: str,
        branch_id: int | None = None,
    ) -> ClientAccessScopeModel:
        return await self.create_scope(
            ClientAccessScopeCreateSchema(
                client_id=client_id,
                employee_id=employee_id,
                branch_id=branch_id,
                permission_type=permission_type,
            ),
        )

    async def grant_role_permission(
        self,
        *,
        client_id: int,
        role_id: int,
        permission_type: str,
        branch_id: int | None = None,
    ) -> ClientAccessScopeModel:
        return await self.create_scope(
            ClientAccessScopeCreateSchema(
                client_id=client_id,
                role_id=role_id,
                branch_id=branch_id,
                permission_type=permission_type,
            ),
        )

    def _validate_permission(self, permission_type: str) -> str:
        normalized = normalize_permission(permission_type)

        if normalized not in ALLOWED_SCOPE_PERMISSIONS:
            raise ClientAccessInvalidPermissionError

        return normalized

