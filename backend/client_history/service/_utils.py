from __future__ import annotations

from datetime import UTC, datetime
from decimal import Decimal
from typing import Any

from pydantic import BaseModel

from client_circout.backend.client_history.service.exceptions import ClientHistoryNotFoundError


def utc_now() -> datetime:
    return datetime.now(UTC)


def to_payload(schema_or_dict: BaseModel | dict[str, Any], *, exclude_unset: bool = False) -> dict[str, Any]:
    if isinstance(schema_or_dict, BaseModel):
        return schema_or_dict.model_dump(exclude_unset=exclude_unset)
    return dict(schema_or_dict)


def clean_update_payload(schema_or_dict: BaseModel | dict[str, Any]) -> dict[str, Any]:
    payload = to_payload(schema_or_dict, exclude_unset=True)
    return {key: value for key, value in payload.items() if value is not None}


def require_found(entity: Any, entity_name: str, entity_id: int) -> Any:
    if entity is None:
        raise ClientHistoryNotFoundError(f"{entity_name} with id={entity_id} not found")
    return entity


def decimal_or_zero(value: Any) -> Decimal:
    if value is None:
        return Decimal("0.00")
    if isinstance(value, Decimal):
        return value
    return Decimal(str(value))


def calc_debt_amount(total_cost: Any, paid_amount: Any) -> Decimal:
    debt = decimal_or_zero(total_cost) - decimal_or_zero(paid_amount)
    return max(debt, Decimal("0.00"))


COMPLETED_STATUSES = frozenset({"completed", "done", "finished", "paid"})
CANCELLED_STATUSES = frozenset({"cancelled", "canceled", "cancel"})
NO_SHOW_STATUSES = frozenset({"no_show", "no-show", "not_come"})
ACTIVE_FUTURE_STATUSES = frozenset({"planned", "scheduled", "active", "booked"})


def normalize_status(status: str | None) -> str:
    return (status or "").strip().lower()
