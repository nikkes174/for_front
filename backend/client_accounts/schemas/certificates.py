from __future__ import annotations

from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class ClientCertificateBaseSchema(BaseModel):
    organization_id: int
    client_id: int
    certificate_id: int
    certificate_number: str
    nominal_amount: Decimal
    balance_amount: Decimal
    status: str = "active"
    issued_at: datetime
    expires_at: datetime | None = None


class ClientCertificateCreateSchema(ClientCertificateBaseSchema):
    pass


class ClientCertificateUpdateSchema(BaseModel):
    certificate_number: str | None = None
    nominal_amount: Decimal | None = None
    balance_amount: Decimal | None = None
    status: str | None = None
    issued_at: datetime | None = None
    expires_at: datetime | None = None


class ClientCertificateReadSchema(ClientCertificateBaseSchema):
    model_config = ConfigDict(from_attributes=True)

    id: int