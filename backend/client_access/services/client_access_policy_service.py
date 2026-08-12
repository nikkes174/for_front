from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_access.models import ClientAccessScopeModel

from ._utils import (
    AccessActor,
    AccessDecision,
    AccessTarget,
    CLIENT_ACTION_BULK,
    CLIENT_ACTION_EXPORT,
    SCOPE_ALL_CLIENTS,
    SCOPE_DENY_BULK,
    SCOPE_DENY_EXPORT,
    SCOPE_DENY_SENSITIVE_FIELDS,
    SCOPE_OWN_BRANCH,
    SCOPE_OWN_CLIENTS,
    filter_scopes_for_actor,
    filter_scopes_for_client,
    has_permission,
)


class ClientAccessPolicyService:
    def can_access_client(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        scopes: Sequence[ClientAccessScopeModel],
        permission_type: str,
    ) -> AccessDecision:
        if actor.is_admin:
            return AccessDecision(
                allowed=True,
                reason="admin_access",
                permission_type=permission_type,
                client_id=target.client_id,
            )

        actor_scopes = filter_scopes_for_actor(scopes, actor)
        client_scopes = filter_scopes_for_client(actor_scopes, target.client_id)

        if self._is_action_denied(actor_scopes, permission_type):
            return AccessDecision(
                allowed=False,
                reason="action_denied_by_policy",
                permission_type=permission_type,
                client_id=target.client_id,
            )

        if has_permission(client_scopes, permission_type):
            return AccessDecision(
                allowed=True,
                reason="direct_scope_allowed",
                permission_type=permission_type,
                client_id=target.client_id,
            )

        if has_permission(actor_scopes, SCOPE_ALL_CLIENTS):
            return AccessDecision(
                allowed=True,
                reason="all_clients_scope_allowed",
                permission_type=permission_type,
                client_id=target.client_id,
            )

        if (
            target.branch_id is not None
            and target.branch_id in actor.branch_ids
            and has_permission(actor_scopes, SCOPE_OWN_BRANCH)
        ):
            return AccessDecision(
                allowed=True,
                reason="own_branch_scope_allowed",
                permission_type=permission_type,
                client_id=target.client_id,
            )

        if (
            target.owner_employee_id is not None
            and target.owner_employee_id == actor.employee_id
            and has_permission(actor_scopes, SCOPE_OWN_CLIENTS)
        ):
            return AccessDecision(
                allowed=True,
                reason="own_client_scope_allowed",
                permission_type=permission_type,
                client_id=target.client_id,
            )

        return AccessDecision(
            allowed=False,
            reason="no_matching_access_scope",
            permission_type=permission_type,
            client_id=target.client_id,
        )

    def can_access_sensitive_fields(
        self,
        *,
        actor: AccessActor,
        scopes: Sequence[ClientAccessScopeModel],
    ) -> bool:
        if actor.is_admin:
            return True

        actor_scopes = filter_scopes_for_actor(scopes, actor)

        return not has_permission(actor_scopes, SCOPE_DENY_SENSITIVE_FIELDS)

    def _is_action_denied(
        self,
        scopes: Sequence[ClientAccessScopeModel],
        permission_type: str,
    ) -> bool:
        if permission_type == CLIENT_ACTION_BULK and has_permission(scopes, SCOPE_DENY_BULK):
            return True

        if permission_type == CLIENT_ACTION_EXPORT and has_permission(scopes, SCOPE_DENY_EXPORT):
            return True

        return False

