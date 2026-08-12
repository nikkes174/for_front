from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_access.crud import ClientAccessScopeCrud
from client_circout.backend.client_access.models import ClientAccessScopeModel

from ._utils import AccessActor, AccessDecision, AccessTarget
from .client_access_policy_service import ClientAccessPolicyService
from .exceptions import ClientAccessDeniedError


class ClientAccessService:
    def __init__(
        self,
        scope_crud: ClientAccessScopeCrud,
        policy_service: ClientAccessPolicyService | None = None,
    ) -> None:
        self._scope_crud = scope_crud
        self._policy_service = policy_service or ClientAccessPolicyService()

    async def check_access(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        permission_type: str,
    ) -> AccessDecision:
        scopes = await self._load_scopes(actor=actor, target_client_id=target.client_id)

        return self._policy_service.can_access_client(
            actor=actor,
            target=target,
            scopes=scopes,
            permission_type=permission_type,
        )

    async def require_access(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        permission_type: str,
    ) -> None:
        decision = await self.check_access(
            actor=actor,
            target=target,
            permission_type=permission_type,
        )

        if not decision.allowed:
            raise ClientAccessDeniedError(decision.reason)

    async def can_view_client(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
    ) -> bool:
        decision = await self.check_access(
            actor=actor,
            target=target,
            permission_type="client:view",
        )
        return decision.allowed

    async def can_edit_client(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
    ) -> bool:
        decision = await self.check_access(
            actor=actor,
            target=target,
            permission_type="client:edit",
        )
        return decision.allowed

    async def can_archive_client(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
    ) -> bool:
        decision = await self.check_access(
            actor=actor,
            target=target,
            permission_type="client:archive",
        )
        return decision.allowed

    async def can_export_clients(
        self,
        *,
        actor: AccessActor,
    ) -> bool:
        decision = await self.check_access(
            actor=actor,
            target=AccessTarget(client_id=0),
            permission_type="client:export",
        )
        return decision.allowed

    async def can_merge_clients(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
    ) -> bool:
        decision = await self.check_access(
            actor=actor,
            target=target,
            permission_type="client:merge",
        )
        return decision.allowed

    async def _load_scopes(
        self,
        *,
        actor: AccessActor,
        target_client_id: int,
    ) -> Sequence[ClientAccessScopeModel]:
        scopes: list[ClientAccessScopeModel] = []

        scopes.extend(await self._scope_crud.get_by_client_id(client_id=target_client_id))

        if target_client_id != 0:
            scopes.extend(await self._scope_crud.get_by_client_id(client_id=0))

        if actor.employee_id is not None:
            scopes.extend(
                await self._scope_crud.get_by_employee_id(employee_id=actor.employee_id),
            )

        for role_id in actor.role_ids:
            scopes.extend(await self._scope_crud.get_by_role_id(role_id=role_id))

        return self._deduplicate_scopes(scopes)

    def _deduplicate_scopes(
        self,
        scopes: Sequence[ClientAccessScopeModel],
    ) -> list[ClientAccessScopeModel]:
        unique: dict[int, ClientAccessScopeModel] = {}

        for scope in scopes:
            unique[scope.id] = scope

        return list(unique.values())

