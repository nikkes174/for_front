from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict


class ClientRecommendationBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    recommendation_type: str
    title: str
    description: str | None = None
    payload_json: dict[str, Any] | None = None
    expires_at: datetime | None = None
    status: str = "active"


class ClientRecommendationCreateSchema(ClientRecommendationBaseSchema):
    pass


class ClientRecommendationUpdateSchema(BaseModel):
    recommendation_type: str | None = None
    title: str | None = None
    description: str | None = None
    payload_json: dict[str, Any] | None = None
    expires_at: datetime | None = None
    status: str | None = None


class ClientRecommendationReadSchema(ClientRecommendationBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime