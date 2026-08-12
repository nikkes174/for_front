from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_access.crud import ClientAccessScopeCrud
from client_circout.backend.client_access.services import (
    ClientAccessPolicyService,
    ClientAccessScopeService,
    ClientAccessService,
    ClientActionAccessService,
    ClientBranchAccessService,
    ClientFieldAccessService,
)
from client_circout.backend.db.db import SessionFactory


async def get_client_access_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientAccessSessionDep = Annotated[
    AsyncSession,
    Depends(get_client_access_db_session),
]


def get_client_access_scope_crud(
    session: ClientAccessSessionDep,
) -> ClientAccessScopeCrud:
    return ClientAccessScopeCrud(session)


ClientAccessScopeCrudDep = Annotated[
    ClientAccessScopeCrud,
    Depends(get_client_access_scope_crud),
]


def get_client_access_policy_service() -> ClientAccessPolicyService:
    return ClientAccessPolicyService()


ClientAccessPolicyServiceDep = Annotated[
    ClientAccessPolicyService,
    Depends(get_client_access_policy_service),
]


def get_client_access_scope_service(
    scope_crud: ClientAccessScopeCrudDep,
) -> ClientAccessScopeService:
    return ClientAccessScopeService(scope_crud)


ClientAccessScopeServiceDep = Annotated[
    ClientAccessScopeService,
    Depends(get_client_access_scope_service),
]


def get_client_access_service(
    scope_crud: ClientAccessScopeCrudDep,
    policy_service: ClientAccessPolicyServiceDep,
) -> ClientAccessService:
    return ClientAccessService(
        scope_crud=scope_crud,
        policy_service=policy_service,
    )


ClientAccessServiceDep = Annotated[
    ClientAccessService,
    Depends(get_client_access_service),
]


def get_client_action_access_service(
    access_service: ClientAccessServiceDep,
) -> ClientActionAccessService:
    return ClientActionAccessService(access_service)


ClientActionAccessServiceDep = Annotated[
    ClientActionAccessService,
    Depends(get_client_action_access_service),
]


def get_client_branch_access_service(
    scope_crud: ClientAccessScopeCrudDep,
    access_service: ClientAccessServiceDep,
) -> ClientBranchAccessService:
    return ClientBranchAccessService(
        scope_crud=scope_crud,
        access_service=access_service,
    )


ClientBranchAccessServiceDep = Annotated[
    ClientBranchAccessService,
    Depends(get_client_branch_access_service),
]


def get_client_field_access_service(
    scope_crud: ClientAccessScopeCrudDep,
    access_service: ClientAccessServiceDep,
    policy_service: ClientAccessPolicyServiceDep,
) -> ClientFieldAccessService:
    return ClientFieldAccessService(
        scope_crud=scope_crud,
        access_service=access_service,
        policy_service=policy_service,
    )


ClientFieldAccessServiceDep = Annotated[
    ClientFieldAccessService,
    Depends(get_client_field_access_service),
]
