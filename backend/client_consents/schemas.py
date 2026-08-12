from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ClientConsentBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    service_messages_allowed: bool = True
    marketing_messages_allowed: bool = False
    sms_allowed: bool = False
    email_allowed: bool = False
    telegram_allowed: bool = False
    consent_given_at: datetime | None = None
    consent_text: str | None = None
    consent_source: str | None = None
    consent_revoked_at: datetime | None = None
    comment: str | None = None


class ClientConsentCreateSchema(ClientConsentBaseSchema):
    pass


class ClientConsentUpdateSchema(BaseModel):
    service_messages_allowed: bool | None = None
    marketing_messages_allowed: bool | None = None
    sms_allowed: bool | None = None
    email_allowed: bool | None = None
    telegram_allowed: bool | None = None
    consent_given_at: datetime | None = None
    consent_text: str | None = None
    consent_source: str | None = None
    consent_revoked_at: datetime | None = None
    comment: str | None = None


class ClientConsentReadSchema(ClientConsentBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime