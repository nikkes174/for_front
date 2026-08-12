from __future__ import annotations

from collections.abc import Iterable, Sequence
from dataclasses import dataclass, field
from typing import Any, Protocol

from client_circout.backend.client_accounts.models.certificates import ClientCertificateModel
from client_circout.backend.client_accounts.models.deposits import ClientDepositModel
from client_circout.backend.client_accounts.models.subscriptions import ClientSubscriptionModel
from client_circout.backend.client_accounts.services.client_certificate_service import ClientCertificateService
from client_circout.backend.client_accounts.services.client_deposit_service import ClientDepositService
from client_circout.backend.client_accounts.services.client_subscription_service import ClientSubscriptionService
from client_circout.backend.client_accounts.services.exceptions import ClientAccountNotFoundError, ClientAccountSyncError


class ClientAccountExternalSnapshotProvider(Protocol):
    async def get_deposits(self, *, client_id: int) -> Sequence[dict[str, Any]]: ...

    async def get_certificates(self, *, client_id: int) -> Sequence[dict[str, Any]]: ...

    async def get_subscriptions(self, *, client_id: int) -> Sequence[dict[str, Any]]: ...


@dataclass(slots=True)
class ClientAccountSyncResult:
    created: int = 0
    updated: int = 0
    skipped: int = 0
    errors: list[str] = field(default_factory=list)

    def merge(self, other: "ClientAccountSyncResult") -> None:
        self.created += other.created
        self.updated += other.updated
        self.skipped += other.skipped
        self.errors.extend(other.errors)


class ClientAccountSyncService:
    def __init__(
        self,
        *,
        deposit_service: ClientDepositService,
        certificate_service: ClientCertificateService,
        subscription_service: ClientSubscriptionService,
        snapshot_provider: ClientAccountExternalSnapshotProvider | None = None,
    ) -> None:
        self._deposit_service = deposit_service
        self._certificate_service = certificate_service
        self._subscription_service = subscription_service
        self._snapshot_provider = snapshot_provider

    async def sync_client_accounts(self, *, client_id: int) -> ClientAccountSyncResult:
        if self._snapshot_provider is None:
            raise ClientAccountSyncError("Client account snapshot provider is not configured.")

        result = ClientAccountSyncResult()
        result.merge(await self.sync_deposit_projections(
            await self._snapshot_provider.get_deposits(client_id=client_id),
        ))
        result.merge(await self.sync_certificate_projections(
            await self._snapshot_provider.get_certificates(client_id=client_id),
        ))
        result.merge(await self.sync_subscription_projections(
            client_id=client_id,
            payloads=await self._snapshot_provider.get_subscriptions(client_id=client_id),
        ))
        return result

    async def sync_deposit_projections(
        self,
        payloads: Iterable[dict[str, Any]],
    ) -> ClientAccountSyncResult:
        result = ClientAccountSyncResult()
        for payload in payloads:
            deposit_id = payload.pop("id", None)
            try:
                if deposit_id is None:
                    await self._deposit_service.create_projection(payload)
                    result.created += 1
                    continue

                await self._deposit_service.refresh_projection(
                    deposit_id=deposit_id,
                    payload=payload,
                )
                result.updated += 1
            except ClientAccountNotFoundError:
                await self._deposit_service.create_projection(payload)
                result.created += 1
            except Exception as exc:  # noqa: BLE001
                result.errors.append(str(exc))
        return result

    async def sync_certificate_projections(
        self,
        payloads: Iterable[dict[str, Any]],
    ) -> ClientAccountSyncResult:
        result = ClientAccountSyncResult()
        for payload in payloads:
            try:
                certificate = await self._find_certificate(payload)
                if certificate is None:
                    await self._certificate_service.create_projection(payload)
                    result.created += 1
                    continue

                await self._certificate_service.refresh_projection(
                    client_certificate_id=certificate.id,
                    payload=payload,
                )
                result.updated += 1
            except Exception as exc:  # noqa: BLE001
                result.errors.append(str(exc))
        return result

    async def sync_subscription_projections(
        self,
        *,
        client_id: int,
        payloads: Iterable[dict[str, Any]],
    ) -> ClientAccountSyncResult:
        result = ClientAccountSyncResult()
        existing = await self._subscription_service.list_by_client(client_id=client_id)
        by_subscription_id = {subscription.subscription_id: subscription for subscription in existing}

        for payload in payloads:
            try:
                subscription = by_subscription_id.get(payload.get("subscription_id"))
                if subscription is None:
                    await self._subscription_service.create_projection(payload)
                    result.created += 1
                    continue

                await self._subscription_service.refresh_projection(
                    client_subscription_id=subscription.id,
                    payload=payload,
                )
                result.updated += 1
            except Exception as exc:  # noqa: BLE001
                result.errors.append(str(exc))
        return result

    async def _find_certificate(
        self,
        payload: dict[str, Any],
    ) -> ClientCertificateModel | None:
        certificate_number = payload.get("certificate_number")
        if certificate_number is None:
            return None

        try:
            return await self._certificate_service.get_by_number(str(certificate_number))
        except ClientAccountNotFoundError:
            return None

