from __future__ import annotations

from collections.abc import Sequence
from decimal import Decimal

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_accounts.models.certificates import ClientCertificateModel


class ClientCertificateConflictError(Exception):
    pass


class ClientCertificateCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientCertificateModel:
        certificate = ClientCertificateModel(**payload)
        self._session.add(certificate)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCertificateConflictError from exc

        await self._session.refresh(certificate)
        return certificate

    async def get_by_id(
        self,
        client_certificate_id: int,
    ) -> ClientCertificateModel | None:
        return await self._session.get(
            ClientCertificateModel,
            client_certificate_id,
        )

    async def get_by_certificate_number(
        self,
        *,
        certificate_number: str,
    ) -> ClientCertificateModel | None:
        stmt = select(ClientCertificateModel).where(
            ClientCertificateModel.certificate_number == certificate_number,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientCertificateModel]:
        stmt = (
            select(ClientCertificateModel)
            .where(ClientCertificateModel.client_id == client_id)
            .order_by(ClientCertificateModel.issued_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_active_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientCertificateModel]:
        stmt = (
            select(ClientCertificateModel)
            .where(
                ClientCertificateModel.client_id == client_id,
                ClientCertificateModel.status == "active",
            )
            .order_by(ClientCertificateModel.expires_at.asc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        certificate: ClientCertificateModel,
        payload: dict,
    ) -> ClientCertificateModel:
        for key, value in payload.items():
            setattr(certificate, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientCertificateConflictError from exc

        await self._session.refresh(certificate)
        return certificate

    async def update_balance(
        self,
        certificate: ClientCertificateModel,
        *,
        balance_amount: Decimal,
    ) -> ClientCertificateModel:
        certificate.balance_amount = balance_amount

        await self._session.commit()
        await self._session.refresh(certificate)

        return certificate

    async def delete(self, certificate: ClientCertificateModel) -> None:
        await self._session.delete(certificate)
        await self._session.commit()
