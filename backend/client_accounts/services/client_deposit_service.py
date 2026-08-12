from __future__ import annotations

from collections.abc import Sequence
from decimal import Decimal
from typing import Any

from client_circout.backend.client_accounts.crud.deposits import ClientDepositConflictError, ClientDepositCrud
from client_circout.backend.client_accounts.models.deposits import ClientDepositModel
from client_circout.backend.client_accounts.schemas.deposits import ClientDepositCreateSchema, ClientDepositUpdateSchema
from client_circout.backend.client_accounts.services._utils import ACTIVE_STATUS, ARCHIVED_STATUS, decimal_or_zero, schema_to_dict
from client_circout.backend.client_accounts.services.exceptions import ClientAccountNotFoundError, ClientAccountSyncError


class ClientDepositService:
    def __init__(self, deposit_crud: ClientDepositCrud) -> None:
        self._deposit_crud = deposit_crud

    async def create_projection(
        self,
        payload: ClientDepositCreateSchema | dict[str, Any],
    ) -> ClientDepositModel:
        try:
            return await self._deposit_crud.create(schema_to_dict(payload))
        except ClientDepositConflictError as exc:
            raise ClientAccountSyncError("Deposit projection conflict.") from exc

    async def get(self, deposit_id: int) -> ClientDepositModel:
        deposit = await self._deposit_crud.get_by_id(deposit_id)
        if deposit is None:
            raise ClientAccountNotFoundError("Deposit not found.")
        return deposit

    async def list_by_client(
        self,
        *,
        client_id: int,
        active_only: bool = False,
    ) -> Sequence[ClientDepositModel]:
        if active_only:
            return await self._deposit_crud.get_active_by_client_id(client_id=client_id)
        return await self._deposit_crud.get_by_client_id(client_id=client_id)

    async def get_active_total_balance(self, *, client_id: int) -> Decimal:
        deposits = await self._deposit_crud.get_active_by_client_id(client_id=client_id)
        return sum((decimal_or_zero(deposit.balance) for deposit in deposits), Decimal("0"))

    async def refresh_projection(
        self,
        *,
        deposit_id: int,
        payload: ClientDepositUpdateSchema | dict[str, Any],
    ) -> ClientDepositModel:
        deposit = await self.get(deposit_id)
        data = schema_to_dict(payload)
        if not data:
            return deposit

        try:
            return await self._deposit_crud.update(deposit, data)
        except ClientDepositConflictError as exc:
            raise ClientAccountSyncError("Deposit projection update conflict.") from exc

    async def archive_projection(self, deposit_id: int) -> ClientDepositModel:
        deposit = await self.get(deposit_id)
        if deposit.status == ARCHIVED_STATUS:
            return deposit
        return await self.refresh_projection(
            deposit_id=deposit_id,
            payload={"status": ARCHIVED_STATUS},
        )

    async def delete_projection(self, deposit_id: int) -> None:
        deposit = await self.get(deposit_id)
        try:
            await self._deposit_crud.delete(deposit)
        except ClientDepositConflictError as exc:
            raise ClientAccountSyncError("Deposit projection delete conflict.") from exc

    async def is_active(self, deposit_id: int) -> bool:
        deposit = await self.get(deposit_id)
        return deposit.status == ACTIVE_STATUS

