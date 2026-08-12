from __future__ import annotations

import asyncio
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol
from uuid import uuid4

from client_circout.backend.client_files.service._utils import safe_file_name
from client_circout.backend.client_files.service.exceptions import ClientFileStorageError, ClientFileValidationError


@dataclass(frozen=True, slots=True)
class StoredClientFile:
    storage_key: str
    file_name: str
    mime_type: str
    size: int


class ClientFileStorageBackend(Protocol):
    async def save(self, *, storage_key: str, content: bytes) -> None: ...

    async def read(self, *, storage_key: str) -> bytes: ...

    async def delete(self, *, storage_key: str) -> None: ...

    async def exists(self, *, storage_key: str) -> bool: ...

    def get_public_url(self, *, storage_key: str) -> str | None: ...


class LocalClientFileStorage(ClientFileStorageBackend):
    def __init__(self, *, base_path: Path | str, public_url_prefix: str | None = None) -> None:
        self._base_path = Path(base_path)
        self._public_url_prefix = public_url_prefix.rstrip("/") if public_url_prefix else None

    async def save(self, *, storage_key: str, content: bytes) -> None:
        path = self._resolve_path(storage_key)
        await asyncio.to_thread(path.parent.mkdir, parents=True, exist_ok=True)
        await asyncio.to_thread(path.write_bytes, content)

    async def read(self, *, storage_key: str) -> bytes:
        path = self._resolve_path(storage_key)
        if not await asyncio.to_thread(path.exists):
            raise ClientFileStorageError(f"File with storage_key={storage_key!r} not found in storage")
        return await asyncio.to_thread(path.read_bytes)

    async def delete(self, *, storage_key: str) -> None:
        path = self._resolve_path(storage_key)
        if await asyncio.to_thread(path.exists):
            await asyncio.to_thread(path.unlink)

    async def exists(self, *, storage_key: str) -> bool:
        return await asyncio.to_thread(self._resolve_path(storage_key).exists)

    def get_public_url(self, *, storage_key: str) -> str | None:
        if self._public_url_prefix is None:
            return None
        return f"{self._public_url_prefix}/{storage_key}"

    def _resolve_path(self, storage_key: str) -> Path:
        path = (self._base_path / storage_key).resolve()
        base_path = self._base_path.resolve()

        if not path.is_relative_to(base_path):
            raise ClientFileStorageError("Invalid storage_key path")

        return path


class ClientFileStorageService:
    DEFAULT_ALLOWED_MIME_TYPES = frozenset({
        "image/jpeg",
        "image/png",
        "image/webp",
        "application/pdf",
        "text/plain",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    })

    def __init__(
        self,
        storage_backend: ClientFileStorageBackend,
        *,
        max_size_bytes: int = 25 * 1024 * 1024,
        allowed_mime_types: set[str] | frozenset[str] | None = None,
    ) -> None:
        self._storage_backend = storage_backend
        self._max_size_bytes = max_size_bytes
        self._allowed_mime_types = allowed_mime_types or self.DEFAULT_ALLOWED_MIME_TYPES

    async def save_file(
        self,
        *,
        organization_id: int,
        client_id: int,
        file_name: str,
        mime_type: str,
        content: bytes,
    ) -> StoredClientFile:
        safe_name = safe_file_name(file_name)
        size = len(content)
        self.validate_file(mime_type=mime_type, size=size)

        storage_key = self.generate_storage_key(
            organization_id=organization_id,
            client_id=client_id,
            file_name=safe_name,
        )
        await self._storage_backend.save(storage_key=storage_key, content=content)

        return StoredClientFile(
            storage_key=storage_key,
            file_name=safe_name,
            mime_type=mime_type,
            size=size,
        )

    async def read_file(self, *, storage_key: str) -> bytes:
        return await self._storage_backend.read(storage_key=storage_key)

    async def delete_file(self, *, storage_key: str) -> None:
        await self._storage_backend.delete(storage_key=storage_key)

    async def file_exists(self, *, storage_key: str) -> bool:
        return await self._storage_backend.exists(storage_key=storage_key)

    def get_download_url(self, *, storage_key: str) -> str | None:
        return self._storage_backend.get_public_url(storage_key=storage_key)

    def validate_file(self, *, mime_type: str, size: int) -> None:
        if not mime_type:
            raise ClientFileValidationError("mime_type is required")

        if mime_type not in self._allowed_mime_types:
            raise ClientFileValidationError(f"Unsupported mime_type={mime_type!r}")

        if size <= 0:
            raise ClientFileValidationError("File is empty")

        if size > self._max_size_bytes:
            raise ClientFileValidationError("File size exceeds configured limit")

    def generate_storage_key(self, *, organization_id: int, client_id: int, file_name: str) -> str:
        suffix = Path(file_name).suffix.lower()
        return f"organizations/{organization_id}/clients/{client_id}/{uuid4().hex}{suffix}"
