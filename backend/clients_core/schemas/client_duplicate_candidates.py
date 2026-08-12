from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClientDuplicateCandidateBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    duplicate_client_id: int

    match_score: float = 0.0
    match_reason: str | None = Field(default=None, max_length=1000)

    status: str = Field(min_length=1, max_length=50)


class ClientDuplicateCandidateCreateSchema(ClientDuplicateCandidateBaseSchema):
    pass


class ClientDuplicateCandidateUpdateSchema(BaseModel):
    match_score: float | None = None
    match_reason: str | None = Field(default=None, max_length=1000)
    status: str | None = Field(default=None, min_length=1, max_length=50)


class ClientDuplicateCandidateReadSchema(ClientDuplicateCandidateBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime