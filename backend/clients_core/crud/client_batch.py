from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client_batch import ClientImportBatchModel, ClientExportBatchModel


class ClientImportBatchConflictError(Exception):
    pass


class ClientImportBatchCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    @property
    def session(self) -> AsyncSession:
        return self._session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientImportBatchModel:
        batch = ClientImportBatchModel(**payload)
        self._session.add(batch)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientImportBatchConflictError from exc

        if auto_commit:
            await self._session.refresh(batch)
        return batch

    async def get_by_id(self, batch_id: int) -> ClientImportBatchModel | None:
        return await self._session.get(ClientImportBatchModel, batch_id)

    async def list(
        self,
        *,
        organization_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientImportBatchModel]:
        stmt = select(ClientImportBatchModel)

        if organization_id is not None:
            stmt = stmt.where(ClientImportBatchModel.organization_id == organization_id)

        if status is not None:
            stmt = stmt.where(ClientImportBatchModel.status == status)

        stmt = stmt.order_by(ClientImportBatchModel.id.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        batch: ClientImportBatchModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientImportBatchModel:
        for field, value in payload.items():
            setattr(batch, field, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientImportBatchConflictError from exc

        if auto_commit:
            await self._session.refresh(batch)
        return batch

    async def delete(self, batch: ClientImportBatchModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(batch)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientImportBatchConflictError from exc


class ClientExportBatchConflictError(Exception):
    """Raised when a unique client export batch constraint is violated."""


class ClientExportBatchCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientExportBatchModel:
        batch = ClientExportBatchModel(**payload)
        self._session.add(batch)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientExportBatchConflictError from exc

        if auto_commit:
            await self._session.refresh(batch)
        return batch

    async def get_by_id(self, batch_id: int) -> ClientExportBatchModel | None:
        return await self._session.get(ClientExportBatchModel, batch_id)

    async def list(
        self,
        *,
        organization_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientExportBatchModel]:
        stmt = select(ClientExportBatchModel)

        if organization_id is not None:
            stmt = stmt.where(ClientExportBatchModel.organization_id == organization_id)

        if status is not None:
            stmt = stmt.where(ClientExportBatchModel.status == status)

        stmt = stmt.order_by(ClientExportBatchModel.id.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        batch: ClientExportBatchModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientExportBatchModel:
        for field, value in payload.items():
            setattr(batch, field, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientExportBatchConflictError from exc

        if auto_commit:
            await self._session.refresh(batch)
        return batch

    async def delete(self, batch: ClientExportBatchModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(batch)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientExportBatchConflictError from exc
