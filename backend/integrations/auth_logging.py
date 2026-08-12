from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import uuid4

import httpx

from contracts.api.auth_logging import AuditApiClient, EventsApiClient
from contracts.audit import AuditLogCreateDTO
from contracts.events import EventPublishDTO


class AuthLoggingPublishError(Exception):
    pass


class AuthLoggingPublisher:
    def __init__(self, events_client: EventsApiClient, audit_client: AuditApiClient) -> None:
        self._events_client = events_client
        self._audit_client = audit_client

    async def publish_event_and_audit(
        self,
        *,
        event_type: str,
        action: str,
        entity_type: str,
        entity_id: int,
        payload: dict[str, Any],
        organization_id: int | None = None,
        branch_id: int | None = None,
        client_id: int | None = None,
        actor_type: str = "user",
        actor_id: int | None = None,
        source: str = "client_circout_api",
        reason: str | None = None,
    ) -> None:
        occurred_at = datetime.now(UTC)
        correlation_id = uuid4().hex
        event_id = uuid4().hex
        try:
            await self._events_client.publish_event(
                EventPublishDTO(
                    event_id=event_id,
                    event_type=event_type,
                    event_version=1,
                    source_service="client_circout",
                    organization_id=organization_id,
                    branch_id=branch_id,
                    client_id=client_id,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    actor_type=actor_type,
                    actor_id=actor_id,
                    source=source,
                    correlation_id=correlation_id,
                    occurred_at=occurred_at,
                    payload=payload,
                ),
            )
            await self._audit_client.create_audit_log(
                AuditLogCreateDTO(
                    organization_id=organization_id,
                    branch_id=branch_id,
                    user_id=actor_id,
                    actor_type=actor_type,
                    action=action,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    reason=reason,
                    new_value=payload,
                    correlation_id=correlation_id,
                    source=source,
                    occurred_at=occurred_at,
                ),
            )
        except httpx.HTTPError as exc:
            raise AuthLoggingPublishError("Failed to publish event/audit to auth_and_logging") from exc
