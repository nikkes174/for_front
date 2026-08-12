from __future__ import annotations

from collections.abc import Sequence
from datetime import date
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_profile.models.profile_metrics import ClientProfileMetricModel, ClientMetricSnapshotModel


class ClientProfileMetricConflictError(Exception):
    pass


class ClientProfileMetricCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientProfileMetricModel:
        metric = ClientProfileMetricModel(**payload)
        self._session.add(metric)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientProfileMetricConflictError from exc

        if auto_commit:
            await self._session.refresh(metric)
        return metric

    async def get_by_id(self, metric_id: int) -> ClientProfileMetricModel | None:
        return await self._session.get(ClientProfileMetricModel, metric_id)

    async def get_by_client_id(self, client_id: int) -> ClientProfileMetricModel | None:
        stmt = select(ClientProfileMetricModel).where(
            ClientProfileMetricModel.client_id == client_id,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def list(
        self,
        *,
        organization_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientProfileMetricModel]:
        stmt = select(ClientProfileMetricModel)

        if organization_id is not None:
            stmt = stmt.where(ClientProfileMetricModel.organization_id == organization_id)

        stmt = stmt.order_by(ClientProfileMetricModel.id.desc()).offset(offset).limit(limit)

        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        metric: ClientProfileMetricModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientProfileMetricModel:
        for field, value in payload.items():
            setattr(metric, field, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientProfileMetricConflictError from exc

        if auto_commit:
            await self._session.refresh(metric)
        return metric

    async def delete(self, metric: ClientProfileMetricModel) -> None:
        await self._session.delete(metric)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientProfileMetricConflictError from exc


class ClientMetricSnapshotConflictError(Exception):
    pass


class ClientMetricSnapshotCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict, *, auto_commit: bool = True) -> ClientMetricSnapshotModel:
        snapshot = ClientMetricSnapshotModel(**payload)
        self._session.add(snapshot)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientMetricSnapshotConflictError from exc

        if auto_commit:
            await self._session.refresh(snapshot)
        return snapshot

    async def get_by_id(
        self,
        snapshot_id: int,
    ) -> ClientMetricSnapshotModel | None:
        return await self._session.get(ClientMetricSnapshotModel, snapshot_id)

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientMetricSnapshotModel]:
        stmt = (
            select(ClientMetricSnapshotModel)
            .where(ClientMetricSnapshotModel.client_id == client_id)
            .order_by(ClientMetricSnapshotModel.snapshot_date.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_client_and_date(
        self,
        *,
        client_id: int,
        snapshot_date: date,
    ) -> ClientMetricSnapshotModel | None:
        stmt = select(ClientMetricSnapshotModel).where(
            ClientMetricSnapshotModel.client_id == client_id,
            ClientMetricSnapshotModel.snapshot_date == snapshot_date,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def update(
        self,
        snapshot: ClientMetricSnapshotModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientMetricSnapshotModel:
        for key, value in payload.items():
            setattr(snapshot, key, value)

        try:
            if auto_commit:
                await self._session.commit()
            else:
                await self._session.flush()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientMetricSnapshotConflictError from exc

        if auto_commit:
            await self._session.refresh(snapshot)
        return snapshot

    async def delete(self, snapshot: ClientMetricSnapshotModel) -> None:
        await self._session.delete(snapshot)
        await self._session.commit()
