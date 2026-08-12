from __future__ import annotations

from ._utils import (
    AccessActor,
    AccessDecision,
    AccessTarget,
    CLIENT_ACTION_ARCHIVE,
    CLIENT_ACTION_BULK,
    CLIENT_ACTION_CHANGE_CONSENTS,
    CLIENT_ACTION_EDIT,
    CLIENT_ACTION_EXPORT,
    CLIENT_ACTION_IMPORT,
    CLIENT_ACTION_MERGE,
    CLIENT_ACTION_VIEW,
    CLIENT_ACTION_VIEW_ACCOUNTS,
    CLIENT_ACTION_VIEW_FILES,
    CLIENT_ACTION_VIEW_HISTORY,
)
from .client_access_service import ClientAccessService
from .exceptions import ClientAccessDeniedError


class ClientActionAccessService:
    def __init__(self, access_service: ClientAccessService) -> None:
        self._access_service = access_service

    async def check_action(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        action: str,
    ) -> AccessDecision:
        return await self._access_service.check_access(
            actor=actor,
            target=target,
            permission_type=action,
        )

    async def require_action(
        self,
        *,
        actor: AccessActor,
        target: AccessTarget,
        action: str,
    ) -> None:
        decision = await self.check_action(
            actor=actor,
            target=target,
            action=action,
        )

        if not decision.allowed:
            raise ClientAccessDeniedError(decision.reason)

    async def require_view_client(self, *, actor: AccessActor, target: AccessTarget) -> None:
        await self.require_action(actor=actor, target=target, action=CLIENT_ACTION_VIEW)

    async def require_edit_client(self, *, actor: AccessActor, target: AccessTarget) -> None:
        await self.require_action(actor=actor, target=target, action=CLIENT_ACTION_EDIT)

    async def require_archive_client(self, *, actor: AccessActor, target: AccessTarget) -> None:
        await self.require_action(actor=actor, target=target, action=CLIENT_ACTION_ARCHIVE)

    async def require_import_clients(self, *, actor: AccessActor) -> None:
        await self.require_action(
            actor=actor,
            target=AccessTarget(client_id=0),
            action=CLIENT_ACTION_IMPORT,
        )

    async def require_export_clients(self, *, actor: AccessActor) -> None:
        await self.require_action(
            actor=actor,
            target=AccessTarget(client_id=0),
            action=CLIENT_ACTION_EXPORT,
        )

    async def require_merge_clients(self, *, actor: AccessActor, target: AccessTarget) -> None:
        await self.require_action(actor=actor, target=target, action=CLIENT_ACTION_MERGE)

    async def require_bulk_action(self, *, actor: AccessActor) -> None:
        await self.require_action(
            actor=actor,
            target=AccessTarget(client_id=0),
            action=CLIENT_ACTION_BULK,
        )

    async def require_view_history(self, *, actor: AccessActor, target: AccessTarget) -> None:
        await self.require_action(actor=actor, target=target, action=CLIENT_ACTION_VIEW_HISTORY)

    async def require_view_accounts(self, *, actor: AccessActor, target: AccessTarget) -> None:
        await self.require_action(actor=actor, target=target, action=CLIENT_ACTION_VIEW_ACCOUNTS)

    async def require_view_files(self, *, actor: AccessActor, target: AccessTarget) -> None:
        await self.require_action(actor=actor, target=target, action=CLIENT_ACTION_VIEW_FILES)

    async def require_change_consents(self, *, actor: AccessActor, target: AccessTarget) -> None:
        await self.require_action(actor=actor, target=target, action=CLIENT_ACTION_CHANGE_CONSENTS)
