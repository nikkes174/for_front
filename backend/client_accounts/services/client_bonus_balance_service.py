from __future__ import annotations

from collections.abc import Sequence
from dataclasses import dataclass
from datetime import datetime
from decimal import Decimal
from typing import Any, Protocol

from client_circout.backend.client_accounts.services._utils import decimal_or_zero
from client_circout.backend.client_accounts.services.exceptions import ClientAccountExternalProviderError, ClientAccountReadOnlyError


@dataclass(frozen=True, slots=True)
class ClientBonusBalanceView:
    client_id: int
    balance: Decimal
    currency: str = "BONUS"
    source: str = "external"
    updated_at: datetime | None = None
    payload: dict[str, Any] | None = None


@dataclass(frozen=True, slots=True)
class ClientBonusHistoryItem:
    client_id: int
    operation_type: str
    amount: Decimal
    balance_after: Decimal | None
    occurred_at: datetime
    source: str = "external"
    payload: dict[str, Any] | None = None


class ClientBonusBalanceProvider(Protocol):
    async def get_balance(self, *, client_id: int) -> ClientBonusBalanceView: ...

    async def list_history(
        self,
        *,
        client_id: int,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientBonusHistoryItem]: ...


class ClientBonusBalanceService:
    def __init__(self, provider: ClientBonusBalanceProvider | None = None) -> None:
        self._provider = provider

    async def get_balance(self, *, client_id: int) -> ClientBonusBalanceView:
        if self._provider is None:
            raise ClientAccountExternalProviderError("Bonus balance provider is not configured.")

        balance = await self._provider.get_balance(client_id=client_id)
        return ClientBonusBalanceView(
            client_id=balance.client_id,
            balance=decimal_or_zero(balance.balance),
            currency=balance.currency,
            source=balance.source,
            updated_at=balance.updated_at,
            payload=balance.payload,
        )

    async def list_history(
        self,
        *,
        client_id: int,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientBonusHistoryItem]:
        if self._provider is None:
            raise ClientAccountExternalProviderError("Bonus history provider is not configured.")
        return await self._provider.list_history(
            client_id=client_id,
            offset=offset,
            limit=limit,
        )

    async def accrue(self, *_: Any, **__: Any) -> None:
        raise ClientAccountReadOnlyError(
            "Bonus operations are owned by loyalty service. client_accounts is read-only.",
        )

    async def write_off(self, *_: Any, **__: Any) -> None:
        raise ClientAccountReadOnlyError(
            "Bonus operations are owned by loyalty service. client_accounts is read-only.",
        )

