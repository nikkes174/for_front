from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field


class ClientSegmentBaseSchema(BaseModel):
    organization_id: int
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    is_dynamic: bool = False
    rules_json: dict[str, Any] | None = None
    created_by: int | None = None
    status: str = Field(min_length=1, max_length=50)


class ClientSegmentCreateSchema(ClientSegmentBaseSchema):
    pass


class ClientSegmentUpdateSchema(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    is_dynamic: bool | None = None
    rules_json: dict[str, Any] | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)


class ClientSegmentReadSchema(ClientSegmentBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None

class ClientSegmentMemberBaseSchema(BaseModel):
    segment_id: int
    client_id: int
    entered_at: datetime
    exited_at: datetime | None = None
    membership_status: str = Field(min_length=1, max_length=50)


class ClientSegmentMemberCreateSchema(ClientSegmentMemberBaseSchema):
    pass


class ClientSegmentMemberUpdateSchema(BaseModel):
    entered_at: datetime | None = None
    exited_at: datetime | None = None
    membership_status: str | None = Field(default=None, min_length=1, max_length=50)


class ClientSegmentMemberReadSchema(ClientSegmentMemberBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int