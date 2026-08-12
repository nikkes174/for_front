from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass, field
from typing import Any, Protocol

from contracts.api.loyalty import LoyaltyApiClient
from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_history.crud.client_check import ClientCheckCrud


@dataclass(slots=True)
class ClientProfileExternalData:
    bonus_balance: Any | None = None
    certificates: list[Any] = field(default_factory=list)
    subscriptions: list[Any] = field(default_factory=list)
    checks: list[Any] = field(default_factory=list)
    payments: list[Any] = field(default_factory=list)
    current_consent: Any | None = None
    consent_history: list[Any] = field(default_factory=list)
    family_account: Mapping[str, Any] = field(default_factory=dict)
    communication_summary: Mapping[str, Any] = field(default_factory=dict)

    def as_dict(self) -> dict[str, Any]:
        return {
            "bonus_balance": self.bonus_balance,
            "certificates": self.certificates,
            "subscriptions": self.subscriptions,
            "checks": self.checks,
            "payments": self.payments,
            "current_consent": self.current_consent,
            "consent_history": self.consent_history,
            "family_account": dict(self.family_account),
            "communication_summary": dict(self.communication_summary),
        }


class ClientProfileExternalDataProvider(Protocol):
    async def get_profile_data(
        self,
        *,
        organization_id: int,
        client_id: int,
    ) -> ClientProfileExternalData: ...


class EmptyClientProfileExternalDataProvider:
    async def get_profile_data(
        self,
        *,
        organization_id: int,
        client_id: int,
    ) -> ClientProfileExternalData:
        return ClientProfileExternalData()


class LoyaltyApiExternalDataProvider:
    def __init__(
        self,
        *,
        loyalty_api: LoyaltyApiClient,
        check_crud: ClientCheckCrud,
        consent_crud: ClientConsentCrud,
    ) -> None:
        self._loyalty_api = loyalty_api
        self._check_crud = check_crud
        self._consent_crud = consent_crud

    async def get_profile_data(
        self,
        *,
        organization_id: int,
        client_id: int,
    ) -> ClientProfileExternalData:
        bonus_balance = None
        certificates: list[Any] = []
        subscriptions: list[Any] = []

        try:
            bonus_balance = (await self._loyalty_api.get_bonus_balance(client_id)).model_dump(mode="json")
        except Exception:
            bonus_balance = None

        try:
            certificates = [
                item.model_dump(mode="json")
                for item in await self._loyalty_api.list_client_certificates(client_id)
            ]
        except Exception:
            certificates = []

        try:
            subscriptions = [
                item.model_dump(mode="json")
                for item in await self._loyalty_api.list_client_subscriptions(client_id)
            ]
        except Exception:
            subscriptions = []

        checks = [
            self._model_to_dict(item)
            for item in await self._check_crud.list(
                organization_id=organization_id,
                client_id=client_id,
                offset=0,
                limit=100,
            )
        ]
        payments = [
            {
                "check_id": item["id"],
                "visit_id": item.get("visit_id"),
                "paid_amount": item.get("paid_amount"),
                "issued_at": item.get("issued_at"),
                "check_number": item.get("check_number"),
            }
            for item in checks
            if item.get("paid_amount")
        ]
        current_consent = await self._consent_crud.get_current_by_client_id(client_id=client_id)
        consent_history = await self._consent_crud.get_by_client_id(client_id=client_id)
        family_client_ids = sorted({
            family_client_id
            for subscription in subscriptions
            for family_client_id in (subscription.get("family_client_ids") or [])
        })

        return ClientProfileExternalData(
            bonus_balance=bonus_balance,
            certificates=certificates,
            subscriptions=subscriptions,
            checks=checks,
            payments=payments,
            current_consent=None if current_consent is None else self._model_to_dict(current_consent),
            consent_history=[self._model_to_dict(item) for item in consent_history],
            family_account={
                "client_id": client_id,
                "family_client_ids": family_client_ids,
                "is_configured": bool(family_client_ids),
            },
        )

    @staticmethod
    def _model_to_dict(model: Any) -> dict[str, Any]:
        return {
            column.name: getattr(model, column.name)
            for column in model.__table__.columns
        }
