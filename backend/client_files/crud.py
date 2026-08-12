from __future__ import annotations

from collections.abc import Sequence

from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_files.models import ClientFileModel, ClientFileLinkModel


class ClientFileConflictError(Exception):
    pass


class ClientFileCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientFileModel:
        file = ClientFileModel(**payload)
        self._session.add(file)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFileConflictError from exc

        await self._session.refresh(file)
        return file

    async def get_by_id(self, file_id: int) -> ClientFileModel | None:
        return await self._session.get(ClientFileModel, file_id)

    async def get_by_storage_key(
        self,
        *,
        storage_key: str,
    ) -> ClientFileModel | None:
        stmt = select(ClientFileModel).where(
            ClientFileModel.storage_key == storage_key,
        )
        result = await self._session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientFileModel]:
        stmt = (
            select(ClientFileModel)
            .where(ClientFileModel.client_id == client_id)
            .order_by(ClientFileModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_category(
        self,
        *,
        client_id: int,
        file_category: str,
    ) -> Sequence[ClientFileModel]:
        stmt = (
            select(ClientFileModel)
            .where(
                ClientFileModel.client_id == client_id,
                ClientFileModel.file_category == file_category,
            )
            .order_by(ClientFileModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        file: ClientFileModel,
        payload: dict,
    ) -> ClientFileModel:
        for key, value in payload.items():
            setattr(file, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFileConflictError from exc

        await self._session.refresh(file)
        return file

    async def delete(self, file: ClientFileModel) -> None:
        await self._session.delete(file)
        await self._session.commit()



class ClientFileLinkConflictError(Exception):
    pass


class ClientFileLinkCrud:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, payload: dict) -> ClientFileLinkModel:
        file_link = ClientFileLinkModel(**payload)
        self._session.add(file_link)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFileLinkConflictError from exc

        await self._session.refresh(file_link)
        return file_link

    async def get_by_id(
        self,
        file_link_id: int,
    ) -> ClientFileLinkModel | None:
        return await self._session.get(ClientFileLinkModel, file_link_id)

    async def get_by_client_id(
        self,
        *,
        client_id: int,
    ) -> Sequence[ClientFileLinkModel]:
        stmt = (
            select(ClientFileLinkModel)
            .where(ClientFileLinkModel.client_id == client_id)
            .order_by(ClientFileLinkModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_file_id(
        self,
        *,
        file_id: int,
    ) -> Sequence[ClientFileLinkModel]:
        stmt = (
            select(ClientFileLinkModel)
            .where(ClientFileLinkModel.file_id == file_id)
            .order_by(ClientFileLinkModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_visit_id(
        self,
        *,
        related_visit_id: int,
    ) -> Sequence[ClientFileLinkModel]:
        stmt = (
            select(ClientFileLinkModel)
            .where(ClientFileLinkModel.related_visit_id == related_visit_id)
            .order_by(ClientFileLinkModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def get_by_procedure_id(
        self,
        *,
        related_procedure_id: int,
    ) -> Sequence[ClientFileLinkModel]:
        stmt = (
            select(ClientFileLinkModel)
            .where(
                ClientFileLinkModel.related_procedure_id == related_procedure_id,
            )
            .order_by(ClientFileLinkModel.created_at.desc())
        )
        result = await self._session.execute(stmt)
        return result.scalars().all()

    async def update(
        self,
        file_link: ClientFileLinkModel,
        payload: dict,
    ) -> ClientFileLinkModel:
        for key, value in payload.items():
            setattr(file_link, key, value)

        try:
            await self._session.commit()
        except IntegrityError as exc:
            await self._session.rollback()
            raise ClientFileLinkConflictError from exc

        await self._session.refresh(file_link)
        return file_link

    async def delete(self, file_link: ClientFileLinkModel) -> None:
        await self._session.delete(file_link)
        await self._session.commit()