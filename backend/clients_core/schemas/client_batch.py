from __future__ import annotations

from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field


class ClientImportBatchBaseSchema(BaseModel):
    organization_id: int
    file_id: int
    status: str = Field(min_length=1, max_length=50)

    total_rows: int = 0
    success_rows: int = 0
    failed_rows: int = 0

    created_by: int | None = None


class ClientImportBatchCreateSchema(ClientImportBatchBaseSchema):
    pass


class ClientImportBatchUpdateSchema(BaseModel):
    status: str | None = Field(default=None, min_length=1, max_length=50)

    total_rows: int | None = None
    success_rows: int | None = None
    failed_rows: int | None = None

    finished_at: datetime | None = None


class ClientImportBatchReadSchema(ClientImportBatchBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    finished_at: datetime | None = None


class ClientExportBatchBaseSchema(BaseModel):
    organization_id: int
    filters_json: dict[str, Any] | None = None
    status: str = Field(min_length=1, max_length=50)
    file_id: int | None = None
    created_by: int | None = None


class ClientExportBatchCreateSchema(ClientExportBatchBaseSchema):
    pass


class ClientExportBatchUpdateSchema(BaseModel):
    filters_json: dict[str, Any] | None = None
    status: str | None = Field(default=None, min_length=1, max_length=50)
    file_id: int | None = None
    finished_at: datetime | None = None


class ClientExportBatchReadSchema(ClientExportBatchBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    finished_at: datetime | None = None