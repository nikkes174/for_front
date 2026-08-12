from __future__ import annotations

from collections.abc import Sequence
from decimal import Decimal
from typing import Any

from client_circout.backend.client_accounts.crud.certificates import ClientCertificateConflictError, ClientCertificateCrud
from client_circout.backend.client_accounts.models.certificates import ClientCertificateModel
from client_circout.backend.client_accounts.schemas.certificates import ClientCertificateCreateSchema, ClientCertificateUpdateSchema
from client_circout.backend.client_accounts.services._utils import ACTIVE_STATUS, ARCHIVED_STATUS, decimal_or_zero, schema_to_dict
from client_circout.backend.client_accounts.services.exceptions import ClientAccountNotFoundError, ClientAccountReadOnlyError, ClientAccountSyncError


class ClientCertificateService:
    def __init__(self, certificate_crud: ClientCertificateCrud) -> None:
        self._certificate_crud = certificate_crud

    async def create_projection(
        self,
        payload: ClientCertificateCreateSchema | dict[str, Any],
    ) -> ClientCertificateModel:
        try:
            return await self._certificate_crud.create(schema_to_dict(payload))
        except ClientCertificateConflictError as exc:
            raise ClientAccountSyncError("Certificate projection conflict.") from exc

    async def get(self, client_certificate_id: int) -> ClientCertificateModel:
        certificate = await self._certificate_crud.get_by_id(client_certificate_id)
        if certificate is None:
            raise ClientAccountNotFoundError("Certificate not found.")
        return certificate

    async def get_by_number(self, certificate_number: str) -> ClientCertificateModel:
        certificate = await self._certificate_crud.get_by_certificate_number(
            certificate_number=certificate_number,
        )
        if certificate is None:
            raise ClientAccountNotFoundError("Certificate not found.")
        return certificate

    async def list_by_client(
        self,
        *,
        client_id: int,
        active_only: bool = False,
    ) -> Sequence[ClientCertificateModel]:
        if active_only:
            return await self._certificate_crud.get_active_by_client_id(client_id=client_id)
        return await self._certificate_crud.get_by_client_id(client_id=client_id)

    async def get_active_total_balance(self, *, client_id: int) -> Decimal:
        certificates = await self._certificate_crud.get_active_by_client_id(client_id=client_id)
        return sum((decimal_or_zero(certificate.balance_amount) for certificate in certificates), Decimal("0"))

    async def refresh_projection(
        self,
        *,
        client_certificate_id: int,
        payload: ClientCertificateUpdateSchema | dict[str, Any],
    ) -> ClientCertificateModel:
        certificate = await self.get(client_certificate_id)
        data = schema_to_dict(payload)
        if not data:
            return certificate

        try:
            return await self._certificate_crud.update(certificate, data)
        except ClientCertificateConflictError as exc:
            raise ClientAccountSyncError("Certificate projection update conflict.") from exc

    async def archive_projection(self, client_certificate_id: int) -> ClientCertificateModel:
        certificate = await self.get(client_certificate_id)
        if certificate.status == ARCHIVED_STATUS:
            return certificate
        return await self.refresh_projection(
            client_certificate_id=client_certificate_id,
            payload={"status": ARCHIVED_STATUS},
        )

    async def delete_projection(self, client_certificate_id: int) -> None:
        certificate = await self.get(client_certificate_id)
        try:
            await self._certificate_crud.delete(certificate)
        except ClientCertificateConflictError as exc:
            raise ClientAccountSyncError("Certificate projection delete conflict.") from exc

    async def is_active(self, client_certificate_id: int) -> bool:
        certificate = await self.get(client_certificate_id)
        return certificate.status == ACTIVE_STATUS

    async def spend_balance(self, *_: Any, **__: Any) -> None:
        raise ClientAccountReadOnlyError(
            "Certificate balance is owned by certificate service. Use projection sync only.",
        )

