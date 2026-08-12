from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_accounts.crud.certificates import ClientCertificateCrud
from client_circout.backend.client_accounts.crud.deposits import ClientDepositCrud
from client_circout.backend.client_accounts.crud.subscriptions import ClientSubscriptionCrud
from client_circout.backend.client_accounts.services import (
    ClientAccountQueryService,
    ClientBonusBalanceService,
    ClientCertificateService,
    ClientDepositService,
    ClientSubscriptionService,
)
from client_circout.backend.db.db import SessionFactory


async def get_client_accounts_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientAccountsSessionDep = Annotated[
    AsyncSession,
    Depends(get_client_accounts_db_session),
]


def get_client_deposit_crud(
    session: ClientAccountsSessionDep,
) -> ClientDepositCrud:
    return ClientDepositCrud(session)


ClientDepositCrudDep = Annotated[
    ClientDepositCrud,
    Depends(get_client_deposit_crud),
]


def get_client_certificate_crud(
    session: ClientAccountsSessionDep,
) -> ClientCertificateCrud:
    return ClientCertificateCrud(session)


ClientCertificateCrudDep = Annotated[
    ClientCertificateCrud,
    Depends(get_client_certificate_crud),
]


def get_client_subscription_crud(
    session: ClientAccountsSessionDep,
) -> ClientSubscriptionCrud:
    return ClientSubscriptionCrud(session)


ClientSubscriptionCrudDep = Annotated[
    ClientSubscriptionCrud,
    Depends(get_client_subscription_crud),
]


def get_client_deposit_service(
    deposit_crud: ClientDepositCrudDep,
) -> ClientDepositService:
    return ClientDepositService(deposit_crud)


ClientDepositServiceDep = Annotated[
    ClientDepositService,
    Depends(get_client_deposit_service),
]


def get_client_certificate_service(
    certificate_crud: ClientCertificateCrudDep,
) -> ClientCertificateService:
    return ClientCertificateService(certificate_crud)


ClientCertificateServiceDep = Annotated[
    ClientCertificateService,
    Depends(get_client_certificate_service),
]


def get_client_subscription_service(
    subscription_crud: ClientSubscriptionCrudDep,
) -> ClientSubscriptionService:
    return ClientSubscriptionService(subscription_crud)


ClientSubscriptionServiceDep = Annotated[
    ClientSubscriptionService,
    Depends(get_client_subscription_service),
]


def get_client_bonus_balance_service() -> ClientBonusBalanceService:
    return ClientBonusBalanceService()


ClientBonusBalanceServiceDep = Annotated[
    ClientBonusBalanceService,
    Depends(get_client_bonus_balance_service),
]


def get_client_account_query_service(
    deposit_service: ClientDepositServiceDep,
    certificate_service: ClientCertificateServiceDep,
    subscription_service: ClientSubscriptionServiceDep,
    bonus_balance_service: ClientBonusBalanceServiceDep,
) -> ClientAccountQueryService:
    return ClientAccountQueryService(
        deposit_service=deposit_service,
        certificate_service=certificate_service,
        subscription_service=subscription_service,
        bonus_balance_service=bonus_balance_service,
    )


ClientAccountQueryServiceDep = Annotated[
    ClientAccountQueryService,
    Depends(get_client_account_query_service),
]
