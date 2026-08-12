from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client_duplicate_candidates import ClientDuplicateCandidateModel


class ClientDuplicateCandidateConflictError(Exception):
    pass


class ClientDuplicateCandidateCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientDuplicateCandidateModel:
        candidate = ClientDuplicateCandidateModel(**payload)
        self._session.add(candidate)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientDuplicateCandidateConflictError from exc

        if auto_commit:
            await self._session.refresh(candidate)
        return candidate

    async def get_by_id(
        self,
        candidate_id: int,
    ) -> ClientDuplicateCandidateModel | None:
        return await self._session.get(ClientDuplicateCandidateModel, candidate_id)

    async def get_by_clients(
        self,
        *,
        client_id: int,
        duplicate_client_id: int,
    ) -> ClientDuplicateCandidateModel | None:
        stmt = select(ClientDuplicateCandidateModel).where(
            ClientDuplicateCandidateModel.client_id == client_id,
            ClientDuplicateCandidateModel.duplicate_client_id == duplicate_client_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        organization_id: int | None = None,
        client_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientDuplicateCandidateModel]:
        stmt = select(ClientDuplicateCandidateModel)

        if organization_id is not None:
            stmt = stmt.where(
                ClientDuplicateCandidateModel.organization_id == organization_id,
            )

        if client_id is not None:
            stmt = stmt.where(ClientDuplicateCandidateModel.client_id == client_id)

        if status is not None:
            stmt = stmt.where(ClientDuplicateCandidateModel.status == status)

        stmt = stmt.order_by(ClientDuplicateCandidateModel.id.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        candidate: ClientDuplicateCandidateModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientDuplicateCandidateModel:
        for field, value in payload.items():
            setattr(candidate, field, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientDuplicateCandidateConflictError from exc

        if auto_commit:
            await self._session.refresh(candidate)
        return candidate

    async def delete(self, candidate: ClientDuplicateCandidateModel, *, auto_commit: bool = True) -> None:
        await self._session.delete(candidate)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientDuplicateCandidateConflictError from exc
