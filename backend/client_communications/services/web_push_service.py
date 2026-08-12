from __future__ import annotations

import json
from collections.abc import Sequence

import anyio
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_communications.models import ClientPushSubscriptionModel
from client_circout.backend.config import (
    WEB_PUSH_VAPID_PRIVATE_KEY,
    WEB_PUSH_VAPID_PUBLIC_KEY,
    WEB_PUSH_VAPID_SUBJECT,
)
from client_circout.backend.db.mixins import utc_now

try:
    from pywebpush import WebPushException, webpush
except Exception:
    WebPushException = Exception
    webpush = None


def web_push_configured() -> bool:
    return bool(webpush and WEB_PUSH_VAPID_PUBLIC_KEY and WEB_PUSH_VAPID_PRIVATE_KEY and WEB_PUSH_VAPID_SUBJECT)


async def send_web_push(
    session: AsyncSession,
    subscriptions: Sequence[ClientPushSubscriptionModel],
    *,
    title: str,
    body: str,
    url: str = "/cabinet.html",
    image: str = "",
) -> int:
    if not web_push_configured():
        return 0

    payload = json.dumps(
        {
            "title": title[:120],
            "body": body[:240],
            "url": url,
            "tag": "organization-broadcast",
            "icon": "/pwa-icon.svg",
            "badge": "/pwa-icon.svg",
            "image": image,
        },
        ensure_ascii=False,
    )
    sent = 0
    now = utc_now()
    for item in subscriptions:
        info = {"endpoint": item.endpoint, "keys": {"p256dh": item.p256dh, "auth": item.auth}}
        try:
            await anyio.to_thread.run_sync(
                lambda: webpush(
                    subscription_info=info,
                    data=payload,
                    vapid_private_key=WEB_PUSH_VAPID_PRIVATE_KEY,
                    vapid_claims={"sub": WEB_PUSH_VAPID_SUBJECT},
                )
            )
            item.last_sent_at = now
            item.last_error = ""
            sent += 1
        except WebPushException as exc:
            item.last_error = str(exc)[:1000]
            status_code = getattr(getattr(exc, "response", None), "status_code", 0) or 0
            if status_code in {404, 410}:
                item.is_active = False
        except Exception as exc:
            item.last_error = str(exc)[:1000]
        item.updated_at = now
    await session.flush()
    return sent
