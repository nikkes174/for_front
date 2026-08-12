from __future__ import annotations

from collections.abc import Sequence

from client_circout.backend.client_files.crud import (
    ClientFileLinkConflictError as ClientFileLinkCrudConflictError,
    ClientFileLinkCrud, ClientFileConflictError,
)
from client_circout.backend.client_files.models import ClientFileLinkModel
from client_circout.backend.client_files.schemas import ClientFileLinkCreateSchema, ClientFileLinkUpdateSchema
from client_circout.backend.client_files.service._utils import require_found, clean_update_payload, to_payload, utc_now


class ClientFileLinkService:
    def __init__(self, file_link_crud: ClientFileLinkCrud) -> None:
        self._file_link_crud = file_link_crud

    async def create_link(self, data: ClientFileLinkCreateSchema | dict) -> ClientFileLinkModel:
        payload = to_payload(data)
        payload.setdefault("created_at", utc_now())

        try:
            return await self._file_link_crud.create(payload)
        except ClientFileLinkCrudConflictError as exc:
            raise ClientFileConflictError("Client file link already exists or violates constraints") from exc

    async def link_to_client(
        self,
        *,
        client_id: int,
        file_id: int,
        file_role: str,
    ) -> ClientFileLinkModel:
        return await self.create_link(
            {
                "client_id": client_id,
                "file_id": file_id,
                "file_role": file_role,
            }
        )

    async def link_to_visit(
        self,
        *,
        client_id: int,
        file_id: int,
        related_visit_id: int,
        file_role: str,
    ) -> ClientFileLinkModel:
        return await self.create_link(
            {
                "client_id": client_id,
                "file_id": file_id,
                "related_visit_id": related_visit_id,
                "file_role": file_role,
            }
        )

    async def link_to_procedure(
        self,
        *,
        client_id: int,
        file_id: int,
        related_procedure_id: int,
        file_role: str,
    ) -> ClientFileLinkModel:
        return await self.create_link(
            {
                "client_id": client_id,
                "file_id": file_id,
                "related_procedure_id": related_procedure_id,
                "file_role": file_role,
            }
        )

    async def get_link(self, link_id: int) -> ClientFileLinkModel:
        link = await self._file_link_crud.get_by_id(link_id)
        return require_found(link, "client_file_link", link_id)

    async def list_client_links(self, *, client_id: int) -> Sequence[ClientFileLinkModel]:
        return await self._file_link_crud.get_by_client_id(client_id=client_id)

    async def list_file_links(self, *, file_id: int) -> Sequence[ClientFileLinkModel]:
        return await self._file_link_crud.get_by_file_id(file_id=file_id)

    async def list_visit_links(self, *, related_visit_id: int) -> Sequence[ClientFileLinkModel]:
        return await self._file_link_crud.get_by_visit_id(related_visit_id=related_visit_id)

    async def list_procedure_links(self, *, related_procedure_id: int) -> Sequence[ClientFileLinkModel]:
        return await self._file_link_crud.get_by_procedure_id(related_procedure_id=related_procedure_id)

    async def update_link(
        self,
        link_id: int,
        data: ClientFileLinkUpdateSchema | dict,
    ) -> ClientFileLinkModel:
        link = await self.get_link(link_id)
        payload = clean_update_payload(data)

        try:
            return await self._file_link_crud.update(link, payload)
        except ClientFileLinkCrudConflictError as exc:
            raise ClientFileConflictError("Client file link update violates constraints") from exc

    async def delete_link(self, link_id: int) -> None:
        link = await self.get_link(link_id)

        try:
            await self._file_link_crud.delete(link)
        except ClientFileLinkCrudConflictError as exc:
            raise ClientFileConflictError("Client file link delete violates constraints") from exc

    async def delete_links_for_file(self, *, file_id: int) -> int:
        links = await self.list_file_links(file_id=file_id)

        for link in links:
            await self._file_link_crud.delete(link)

        return len(links)
