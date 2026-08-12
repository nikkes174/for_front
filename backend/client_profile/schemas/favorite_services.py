from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientFavoriteServiceBaseSchema(BaseModel):
    client_id: int
    service_id: int
    usage_count: int = 0
    last_used_at: datetime | None = None


class ClientFavoriteServiceCreateSchema(ClientFavoriteServiceBaseSchema):
    pass


class ClientFavoriteServiceUpdateSchema(BaseModel):
    usage_count: int | None = None
    last_used_at: datetime | None = None


class ClientFavoriteServiceReadSchema(ClientFavoriteServiceBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int