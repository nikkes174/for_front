from __future__ import annotations

from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, field_validator
from pydantic import Field


class ClientMessageBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    sent_at: datetime
    channel: str
    message_type: str
    message_text: str
    message_title: str | None = None
    image_urls: list[str] = Field(default_factory=list, max_length=10)
    delivery_status: str = "pending"
    employee_id: int | None = None
    related_visit_id: int | None = None


class ClientMessageCreateSchema(ClientMessageBaseSchema):
    pass


class ClientMessageUpdateSchema(BaseModel):
    sent_at: datetime | None = None
    channel: str | None = None
    message_type: str | None = None
    message_text: str | None = None
    message_title: str | None = None
    image_urls: list[str] | None = Field(default=None, max_length=10)
    delivery_status: str | None = None
    employee_id: int | None = None
    related_visit_id: int | None = None


class ClientMessageReadSchema(ClientMessageBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime

class ClientMessageDeliveryLogBaseSchema(BaseModel):
    message_id: int
    provider_name: str
    provider_message_id: str | None = None
    status: str
    status_at: datetime
    error_text: str | None = None
    payload_json: dict[str, Any] | None = None


class ClientMessageDeliveryLogCreateSchema(ClientMessageDeliveryLogBaseSchema):
    pass


class ClientMessageDeliveryLogUpdateSchema(BaseModel):
    provider_name: str | None = None
    provider_message_id: str | None = None
    status: str | None = None
    status_at: datetime | None = None
    error_text: str | None = None
    payload_json: dict[str, Any] | None = None


class ClientMessageDeliveryLogReadSchema(ClientMessageDeliveryLogBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int


class ClientPushSubscriptionCreateSchema(BaseModel):
    organization_id: int
    client_id: int
    endpoint: str = Field(min_length=1)
    keys: dict[str, str]
    platform: str = ""
    user_agent: str = ""


class ClientPushSubscriptionDeleteSchema(BaseModel):
    endpoint: str = Field(min_length=1)


class ClientPushPreferenceUpdateSchema(BaseModel):
    organization_id: int
    client_id: int
    enabled: bool


class ClientPushSendSchema(BaseModel):
    organization_id: int
    title: str = Field(min_length=1, max_length=120)
    message: str = Field(min_length=1, max_length=120)
    client_ids: list[int] | None = None
    channels: list[Literal["application", "max", "telegram"]] = Field(default_factory=lambda: ["application"], min_length=1)
    image_urls: list[str] = Field(default_factory=list, max_length=10)
    single_delivery: bool = False

    @field_validator("title", "message")
    @classmethod
    def strip_required_text(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("field is required")
        return value


class ClientPushStatusSchema(BaseModel):
    ok: bool = True
    configured: bool
    public_key: str
    enabled: bool = False
    active_count: int = 0
    max_count: int = 0
    telegram_count: int = 0
