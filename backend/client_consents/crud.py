from __future__ import annotations

from collections.abc import Sequence
from datetime import datetime

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_consents.models import ClientConsentModel


class ClientConsentConflictError(Exception):
    pass


class ClientConsentCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientConsentModel:
        consent = ClientConsentModel(**payload)
        self._session.add(consent)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientConsentConflictError from exc

        await self._session.refresh(consent)
        return consent

    async def get_by_id(
        self,
        consent_id: int,
    ) -> ClientConsentModel | None:
        return await self._session.get(ClientConsentModel, consent_id)

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientConsentModel]:
        stmt = (
            select(ClientConsentModel)
            .where(ClientConsentModel.client_id == client_id)
            .order_by(ClientConsentModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_current_by_client_id(
        self,
        *,
        client_id: int,
    ) -> ClientConsentModel | None:
        stmt = (
            select(ClientConsentModel)
            .where(
                ClientConsentModel.client_id == client_id,
                ClientConsentModel.consent_revoked_at.is_(None),
            )
            .order_by(ClientConsentModel.created_at.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(
        self,
        consent: ClientConsentModel,
        payload: dict,
    ) -> ClientConsentModel:
        for key, value in payload.items():
            setattr(consent, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientConsentConflictError from exc

        await self._session.refresh(consent)
        return consent

    async def revoke(
        self,
        consent: ClientConsentModel,
        *,
        revoked_at: datetime,
        comment: str | None = None,
    ) -> ClientConsentModel:
        consent.consent_revoked_at = revoked_at
        consent.marketing_messages_allowed = False
        consent.sms_allowed = False
        consent.email_allowed = False
        consent.telegram_allowed = False

        if comment is not None:
            consent.comment = comment

        await self._session.commit()
        await self._session.refresh(consent)

        return consent

    async def delete(self, consent: ClientConsentModel) -> None:
        await self._session.delete(consent)
        await self._session.commit()