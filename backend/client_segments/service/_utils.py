from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel


def utcnow() -> datetime:
    return datetime.now(UTC)


def to_payload(
    data: BaseModel | dict[str, Any],
    *,
    exclude_unset: bool = False,
) -> dict[str, Any]:
    if isinstance(data, BaseModel):
        return data.model_dump(exclude_unset=exclude_unset)
    return dict(data)


def normalize_datetime(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)
