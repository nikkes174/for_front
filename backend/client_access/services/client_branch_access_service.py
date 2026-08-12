from __future__ import annotations

from client_circout.backend.client_access.crud import ClientAccessScopeCrud

from ._utils import AccessActor, AccessDecision, AccessTarget, SCOPE_OWN_BRANCH
from .client_access_service import ClientAccessService


class ClientBranchAccessService:
    def __init__(
        self,
        scope_crud: ClientAccessScopeCrud,
        access_service: ClientAccessService | None = None,
    ) -> None:
        self._scope_crud = scope_crud
        self._access_service = access_service or ClientAccessService(scope_crud)

    async def can_access_branch_client(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        permission_type: str,
    ) -> AccessDecision:
        if target.branch_id is None:
            return await self._access_service.check_access(
                actor=actor,
                target=target,
                permission_type=permission_type,
            )

        return await self._access_service.check_access(
            actor=actor,
            target=target,
            permission_type=permission_type,
        )

    async def has_branch_scope(
        self,
        *,
        actor: AccessActor,
        client_id: int,
        branch_id: int,
    ) -> bool:
        decision = await self._access_service.check_access(
            actor=actor,
            target=AccessTarget(client_id=client_id, branch_id=branch_id),
            permission_type=SCOPE_OWN_BRANCH,
        )

        return decision.allowed

    def is_actor_branch_allowed(
        self,
        *,
        actor: AccessActor,
        branch_id: int | None,
    ) -> bool:
        if actor.is_admin:
            return True

        if branch_id is None:
            return False

        return branch_id in actor.branch_ids

