from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ClientCategoryBaseSchema(BaseModel):
    organization_id: int
    name: str = Field(min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    color: str | None = Field(default=None, max_length=32)


class ClientCategoryCreateSchema(ClientCategoryBaseSchema):
    pass


class ClientCategoryUpdateSchema(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=1000)
    color: str | None = Field(default=None, max_length=32)


class ClientCategoryReadSchema(ClientCategoryBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None


class ClientCategoryLinkBaseSchema(BaseModel):
    client_id: int
    category_id: int
    created_by: int | None = None


class ClientCategoryLinkCreateSchema(ClientCategoryLinkBaseSchema):
    pass


class ClientCategoryLinkReadSchema(ClientCategoryLinkBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime