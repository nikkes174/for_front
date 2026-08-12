from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, ConfigDict

from client_circout.backend.client_consents.crud import ClientConsentCrud
from client_circout.backend.client_consents.services.client_consent_comment_service import (
    ClientConsentCommentService,
)
from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.config import LOYLYTY_API_URL
from client_circout.backend.client_accounts.dependencies import (
    ClientAccountsSessionDep,
    ClientAccountQueryServiceDep,
    ClientBonusBalanceServiceDep,
    ClientCertificateServiceDep,
    ClientDepositServiceDep,
    ClientSubscriptionServiceDep,
)
from client_circout.backend.client_accounts.schemas.certificates import (
    ClientCertificateCreateSchema,
    ClientCertificateReadSchema,
    ClientCertificateUpdateSchema,
)
from client_circout.backend.client_accounts.schemas.deposits import (
    ClientDepositCreateSchema,
    ClientDepositReadSchema,
    ClientDepositUpdateSchema,
)
from client_circout.backend.client_accounts.schemas.subscriptions import (
    ClientSubscriptionCreateSchema,
    ClientSubscriptionReadSchema,
    ClientSubscriptionUpdateSchema,
)
from client_circout.backend.client_accounts.services import (
    ClientAccountExternalProviderError,
    ClientAccountNotFoundError,
    ClientAccountReadOnlyError,
    ClientAccountServiceError,
    ClientAccountSyncError,
)
from contracts.api.loyalty import LoyaltyApiClient


router = APIRouter(
    prefix="/client-accounts",
    tags=["client-accounts"],
)


class TotalBalanceRead(BaseModel):
    client_id: int
    amount: Decimal


class TotalVisitsRead(BaseModel):
    client_id: int
    visits_left: int


class ClientBonusBalanceRead(BaseModel):
    client_id: int
    balance: Decimal
    currency: str
    source: str
    updated_at: datetime | None = None
    payload: dict[str, Any] | None = None


class ClientBonusHistoryItemRead(BaseModel):
    client_id: int
    operation_type: str
    amount: Decimal
    balance_after: Decimal | None = None
    occurred_at: datetime
    source: str
    payload: dict[str, Any] | None = None


class ClientAccountsTotalsRead(BaseModel):
    deposit_balance: Decimal
    certificate_balance: Decimal
    subscription_visits_left: int
    bonus_balance: Decimal


class ClientConsentRestrictionsRead(BaseModel):
    no_call: bool
    no_write: bool
    only_specific_time: bool
    raw_comment: str | None = None


class ClientConsentInfoRead(BaseModel):
    id: int | None = None
    organization_id: int | None = None
    client_id: int
    service_messages_allowed: bool
    marketing_messages_allowed: bool
    sms_allowed: bool
    email_allowed: bool
    telegram_allowed: bool
    consent_given_at: datetime | None = None
    consent_text: str | None = None
    consent_source: str | None = None
    consent_revoked_at: datetime | None = None
    comment: str | None = None
    restrictions: ClientConsentRestrictionsRead


class ClientAccountsSummaryRead(BaseModel):
    client_id: int
    deposits: list[ClientDepositReadSchema]
    certificates: list[ClientCertificateReadSchema]
    subscriptions: list[ClientSubscriptionReadSchema]
    bonus_balance: ClientBonusBalanceRead | None = None
    consent: ClientConsentInfoRead | None = None
    consent_history: list[ClientConsentInfoRead] = []
    totals: ClientAccountsTotalsRead


class DeleteRead(BaseModel):
    deleted: bool


def _loyalty_client() -> LoyaltyApiClient:
    return LoyaltyApiClient(LOYLYTY_API_URL)


async def _get_client_context(
    session: ClientAccountsSessionDep,
    client_id: int,
) -> tuple[int, Any]:
    client = await ClientCrud(session).get_by_id(client_id)
    if client is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Client {client_id} not found",
        )
    return client.organization_id, client


def _subscription_to_deposit(
    subscription: dict[str, Any],
    *,
    organization_id: int,
) -> ClientDepositReadSchema:
    created_at = subscription.get("created_at") or subscription.get("started_at")
    updated_at = subscription.get("last_write_off_at") or created_at
    return ClientDepositReadSchema(
        id=subscription["id"],
        organization_id=organization_id,
        client_id=subscription["client_id"],
        amount=subscription.get("deposit_amount", Decimal("0")),
        currency="RUB",
        balance=subscription.get("deposit_left", Decimal("0")),
        status=subscription.get("status", "active"),
        expires_at=subscription.get("expires_at"),
        created_at=created_at,
        updated_at=updated_at,
    )


def _certificate_to_projection(
    certificate: dict[str, Any],
    *,
    organization_id: int,
) -> ClientCertificateReadSchema:
    return ClientCertificateReadSchema(
        id=certificate["id"],
        organization_id=organization_id,
        client_id=certificate["client_id"],
        certificate_id=certificate["id"],
        certificate_number=certificate["certificate_code"],
        nominal_amount=certificate["nominal_amount"],
        balance_amount=certificate["balance_amount"],
        status=certificate.get("status", "active"),
        issued_at=certificate["issued_at"],
        expires_at=certificate.get("expires_at"),
    )


def _subscription_to_projection(
    subscription: dict[str, Any],
    *,
    organization_id: int,
) -> ClientSubscriptionReadSchema:
    return ClientSubscriptionReadSchema(
        id=subscription["id"],
        organization_id=organization_id,
        client_id=subscription["client_id"],
        subscription_id=subscription["id"],
        name=subscription["subscription_name"],
        visits_total=subscription["visits_total"],
        visits_left=subscription["visits_left"],
        status=subscription.get("status", "active"),
        issued_at=subscription["started_at"],
        expires_at=subscription.get("expires_at"),
    )


def _consent_to_read(
    consent: Any,
    *,
    comment_service: ClientConsentCommentService,
    client_id: int,
) -> ClientConsentInfoRead:
    restrictions = comment_service.parse_restrictions(getattr(consent, "comment", None))
    return ClientConsentInfoRead(
        id=getattr(consent, "id", None),
        organization_id=getattr(consent, "organization_id", None),
        client_id=client_id,
        service_messages_allowed=bool(getattr(consent, "service_messages_allowed", False)),
        marketing_messages_allowed=bool(getattr(consent, "marketing_messages_allowed", False)),
        sms_allowed=bool(getattr(consent, "sms_allowed", False)),
        email_allowed=bool(getattr(consent, "email_allowed", False)),
        telegram_allowed=bool(getattr(consent, "telegram_allowed", False)),
        consent_given_at=getattr(consent, "consent_given_at", None),
        consent_text=getattr(consent, "consent_text", None),
        consent_source=getattr(consent, "consent_source", None),
        consent_revoked_at=getattr(consent, "consent_revoked_at", None),
        comment=getattr(consent, "comment", None),
        restrictions=ClientConsentRestrictionsRead(
            no_call=restrictions.no_call,
            no_write=restrictions.no_write,
            only_specific_time=restrictions.only_specific_time,
            raw_comment=restrictions.raw_comment,
        ),
    )


def _raise_http_error(exc: ClientAccountServiceError) -> None:
    if isinstance(exc, ClientAccountNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc) or "Р—Р°РїРёСЃСЊ СЃС‡С‘С‚Р° РєР»РёРµРЅС‚Р° РЅРµ РЅР°Р№РґРµРЅР°",
        ) from exc

    if isinstance(exc, ClientAccountReadOnlyError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc) or "РћРїРµСЂР°С†РёСЏ РґРѕСЃС‚СѓРїРЅР° С‚РѕР»СЊРєРѕ С‡РµСЂРµР· РѕСЃРЅРѕРІРЅРѕР№ СЃРµСЂРІРёСЃ-РІР»Р°РґРµР»РµС†",
        ) from exc

    if isinstance(exc, ClientAccountExternalProviderError):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=str(exc) or "Р’РЅРµС€РЅРёР№ РїСЂРѕРІР°Р№РґРµСЂ СЃС‡С‘С‚Р° РєР»РёРµРЅС‚Р° РЅРµ РЅР°СЃС‚СЂРѕРµРЅ",
        ) from exc

    if isinstance(exc, ClientAccountSyncError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc) or "РћС€РёР±РєР° СЃРёРЅС…СЂРѕРЅРёР·Р°С†РёРё РїСЂРѕРµРєС†РёРё СЃС‡С‘С‚Р° РєР»РёРµРЅС‚Р°",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc) or "РћС€РёР±РєР° СЃС‡С‘С‚Р° РєР»РёРµРЅС‚Р°",
    ) from exc


@router.get(
    "/clients/{client_id}",
    response_model=ClientAccountsSummaryRead,
)
async def get_client_accounts_summary(
    client_id: int,
    service: ClientAccountQueryServiceDep,
    session: ClientAccountsSessionDep,
    active_only: bool = Query(default=False),
    include_bonus: bool = Query(default=True),
) -> ClientAccountsSummaryRead:
    try:
        organization_id, _ = await _get_client_context(session, client_id)
        consent_crud = ClientConsentCrud(session)
        comment_service = ClientConsentCommentService(consent_crud)
        loyalty = _loyalty_client()
        subscriptions_raw = [
            item.model_dump(mode="json")
            for item in await loyalty.list_client_subscriptions(client_id)
        ]
        certificates_raw = [
            item.model_dump(mode="json")
            for item in await loyalty.list_client_certificates(client_id)
        ]
        if active_only:
            subscriptions_raw = [item for item in subscriptions_raw if item.get("status") == "active"]
            certificates_raw = [item for item in certificates_raw if item.get("status") == "active"]

        deposits = [
            _subscription_to_deposit(item, organization_id=organization_id)
            for item in subscriptions_raw
            if Decimal(str(item.get("deposit_amount", 0))) > 0 or Decimal(str(item.get("deposit_left", 0))) > 0
        ]
        certificates = [
            _certificate_to_projection(item, organization_id=organization_id)
            for item in certificates_raw
        ]
        subscriptions = [
            _subscription_to_projection(item, organization_id=organization_id)
            for item in subscriptions_raw
        ]

        bonus_balance = None
        if include_bonus:
            try:
                bonus = await _loyalty_client().get_bonus_balance(client_id)
                bonus_balance = ClientBonusBalanceRead(
                    client_id=bonus.client_id,
                    balance=Decimal(str(bonus.balance)),
                    currency="BONUS",
                    source="loyalty_api",
                    updated_at=None,
                    payload=bonus.model_dump(mode="json"),
                )
            except Exception:
                bonus_balance = None

        current_consent_model = await consent_crud.get_current_by_client_id(client_id=client_id)
        consent_history_models = await consent_crud.get_by_client_id(client_id=client_id)
        consent = None if current_consent_model is None else _consent_to_read(
            current_consent_model,
            comment_service=comment_service,
            client_id=client_id,
        )
        consent_history = [
            _consent_to_read(
                item,
                comment_service=comment_service,
                client_id=client_id,
            )
            for item in consent_history_models
        ]

        return ClientAccountsSummaryRead(
            client_id=client_id,
            deposits=deposits,
            certificates=certificates,
            subscriptions=subscriptions,
            bonus_balance=bonus_balance,
            consent=consent,
            consent_history=consent_history,
            totals=ClientAccountsTotalsRead(
                deposit_balance=sum((deposit.balance for deposit in deposits), Decimal("0")),
                certificate_balance=sum((certificate.balance_amount for certificate in certificates), Decimal("0")),
                subscription_visits_left=sum(item.visits_left for item in subscriptions),
                bonus_balance=Decimal("0") if bonus_balance is None else bonus_balance.balance,
            ),
        )
    except ClientAccountServiceError as exc:
        _raise_http_error(exc)


@router.get(
    "/clients/{client_id}/deposits",
    response_model=list[ClientDepositReadSchema],
)
async def list_client_deposits(
    client_id: int,
    service: ClientDepositServiceDep,
    session: ClientAccountsSessionDep,
    active_only: bool = Query(default=False),
) -> list[ClientDepositReadSchema]:
    organization_id, _ = await _get_client_context(session, client_id)
    subscriptions = [
        item.model_dump(mode="json")
        for item in await _loyalty_client().list_client_subscriptions(client_id)
    ]
    if active_only:
        subscriptions = [item for item in subscriptions if item.get("status") == "active"]
    return [
        _subscription_to_deposit(item, organization_id=organization_id)
        for item in subscriptions
        if Decimal(str(item.get("deposit_amount", 0))) > 0 or Decimal(str(item.get("deposit_left", 0))) > 0
    ]


@router.get(
    "/clients/{client_id}/deposits/active-total-balance",
    response_model=TotalBalanceRead,
)
async def get_client_active_deposit_total_balance(
    client_id: int,
    service: ClientDepositServiceDep,
    session: ClientAccountsSessionDep,
) -> TotalBalanceRead:
    organization_id, _ = await _get_client_context(session, client_id)
    deposits = await list_client_deposits(
        client_id=client_id,
        service=service,
        session=session,
        active_only=True,
    )
    amount = sum((deposit.balance for deposit in deposits), Decimal("0"))
    return TotalBalanceRead(client_id=client_id, amount=amount)


@router.post(
    "/deposits",
    response_model=ClientDepositReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_deposit_projection(
    payload: ClientDepositCreateSchema,
    service: ClientDepositServiceDep,
) -> ClientDepositReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Deposits are owned by loyalty service. client_accounts is read-only."))


@router.get(
    "/deposits/{deposit_id}",
    response_model=ClientDepositReadSchema,
)
async def get_deposit(
    deposit_id: int,
    service: ClientDepositServiceDep,
) -> ClientDepositReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Read deposits by client via loyalty-backed endpoints."))


@router.patch(
    "/deposits/{deposit_id}",
    response_model=ClientDepositReadSchema,
)
async def refresh_deposit_projection(
    deposit_id: int,
    payload: ClientDepositUpdateSchema,
    service: ClientDepositServiceDep,
) -> ClientDepositReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Deposits are owned by loyalty service. client_accounts is read-only."))


@router.post(
    "/deposits/{deposit_id}/archive",
    response_model=ClientDepositReadSchema,
)
async def archive_deposit_projection(
    deposit_id: int,
    service: ClientDepositServiceDep,
) -> ClientDepositReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Deposits are owned by loyalty service. client_accounts is read-only."))


@router.delete(
    "/deposits/{deposit_id}",
    response_model=DeleteRead,
)
async def delete_deposit_projection(
    deposit_id: int,
    service: ClientDepositServiceDep,
) -> DeleteRead:
    _raise_http_error(ClientAccountReadOnlyError("Deposits are owned by loyalty service. client_accounts is read-only."))


@router.get(
    "/clients/{client_id}/certificates",
    response_model=list[ClientCertificateReadSchema],
)
async def list_client_certificates(
    client_id: int,
    service: ClientCertificateServiceDep,
    session: ClientAccountsSessionDep,
    active_only: bool = Query(default=False),
) -> list[ClientCertificateReadSchema]:
    organization_id, _ = await _get_client_context(session, client_id)
    certificates = [
        item.model_dump(mode="json")
        for item in await _loyalty_client().list_client_certificates(client_id)
    ]
    if active_only:
        certificates = [item for item in certificates if item.get("status") == "active"]
    return [
        _certificate_to_projection(item, organization_id=organization_id)
        for item in certificates
    ]


@router.get(
    "/clients/{client_id}/certificates/active-total-balance",
    response_model=TotalBalanceRead,
)
async def get_client_active_certificate_total_balance(
    client_id: int,
    service: ClientCertificateServiceDep,
    session: ClientAccountsSessionDep,
) -> TotalBalanceRead:
    certificates = await list_client_certificates(
        client_id=client_id,
        service=service,
        session=session,
        active_only=True,
    )
    amount = sum((certificate.balance_amount for certificate in certificates), Decimal("0"))
    return TotalBalanceRead(client_id=client_id, amount=amount)


@router.post(
    "/certificates",
    response_model=ClientCertificateReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_certificate_projection(
    payload: ClientCertificateCreateSchema,
    service: ClientCertificateServiceDep,
) -> ClientCertificateReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Certificates are owned by loyalty service. client_accounts is read-only."))


@router.get(
    "/certificates/by-number/{certificate_number}",
    response_model=ClientCertificateReadSchema,
)
async def get_certificate_by_number(
    certificate_number: str,
    service: ClientCertificateServiceDep,
) -> ClientCertificateReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Read certificates by client via loyalty-backed endpoints."))


@router.get(
    "/certificates/{client_certificate_id}",
    response_model=ClientCertificateReadSchema,
)
async def get_certificate(
    client_certificate_id: int,
    service: ClientCertificateServiceDep,
) -> ClientCertificateReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Read certificates by client via loyalty-backed endpoints."))


@router.patch(
    "/certificates/{client_certificate_id}",
    response_model=ClientCertificateReadSchema,
)
async def refresh_certificate_projection(
    client_certificate_id: int,
    payload: ClientCertificateUpdateSchema,
    service: ClientCertificateServiceDep,
) -> ClientCertificateReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Certificates are owned by loyalty service. client_accounts is read-only."))


@router.post(
    "/certificates/{client_certificate_id}/archive",
    response_model=ClientCertificateReadSchema,
)
async def archive_certificate_projection(
    client_certificate_id: int,
    service: ClientCertificateServiceDep,
) -> ClientCertificateReadSchema:
    _raise_http_error(ClientAccountReadOnlyError("Certificates are owned by loyalty service. client_accounts is read-only."))


@router.delete(
    "/certificates/{client_certificate_id}",
    response_model=DeleteRead,
)
async def delete_certificate_projection(
    client_certificate_id: int,
    service: ClientCertificateServiceDep,
) -> DeleteRead:
    _raise_http_error(ClientAccountReadOnlyError("Certificates are owned by loyalty service. client_accounts is read-only."))


@router.get(
    "/clients/{client_id}/subscriptions",
    response_model=list[ClientSubscriptionReadSchema],
)
async def list_client_subscriptions(
    client_id: int,
    service: ClientSubscriptionServiceDep,
    active_only: bool = Query(default=False),
) -> list[ClientSubscriptionReadSchema]:
    subscriptions = await service.list_by_client(
        client_id=client_id,
        active_only=active_only,
    )
    return [
        ClientSubscriptionReadSchema.model_validate(subscription)
        for subscription in subscriptions
    ]


@router.get(
    "/clients/{client_id}/subscriptions/active-total-visits-left",
    response_model=TotalVisitsRead,
)
async def get_client_active_subscription_total_visits_left(
    client_id: int,
    service: ClientSubscriptionServiceDep,
) -> TotalVisitsRead:
    visits_left = await service.get_active_total_visits_left(client_id=client_id)
    return TotalVisitsRead(client_id=client_id, visits_left=visits_left)


@router.post(
    "/subscriptions",
    response_model=ClientSubscriptionReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_subscription_projection(
    payload: ClientSubscriptionCreateSchema,
    service: ClientSubscriptionServiceDep,
) -> ClientSubscriptionReadSchema:
    try:
        subscription = await service.create_projection(payload)
    except ClientAccountServiceError as exc:
        _raise_http_error(exc)

    return ClientSubscriptionReadSchema.model_validate(subscription)


@router.get(
    "/subscriptions/{client_subscription_id}",
    response_model=ClientSubscriptionReadSchema,
)
async def get_subscription(
    client_subscription_id: int,
    service: ClientSubscriptionServiceDep,
) -> ClientSubscriptionReadSchema:
    try:
        subscription = await service.get(client_subscription_id)
    except ClientAccountServiceError as exc:
        _raise_http_error(exc)

    return ClientSubscriptionReadSchema.model_validate(subscription)


@router.patch(
    "/subscriptions/{client_subscription_id}",
    response_model=ClientSubscriptionReadSchema,
)
async def refresh_subscription_projection(
    client_subscription_id: int,
    payload: ClientSubscriptionUpdateSchema,
    service: ClientSubscriptionServiceDep,
) -> ClientSubscriptionReadSchema:
    try:
        subscription = await service.refresh_projection(
            client_subscription_id=client_subscription_id,
            payload=payload,
        )
    except ClientAccountServiceError as exc:
        _raise_http_error(exc)

    return ClientSubscriptionReadSchema.model_validate(subscription)


@router.post(
    "/subscriptions/{client_subscription_id}/archive",
    response_model=ClientSubscriptionReadSchema,
)
async def archive_subscription_projection(
    client_subscription_id: int,
    service: ClientSubscriptionServiceDep,
) -> ClientSubscriptionReadSchema:
    try:
        subscription = await service.archive_projection(client_subscription_id)
    except ClientAccountServiceError as exc:
        _raise_http_error(exc)

    return ClientSubscriptionReadSchema.model_validate(subscription)


@router.delete(
    "/subscriptions/{client_subscription_id}",
    response_model=DeleteRead,
)
async def delete_subscription_projection(
    client_subscription_id: int,
    service: ClientSubscriptionServiceDep,
) -> DeleteRead:
    try:
        await service.delete_projection(client_subscription_id)
    except ClientAccountServiceError as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)


@router.get(
    "/clients/{client_id}/bonus-balance",
    response_model=ClientBonusBalanceRead,
)
async def get_client_bonus_balance(
    client_id: int,
    service: ClientBonusBalanceServiceDep,
) -> ClientBonusBalanceRead:
    try:
        balance = await service.get_balance(client_id=client_id)
    except ClientAccountServiceError as exc:
        _raise_http_error(exc)

    return ClientBonusBalanceRead(
        client_id=balance.client_id,
        balance=balance.balance,
        currency=balance.currency,
        source=balance.source,
        updated_at=balance.updated_at,
        payload=balance.payload,
    )


@router.get(
    "/clients/{client_id}/bonus-history",
    response_model=list[ClientBonusHistoryItemRead],
)
async def list_client_bonus_history(
    client_id: int,
    service: ClientBonusBalanceServiceDep,
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientBonusHistoryItemRead]:
    try:
        history = await service.list_history(
            client_id=client_id,
            offset=offset,
            limit=limit,
        )
    except ClientAccountServiceError as exc:
        _raise_http_error(exc)

    return [
        ClientBonusHistoryItemRead(
            client_id=item.client_id,
            operation_type=item.operation_type,
            amount=item.amount,
            balance_after=item.balance_after,
            occurred_at=item.occurred_at,
            source=item.source,
            payload=item.payload,
        )
        for item in history
    ]
