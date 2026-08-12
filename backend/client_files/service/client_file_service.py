from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_files.crud import (
    ClientFileConflictError as ClientFileCrudConflictError,
    ClientFileCrud, ClientFileConflictError,
)
from client_circout.backend.client_files.models import ClientFileModel
from client_circout.backend.client_files.schemas import ClientFileCreateSchema, ClientFileUpdateSchema
from client_circout.backend.client_files.service._utils import utc_now, to_payload, require_found, clean_update_payload
from client_circout.backend.client_files.service.client_file_access_service import ClientFileAccessService, ClientFileAccessContext
from client_circout.backend.client_files.service.client_file_category_service import ClientFileCategoryService
from client_circout.backend.client_files.service.client_file_storage_service import ClientFileStorageService
from client_circout.backend.client_files.service.exceptions import ClientFileStorageError


class ClientFileService:
    def __init__(
        self,
        file_crud: ClientFileCrud,
        *,
        category_service: ClientFileCategoryService | None = None,
        storage_service: ClientFileStorageService | None = None,
        access_service: ClientFileAccessService | None = None,
    ) -> None:
        self._file_crud = file_crud
        self._category_service = category_service or ClientFileCategoryService()
        self._storage_service = storage_service
        self._access_service = access_service or ClientFileAccessService()

    async def upload_file(
        self,
        *,
        organization_id: int,
        client_id: int,
        file_category: str,
        file_name: str,
        mime_type: str,
        content: bytes,
        uploaded_by: int | None = None,
        access_context: ClientFileAccessContext | None = None,
    ) -> ClientFileModel:
        if self._storage_service is None:
            raise ClientFileStorageError("Storage service is not configured")

        if access_context is not None:
            self._access_service.ensure_can_upload_file(
                organization_id=organization_id,
                client_id=client_id,
                context=access_context,
            )

        category = self._category_service.validate_category(file_category)
        stored_file = await self._storage_service.save_file(
            organization_id=organization_id,
            client_id=client_id,
            file_name=file_name,
            mime_type=mime_type,
            content=content,
        )

        try:
            return await self.create_file_record(
                {
                    "client_id": client_id,
                    "organization_id": organization_id,
                    "file_category": category,
                    "file_name": stored_file.file_name,
                    "mime_type": stored_file.mime_type,
                    "size": stored_file.size,
                    "storage_key": stored_file.storage_key,
                    "uploaded_by": uploaded_by,
                }
            )
        except Exception:
            await self._storage_service.delete_file(storage_key=stored_file.storage_key)
            raise

    async def create_file_record(self, data: ClientFileCreateSchema | dict) -> ClientFileModel:
        payload = to_payload(data)
        payload["file_category"] = self._category_service.validate_category(payload["file_category"])
        payload.setdefault("created_at", utc_now())

        try:
            return await self._file_crud.create(payload)
        except ClientFileCrudConflictError as exc:
            raise ClientFileConflictError("Client file already exists or violates constraints") from exc

    async def get_file(
        self,
        file_id: int,
        *,
        access_context: ClientFileAccessContext | None = None,
    ) -> ClientFileModel:
        file = require_found(await self._file_crud.get_by_id(file_id), "client_file", file_id)

        if access_context is not None:
            self._access_service.ensure_can_view_file(file=file, context=access_context)

        return file

    async def get_file_by_storage_key(
        self,
        *,
        storage_key: str,
        access_context: ClientFileAccessContext | None = None,
    ) -> ClientFileModel:
        file = await self._file_crud.get_by_storage_key(storage_key=storage_key)
        if file is None:
            raise ClientFileStorageError(f"Client file with storage_key={storage_key!r} not found")

        if access_context is not None:
            self._access_service.ensure_can_view_file(file=file, context=access_context)

        return file

    async def list_client_files(
        self,
        *,
        client_id: int,
        access_context: ClientFileAccessContext | None = None,
    ) -> Sequence[ClientFileModel]:
        files = await self._file_crud.get_by_client_id(client_id=client_id)

        if access_context is None:
            return files

        return [
            file
            for file in files
            if self._access_service.can_view_file(file=file, context=access_context)
        ]

    async def list_client_files_by_category(
        self,
        *,
        client_id: int,
        file_category: str,
        access_context: ClientFileAccessContext | None = None,
    ) -> Sequence[ClientFileModel]:
        category = self._category_service.validate_category(file_category)
        files = await self._file_crud.get_by_category(client_id=client_id, file_category=category)

        if access_context is None:
            return files

        return [
            file
            for file in files
            if self._access_service.can_view_file(file=file, context=access_context)
        ]

    async def update_file_metadata(
        self,
        file_id: int,
        data: ClientFileUpdateSchema | dict,
        *,
        access_context: ClientFileAccessContext | None = None,
    ) -> ClientFileModel:
        file = await self.get_file(file_id)

        if access_context is not None:
            self._access_service.ensure_can_update_file(file=file, context=access_context)

        payload = clean_update_payload(data)
        if "file_category" in payload:
            payload["file_category"] = self._category_service.validate_category(payload["file_category"])

        try:
            return await self._file_crud.update(file, payload)
        except ClientFileCrudConflictError as exc:
            raise ClientFileConflictError("Client file metadata update violates constraints") from exc

    async def archive_file(
        self,
        file_id: int,
        *,
        access_context: ClientFileAccessContext | None = None,
    ) -> ClientFileModel:
        return await self.update_file_metadata(
            file_id,
            {"file_category": ClientFileCategoryService.ARCHIVED},
            access_context=access_context,
        )

    async def get_download_url(
        self,
        file_id: int,
        *,
        access_context: ClientFileAccessContext | None = None,
    ) -> str | None:
        if self._storage_service is None:
            raise ClientFileStorageError("Storage service is not configured")

        file = await self.get_file(file_id)

        if access_context is not None:
            self._access_service.ensure_can_download_file(file=file, context=access_context)

        return self._storage_service.get_download_url(storage_key=file.storage_key)

    async def read_file_content(
        self,
        file_id: int,
        *,
        access_context: ClientFileAccessContext | None = None,
    ) -> bytes:
        if self._storage_service is None:
            raise ClientFileStorageError("Storage service is not configured")

        file = await self.get_file(file_id)

        if access_context is not None:
            self._access_service.ensure_can_download_file(file=file, context=access_context)

        return await self._storage_service.read_file(storage_key=file.storage_key)

    async def delete_file_metadata(
        self,
        file_id: int,
        *,
        access_context: ClientFileAccessContext | None = None,
    ) -> None:
        file = await self.get_file(file_id)

        if access_context is not None:
            self._access_service.ensure_can_delete_file(file=file, context=access_context)

        try:
            await self._file_crud.delete(file)
        except ClientFileCrudConflictError as exc:
            raise ClientFileConflictError("Client file metadata delete violates constraints") from exc

    async def delete_file_with_storage(
        self,
        file_id: int,
        *,
        access_context: ClientFileAccessContext | None = None,
    ) -> None:
        if self._storage_service is None:
            raise ClientFileStorageError("Storage service is not configured")

        file = await self.get_file(file_id)

        if access_context is not None:
            self._access_service.ensure_can_delete_file(file=file, context=access_context)

        await self._storage_service.delete_file(storage_key=file.storage_key)
        await self.delete_file_metadata(file.id)
