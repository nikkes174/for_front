from __future__ import annotations

from collections.abc import Mapping, Sequence
from datetime import date
from typing import Any

from pydantic import BaseModel

from client_circout.backend.client_profile.crud.profile_metrics import (
    ClientMetricSnapshotConflictError,
    ClientMetricSnapshotCrud,
    ClientProfileMetricConflictError,
    ClientProfileMetricCrud,
)
from client_circout.backend.client_profile.models.profile_metrics import (
    ClientMetricSnapshotModel,
    ClientProfileMetricModel,
)
from client_circout.backend.client_profile.schemas.profile_metrics import (
    ClientMetricSnapshotCreateSchema,
    ClientMetricSnapshotUpdateSchema,
    ClientProfileMetricCreateSchema,
    ClientProfileMetricUpdateSchema,
)
from client_circout.backend.client_profile.service._utils import payload_to_dict, utc_now, today_utc
from client_circout.backend.client_profile.service.exceptions import ProfileEntityConflictError, ProfileEntityNotFoundError


class ClientProfileMetricsService:
    def __init__(
        self,
        metric_crud: ClientProfileMetricCrud,
        snapshot_crud: ClientMetricSnapshotCrud,
    ) -> None:
        self._metric_crud = metric_crud
        self._snapshot_crud = snapshot_crud

    async def create(
        self,
        payload: ClientProfileMetricCreateSchema | Mapping[str, Any],
    ) -> ClientProfileMetricModel:
        data = payload_to_dict(payload, exclude_unset=False)
        data.setdefault("updated_at", utc_now())

        try:
            return await self._metric_crud.create(data)
        except ClientProfileMetricConflictError as exc:
            raise ProfileEntityConflictError("profile metric create conflict") from exc

    async def get(self, metric_id: int) -> ClientProfileMetricModel:
        metric = await self._metric_crud.get_by_id(metric_id)
        if metric is None:
            raise ProfileEntityNotFoundError("client_profile_metric", metric_id)
        return metric

    async def get_by_client(self, client_id: int) -> ClientProfileMetricModel | None:
        return await self._metric_crud.get_by_client_id(client_id)

    async def list(
        self,
        *,
        organization_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientProfileMetricModel]:
        return await self._metric_crud.list(
            organization_id=organization_id,
            offset=offset,
            limit=limit,
        )

    async def update(
        self,
        metric_id: int,
        payload: ClientProfileMetricUpdateSchema | BaseModel | Mapping[str, Any],
    ) -> ClientProfileMetricModel:
        metric = await self.get(metric_id)
        data = payload_to_dict(payload)

        if not data:
            return metric

        data["updated_at"] = utc_now()

        try:
            return await self._metric_crud.update(metric, data)
        except ClientProfileMetricConflictError as exc:
            raise ProfileEntityConflictError("profile metric update conflict") from exc

    async def upsert_by_client(
        self,
        *,
        organization_id: int,
        client_id: int,
        payload: ClientProfileMetricUpdateSchema | BaseModel | Mapping[str, Any],
    ) -> ClientProfileMetricModel:
        metric = await self._metric_crud.get_by_client_id(client_id)
        data = payload_to_dict(payload)
        data["updated_at"] = utc_now()

        if metric is None:
            data["organization_id"] = organization_id
            data["client_id"] = client_id
            try:
                return await self._metric_crud.create(data)
            except ClientProfileMetricConflictError as exc:
                metric = await self._metric_crud.get_by_client_id(client_id)
                if metric is None:
                    raise ProfileEntityConflictError("profile metric create conflict") from exc
                return await self._metric_crud.update(metric, data)

        try:
            return await self._metric_crud.update(metric, data)
        except ClientProfileMetricConflictError as exc:
            raise ProfileEntityConflictError("profile metric update conflict") from exc

    async def delete(self, metric_id: int) -> None:
        metric = await self.get(metric_id)
        await self._metric_crud.delete(metric)

    async def create_snapshot(
        self,
        payload: ClientMetricSnapshotCreateSchema | Mapping[str, Any],
    ) -> ClientMetricSnapshotModel:
        data = payload_to_dict(payload, exclude_unset=False)
        data.setdefault("snapshot_date", today_utc())

        try:
            return await self._snapshot_crud.create(data)
        except ClientMetricSnapshotConflictError as exc:
            raise ProfileEntityConflictError("metric snapshot create conflict") from exc

    async def get_snapshot(self, snapshot_id: int) -> ClientMetricSnapshotModel:
        snapshot = await self._snapshot_crud.get_by_id(snapshot_id)
        if snapshot is None:
            raise ProfileEntityNotFoundError("client_metric_snapshot", snapshot_id)
        return snapshot

    async def list_snapshots_by_client(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientMetricSnapshotModel]:
        return await self._snapshot_crud.get_by_client_id(client_id=client_id)

    async def upsert_snapshot(
        self,
        *,
        organization_id: int,
        client_id: int,
        snapshot_date: date | None = None,
        payload: ClientMetricSnapshotUpdateSchema | BaseModel | Mapping[str, Any],
    ) -> ClientMetricSnapshotModel:
        current_date = snapshot_date or today_utc()
        snapshot = await self._snapshot_crud.get_by_client_and_date(
            client_id=client_id,
            snapshot_date=current_date,
        )
        data = payload_to_dict(payload)

        if snapshot is None:
            data["organization_id"] = organization_id
            data["client_id"] = client_id
            data["snapshot_date"] = current_date
            try:
                return await self._snapshot_crud.create(data)
            except ClientMetricSnapshotConflictError as exc:
                snapshot = await self._snapshot_crud.get_by_client_and_date(
                    client_id=client_id,
                    snapshot_date=current_date,
                )
                if snapshot is None:
                    raise ProfileEntityConflictError("metric snapshot create conflict") from exc
                return await self._snapshot_crud.update(snapshot, data)

        try:
            return await self._snapshot_crud.update(snapshot, data)
        except ClientMetricSnapshotConflictError as exc:
            raise ProfileEntityConflictError("metric snapshot update conflict") from exc

    async def delete_snapshot(self, snapshot_id: int) -> None:
        snapshot = await self.get_snapshot(snapshot_id)
        await self._snapshot_crud.delete(snapshot)
