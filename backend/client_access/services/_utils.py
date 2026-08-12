from __future__ import annotations

from collections.abc import Iterable
from dataclasses import dataclass
from typing import Any

from client_circout.backend.global_utils import dump_schema, compact_none, utcnow

ALL_CLIENTS_SCOPE_ID = 0

CLIENT_ACTION_VIEW = "client:view"
CLIENT_ACTION_EDIT = "client:edit"
CLIENT_ACTION_ARCHIVE = "client:archive"
CLIENT_ACTION_IMPORT = "client:import"
CLIENT_ACTION_EXPORT = "client:export"
CLIENT_ACTION_MERGE = "client:merge"
CLIENT_ACTION_BULK = "client:bulk"
CLIENT_ACTION_VIEW_HISTORY = "client:view_history"
CLIENT_ACTION_VIEW_ACCOUNTS = "client:view_accounts"
CLIENT_ACTION_VIEW_FILES = "client:view_files"
CLIENT_ACTION_CHANGE_CONSENTS = "client:change_consents"

FIELD_ACTION_VIEW = "field:view"
FIELD_ACTION_EDIT = "field:edit"

SCOPE_ALL_CLIENTS = "scope:clients:all"
SCOPE_OWN_BRANCH = "scope:clients:own_branch"
SCOPE_OWN_CLIENTS = "scope:clients:own"
SCOPE_DENY_BULK = "deny:client:bulk"
SCOPE_DENY_EXPORT = "deny:client:export"
SCOPE_DENY_SENSITIVE_FIELDS = "deny:client:sensitive_fields"

SENSITIVE_FIELDS = frozenset(
    {
        "primary_phone",
        "secondary_phone",
        "email",
        "comment",
        "note",
        "categories",
        "additional_fields",
        "files",
        "consents",
    },
)

ALLOWED_ACTIONS = frozenset(
    {
        CLIENT_ACTION_VIEW,
        CLIENT_ACTION_EDIT,
        CLIENT_ACTION_ARCHIVE,
        CLIENT_ACTION_IMPORT,
        CLIENT_ACTION_EXPORT,
        CLIENT_ACTION_MERGE,
        CLIENT_ACTION_BULK,
        CLIENT_ACTION_VIEW_HISTORY,
        CLIENT_ACTION_VIEW_ACCOUNTS,
        CLIENT_ACTION_VIEW_FILES,
        CLIENT_ACTION_CHANGE_CONSENTS,
    }
)

ALLOWED_FIELD_ACTIONS = frozenset({FIELD_ACTION_VIEW, FIELD_ACTION_EDIT})

ALLOWED_SCOPE_PERMISSIONS = ALLOWED_ACTIONS | {
    SCOPE_ALL_CLIENTS,
    SCOPE_OWN_BRANCH,
    SCOPE_OWN_CLIENTS,
    SCOPE_DENY_BULK,
    SCOPE_DENY_EXPORT,
    SCOPE_DENY_SENSITIVE_FIELDS,
}


@dataclass(slots=True, frozen=True)
class AccessActor:
    employee_id: int | None = None
    role_ids: tuple[int, ...] = ()
    branch_ids: tuple[int, ...] = ()
    organization_id: int | None = None
    is_admin: bool = False


@dataclass(slots=True, frozen=True)
class AccessTarget:
    client_id: int
    organization_id: int | None = None
    branch_id: int | None = None
    owner_employee_id: int | None = None


@dataclass(slots=True, frozen=True)
class AccessDecision:
    allowed: bool
    reason: str
    permission_type: str
    client_id: int | None = None
    field_name: str | None = None


@dataclass(slots=True, frozen=True)
class AccessAuditEvent:
    actor: AccessActor
    action: str
    target_client_id: int | None
    allowed: bool
    reason: str
    metadata: dict[str, Any]


def normalize_permission(permission_type: str) -> str:
    return permission_type.strip().lower()


def normalize_field_name(field_name: str) -> str:
    return field_name.strip()


def scope_matches_actor(scope: Any, actor: AccessActor) -> bool:
    if actor.is_admin:
        return True

    if scope.employee_id is not None and scope.employee_id == actor.employee_id:
        return True

    if scope.role_id is not None and scope.role_id in actor.role_ids:
        return True

    if scope.branch_id is not None and scope.branch_id in actor.branch_ids:
        return True

    return False


def scope_matches_client(scope: Any, client_id: int) -> bool:
    return scope.client_id in {client_id, ALL_CLIENTS_SCOPE_ID}


def has_permission(scopes: Iterable[Any], permission_type: str) -> bool:
    permission_type = normalize_permission(permission_type)
    return any(normalize_permission(scope.permission_type) == permission_type for scope in scopes)


def filter_scopes_for_actor(scopes: Iterable[Any], actor: AccessActor) -> list[Any]:
    if actor.is_admin:
        return list(scopes)

    return [scope for scope in scopes if scope_matches_actor(scope, actor)]


def filter_scopes_for_client(scopes: Iterable[Any], client_id: int) -> list[Any]:
    return [scope for scope in scopes if scope_matches_client(scope, client_id)]


__all__ = (
    "ALL_CLIENTS_SCOPE_ID",
    "ALLOWED_ACTIONS",
    "ALLOWED_FIELD_ACTIONS",
    "ALLOWED_SCOPE_PERMISSIONS",
    "CLIENT_ACTION_ARCHIVE",
    "CLIENT_ACTION_BULK",
    "CLIENT_ACTION_CHANGE_CONSENTS",
    "CLIENT_ACTION_EDIT",
    "CLIENT_ACTION_EXPORT",
    "CLIENT_ACTION_IMPORT",
    "CLIENT_ACTION_MERGE",
    "CLIENT_ACTION_VIEW",
    "CLIENT_ACTION_VIEW_ACCOUNTS",
    "CLIENT_ACTION_VIEW_FILES",
    "CLIENT_ACTION_VIEW_HISTORY",
    "FIELD_ACTION_EDIT",
    "FIELD_ACTION_VIEW",
    "SCOPE_ALL_CLIENTS",
    "SCOPE_DENY_BULK",
    "SCOPE_DENY_EXPORT",
    "SCOPE_DENY_SENSITIVE_FIELDS",
    "SCOPE_OWN_BRANCH",
    "SCOPE_OWN_CLIENTS",
    "SENSITIVE_FIELDS",
    "AccessActor",
    "AccessAuditEvent",
    "AccessDecision",
    "AccessTarget",
    "compact_none",
    "dump_schema",
    "filter_scopes_for_actor",
    "filter_scopes_for_client",
    "has_permission",
    "normalize_field_name",
    "normalize_permission",
    "scope_matches_actor",
    "scope_matches_client",
    "utcnow",
)

