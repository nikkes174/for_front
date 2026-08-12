from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client import (
    ClientModel,
    ClientOrganizationModel,
    client_organization_filter,
)


class ClientConflictError(Exception):
    pass


class ClientCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @property
    def session(self) -> AsyncSession:
        return self._session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientModel:
        client = ClientModel(**payload)
        self._session.add(client)

        try:
            await self._session.flush()
            self._session.add(ClientOrganizationModel(
                client_id=client.id,
                organization_id=client.organization_id,
            ))
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientConflictError(str(getattr(exc, "orig", exc))) from exc

        if auto_commit:
            await self._session.refresh(client)
        return client

    async def get_by_id(self, client_id: int) -> ClientModel | None:
        return await self._session.get(ClientModel, client_id)

    async def get_by_telegram_id(self, telegram_id: int) -> ClientModel | None:
        stmt = select(ClientModel).where(ClientModel.telegram_id == telegram_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_org_and_telegram_id(
        self,
        organization_id: int,
        telegram_id: int,
    ) -> ClientModel | None:
        stmt = select(ClientModel).where(
            client_organization_filter(organization_id),
            ClientModel.telegram_id == telegram_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_max_id(self, max_id: int) -> ClientModel | None:
        stmt = select(ClientModel).where(ClientModel.max_id == max_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_org_and_max_id(
        self,
        organization_id: int,
        max_id: int,
    ) -> ClientModel | None:
        stmt = select(ClientModel).where(
            client_organization_filter(organization_id),
            ClientModel.max_id == max_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_vk_id(self, vk_id: int) -> ClientModel | None:
        stmt = select(ClientModel).where(ClientModel.vk_id == vk_id)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_org_and_vk_id(
        self,
        organization_id: int,
        vk_id: int,
    ) -> ClientModel | None:
        stmt = select(ClientModel).where(
            client_organization_filter(organization_id),
            ClientModel.vk_id == vk_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_primary_phone(self, phone: str) -> ClientModel | None:
        stmt = select(ClientModel).where(ClientModel.primary_phone == phone).order_by(ClientModel.id.asc()).limit(1)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_org_and_primary_phone(
        self,
        organization_id: int,
        phone: str,
    ) -> ClientModel | None:
        stmt = select(ClientModel).where(
            client_organization_filter(organization_id),
            ClientModel.primary_phone == phone,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_email(self, email: str) -> ClientModel | None:
        stmt = select(ClientModel).where(ClientModel.email == email)
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_org_and_email(
        self,
        organization_id: int,
        email: str,
    ) -> ClientModel | None:
        stmt = select(ClientModel).where(
            client_organization_filter(organization_id),
            ClientModel.email == email,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        organization_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientModel]:
        stmt = select(ClientModel)

        if organization_id is not None:
            stmt = stmt.where(client_organization_filter(organization_id))

        if status is not None:
            stmt = stmt.where(ClientModel.status == status)

        stmt = stmt.order_by(ClientModel.id).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def add_organization(self, client: ClientModel, organization_id: int) -> ClientModel:
        link = await self._session.get(ClientOrganizationModel, (client.id, organization_id))
        if link is not None:
            return client
        self._session.add(ClientOrganizationModel(
            client_id=client.id,
            organization_id=organization_id,
        ))
        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientConflictError(str(getattr(exc, "orig", exc))) from exc
        return client

    async def update(self, client: ClientModel, payload: dict, *, auto_commit: bool = True) -> ClientModel:
        for field, value in payload.items():
            setattr(client, field, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientConflictError(str(getattr(exc, "orig", exc))) from exc

        if auto_commit:
            await self._session.refresh(client)
        return client

    async def delete(self, client: ClientModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(client)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientConflictError(str(getattr(exc, "orig", exc))) from exc
