from __future__ import annotations

from collections.abc import AsyncIterator
import hashlib
import hmac
import os
import time
from typing import Annotated

from fastapi import Cookie, Request
import httpx

from contracts.api.auth_logging import AuditApiClient, EventsApiClient
from client_circout.backend.config import AUTH_AND_LOGGING_API_URL
from client_circout.backend.integrations.auth_logging import AuthLoggingPublisher

COOKIE_NAME = "loyalty_session"
SECRET = os.getenv("AUTH_SESSION_SECRET") or os.getenv("SECRET_KEY") or "dev-only-change-me"


def _sign(value: str) -> str:
    return hmac.new(SECRET.encode(), value.encode(), hashlib.sha256).hexdigest()


def _read_actor_id(token: str | None) -> int | None:
    if not token:
        return None
    try:
        user_id_raw, expires_raw, signature = token.split(".", 2)
        payload = f"{user_id_raw}.{expires_raw}"
        if not hmac.compare_digest(_sign(payload), signature) or int(expires_raw) < time.time():
            return None
        return int(user_id_raw)
    except ValueError:
        return None


async def get_current_actor_id(
    loyalty_session: Annotated[str | None, Cookie(alias=COOKIE_NAME)] = None,
) -> int | None:
    return _read_actor_id(loyalty_session)


async def get_auth_logging_publisher() -> AsyncIterator[AuthLoggingPublisher]:
    events_client = EventsApiClient(AUTH_AND_LOGGING_API_URL)
    audit_client = AuditApiClient(AUTH_AND_LOGGING_API_URL)
    try:
        yield AuthLoggingPublisher(events_client, audit_client)
    finally:
        await events_client.aclose()
        await audit_client.aclose()


class ReviewTargetsApi:
    def __init__(self, client: httpx.AsyncClient) -> None:
        self._client = client

    async def branch_exists(self, organization_id: int, branch_id: int) -> bool:
        response = await self._client.get(
            f"/public-api/organizations/{organization_id}/branches/{branch_id}/exists",
        )
        response.raise_for_status()
        return response.json().get("exists") is True

    async def employee_exists(self, organization_id: int, employee_id: int | None) -> bool:
        if employee_id is None:
            return False
        response = await self._client.get(
            f"/users-access/organizations/{organization_id}/organization-memberships",
        )
        response.raise_for_status()
        return any(int(item["user_id"]) == employee_id for item in response.json())


async def get_review_targets_api(request: Request) -> AsyncIterator[ReviewTargetsApi]:
    headers = {}
    if cookie := request.headers.get("cookie"):
        headers["cookie"] = cookie
    async with httpx.AsyncClient(
        base_url=AUTH_AND_LOGGING_API_URL.rstrip("/"),
        headers=headers,
        timeout=10.0,
        trust_env=False,
    ) as client:
        yield ReviewTargetsApi(client)
