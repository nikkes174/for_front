from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from typing import Any

from client_circout.backend.client_accounts.models.certificates import ClientCertificateModel
from client_circout.backend.client_accounts.models.deposits import ClientDepositModel
from client_circout.backend.client_accounts.models.subscriptions import ClientSubscriptionModel
from client_circout.backend.client_accounts.services._utils import decimal_or_zero, model_to_dict
from client_circout.backend.client_accounts.services.client_bonus_balance_service import ClientBonusBalanceService, ClientBonusBalanceView
from client_circout.backend.client_accounts.services.client_certificate_service import ClientCertificateService
from client_circout.backend.client_accounts.services.client_deposit_service import ClientDepositService
from client_circout.backend.client_accounts.services.client_subscription_service import ClientSubscriptionService
from client_circout.backend.client_accounts.services.exceptions import ClientAccountExternalProviderError


@dataclass(frozen=True, slots=True)
class ClientAccountsSummary:
    client_id: int
    deposits: list[ClientDepositModel]
    certificates: list[ClientCertificateModel]
    subscriptions: list[ClientSubscriptionModel]
    bonus_balance: ClientBonusBalanceView | None
    totals: dict[str, Decimal | int]

    def as_dict(self) -> dict[str, Any]:
        return {
            "client_id": self.client_id,
            "deposits": [model_to_dict(deposit) for deposit in self.deposits],
            "certificates": [model_to_dict(certificate) for certificate in self.certificates],
            "subscriptions": [model_to_dict(subscription) for subscription in self.subscriptions],
            "bonus_balance": None if self.bonus_balance is None else {
                "client_id": self.bonus_balance.client_id,
                "balance": self.bonus_balance.balance,
                "currency": self.bonus_balance.currency,
                "source": self.bonus_balance.source,
                "updated_at": self.bonus_balance.updated_at,
                "payload": self.bonus_balance.payload,
            },
            "totals": self.totals,
        }


class ClientAccountQueryService:
    def __init__(
        self,
        *,
        deposit_service: ClientDepositService,
        certificate_service: ClientCertificateService,
        subscription_service: ClientSubscriptionService,
        bonus_balance_service: ClientBonusBalanceService | None = None,
    ) -> None:
        self._deposit_service = deposit_service
        self._certificate_service = certificate_service
        self._subscription_service = subscription_service
        self._bonus_balance_service = bonus_balance_service

    async def get_client_accounts(
        self,
        *,
        client_id: int,
        active_only: bool = False,
        include_bonus: bool = True,
        ignore_bonus_provider_errors: bool = True,
    ) -> ClientAccountsSummary:
        deposits = list(await self._deposit_service.list_by_client(
            client_id=client_id,
            active_only=active_only,
        ))
        certificates = list(await self._certificate_service.list_by_client(
            client_id=client_id,
            active_only=active_only,
        ))
        subscriptions = list(await self._subscription_service.list_by_client(
            client_id=client_id,
            active_only=active_only,
        ))

        bonus_balance: ClientBonusBalanceView | None = None
        if include_bonus and self._bonus_balance_service is not None:
            try:
                bonus_balance = await self._bonus_balance_service.get_balance(client_id=client_id)
            except ClientAccountExternalProviderError:
                if not ignore_bonus_provider_errors:
                    raise

        totals: dict[str, Decimal | int] = {
            "deposit_balance": sum((decimal_or_zero(deposit.balance) for deposit in deposits), Decimal("0")),
            "certificate_balance": sum((decimal_or_zero(certificate.balance_amount) for certificate in certificates), Decimal("0")),
            "subscription_visits_left": sum(subscription.visits_left for subscription in subscriptions),
            "bonus_balance": Decimal("0") if bonus_balance is None else bonus_balance.balance,
        }

        return ClientAccountsSummary(
            client_id=client_id,
            deposits=deposits,
            certificates=certificates,
            subscriptions=subscriptions,
            bonus_balance=bonus_balance,
            totals=totals,
        )

    async def list_deposits(
        self,
        *,
        client_id: int,
        active_only: bool = False,
    ) -> list[ClientDepositModel]:
        return list(await self._deposit_service.list_by_client(
            client_id=client_id,
            active_only=active_only,
        ))

    async def list_certificates(
        self,
        *,
        client_id: int,
        active_only: bool = False,
    ) -> list[ClientCertificateModel]:
        return list(await self._certificate_service.list_by_client(
            client_id=client_id,
            active_only=active_only,
        ))

    async def list_subscriptions(
        self,
        *,
        client_id: int,
        active_only: bool = False,
    ) -> list[ClientSubscriptionModel]:
        return list(await self._subscription_service.list_by_client(
            client_id=client_id,
            active_only=active_only,
        ))

