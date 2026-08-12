from __future__ import annotations

from dataclasses import dataclass

from client_circout.backend.client_files.models import ClientFileLinkModel, ClientFileModel
from client_circout.backend.client_files.service.client_file_link_service import ClientFileLinkService
from client_circout.backend.client_files.service.client_file_service import ClientFileService


@dataclass(frozen=True, slots=True)
class ExternalFileMetadata:
    file_category: str | None = None
    file_name: str | None = None
    mime_type: str | None = None
    size: int | None = None
    storage_key: str | None = None
    uploaded_by: int | None = None

    def to_update_payload(self) -> dict:
        return {
            key: value
            for key, value in {
                "file_category": self.file_category,
                "file_name": self.file_name,
                "mime_type": self.mime_type,
                "size": self.size,
                "storage_key": self.storage_key,
                "uploaded_by": self.uploaded_by,
            }.items()
            if value is not None
        }


class ClientFileSyncService:
    def __init__(
        self,
        *,
        file_service: ClientFileService,
        file_link_service: ClientFileLinkService,
    ) -> None:
        self._file_service = file_service
        self._file_link_service = file_link_service

    async def sync_file_metadata(
        self,
        *,
        file_id: int,
        metadata: ExternalFileMetadata,
    ) -> ClientFileModel:
        return await self._file_service.update_file_metadata(
            file_id,
            metadata.to_update_payload(),
        )

    async def sync_visit_link(
        self,
        *,
        client_id: int,
        file_id: int,
        related_visit_id: int,
        file_role: str,
    ) -> ClientFileLinkModel:
        existing = await self._find_link(
            file_id=file_id,
            related_visit_id=related_visit_id,
            related_procedure_id=None,
        )

        if existing is not None:
            return await self._file_link_service.update_link(
                existing.id,
                {
                    "related_visit_id": related_visit_id,
                    "file_role": file_role,
                },
            )

        return await self._file_link_service.link_to_visit(
            client_id=client_id,
            file_id=file_id,
            related_visit_id=related_visit_id,
            file_role=file_role,
        )

    async def sync_procedure_link(
        self,
        *,
        client_id: int,
        file_id: int,
        related_procedure_id: int,
        file_role: str,
    ) -> ClientFileLinkModel:
        existing = await self._find_link(
            file_id=file_id,
            related_visit_id=None,
            related_procedure_id=related_procedure_id,
        )

        if existing is not None:
            return await self._file_link_service.update_link(
                existing.id,
                {
                    "related_procedure_id": related_procedure_id,
                    "file_role": file_role,
                },
            )

        return await self._file_link_service.link_to_procedure(
            client_id=client_id,
            file_id=file_id,
            related_procedure_id=related_procedure_id,
            file_role=file_role,
        )

    async def unlink_file_from_external_entity(
        self,
        *,
        file_id: int,
        related_visit_id: int | None = None,
        related_procedure_id: int | None = None,
    ) -> bool:
        link = await self._find_link(
            file_id=file_id,
            related_visit_id=related_visit_id,
            related_procedure_id=related_procedure_id,
        )

        if link is None:
            return False

        await self._file_link_service.delete_link(link.id)
        return True

    async def _find_link(
        self,
        *,
        file_id: int,
        related_visit_id: int | None,
        related_procedure_id: int | None,
    ) -> ClientFileLinkModel | None:
        links = await self._file_link_service.list_file_links(file_id=file_id)

        for link in links:
            if related_visit_id is not None and link.related_visit_id == related_visit_id:
                return link
            if related_procedure_id is not None and link.related_procedure_id == related_procedure_id:
                return link

        return None
