from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientFavoriteEmployeeBaseSchema(BaseModel):
    client_id: int
    employee_id: int
    usage_count: int = 0
    last_used_at: datetime | None = None


class ClientFavoriteEmployeeCreateSchema(ClientFavoriteEmployeeBaseSchema):
    pass


class ClientFavoriteEmployeeUpdateSchema(BaseModel):
    usage_count: int | None = None
    last_used_at: datetime | None = None


class ClientFavoriteEmployeeReadSchema(ClientFavoriteEmployeeBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int