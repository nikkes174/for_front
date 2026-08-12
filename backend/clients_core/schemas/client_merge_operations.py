from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClientMergeOperationBaseSchema(BaseModel):
    organization_id: int
    primary_client_id: int
    duplicate_client_id: int
    reason: str | None = Field(default=None, max_length=1000)
    merged_by: int | None = None


class ClientMergeOperationCreateSchema(ClientMergeOperationBaseSchema):
    pass


class ClientMergeOperationReadSchema(ClientMergeOperationBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime