from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.client_communications.crud import ClientMessageCrud, ClientMessageDeliveryLogCrud
from client_circout.backend.client_communications.services.client_message_query_service import ClientMessageQueryService
from client_circout.backend.db.db import SessionFactory


async def get_client_communications_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientCommunicationsSessionDep = Annotated[
    AsyncSession,
    Depends(get_client_communications_db_session),
]


def get_client_message_delivery_log_crud(
    session: ClientCommunicationsSessionDep,
) -> ClientMessageDeliveryLogCrud:
    return ClientMessageDeliveryLogCrud(session)


ClientMessageDeliveryLogCrudDep = Annotated[
    ClientMessageDeliveryLogCrud,
    Depends(get_client_message_delivery_log_crud),
]


def get_client_message_crud(
    session: ClientCommunicationsSessionDep,
) -> ClientMessageCrud:
    return ClientMessageCrud(session)


ClientMessageCrudDep = Annotated[
    ClientMessageCrud,
    Depends(get_client_message_crud),
]


def get_client_message_query_service(
    session: ClientCommunicationsSessionDep,
) -> ClientMessageQueryService:
    return ClientMessageQueryService(session)


ClientMessageQueryServiceDep = Annotated[
    ClientMessageQueryService,
    Depends(get_client_message_query_service),
]
