from __future__ import annotations

from client_circout.backend.clients_core.crud.client import ClientConflictError, ClientCrud
from client_circout.backend.clients_core.crud.client_additional import (
    ClientAdditionalFieldValueConflictError,
    ClientAdditionalFieldValueCrud,
)
from client_circout.backend.clients_core.crud.client_branch import ClientBranchConflictError, ClientBranchCrud
from client_circout.backend.clients_core.crud.client_categories import (
    ClientCategoryLinkConflictError,
    ClientCategoryLinkCrud,
)
from client_circout.backend.clients_core.crud.client_merge_operations import (
    ClientMergeOperationConflictError,
    ClientMergeOperationCrud,
)
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.clients_core.models.client_merge_operations import ClientMergeOperationModel
from client_circout.backend.clients_core.service._utils import utc_now, is_empty
from client_circout.backend.clients_core.service.exceptions import MergeServiceError, EntityNotFoundError, EntityConflictError

UNIQUE_TRANSFER_FIELDS = (
    "telegram_id",
    "max_id",
    "vk_id",
)

CLIENT_FIELDS_TO_FILL = (
    "last_name",
    "first_name",
    "middle_name",
    "full_name",
    "primary_phone",
    "secondary_phone",
    "email",
    "birth_date",
    "gender",
    "photo_file_id",
    "comment",
    "note",
    "referrer_client_id",
    "api_field_1",
    "api_field_2",
    "api_field_3",
)


class ClientMergeService:
    def __init__(
        self,
        client_crud: ClientCrud,
        merge_operation_crud: ClientMergeOperationCrud,
        category_link_crud: ClientCategoryLinkCrud | None = None,
        additional_value_crud: ClientAdditionalFieldValueCrud | None = None,
        branch_crud: ClientBranchCrud | None = None,
    ) -> None:
        self._client_crud = client_crud
        self._merge_operation_crud = merge_operation_crud
        self._category_link_crud = category_link_crud
        self._additional_value_crud = additional_value_crud
        self._branch_crud = branch_crud

    async def merge(
        self,
        *,
        primary_client_id: int,
        duplicate_client_id: int,
        merged_by: int | None = None,
        reason: str | None = None,
    ) -> ClientMergeOperationModel:
        if primary_client_id == duplicate_client_id:
            raise MergeServiceError("primary_client_id and duplicate_client_id must be different")

        primary_client = await self._get_client(primary_client_id)
        duplicate_client = await self._get_client(duplicate_client_id)

        if primary_client.organization_id != duplicate_client.organization_id:
            raise MergeServiceError("clients must belong to the same organization")

        now = utc_now()
        async with self._client_crud.session.begin():
            unique_transfer_payload = self._build_unique_transfer_payload(
                primary_client=primary_client,
                duplicate_client=duplicate_client,
            )

            duplicate_clear_payload = {
                field_name: None
                for field_name in unique_transfer_payload
            }

            if duplicate_clear_payload:
                duplicate_clear_payload["updated_at"] = now
                duplicate_client = await self._update_client(
                    duplicate_client,
                    duplicate_clear_payload,
                    auto_commit=False,
                )

            primary_payload = self._build_primary_merge_payload(
                primary_client=primary_client,
                duplicate_client=duplicate_client,
            )
            primary_payload.update(unique_transfer_payload)

            if primary_payload:
                primary_payload["updated_at"] = now
                await self._update_client(primary_client, primary_payload, auto_commit=False)

            await self._merge_category_links(
                primary_client_id=primary_client_id,
                duplicate_client_id=duplicate_client_id,
                created_by=merged_by,
                auto_commit=False,
            )
            await self._merge_additional_values(
                primary_client_id=primary_client_id,
                duplicate_client_id=duplicate_client_id,
                auto_commit=False,
            )
            await self._merge_branches(
                primary_client_id=primary_client_id,
                duplicate_client_id=duplicate_client_id,
                auto_commit=False,
            )

            await self._update_client(
                duplicate_client,
                {
                    "status": "merged",
                    "archived_at": now,
                    "archived_by": merged_by,
                    "updated_at": now,
                },
                auto_commit=False,
            )

            try:
                operation = await self._merge_operation_crud.create(
                    {
                        "organization_id": primary_client.organization_id,
                        "primary_client_id": primary_client_id,
                        "duplicate_client_id": duplicate_client_id,
                        "reason": reason,
                        "merged_by": merged_by,
                        "created_at": now,
                    },
                    auto_commit=False,
                )
            except ClientMergeOperationConflictError as exc:
                raise EntityConflictError("client merge operation create conflict") from exc

        await self._client_crud.session.refresh(operation)
        return operation

    async def get_operation(self, operation_id: int) -> ClientMergeOperationModel:
        operation = await self._merge_operation_crud.get_by_id(operation_id)
        if operation is None:
            raise EntityNotFoundError("client_merge_operation", operation_id)

        return operation

    async def list_operations(
        self,
        *,
        organization_id: int | None = None,
        primary_client_id: int | None = None,
        duplicate_client_id: int | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> list[ClientMergeOperationModel]:
        operations = await self._merge_operation_crud.list(
            organization_id=organization_id,
            primary_client_id=primary_client_id,
            duplicate_client_id=duplicate_client_id,
            offset=offset,
            limit=limit,
        )
        return list(operations)

    async def _get_client(self, client_id: int) -> ClientModel:
        client = await self._client_crud.get_by_id(client_id)
        if client is None:
            raise EntityNotFoundError("client", client_id)

        return client

    async def _update_client(
        self,
        client: ClientModel,
        payload: dict,
        *,
        auto_commit: bool = True,
    ) -> ClientModel:
        try:
            return await self._client_crud.update(client, payload, auto_commit=auto_commit)
        except ClientConflictError as exc:
            raise EntityConflictError("client merge update conflict") from exc

    @staticmethod
    def _build_unique_transfer_payload(
        *,
        primary_client: ClientModel,
        duplicate_client: ClientModel,
    ) -> dict:
        payload = {}

        for field_name in UNIQUE_TRANSFER_FIELDS:
            primary_value = getattr(primary_client, field_name)
            duplicate_value = getattr(duplicate_client, field_name)

            if is_empty(primary_value) and not is_empty(duplicate_value):
                payload[field_name] = duplicate_value

        return payload

    @staticmethod
    def _build_primary_merge_payload(
        *,
        primary_client: ClientModel,
        duplicate_client: ClientModel,
    ) -> dict:
        payload = {}

        for field_name in CLIENT_FIELDS_TO_FILL:
            primary_value = getattr(primary_client, field_name)
            duplicate_value = getattr(duplicate_client, field_name)

            if is_empty(primary_value) and not is_empty(duplicate_value):
                payload[field_name] = duplicate_value

        return payload

    async def _merge_category_links(
        self,
        *,
        primary_client_id: int,
        duplicate_client_id: int,
        created_by: int | None,
        auto_commit: bool = True,
    ) -> None:
        if self._category_link_crud is None:
            return

        links = await self._category_link_crud.list(
            client_id=duplicate_client_id,
            offset=0,
            limit=1000,
        )

        for link in links:
            existing = await self._category_link_crud.get_by_client_and_category(
                client_id=primary_client_id,
                category_id=link.category_id,
            )
            if existing is not None:
                continue

            try:
                await self._category_link_crud.create(
                    {
                        "client_id": primary_client_id,
                        "category_id": link.category_id,
                        "created_at": utc_now(),
                        "created_by": created_by,
                    },
                    auto_commit=auto_commit,
                )
            except ClientCategoryLinkConflictError as exc:
                raise EntityConflictError("client category link merge conflict") from exc

    async def _merge_additional_values(
        self,
        *,
        primary_client_id: int,
        duplicate_client_id: int,
        auto_commit: bool = True,
    ) -> None:
        if self._additional_value_crud is None:
            return

        values = await self._additional_value_crud.list(
            client_id=duplicate_client_id,
            offset=0,
            limit=1000,
        )

        for value in values:
            existing = await self._additional_value_crud.get_by_client_and_field(
                client_id=primary_client_id,
                field_id=value.field_id,
            )

            if existing is None:
                try:
                    await self._additional_value_crud.create(
                        {
                            "client_id": primary_client_id,
                            "field_id": value.field_id,
                            "value_text": value.value_text,
                            "value_json": value.value_json,
                            "updated_at": utc_now(),
                        },
                        auto_commit=auto_commit,
                    )
                except ClientAdditionalFieldValueConflictError as exc:
                    raise EntityConflictError("client additional value merge conflict") from exc
                continue

            if is_empty(existing.value_text) and is_empty(existing.value_json):
                try:
                    await self._additional_value_crud.update(
                        existing,
                        {
                            "value_text": value.value_text,
                            "value_json": value.value_json,
                            "updated_at": utc_now(),
                        },
                        auto_commit=auto_commit,
                    )
                except ClientAdditionalFieldValueConflictError as exc:
                    raise EntityConflictError("client additional value merge conflict") from exc

    async def _merge_branches(
        self,
        *,
        primary_client_id: int,
        duplicate_client_id: int,
        auto_commit: bool = True,
    ) -> None:
        if self._branch_crud is None:
            return

        branches = await self._branch_crud.list(
            client_id=duplicate_client_id,
            offset=0,
            limit=1000,
        )

        for branch in branches:
            existing = await self._branch_crud.get_by_client_and_branch(
                client_id=primary_client_id,
                branch_id=branch.branch_id,
            )

            if existing is None:
                try:
                    await self._branch_crud.create(
                        {
                            "client_id": primary_client_id,
                            "branch_id": branch.branch_id,
                            "first_visit_at": branch.first_visit_at,
                            "last_visit_at": branch.last_visit_at,
                        },
                        auto_commit=auto_commit,
                    )
                except ClientBranchConflictError as exc:
                    raise EntityConflictError("client branch merge conflict") from exc
                continue

            first_visit_at = existing.first_visit_at
            last_visit_at = existing.last_visit_at

            if branch.first_visit_at is not None:
                if first_visit_at is None or branch.first_visit_at < first_visit_at:
                    first_visit_at = branch.first_visit_at

            if branch.last_visit_at is not None:
                if last_visit_at is None or branch.last_visit_at > last_visit_at:
                    last_visit_at = branch.last_visit_at

            try:
                await self._branch_crud.update(
                    existing,
                    {
                        "first_visit_at": first_visit_at,
                        "last_visit_at": last_visit_at,
                    },
                    auto_commit=auto_commit,
                )
            except ClientBranchConflictError as exc:
                raise EntityConflictError("client branch merge conflict") from exc
