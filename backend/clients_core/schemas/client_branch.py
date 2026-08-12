from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientBranchBaseSchema(BaseModel):
    client_id: int
    branch_id: int
    first_visit_at: datetime | None = None
    last_visit_at: datetime | None = None


class ClientBranchCreateSchema(ClientBranchBaseSchema):
    pass


class ClientBranchUpdateSchema(BaseModel):
    first_visit_at: datetime | None = None
    last_visit_at: datetime | None = None


class ClientBranchReadSchema(ClientBranchBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int