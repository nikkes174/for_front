from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator


def normalize_phone(value: str | None) -> str | None:
    if value is None:
        return None
    digits = "".join(char for char in str(value) if char.isdigit())
    if len(digits) == 11 and digits.startswith("8"):
        digits = "7" + digits[1:]
    elif len(digits) == 10:
        digits = "7" + digits
    return digits or None


class ClientBaseSchema(BaseModel):
    organization_id: int

    last_name: str | None = Field(default=None, max_length=100)
    first_name: str | None = Field(default=None, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    full_name: str | None = Field(default=None, max_length=255)

    telegram_id: int | None = None
    max_id: int | None = None
    vk_id: int | None = None

    primary_phone: str | None = Field(default=None, max_length=32)
    secondary_phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)

    birth_date: date | None = None
    gender: str | None = Field(default=None, max_length=16)

    photo_file_id: str | None = Field(default=None, max_length=255)
    comment: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)

    importance_class: int = 0
    online_booking_enabled: bool = True

    referrer_client_id: int | None = None

    api_field_1: str | None = Field(default=None, max_length=255)
    api_field_2: str | None = Field(default=None, max_length=255)
    api_field_3: str | None = Field(default=None, max_length=255)

    created_by: int | None = None
    creation_source: str | None = Field(default=None, max_length=100)

    status: str | None = Field(default=None, max_length=50)

    @field_validator("primary_phone", "secondary_phone", mode="before")
    @classmethod
    def normalize_phone_fields(cls, value: str | None) -> str | None:
        return normalize_phone(value)


class ClientCreateSchema(ClientBaseSchema):
    pass


class ClientUpdateSchema(BaseModel):
    last_name: str | None = Field(default=None, max_length=100)
    first_name: str | None = Field(default=None, max_length=100)
    middle_name: str | None = Field(default=None, max_length=100)
    full_name: str | None = Field(default=None, max_length=255)

    telegram_id: int | None = None
    max_id: int | None = None
    vk_id: int | None = None

    primary_phone: str | None = Field(default=None, max_length=32)
    secondary_phone: str | None = Field(default=None, max_length=32)
    email: str | None = Field(default=None, max_length=255)

    birth_date: date | None = None
    gender: str | None = Field(default=None, max_length=16)

    photo_file_id: str | None = Field(default=None, max_length=255)
    comment: str | None = Field(default=None, max_length=2000)
    note: str | None = Field(default=None, max_length=2000)

    importance_class: int | None = None
    online_booking_enabled: bool | None = None

    referrer_client_id: int | None = None

    api_field_1: str | None = Field(default=None, max_length=255)
    api_field_2: str | None = Field(default=None, max_length=255)
    api_field_3: str | None = Field(default=None, max_length=255)

    status: str | None = Field(default=None, max_length=50)

    @field_validator("primary_phone", "secondary_phone", mode="before")
    @classmethod
    def normalize_phone_fields(cls, value: str | None) -> str | None:
        return normalize_phone(value)


class ClientReadSchema(ClientBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime
    updated_at: datetime | None = None
    archived_at: datetime | None = None
    archived_by: int | None = None
    last_visit_at: datetime | None = None
