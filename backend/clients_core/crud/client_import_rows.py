from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client_import_rows import ClientImportRowModel


class ClientImportRowConflictError(Exception):
    pass

class ClientImportRowCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientImportRowModel:
        row = ClientImportRowModel(**payload)
        self._session.add(row)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientImportRowConflictError from exc

        if auto_commit:
            await self._session.refresh(row)
        return row

    async def get_by_id(self, row_id: int) -> ClientImportRowModel | None:
        return await self._session.get(ClientImportRowModel, row_id)

    async def list(
        self,
        *,
        batch_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientImportRowModel]:
        stmt = select(ClientImportRowModel)

        if batch_id is not None:
            stmt = stmt.where(ClientImportRowModel.batch_id == batch_id)

        if status is not None:
            stmt = stmt.where(ClientImportRowModel.status == status)

        stmt = stmt.order_by(ClientImportRowModel.row_number).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        row: ClientImportRowModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientImportRowModel:
        for field, value in payload.items():
            setattr(row, field, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientImportRowConflictError from exc

        if auto_commit:
            await self._session.refresh(row)
        return row

    async def delete(self, row: ClientImportRowModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(row)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientImportRowConflictError from exc
