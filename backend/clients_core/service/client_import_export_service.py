from __future__ import annotations

from collections.abc import Mapping, Sequence
from pathlib import Path
from typing import Any
from fastapi import UploadFile

from client_circout.backend.clients_core.crud.client import ClientConflictError, ClientCrud
from client_circout.backend.clients_core.crud.client_batch import (
    ClientExportBatchConflictError,
    ClientExportBatchCrud,
    ClientImportBatchConflictError,
    ClientImportBatchCrud,
)
from client_circout.backend.clients_core.crud.client_import_rows import (
    ClientImportRowConflictError,
    ClientImportRowCrud,
)
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.clients_core.models.client_batch import ClientExportBatchModel, ClientImportBatchModel
from client_circout.backend.clients_core.models.client_import_rows import ClientImportRowModel
from client_circout.backend.clients_core.service._utils import utc_now
from client_circout.backend.clients_core.service.exceptions import EntityConflictError, EntityNotFoundError

IMPORT_STATUS_CREATED = "created"
IMPORT_STATUS_PROCESSING = "processing"
IMPORT_STATUS_FINISHED = "finished"
IMPORT_STATUS_FAILED = "failed"

EXPORT_STATUS_CREATED = "created"
EXPORT_STATUS_PROCESSING = "processing"
EXPORT_STATUS_FINISHED = "finished"
EXPORT_STATUS_FAILED = "failed"

ROW_STATUS_PENDING = "pending"
ROW_STATUS_SUCCESS = "success"
ROW_STATUS_FAILED = "failed"


class ClientImportExportService:
    def __init__(
        self,
        import_batch_crud: ClientImportBatchCrud,
        import_row_crud: ClientImportRowCrud,
        export_batch_crud: ClientExportBatchCrud,
    ) -> None:
        self._import_batch_crud = import_batch_crud
        self._import_row_crud = import_row_crud
        self._export_batch_crud = export_batch_crud

    async def create_import_batch(
        self,
        *,
        organization_id: int,
        file_id: int,
        total_rows: int = 0,
        created_by: int | None = None,
        status: str = IMPORT_STATUS_CREATED,
    ) -> ClientImportBatchModel:
        try:
            return await self._import_batch_crud.create(
                {
                    "organization_id": organization_id,
                    "file_id": file_id,
                    "status": status,
                    "total_rows": total_rows,
                    "success_rows": 0,
                    "failed_rows": 0,
                    "created_by": created_by,
                    "created_at": utc_now(),
                },
            )
        except ClientImportBatchConflictError as exc:
            raise EntityConflictError("client import batch create conflict") from exc

    async def get_import_batch(self, batch_id: int) -> ClientImportBatchModel:
        batch = await self._import_batch_crud.get_by_id(batch_id)
        if batch is None:
            raise EntityNotFoundError("client_import_batch", batch_id)

        return batch

    async def list_import_batches(
        self,
        *,
        organization_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientImportBatchModel]:
        return await self._import_batch_crud.list(
            organization_id=organization_id,
            status=status,
            offset=offset,
            limit=limit,
        )

    async def start_import_batch(self, batch_id: int) -> ClientImportBatchModel:
        batch = await self.get_import_batch(batch_id)
        return await self._update_import_batch(batch, {"status": IMPORT_STATUS_PROCESSING})

    async def finish_import_batch(self, batch_id: int) -> ClientImportBatchModel:
        batch = await self.get_import_batch(batch_id)
        return await self._update_import_batch(
            batch,
            {
                "status": IMPORT_STATUS_FINISHED,
                "finished_at": utc_now(),
            },
        )

    async def fail_import_batch(self, batch_id: int) -> ClientImportBatchModel:
        batch = await self.get_import_batch(batch_id)
        return await self._update_import_batch(
            batch,
            {
                "status": IMPORT_STATUS_FAILED,
                "finished_at": utc_now(),
            },
        )

    async def create_import_row(
        self,
        *,
        batch_id: int,
        row_number: int,
        raw_data_json: dict[str, Any] | None,
        status: str = ROW_STATUS_PENDING,
        client_id: int | None = None,
        error_text: str | None = None,
    ) -> ClientImportRowModel:
        await self.get_import_batch(batch_id)

        try:
            return await self._import_row_crud.create(
                {
                    "batch_id": batch_id,
                    "row_number": row_number,
                    "raw_data_json": raw_data_json,
                    "client_id": client_id,
                    "status": status,
                    "error_text": error_text,
                },
            )
        except ClientImportRowConflictError as exc:
            raise EntityConflictError("client import row create conflict") from exc

    async def add_import_rows(
        self,
        *,
        batch_id: int,
        rows: Sequence[Mapping[str, Any]],
        start_row_number: int = 1,
    ) -> list[ClientImportRowModel]:
        batch = await self.get_import_batch(batch_id)
        created_rows: list[ClientImportRowModel] = []
        async with self._import_batch_crud.session.begin():
            for index, row in enumerate(rows, start=start_row_number):
                try:
                    created_rows.append(
                        await self._import_row_crud.create(
                            {
                                "batch_id": batch_id,
                                "row_number": index,
                                "raw_data_json": dict(row),
                                "client_id": None,
                                "status": ROW_STATUS_PENDING,
                                "error_text": None,
                            },
                            auto_commit=False,
                        ),
                    )
                except ClientImportRowConflictError as exc:
                    raise EntityConflictError("client import row create conflict") from exc

            await self._update_import_batch(
                batch,
                {"total_rows": batch.total_rows + len(created_rows)},
                auto_commit=False,
            )

        return created_rows

    async def get_import_row(self, row_id: int) -> ClientImportRowModel:
        row = await self._import_row_crud.get_by_id(row_id)
        if row is None:
            raise EntityNotFoundError("client_import_row", row_id)

        return row

    async def list_import_rows(
        self,
        *,
        batch_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientImportRowModel]:
        return await self._import_row_crud.list(
            batch_id=batch_id,
            status=status,
            offset=offset,
            limit=limit,
        )

    async def mark_import_row_success(
        self,
        *,
        row_id: int,
        client_id: int,
    ) -> ClientImportRowModel:
        return await self._change_row_status(
            row_id=row_id,
            status=ROW_STATUS_SUCCESS,
            client_id=client_id,
            error_text=None,
        )

    async def mark_import_row_failed(
        self,
        *,
        row_id: int,
        error_text: str,
    ) -> ClientImportRowModel:
        return await self._change_row_status(
            row_id=row_id,
            status=ROW_STATUS_FAILED,
            client_id=None,
            error_text=error_text,
        )

    async def create_export_batch(
        self,
        *,
        organization_id: int,
        filters_json: dict[str, Any] | None = None,
        created_by: int | None = None,
        status: str = EXPORT_STATUS_CREATED,
    ) -> ClientExportBatchModel:
        try:
            return await self._export_batch_crud.create(
                {
                    "organization_id": organization_id,
                    "filters_json": filters_json,
                    "status": status,
                    "file_id": None,
                    "created_by": created_by,
                    "created_at": utc_now(),
                },
            )
        except ClientExportBatchConflictError as exc:
            raise EntityConflictError("client export batch create conflict") from exc

    async def get_export_batch(self, batch_id: int) -> ClientExportBatchModel:
        batch = await self._export_batch_crud.get_by_id(batch_id)
        if batch is None:
            raise EntityNotFoundError("client_export_batch", batch_id)

        return batch

    async def list_export_batches(
        self,
        *,
        organization_id: int | None = None,
        status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientExportBatchModel]:
        return await self._export_batch_crud.list(
            organization_id=organization_id,
            status=status,
            offset=offset,
            limit=limit,
        )

    async def start_export_batch(self, batch_id: int) -> ClientExportBatchModel:
        batch = await self.get_export_batch(batch_id)
        return await self._update_export_batch(batch, {"status": EXPORT_STATUS_PROCESSING})

    async def finish_export_batch(
        self,
        *,
        batch_id: int,
        file_id: int,
    ) -> ClientExportBatchModel:
        batch = await self.get_export_batch(batch_id)
        return await self._update_export_batch(
            batch,
            {
                "status": EXPORT_STATUS_FINISHED,
                "file_id": file_id,
                "finished_at": utc_now(),
            },
        )

    async def fail_export_batch(self, batch_id: int) -> ClientExportBatchModel:
        batch = await self.get_export_batch(batch_id)
        return await self._update_export_batch(
            batch,
            {
                "status": EXPORT_STATUS_FAILED,
                "finished_at": utc_now(),
            },
        )

    async def _change_row_status(
        self,
        *,
        row_id: int,
        status: str,
        client_id: int | None,
        error_text: str | None,
    ) -> ClientImportRowModel:
        row = await self.get_import_row(row_id)
        batch = await self.get_import_batch(row.batch_id)
        old_status = row.status

        async with self._import_batch_crud.session.begin():
            try:
                updated_row = await self._import_row_crud.update(
                    row,
                    {
                        "status": status,
                        "client_id": client_id,
                        "error_text": error_text,
                    },
                    auto_commit=False,
                )
            except ClientImportRowConflictError as exc:
                raise EntityConflictError("client import row update conflict") from exc

            success_delta = int(status == ROW_STATUS_SUCCESS) - int(old_status == ROW_STATUS_SUCCESS)
            failed_delta = int(status == ROW_STATUS_FAILED) - int(old_status == ROW_STATUS_FAILED)

            if success_delta or failed_delta:
                await self._update_import_batch(
                    batch,
                    {
                        "success_rows": max(batch.success_rows + success_delta, 0),
                        "failed_rows": max(batch.failed_rows + failed_delta, 0),
                    },
                    auto_commit=False,
                )

        return updated_row

    async def _update_import_batch(
        self,
        batch: ClientImportBatchModel,
        payload: dict[str, Any],
        *,
        auto_commit: bool = True,
    ) -> ClientImportBatchModel:
        try:
            return await self._import_batch_crud.update(batch, payload, auto_commit=auto_commit)
        except ClientImportBatchConflictError as exc:
            raise EntityConflictError("client import batch update conflict") from exc

    async def _update_export_batch(
        self,
        batch: ClientExportBatchModel,
        payload: dict[str, Any],
        *,
        auto_commit: bool = True,
    ) -> ClientExportBatchModel:
        try:
            return await self._export_batch_crud.update(batch, payload, auto_commit=auto_commit)
        except ClientExportBatchConflictError as exc:
            raise EntityConflictError("client export batch update conflict") from exc

class ClientDownloadPhoto:
    def __init__(self, client_crud: ClientCrud, storage_dir: Path) -> None:
        self._client_crud = client_crud
        self._storage_dir = storage_dir

    async def upload_photo(
        self,
        *,
        client_id: int,
        file: UploadFile,
    ) -> ClientModel:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise EntityNotFoundError("client", client_id)

        extension = self._resolve_extension(file)
        self._storage_dir.mkdir(parents=True, exist_ok=True)
        self._delete_existing_files(client_id)

        file_name = f"{client_id}{extension}"
        target_path = self._storage_dir / file_name
        content = await file.read()
        target_path.write_bytes(content)

        try:
            return await self._client_crud.update(
                client,
                {
                    "photo_file_id": file_name,
                    "updated_at": utc_now(),
                },
            )
        except ClientConflictError as exc:
            raise EntityConflictError(f"client photo update conflict: {exc}") from exc

    async def get_photo_path(self, *, client_id: int) -> Path | None:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise EntityNotFoundError("client", client_id)
        if not client.photo_file_id:
            return None

        path = self._storage_dir / client.photo_file_id
        if not path.exists():
            await self._client_crud.update(
                client,
                {"photo_file_id": None, "updated_at": utc_now()},
            )
            return None
        return path

    def _delete_existing_files(self, client_id: int) -> None:
        for existing in self._storage_dir.glob(f"{client_id}.*"):
            existing.unlink(missing_ok=True)

    @staticmethod
    def _resolve_extension(file: UploadFile) -> str:
        source_name = Path(file.filename or "")
        suffix = source_name.suffix.lower()
        if suffix in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            return ".jpg" if suffix == ".jpeg" else suffix

        by_content_type = {
            "image/jpeg": ".jpg",
            "image/png": ".png",
            "image/webp": ".webp",
            "image/gif": ".gif",
        }
        return by_content_type.get(file.content_type or "", ".jpg")
