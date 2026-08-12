from __future__ import annotations

from collections.abc import Mapping, Sequence
from typing import Any

from pydantic import BaseModel

from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.clients_core.crud.client_additional import (
    ClientAdditionalFieldConflictError,
    ClientAdditionalFieldCrud,
    ClientAdditionalFieldValueConflictError,
    ClientAdditionalFieldValueCrud,
)
from client_circout.backend.clients_core.models.client_additional import (
    ClientAdditionalFieldModel,
    ClientAdditionalFieldValueModel,
)
from client_circout.backend.clients_core.service._utils import payload_to_dict, utc_now
from client_circout.backend.clients_core.service.exceptions import EntityConflictError, EntityNotFoundError


class ClientAdditionalFieldsService:
    def __init__(
        self,
        client_crud: ClientCrud,
        field_crud: ClientAdditionalFieldCrud,
        value_crud: ClientAdditionalFieldValueCrud,
    ) -> None:
        self._client_crud = client_crud
        self._field_crud = field_crud
        self._value_crud = value_crud

    async def create_field(
        self,
        payload: BaseModel | Mapping[str, Any],
    ) -> ClientAdditionalFieldModel:
        data = payload_to_dict(payload, exclude_unset=False)
        data["code"] = data["code"].strip()
        data.setdefault("created_at", utc_now())

        existing = await self._field_crud.get_by_code(
            organization_id=data["organization_id"],
            code=data["code"],
        )
        if existing is not None:
            raise EntityConflictError("client additional field already exists")

        try:
            return await self._field_crud.create(data)
        except ClientAdditionalFieldConflictError as exc:
            raise EntityConflictError("client additional field create conflict") from exc

    async def get_field(self, field_id: int) -> ClientAdditionalFieldModel:
        field = await self._field_crud.get_by_id(field_id)
        if field is None:
            raise EntityNotFoundError("client_additional_field", field_id)

        return field

    async def get_field_by_code(
        self,
        *,
        organization_id: int,
        code: str,
    ) -> ClientAdditionalFieldModel | None:
        return await self._field_crud.get_by_code(
            organization_id=organization_id,
            code=code.strip(),
        )

    async def list_fields(
        self,
        *,
        organization_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientAdditionalFieldModel]:
        return await self._field_crud.list(
            organization_id=organization_id,
            offset=offset,
            limit=limit,
        )

    async def update_field(
        self,
        field_id: int,
        payload: BaseModel | Mapping[str, Any],
    ) -> ClientAdditionalFieldModel:
        field = await self.get_field(field_id)
        data = payload_to_dict(payload)

        if not data:
            return field

        if "code" in data and data["code"] is not None:
            data["code"] = data["code"].strip()
            existing = await self._field_crud.get_by_code(
                organization_id=field.organization_id,
                code=data["code"],
            )
            if existing is not None and existing.id != field.id:
                raise EntityConflictError("client additional field already exists")

        data["updated_at"] = utc_now()

        try:
            return await self._field_crud.update(field, data)
        except ClientAdditionalFieldConflictError as exc:
            raise EntityConflictError("client additional field update conflict") from exc

    async def delete_field(self, field_id: int) -> None:
        field = await self.get_field(field_id)

        try:
            await self._field_crud.delete(field)
        except ClientAdditionalFieldConflictError as exc:
            raise EntityConflictError("client additional field delete conflict") from exc

    async def set_value(
        self,
        *,
        client_id: int,
        field_id: int,
        value_text: str | None = None,
        value_json: dict[str, Any] | None = None,
    ) -> ClientAdditionalFieldValueModel:
        await self._ensure_client_exists(client_id)
        await self.get_field(field_id)

        existing = await self._value_crud.get_by_client_and_field(
            client_id=client_id,
            field_id=field_id,
        )

        payload = {
            "client_id": client_id,
            "field_id": field_id,
            "value_text": value_text,
            "value_json": value_json,
            "updated_at": utc_now(),
        }

        try:
            if existing is not None:
                return await self._value_crud.update(existing, payload)

            return await self._value_crud.create(payload)
        except ClientAdditionalFieldValueConflictError as exc:
            existing = await self._value_crud.get_by_client_and_field(
                client_id=client_id,
                field_id=field_id,
            )
            if existing is not None:
                return await self._value_crud.update(existing, payload)
            raise EntityConflictError("client additional field value conflict") from exc

    async def set_values(
        self,
        *,
        client_id: int,
        values: Mapping[int, str | dict[str, Any] | None],
    ) -> list[ClientAdditionalFieldValueModel]:
        saved_values: list[ClientAdditionalFieldValueModel] = []

        for field_id, value in values.items():
            if isinstance(value, dict):
                saved_value = await self.set_value(
                    client_id=client_id,
                    field_id=field_id,
                    value_json=value,
                )
            elif value is None:
                saved_value = await self.set_value(
                    client_id=client_id,
                    field_id=field_id,
                    value_text=None,
                    value_json=None,
                )
            else:
                saved_value = await self.set_value(
                    client_id=client_id,
                    field_id=field_id,
                    value_text=str(value),
                )

            saved_values.append(saved_value)

        return saved_values

    async def get_value(
        self,
        *,
        client_id: int,
        field_id: int,
    ) -> ClientAdditionalFieldValueModel | None:
        return await self._value_crud.get_by_client_and_field(
            client_id=client_id,
            field_id=field_id,
        )

    async def list_values(
        self,
        *,
        client_id: int | None = None,
        field_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientAdditionalFieldValueModel]:
        return await self._value_crud.list(
            client_id=client_id,
            field_id=field_id,
            offset=offset,
            limit=limit,
        )

    async def delete_value(self, value_id: int) -> None:
        value = await self._value_crud.get_by_id(value_id)
        if value is None:
            raise EntityNotFoundError("client_additional_field_value", value_id)

        try:
            await self._value_crud.delete(value)
        except ClientAdditionalFieldValueConflictError as exc:
            raise EntityConflictError("client additional field value delete conflict") from exc

    async def get_missing_required_field_ids(
        self,
        *,
        client_id: int,
        organization_id: int,
    ) -> list[int]:
        fields = await self._field_crud.list(
            organization_id=organization_id,
            offset=0,
            limit=1000,
        )

        missing: list[int] = []
        for field in fields:
            if not field.is_required:
                continue

            value = await self._value_crud.get_by_client_and_field(
                client_id=client_id,
                field_id=field.id,
            )
            if value is None or (value.value_text is None and value.value_json is None):
                missing.append(field.id)

        return missing

    async def _ensure_client_exists(self, client_id: int) -> None:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise EntityNotFoundError("client", client_id)
