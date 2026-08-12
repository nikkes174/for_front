from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client_branch import ClientBranchModel


class ClientBranchConflictError(Exception):
    pass


class ClientBranchCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientBranchModel:
        client_branch = ClientBranchModel(**payload)
        self._session.add(client_branch)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientBranchConflictError from exc

        if auto_commit:
            await self._session.refresh(client_branch)
        return client_branch

    async def get_by_id(self, client_branch_id: int) -> ClientBranchModel | None:
        return await self._session.get(ClientBranchModel, client_branch_id)

    async def get_by_client_and_branch(
        self,
        *,
        client_id: int,
        branch_id: int,
    ) -> ClientBranchModel | None:
        stmt = select(ClientBranchModel).where(
            ClientBranchModel.client_id == client_id,
            ClientBranchModel.branch_id == branch_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        client_id: int | None = None,
        branch_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientBranchModel]:
        stmt = select(ClientBranchModel)

        if client_id is not None:
            stmt = stmt.where(ClientBranchModel.client_id == client_id)

        if branch_id is not None:
            stmt = stmt.where(ClientBranchModel.branch_id == branch_id)

        stmt = stmt.order_by(ClientBranchModel.id).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        client_branch: ClientBranchModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientBranchModel:
        for field, value in payload.items():
            setattr(client_branch, field, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientBranchConflictError from exc

        if auto_commit:
            await self._session.refresh(client_branch)
        return client_branch

    async def delete(self, client_branch: ClientBranchModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(client_branch)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientBranchConflictError from exc
