from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientAccessScopeBaseSchema(BaseModel):
    client_id: int
    role_id: int | None = None
    employee_id: int | None = None
    branch_id: int | None = None
    permission_type: str


class ClientAccessScopeCreateSchema(ClientAccessScopeBaseSchema):
    pass


class ClientAccessScopeUpdateSchema(BaseModel):
    role_id: int | None = None
    employee_id: int | None = None
    branch_id: int | None = None
    permission_type: str | None = None


class ClientAccessScopeReadSchema(ClientAccessScopeBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime