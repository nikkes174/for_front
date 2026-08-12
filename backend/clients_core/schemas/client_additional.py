from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ClientAdditionalFieldValueBaseSchema(BaseModel):
    client_id: int
    field_id: int
    value_text: str | None = Field(default=None, max_length=2000)
    value_json: dict[str, Any] | None = None


class ClientAdditionalFieldValueCreateSchema(ClientAdditionalFieldValueBaseSchema):
    pass


class ClientAdditionalFieldValueUpdateSchema(BaseModel):
    value_text: str | None = Field(default=None, max_length=2000)
    value_json: dict[str, Any] | None = None


class ClientAdditionalFieldValueReadSchema(ClientAdditionalFieldValueBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    updated_at: datetime | None = None

class ClientAdditionalFieldBaseSchema(BaseModel):
    organization_id: int

    code: str = Field(min_length=1, max_length=100)
    name: str = Field(min_length=1, max_length=255)
    field_type: str = Field(min_length=1, max_length=50)

    is_required: bool = False

    options_json: dict[str, Any] | None = None


class ClientAdditionalFieldCreateSchema(
    ClientAdditionalFieldBaseSchema,
):
    pass


class ClientAdditionalFieldUpdateSchema(BaseModel):
    code: str | None = Field(default=None, min_length=1, max_length=100)
    name: str | None = Field(default=None, min_length=1, max_length=255)
    field_type: str | None = Field(default=None, min_length=1, max_length=50)

    is_required: bool | None = None

    options_json: dict[str, Any] | None = None


class ClientAdditionalFieldReadSchema(
    ClientAdditionalFieldBaseSchema,
):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None