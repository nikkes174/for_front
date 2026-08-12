from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client_merge_operations import ClientMergeOperationModel


class ClientMergeOperationConflictError(Exception):
    pass


class ClientMergeOperationCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientMergeOperationModel:
        operation = ClientMergeOperationModel(**payload)
        self._session.add(operation)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientMergeOperationConflictError from exc

        if auto_commit:
            await self._session.refresh(operation)
        return operation

    async def get_by_id(self, operation_id: int) -> ClientMergeOperationModel | None:
        return await self._session.get(ClientMergeOperationModel, operation_id)

    async def list(
        self,
        *,
        organization_id: int | None = None,
        primary_client_id: int | None = None,
        duplicate_client_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientMergeOperationModel]:
        stmt = select(ClientMergeOperationModel)

        if organization_id is not None:
            stmt = stmt.where(ClientMergeOperationModel.organization_id == organization_id)

        if primary_client_id is not None:
            stmt = stmt.where(ClientMergeOperationModel.primary_client_id == primary_client_id)

        if duplicate_client_id is not None:
            stmt = stmt.where(
                ClientMergeOperationModel.duplicate_client_id == duplicate_client_id,
            )

        stmt = stmt.order_by(ClientMergeOperationModel.id.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def delete(self, operation: ClientMergeOperationModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(operation)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientMergeOperationConflictError from exc
