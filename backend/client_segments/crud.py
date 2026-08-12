from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_segments.models import ClientSegmentModel, ClientSegmentMemberModel


class ClientSegmentConflictError(Exception):
    pass


class ClientSegmentCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientSegmentModel:
        segment = ClientSegmentModel(**payload)
        self._session.add(segment)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientSegmentConflictError from exc

        await self._session.refresh(segment)
        return segment

    async def get_by_id(self, segment_id: int) -> ClientSegmentModel | None:
        return await self._session.get(ClientSegmentModel, segment_id)

    async def list(
        self,
        *,
        organization_id: int | None = None,
        status: str | None = None,
        is_dynamic: bool | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientSegmentModel]:
        stmt = select(ClientSegmentModel)

        if organization_id is not None:
            stmt = stmt.where(ClientSegmentModel.organization_id == organization_id)

        if status is not None:
            stmt = stmt.where(ClientSegmentModel.status == status)

        if is_dynamic is not None:
            stmt = stmt.where(ClientSegmentModel.is_dynamic == is_dynamic)

        stmt = stmt.order_by(ClientSegmentModel.id.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        segment: ClientSegmentModel,
        payload: dict,
    ) -> ClientSegmentModel:
        for field, value in payload.items():
            setattr(segment, field, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientSegmentConflictError from exc

        await self._session.refresh(segment)
        return segment

    async def delete(self, segment: ClientSegmentModel) -> None:
        await self._session.delete(segment)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientSegmentConflictError from exc

class ClientSegmentMemberConflictError(Exception):
    pass


class ClientSegmentMemberCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientSegmentMemberModel:
        member = ClientSegmentMemberModel(**payload)
        self._session.add(member)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientSegmentMemberConflictError from exc

        await self._session.refresh(member)
        return member

    async def get_by_id(self, member_id: int) -> ClientSegmentMemberModel | None:
        return await self._session.get(ClientSegmentMemberModel, member_id)

    async def get_by_segment_and_client(
        self,
        *,
        segment_id: int,
        client_id: int,
    ) -> ClientSegmentMemberModel | None:
        stmt = select(ClientSegmentMemberModel).where(
            ClientSegmentMemberModel.segment_id == segment_id,
            ClientSegmentMemberModel.client_id == client_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        segment_id: int | None = None,
        client_id: int | None = None,
        membership_status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientSegmentMemberModel]:
        stmt = select(ClientSegmentMemberModel)

        if segment_id is not None:
            stmt = stmt.where(ClientSegmentMemberModel.segment_id == segment_id)

        if client_id is not None:
            stmt = stmt.where(ClientSegmentMemberModel.client_id == client_id)

        if membership_status is not None:
            stmt = stmt.where(
                ClientSegmentMemberModel.membership_status == membership_status,
            )

        stmt = stmt.order_by(ClientSegmentMemberModel.id.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        member: ClientSegmentMemberModel,
        payload: dict,
    ) -> ClientSegmentMemberModel:
        for field, value in payload.items():
            setattr(member, field, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientSegmentMemberConflictError from exc

        await self._session.refresh(member)
        return member

    async def delete(self, member: ClientSegmentMemberModel) -> None:
        await self._session.delete(member)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientSegmentMemberConflictError from exc