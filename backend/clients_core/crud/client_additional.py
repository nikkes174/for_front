from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client_additional import ClientAdditionalFieldValueModel, ClientAdditionalFieldModel


class ClientAdditionalFieldValueConflictError(Exception):
    pass


class ClientAdditionalFieldValueCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientAdditionalFieldValueModel:
        value = ClientAdditionalFieldValueModel(**payload)
        self._session.add(value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientAdditionalFieldValueConflictError from exc

        if auto_commit:
            await self._session.refresh(value)
        return value

    async def get_by_id(
        self,
        value_id: int,
    ) -> ClientAdditionalFieldValueModel | None:
        return await self._session.get(ClientAdditionalFieldValueModel, value_id)

    async def get_by_client_and_field(
        self,
        *,
        client_id: int,
        field_id: int,
    ) -> ClientAdditionalFieldValueModel | None:
        stmt = select(ClientAdditionalFieldValueModel).where(
            ClientAdditionalFieldValueModel.client_id == client_id,
            ClientAdditionalFieldValueModel.field_id == field_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        client_id: int | None = None,
        field_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientAdditionalFieldValueModel]:
        stmt = select(ClientAdditionalFieldValueModel)

        if client_id is not None:
            stmt = stmt.where(ClientAdditionalFieldValueModel.client_id == client_id)

        if field_id is not None:
            stmt = stmt.where(ClientAdditionalFieldValueModel.field_id == field_id)

        stmt = stmt.order_by(ClientAdditionalFieldValueModel.id).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        value: ClientAdditionalFieldValueModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientAdditionalFieldValueModel:
        for field, field_value in payload.items():
            setattr(value, field, field_value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientAdditionalFieldValueConflictError from exc

        if auto_commit:
            await self._session.refresh(value)
        return value

    async def delete(self, value: ClientAdditionalFieldValueModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientAdditionalFieldValueConflictError from exc

class ClientAdditionalFieldConflictError(Exception):
    """Raised when a unique additional field constraint is violated."""


class ClientAdditionalFieldCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(
        self,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientAdditionalFieldModel:
        field = ClientAdditionalFieldModel(**payload)
        self._session.add(field)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientAdditionalFieldConflictError from exc

        if auto_commit:
            await self._session.refresh(field)
        return field

    async def get_by_id(
        self,
        field_id: int,
    ) -> ClientAdditionalFieldModel | None:
        return await self._session.get(ClientAdditionalFieldModel, field_id)

    async def get_by_code(
        self,
        *,
        organization_id: int,
        code: str,
    ) -> ClientAdditionalFieldModel | None:
        stmt = select(ClientAdditionalFieldModel).where(
            ClientAdditionalFieldModel.organization_id == organization_id,
            ClientAdditionalFieldModel.code == code,
        )

        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        organization_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientAdditionalFieldModel]:
        stmt = select(ClientAdditionalFieldModel)

        if organization_id is not None:
            stmt = stmt.where(
                ClientAdditionalFieldModel.organization_id == organization_id,
            )

        stmt = stmt.order_by(ClientAdditionalFieldModel.id).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        field: ClientAdditionalFieldModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientAdditionalFieldModel:
        for key, value in payload.items():
            setattr(field, key, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientAdditionalFieldConflictError from exc

        if auto_commit:
            await self._session.refresh(field)
        return field

    async def delete(
        self,
        field: ClientAdditionalFieldModel,
        *,
        auto_commit: bool = True,
    ) -> None:
        await self._session.delete(field)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientAdditionalFieldConflictError from exc
