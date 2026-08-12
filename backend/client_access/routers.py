from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, Field

from client_circout.backend.client_access.dependencies import (
    ClientAccessScopeServiceDep,
    ClientAccessServiceDep,
    ClientActionAccessServiceDep,
    ClientBranchAccessServiceDep,
    ClientFieldAccessServiceDep,
)
from client_circout.backend.client_access.schemas import (
    ClientAccessScopeCreateSchema,
    ClientAccessScopeReadSchema,
    ClientAccessScopeUpdateSchema,
)
from client_circout.backend.client_access.services import AccessActor, AccessDecision, AccessTarget
from client_circout.backend.client_access.services._utils import (
    ALLOWED_ACTIONS,
    ALLOWED_FIELD_ACTIONS,
    ALLOWED_SCOPE_PERMISSIONS,
    SENSITIVE_FIELDS,
)
from client_circout.backend.client_access.services.exceptions import (
    ClientAccessDeniedError,
    ClientAccessInvalidFieldError,
    ClientAccessInvalidPermissionError,
    ClientAccessScopeConflictServiceError,
    ClientAccessScopeNotFoundError,
    ClientAccessServiceError,
)

router = APIRouter(
    prefix="/client-access",
    tags=["client-access"],
)


class AccessActorRequest(BaseModel):
    employee_id: int | None = None
    role_ids: tuple[int, ...] = ()
    branch_ids: tuple[int, ...] = ()
    organization_id: int | None = None
    is_admin: bool = False

    def to_domain(self) -> AccessActor:
        return AccessActor(
            employee_id=self.employee_id,
            role_ids=self.role_ids,
            branch_ids=self.branch_ids,
            organization_id=self.organization_id,
            is_admin=self.is_admin,
        )


class AccessTargetRequest(BaseModel):
    client_id: int
    organization_id: int | None = None
    branch_id: int | None = None
    owner_employee_id: int | None = None

    def to_domain(self) -> AccessTarget:
        return AccessTarget(
            client_id=self.client_id,
            organization_id=self.organization_id,
            branch_id=self.branch_id,
            owner_employee_id=self.owner_employee_id,
        )


class AccessDecisionRead(BaseModel):
    allowed: bool
    reason: str
    permission_type: str
    client_id: int | None = None
    field_name: str | None = None

    @classmethod
    def from_domain(cls, decision: AccessDecision) -> AccessDecisionRead:
        return cls(
            allowed=decision.allowed,
            reason=decision.reason,
            permission_type=decision.permission_type,
            client_id=decision.client_id,
            field_name=decision.field_name,
        )


class AccessCheckRequest(BaseModel):
    actor: AccessActorRequest
    target: AccessTargetRequest
    permission_type: str = Field(max_length=64)


class ActionAccessCheckRequest(BaseModel):
    actor: AccessActorRequest
    target: AccessTargetRequest
    action: str = Field(max_length=64)


class FieldAccessCheckRequest(BaseModel):
    actor: AccessActorRequest
    target: AccessTargetRequest
    field_name: str = Field(max_length=128)


class FieldFilterRequest(BaseModel):
    actor: AccessActorRequest
    target: AccessTargetRequest
    payload: dict[str, Any]


class FieldFilterRead(BaseModel):
    payload: dict[str, Any]


class BranchAccessCheckRequest(BaseModel):
    actor: AccessActorRequest
    target: AccessTargetRequest
    permission_type: str = Field(max_length=64)


class BranchScopeCheckRequest(BaseModel):
    actor: AccessActorRequest
    client_id: int
    branch_id: int


class ActorBranchAllowedRequest(BaseModel):
    actor: AccessActorRequest
    branch_id: int | None = None


class BooleanRead(BaseModel):
    allowed: bool


class ReplaceEmployeeClientScopesRequest(BaseModel):
    permission_types: list[str]


class GrantEmployeePermissionRequest(BaseModel):
    permission_type: str = Field(max_length=64)
    branch_id: int | None = None


class GrantRolePermissionRequest(BaseModel):
    permission_type: str = Field(max_length=64)
    branch_id: int | None = None


class AccessPermissionsRead(BaseModel):
    allowed_actions: list[str]
    allowed_field_actions: list[str]
    allowed_scope_permissions: list[str]
    sensitive_fields: list[str]


def _error_detail(exc: Exception, default: str) -> str:
    return str(exc) or default


def _raise_http_error(exc: ClientAccessServiceError) -> None:
    if isinstance(exc, ClientAccessScopeNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=_error_detail(exc, "РћР±Р»Р°СЃС‚СЊ РґРѕСЃС‚СѓРїР° РЅРµ РЅР°Р№РґРµРЅР°"),
        ) from exc

    if isinstance(exc, ClientAccessScopeConflictServiceError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=_error_detail(exc, "РљРѕРЅС„Р»РёРєС‚ РѕР±Р»Р°СЃС‚Рё РґРѕСЃС‚СѓРїР°"),
        ) from exc

    if isinstance(exc, ClientAccessDeniedError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=_error_detail(exc, "Р”РѕСЃС‚СѓРї Р·Р°РїСЂРµС‰С‘РЅ"),
        ) from exc

    if isinstance(
        exc,
        (
            ClientAccessInvalidPermissionError,
            ClientAccessInvalidFieldError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=_error_detail(exc, "РќРµРєРѕСЂСЂРµРєС‚РЅС‹Рµ РґР°РЅРЅС‹Рµ РґРѕСЃС‚СѓРїР°"),
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=_error_detail(exc, "РћС€РёР±РєР° РґРѕСЃС‚СѓРїР° РєР»РёРµРЅС‚Р°"),
    ) from exc


@router.get("/permissions", response_model=AccessPermissionsRead)
async def get_access_permissions() -> AccessPermissionsRead:
    return AccessPermissionsRead(
        allowed_actions=sorted(ALLOWED_ACTIONS),
        allowed_field_actions=sorted(ALLOWED_FIELD_ACTIONS),
        allowed_scope_permissions=sorted(ALLOWED_SCOPE_PERMISSIONS),
        sensitive_fields=sorted(SENSITIVE_FIELDS),
    )


@router.post(
    "/scopes",
    response_model=ClientAccessScopeReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_scope(
    payload: ClientAccessScopeCreateSchema,
    service: ClientAccessScopeServiceDep,
) -> ClientAccessScopeReadSchema:
    try:
        scope = await service.create_scope(payload)
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return ClientAccessScopeReadSchema.model_validate(scope)


@router.get(
    "/scopes/{scope_id}",
    response_model=ClientAccessScopeReadSchema,
)
async def get_scope(
    scope_id: int,
    service: ClientAccessScopeServiceDep,
) -> ClientAccessScopeReadSchema:
    try:
        scope = await service.get_scope(scope_id)
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return ClientAccessScopeReadSchema.model_validate(scope)


@router.patch(
    "/scopes/{scope_id}",
    response_model=ClientAccessScopeReadSchema,
)
async def update_scope(
    scope_id: int,
    payload: ClientAccessScopeUpdateSchema,
    service: ClientAccessScopeServiceDep,
) -> ClientAccessScopeReadSchema:
    try:
        scope = await service.update_scope(
            scope_id=scope_id,
            payload=payload,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return ClientAccessScopeReadSchema.model_validate(scope)


@router.delete(
    "/scopes/{scope_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def revoke_scope(
    scope_id: int,
    service: ClientAccessScopeServiceDep,
) -> None:
    try:
        await service.revoke_scope(scope_id)
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)


@router.get(
    "/clients/{client_id}/scopes",
    response_model=list[ClientAccessScopeReadSchema],
)
async def list_client_scopes(
    client_id: int,
    service: ClientAccessScopeServiceDep,
) -> list[ClientAccessScopeReadSchema]:
    scopes = await service.list_client_scopes(client_id=client_id)
    return [ClientAccessScopeReadSchema.model_validate(scope) for scope in scopes]


@router.get(
    "/employees/{employee_id}/scopes",
    response_model=list[ClientAccessScopeReadSchema],
)
async def list_employee_scopes(
    employee_id: int,
    service: ClientAccessScopeServiceDep,
) -> list[ClientAccessScopeReadSchema]:
    scopes = await service.list_employee_scopes(employee_id=employee_id)
    return [ClientAccessScopeReadSchema.model_validate(scope) for scope in scopes]


@router.get(
    "/roles/{role_id}/scopes",
    response_model=list[ClientAccessScopeReadSchema],
)
async def list_role_scopes(
    role_id: int,
    service: ClientAccessScopeServiceDep,
) -> list[ClientAccessScopeReadSchema]:
    scopes = await service.list_role_scopes(role_id=role_id)
    return [ClientAccessScopeReadSchema.model_validate(scope) for scope in scopes]


@router.put(
    "/clients/{client_id}/employees/{employee_id}/scopes",
    response_model=list[ClientAccessScopeReadSchema],
)
async def replace_employee_client_scopes(
    client_id: int,
    employee_id: int,
    payload: ReplaceEmployeeClientScopesRequest,
    service: ClientAccessScopeServiceDep,
) -> list[ClientAccessScopeReadSchema]:
    try:
        scopes = await service.replace_employee_client_scopes(
            client_id=client_id,
            employee_id=employee_id,
            permission_types=payload.permission_types,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return [ClientAccessScopeReadSchema.model_validate(scope) for scope in scopes]


@router.post(
    "/clients/{client_id}/employees/{employee_id}/permissions",
    response_model=ClientAccessScopeReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def grant_employee_permission(
    client_id: int,
    employee_id: int,
    payload: GrantEmployeePermissionRequest,
    service: ClientAccessScopeServiceDep,
) -> ClientAccessScopeReadSchema:
    try:
        scope = await service.grant_employee_permission(
            client_id=client_id,
            employee_id=employee_id,
            permission_type=payload.permission_type,
            branch_id=payload.branch_id,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return ClientAccessScopeReadSchema.model_validate(scope)


@router.post(
    "/clients/{client_id}/roles/{role_id}/permissions",
    response_model=ClientAccessScopeReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def grant_role_permission(
    client_id: int,
    role_id: int,
    payload: GrantRolePermissionRequest,
    service: ClientAccessScopeServiceDep,
) -> ClientAccessScopeReadSchema:
    try:
        scope = await service.grant_role_permission(
            client_id=client_id,
            role_id=role_id,
            permission_type=payload.permission_type,
            branch_id=payload.branch_id,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return ClientAccessScopeReadSchema.model_validate(scope)


@router.post("/check", response_model=AccessDecisionRead)
async def check_access(
    payload: AccessCheckRequest,
    service: ClientAccessServiceDep,
) -> AccessDecisionRead:
    try:
        decision = await service.check_access(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            permission_type=payload.permission_type,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return AccessDecisionRead.from_domain(decision)


@router.post("/require", response_model=BooleanRead)
async def require_access(
    payload: AccessCheckRequest,
    service: ClientAccessServiceDep,
) -> BooleanRead:
    try:
        await service.require_access(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            permission_type=payload.permission_type,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return BooleanRead(allowed=True)


@router.post("/actions/check", response_model=AccessDecisionRead)
async def check_action_access(
    payload: ActionAccessCheckRequest,
    service: ClientActionAccessServiceDep,
) -> AccessDecisionRead:
    try:
        decision = await service.check_action(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            action=payload.action,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return AccessDecisionRead.from_domain(decision)


@router.post("/actions/require", response_model=BooleanRead)
async def require_action_access(
    payload: ActionAccessCheckRequest,
    service: ClientActionAccessServiceDep,
) -> BooleanRead:
    try:
        await service.require_action(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            action=payload.action,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return BooleanRead(allowed=True)


@router.post("/fields/view/check", response_model=AccessDecisionRead)
async def check_field_view_access(
    payload: FieldAccessCheckRequest,
    service: ClientFieldAccessServiceDep,
) -> AccessDecisionRead:
    try:
        decision = await service.can_view_field(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            field_name=payload.field_name,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return AccessDecisionRead.from_domain(decision)


@router.post("/fields/edit/check", response_model=AccessDecisionRead)
async def check_field_edit_access(
    payload: FieldAccessCheckRequest,
    service: ClientFieldAccessServiceDep,
) -> AccessDecisionRead:
    try:
        decision = await service.can_edit_field(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            field_name=payload.field_name,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return AccessDecisionRead.from_domain(decision)


@router.post("/fields/filter-readable", response_model=FieldFilterRead)
async def filter_readable_fields(
    payload: FieldFilterRequest,
    service: ClientFieldAccessServiceDep,
) -> FieldFilterRead:
    try:
        filtered_payload = await service.filter_readable_fields(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            payload=payload.payload,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return FieldFilterRead(payload=filtered_payload)


@router.post("/fields/filter-writable", response_model=FieldFilterRead)
async def filter_writable_fields(
    payload: FieldFilterRequest,
    service: ClientFieldAccessServiceDep,
) -> FieldFilterRead:
    try:
        filtered_payload = await service.filter_writable_fields(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            payload=payload.payload,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return FieldFilterRead(payload=filtered_payload)


@router.post("/branches/check", response_model=AccessDecisionRead)
async def check_branch_client_access(
    payload: BranchAccessCheckRequest,
    service: ClientBranchAccessServiceDep,
) -> AccessDecisionRead:
    try:
        decision = await service.can_access_branch_client(
            actor=payload.actor.to_domain(),
            target=payload.target.to_domain(),
            permission_type=payload.permission_type,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return AccessDecisionRead.from_domain(decision)


@router.post("/branches/scope/check", response_model=BooleanRead)
async def check_branch_scope(
    payload: BranchScopeCheckRequest,
    service: ClientBranchAccessServiceDep,
) -> BooleanRead:
    try:
        allowed = await service.has_branch_scope(
            actor=payload.actor.to_domain(),
            client_id=payload.client_id,
            branch_id=payload.branch_id,
        )
    except ClientAccessServiceError as exc:
        _raise_http_error(exc)

    return BooleanRead(allowed=allowed)


@router.post("/branches/actor-allowed", response_model=BooleanRead)
async def check_actor_branch_allowed(
    payload: ActorBranchAllowedRequest,
    service: ClientBranchAccessServiceDep,
) -> BooleanRead:
    allowed = service.is_actor_branch_allowed(
        actor=payload.actor.to_domain(),
        branch_id=payload.branch_id,
    )
    return BooleanRead(allowed=allowed)
