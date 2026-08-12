from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from decimal import Decimal
from typing import Any, TypeVar

from pydantic import BaseModel


ModelT = TypeVar("ModelT")


ACTIVE_STATUS = "active"
ARCHIVED_STATUS = "archived"
EXPIRED_STATUS = "expired"


def utc_now() -> datetime:
    return datetime.now(UTC)


def utcnow() -> datetime:
    return utc_now()


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


def schema_to_dict(
    schema: BaseModel | Mapping[str, Any],
    *,
    exclude_unset: bool = True,
    exclude_none: bool = False,
) -> dict[str, Any]:
    return payload_to_dict(
        schema,
        exclude_unset=exclude_unset,
        exclude_none=exclude_none,
    )


def dump_schema(schema: BaseModel | Mapping[str, Any]) -> dict[str, Any]:
    return payload_to_dict(schema, exclude_unset=True)


def schema_dump(schema: BaseModel | Mapping[str, Any]) -> dict[str, Any]:
    return payload_to_dict(schema, exclude_unset=True)


def schema_to_create_dict(schema: BaseModel | Mapping[str, Any]) -> dict[str, Any]:
    return payload_to_dict(schema, exclude_unset=False)


def schema_to_update_dict(schema: BaseModel | Mapping[str, Any]) -> dict[str, Any]:
    return payload_to_dict(schema, exclude_unset=True)


def compact_none(payload: Mapping[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in payload.items() if value is not None}


def clean_payload(payload: Mapping[str, Any]) -> dict[str, Any]:
    return compact_none(payload)


def normalize_pagination(
    offset: int,
    limit: int,
    *,
    max_limit: int = 500,
) -> tuple[int, int]:
    return max(offset, 0), min(max(limit, 1), max_limit)


def normalize_string(value: str) -> str:
    return value.strip().lower().replace("-", "_").replace(" ", "_")


def normalize_phone(phone: str | None) -> str | None:
    if not phone:
        return None

    digits = "".join(ch for ch in phone if ch.isdigit())
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    elif len(digits) == 10:
        digits = "7" + digits
    return digits or None


def normalize_email(email: str | None) -> str | None:
    if not email:
        return None

    normalized = email.strip().lower()
    return normalized or None


def build_full_name(data: Mapping[str, Any]) -> str | None:
    parts = (
        data.get("last_name"),
        data.get("first_name"),
        data.get("middle_name"),
    )
    full_name = " ".join(str(part).strip() for part in parts if part)
    return full_name or None


def is_empty(value: Any) -> bool:
    return value is None or value == "" or value == [] or value == {}


def decimal_or_zero(value: Decimal | int | float | str | None) -> Decimal:
    if value is None:
        return Decimal("0")

    if isinstance(value, Decimal):
        return value

    return Decimal(str(value))


def is_active_status(status: str | None) -> bool:
    return status == ACTIVE_STATUS


def model_to_dict(model: Any) -> dict[str, Any]:
    return {
        column.name: getattr(model, column.name)
        for column in model.__table__.columns
    }


def deduplicate_by_id(items: Sequence[ModelT]) -> list[ModelT]:
    unique: dict[int, ModelT] = {}

    for item in items:
        item_id = getattr(item, "id", None)
        if item_id is not None:
            unique[item_id] = item

    return list(unique.values())


class SafeFormatDict(dict[str, Any]):
    def __missing__(self, key: str) -> str:
        return "{" + key + "}"
