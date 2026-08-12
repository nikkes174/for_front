from __future__ import annotations

from collections.abc import Mapping
from datetime import UTC, date, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel


def utc_now() -> datetime:
    return datetime.now(UTC)


def today_utc() -> date:
    return utc_now().date()


def payload_to_dict(
    payload: BaseModel | Mapping[str, Any],
    *,
    exclude_unset: bool = True,
    exclude_none: bool = False,
) -> dict[str, Any]:
    if isinstance(payload, BaseModel):
        return payload.model_dump(
            exclude_unset=exclude_unset,
            exclude_none=exclude_none,
        )
    return dict(payload)


def decimal_zero() -> Decimal:
    return Decimal("0.00")


def normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
