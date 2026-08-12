from __future__ import annotations

from collections.abc import Awaitable, Callable
from typing import Any

from ._utils import AccessActor, AccessAuditEvent, AccessDecision, utcnow


AuditSink = Callable[[AccessAuditEvent], Awaitable[None]]


class ClientAccessAuditService:
    def __init__(self, audit_sink: AuditSink | None = None) -> None:
        self._audit_sink = audit_sink

    async def log_scope_granted(
        self,
        *,
        actor: AccessActor,
        target_client_id: int,
        permission_type: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        await self._emit(
            action="access_scope_granted",
            actor=actor,
            target_client_id=target_client_id,
            allowed=True,
            reason="scope_granted",
            metadata={
                "permission_type": permission_type,
                "created_at": utcnow().isoformat(),
                **(metadata or {}),
            },
        )

    async def log_scope_revoked(
        self,
        *,
        actor: AccessActor,
        target_client_id: int,
        permission_type: str,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        await self._emit(
            action="access_scope_revoked",
            actor=actor,
            target_client_id=target_client_id,
            allowed=True,
            reason="scope_revoked",
            metadata={
                "permission_type": permission_type,
                "created_at": utcnow().isoformat(),
                **(metadata or {}),
            },
        )

    async def log_access_decision(
        self,
        *,
        actor: AccessActor,
        decision: AccessDecision,
        metadata: dict[str, Any] | None = None,
    ) -> None:
        await self._emit(
            action="access_checked",
            actor=actor,
            target_client_id=decision.client_id,
            allowed=decision.allowed,
            reason=decision.reason,
            metadata={
                "permission_type": decision.permission_type,
                "field_name": decision.field_name,
                "created_at": utcnow().isoformat(),
                **(metadata or {}),
            },
        )

    async def _emit(
        self,
        *,
        action: str,
        actor: AccessActor,
        target_client_id: int | None,
        allowed: bool,
        reason: str,
        metadata: dict[str, Any],
    ) -> None:
        if self._audit_sink is None:
            return

        await self._audit_sink(
            AccessAuditEvent(
                actor=actor,
                action=action,
                target_client_id=target_client_id,
                allowed=allowed,
                reason=reason,
                metadata=metadata,
            ),
        )
