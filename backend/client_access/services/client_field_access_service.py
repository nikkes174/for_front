from __future__ import annotations

from collections.abc import Iterable, Sequence
from typing import Any

from client_circout.backend.client_access.crud import ClientAccessScopeCrud

from ._utils import (
    AccessActor,
    AccessDecision,
    AccessTarget,
    FIELD_ACTION_EDIT,
    FIELD_ACTION_VIEW,
    SENSITIVE_FIELDS,
    normalize_field_name,
)
from .client_access_policy_service import ClientAccessPolicyService
from .client_access_service import ClientAccessService
from .exceptions import ClientAccessDeniedError, ClientAccessInvalidFieldError


class ClientFieldAccessService:
    def __init__(
        self,
        scope_crud: ClientAccessScopeCrud,
        access_service: ClientAccessService | None = None,
        policy_service: ClientAccessPolicyService | None = None,
    ) -> None:
        self._scope_crud = scope_crud
        self._access_service = access_service or ClientAccessService(scope_crud)
        self._policy_service = policy_service or ClientAccessPolicyService()

    async def can_view_field(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        field_name: str,
    ) -> AccessDecision:
        return await self._check_field_access(
            actor=actor,
            target=target,
            field_name=field_name,
            field_action=FIELD_ACTION_VIEW,
            base_permission="client:view",
        )

    async def can_edit_field(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        field_name: str,
    ) -> AccessDecision:
        return await self._check_field_access(
            actor=actor,
            target=target,
            field_name=field_name,
            field_action=FIELD_ACTION_EDIT,
            base_permission="client:edit",
        )

    async def require_view_field(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        field_name: str,
    ) -> None:
        decision = await self.can_view_field(
            actor=actor,
            target=target,
            field_name=field_name,
        )

        if not decision.allowed:
            raise ClientAccessDeniedError(decision.reason)

    async def filter_readable_fields(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        filtered: dict[str, Any] = {}

        for field_name, value in payload.items():
            decision = await self.can_view_field(
                actor=actor,
                target=target,
                field_name=field_name,
            )

            if decision.allowed:
                filtered[field_name] = value

        return filtered

    async def filter_writable_fields(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        payload: dict[str, Any],
    ) -> dict[str, Any]:
        filtered: dict[str, Any] = {}

        for field_name, value in payload.items():
            decision = await self.can_edit_field(
                actor=actor,
                target=target,
                field_name=field_name,
            )

            if decision.allowed:
                filtered[field_name] = value

        return filtered

    async def _check_field_access(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        field_name: str,
        field_action: str,
        base_permission: str,
    ) -> AccessDecision:
        normalized_field = normalize_field_name(field_name)

        if not normalized_field:
            raise ClientAccessInvalidFieldError

        base_decision = await self._access_service.check_access(
            actor=actor,
            target=target,
            permission_type=base_permission,
        )

        if not base_decision.allowed:
            return AccessDecision(
                allowed=False,
                reason=base_decision.reason,
                permission_type=field_action,
                client_id=target.client_id,
                field_name=normalized_field,
            )

        if normalized_field not in SENSITIVE_FIELDS:
            return AccessDecision(
                allowed=True,
                reason="non_sensitive_field_allowed",
                permission_type=field_action,
                client_id=target.client_id,
                field_name=normalized_field,
            )

        scopes = await self._access_service._load_scopes(
            actor=actor,
            target_client_id=target.client_id,
        )

        if self._policy_service.can_access_sensitive_fields(
            actor=actor,
            scopes=scopes,
        ):
            return AccessDecision(
                allowed=True,
                reason="sensitive_field_allowed",
                permission_type=field_action,
                client_id=target.client_id,
                field_name=normalized_field,
            )

        return AccessDecision(
            allowed=False,
            reason="sensitive_field_denied",
            permission_type=field_action,
            client_id=target.client_id,
            field_name=normalized_field,
        )

