from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from pydantic import BaseModel

from client_circout.backend.client_files.service.exceptions import ClientFileNotFoundError


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
        raise ClientFileNotFoundError(f"{entity_name} with id={entity_id} not found")
    return entity


def normalize_text(value: str) -> str:
    return value.strip().lower()


def safe_file_name(file_name: str) -> str:
    cleaned = file_name.strip().replace("\\", "_").replace("/", "_")
    return cleaned or "file"
