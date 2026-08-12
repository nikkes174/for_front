from __future__ import annotations

from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ClientImportRowBaseSchema(BaseModel):
    batch_id: int
    row_number: int
    raw_data_json: dict[str, Any] | None = None
    client_id: int | None = None
    status: str = Field(min_length=1, max_length=50)
    error_text: str | None = Field(default=None, max_length=2000)


class ClientImportRowCreateSchema(ClientImportRowBaseSchema):
    pass


class ClientImportRowUpdateSchema(BaseModel):
    raw_data_json: dict[str, Any] | None = None
    client_id: int | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)
    error_text: str | None = Field(default=None, max_length=2000)


class ClientImportRowReadSchema(ClientImportRowBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int