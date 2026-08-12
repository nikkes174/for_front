from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Protocol

from client_circout.backend.client_accounts.services._utils import decimal_or_zero
from client_circout.backend.client_accounts.services.exceptions import ClientAccountExternalProviderError


@dataclass(frozen=True, slots=True)
class ClientAccountHistoryRecord:
    client_id: int
    account_type: str
    operation_type: str
    amount: Decimal | None
    balance_after: Decimal | None
    occurred_at: datetime
    source: str
    account_id: int | str | None = None
    description: str | None = None
    payload: dict[str, Any] | None = None


class ClientAccountHistoryProvider(Protocol):
    async def list_history(
        self,
        *,
        client_id: int,
        account_type: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientAccountHistoryRecord]: ...


class ClientAccountHistoryService:
    def __init__(self, provider: ClientAccountHistoryProvider | None = None) -> None:
        self._provider = provider

    async def list_history(
        self,
        *,
        client_id: int,
        account_type: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientAccountHistoryRecord]:
        if self._provider is None:
            raise ClientAccountExternalProviderError("Client account history provider is not configured.")

        records = await self._provider.list_history(
            client_id=client_id,
            account_type=account_type,
            offset=offset,
            limit=limit,
        )
        return [
            ClientAccountHistoryRecord(
                client_id=record.client_id,
                account_type=record.account_type,
                operation_type=record.operation_type,
                amount=None if record.amount is None else decimal_or_zero(record.amount),
                balance_after=None if record.balance_after is None else decimal_or_zero(record.balance_after),
                occurred_at=record.occurred_at,
                source=record.source,
                account_id=record.account_id,
                description=record.description,
                payload=record.payload,
            )
            for record in records
        ]

