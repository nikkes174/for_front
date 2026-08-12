from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientFileBaseSchema(BaseModel):
    client_id: int
    organization_id: int
    file_category: str
    file_name: str
    mime_type: str
    size: int
    storage_key: str
    uploaded_by: int | None = None


class ClientFileCreateSchema(ClientFileBaseSchema):
    pass


class ClientFileUpdateSchema(BaseModel):
    file_category: str | None = None
    file_name: str | None = None
    mime_type: str | None = None
    size: int | None = None
    storage_key: str | None = None
    uploaded_by: int | None = None


class ClientFileReadSchema(ClientFileBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime

class ClientFileLinkBaseSchema(BaseModel):
    client_id: int
    file_id: int
    related_visit_id: int | None = None
    related_procedure_id: int | None = None
    file_role: str


class ClientFileLinkCreateSchema(ClientFileLinkBaseSchema):
    pass


class ClientFileLinkUpdateSchema(BaseModel):
    related_visit_id: int | None = None
    related_procedure_id: int | None = None
    file_role: str | None = None


class ClientFileLinkReadSchema(ClientFileLinkBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime