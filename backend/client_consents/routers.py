from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from client_circout.backend.client_consents.crud import ClientConsentConflictError
from client_circout.backend.client_consents.dependencies import (
    ClientConsentCommentServiceDep,
    ClientConsentHistoryServiceDep,
    ClientConsentQueryServiceDep,
    ClientConsentServiceDep,
    ClientConsentSourceServiceDep,
    ClientConsentStatusServiceDep,
    ClientConsentSyncServiceDep,
)
from client_circout.backend.client_consents.schemas import (
    ClientConsentCreateSchema,
    ClientConsentReadSchema,
    ClientConsentUpdateSchema,
)
from client_circout.backend.client_consents.services import ExternalConsentPayload
from client_circout.backend.client_consents.services.exceptions import (
    ClientConsentInvalidChannelError,
    ClientConsentInvalidMessageTypeError,
    ClientConsentInvalidSourceError,
    ClientConsentNotFoundError,
    ClientConsentServiceError,
)

router = APIRouter(
    prefix="/client-consents",
    tags=["client-consents"],
)


class DeleteRead(BaseModel):
    deleted: bool


class RevokeConsentRequest(BaseModel):
    comment: str | None = None


class GrantAllChannelsRequest(BaseModel):
    consent_text: str | None = None
    consent_source: str | None = None


class CreateConsentVersionRequest(ClientConsentCreateSchema):
    revoke_previous: bool = True


class UpdateCommentRequest(BaseModel):
    comment: str | None = None


class ConsentCommentRead(BaseModel):
    consent_id: int | None = None
    client_id: int | None = None
    comment: str | None = None


class ConsentRestrictionsRead(BaseModel):
    no_call: bool
    no_write: bool
    only_specific_time: bool
    raw_comment: str | None = None


class ConsentStatusRead(BaseModel):
    client_id: int
    service_messages_allowed: bool
    marketing_messages_allowed: bool
    sms_allowed: bool
    email_allowed: bool
    telegram_allowed: bool
    is_revoked: bool
    comment: str | None = None


class BooleanRead(BaseModel):
    allowed: bool


class AllowedSourcesRead(BaseModel):
    sources: list[str]


class SyncExternalConsentRequest(BaseModel):
    organization_id: int
    client_id: int
    service_messages_allowed: bool
    marketing_messages_allowed: bool
    sms_allowed: bool
    email_allowed: bool
    telegram_allowed: bool
    consent_text: str | None = None
    consent_source: str | None = None
    consent_given_at: datetime | None = None
    comment: str | None = None
    create_new_version: bool = True


def _to_read(consent) -> ClientConsentReadSchema:
    return ClientConsentReadSchema.model_validate(consent)


def _raise_http_error(exc: Exception) -> None:
    if isinstance(exc, ClientConsentNotFoundError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc) or "Согласие клиента не найдено",
        ) from exc

    if isinstance(exc, ClientConsentConflictError):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Конфликт согласия клиента",
        ) from exc

    if isinstance(
        exc,
        (
            ClientConsentInvalidSourceError,
            ClientConsentInvalidChannelError,
            ClientConsentInvalidMessageTypeError,
        ),
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Некорректные данные согласия",
        ) from exc

    if isinstance(exc, ClientConsentServiceError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc) or "Ошибка сервиса согласий клиента",
        ) from exc

    raise HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail=str(exc) or "Ошибка согласия клиента",
    ) from exc


@router.get("/sources", response_model=AllowedSourcesRead)
async def get_allowed_consent_sources(
    service: ClientConsentSourceServiceDep,
) -> AllowedSourcesRead:
    return AllowedSourcesRead(
        sources=sorted(service.allowed_sources()),
    )


@router.post(
    "",
    response_model=ClientConsentReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_consent(
    payload: ClientConsentCreateSchema,
    service: ClientConsentServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.create(payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.post(
    "/versions",
    response_model=ClientConsentReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_consent_version(
    payload: CreateConsentVersionRequest,
    service: ClientConsentServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.create_version(
            ClientConsentCreateSchema(**payload.model_dump(exclude={"revoke_previous"})),
            revoke_previous=payload.revoke_previous,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.get(
    "",
    response_model=list[ClientConsentReadSchema],
)
async def list_consents(
    service: ClientConsentQueryServiceDep,
    organization_id: int | None = Query(default=None),
    client_id: int | None = Query(default=None),
    consent_source: str | None = Query(default=None),
    only_current: bool | None = Query(default=None),
    service_messages_allowed: bool | None = Query(default=None),
    marketing_messages_allowed: bool | None = Query(default=None),
    sms_allowed: bool | None = Query(default=None),
    email_allowed: bool | None = Query(default=None),
    telegram_allowed: bool | None = Query(default=None),
    given_from: datetime | None = Query(default=None),
    given_to: datetime | None = Query(default=None),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientConsentReadSchema]:
    consents = await service.list_consents(
        organization_id=organization_id,
        client_id=client_id,
        consent_source=consent_source,
        only_current=only_current,
        service_messages_allowed=service_messages_allowed,
        marketing_messages_allowed=marketing_messages_allowed,
        sms_allowed=sms_allowed,
        email_allowed=email_allowed,
        telegram_allowed=telegram_allowed,
        given_from=given_from,
        given_to=given_to,
        offset=offset,
        limit=limit,
    )
    return [_to_read(consent) for consent in consents]


@router.get(
    "/allowed-for-channel",
    response_model=list[ClientConsentReadSchema],
)
async def list_allowed_for_channel(
    service: ClientConsentQueryServiceDep,
    organization_id: int,
    channel: str = Query(max_length=32),
    message_type: str = Query(max_length=32),
    offset: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=1000),
) -> list[ClientConsentReadSchema]:
    try:
        consents = await service.list_allowed_for_channel(
            organization_id=organization_id,
            channel=channel,
            message_type=message_type,
            offset=offset,
            limit=limit,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return [_to_read(consent) for consent in consents]


@router.get(
    "/clients/{client_id}/current",
    response_model=ClientConsentReadSchema | None,
)
async def get_current_client_consent(
    client_id: int,
    service: ClientConsentServiceDep,
) -> ClientConsentReadSchema | None:
    consent = await service.get_current_by_client_id(client_id)

    if consent is None:
        return None

    return _to_read(consent)


@router.get(
    "/clients/{client_id}/history",
    response_model=list[ClientConsentReadSchema],
)
async def get_client_consent_history(
    client_id: int,
    service: ClientConsentHistoryServiceDep,
) -> list[ClientConsentReadSchema]:
    consents = await service.list_by_client(client_id)
    return [_to_read(consent) for consent in consents]


@router.get(
    "/clients/{client_id}/last-change",
    response_model=ClientConsentReadSchema | None,
)
async def get_client_last_consent_change(
    client_id: int,
    service: ClientConsentHistoryServiceDep,
) -> ClientConsentReadSchema | None:
    consent = await service.get_last_change(client_id)

    if consent is None:
        return None

    return _to_read(consent)


@router.get(
    "/clients/{client_id}/status",
    response_model=ConsentStatusRead,
)
async def get_client_consent_status(
    client_id: int,
    service: ClientConsentStatusServiceDep,
) -> ConsentStatusRead:
    consent_status = await service.get_current_status(client_id)
    return ConsentStatusRead(**consent_status.__dict__)


@router.get(
    "/clients/{client_id}/can-send",
    response_model=BooleanRead,
)
async def can_send_to_client(
    client_id: int,
    service: ClientConsentStatusServiceDep,
    channel: str = Query(max_length=32),
    message_type: str = Query(max_length=32),
) -> BooleanRead:
    try:
        allowed = await service.can_send(
            client_id=client_id,
            channel=channel,
            message_type=message_type,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return BooleanRead(allowed=allowed)


@router.get(
    "/clients/{client_id}/channels/{channel}/allowed",
    response_model=BooleanRead,
)
async def is_client_channel_allowed(
    client_id: int,
    channel: str,
    service: ClientConsentStatusServiceDep,
) -> BooleanRead:
    try:
        allowed = await service.is_channel_allowed(
            client_id=client_id,
            channel=channel,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return BooleanRead(allowed=allowed)


@router.get(
    "/clients/{client_id}/comment",
    response_model=ConsentCommentRead,
)
async def get_current_client_consent_comment(
    client_id: int,
    service: ClientConsentCommentServiceDep,
) -> ConsentCommentRead:
    comment = await service.get_current_comment_by_client(client_id)
    return ConsentCommentRead(client_id=client_id, comment=comment)


@router.get(
    "/clients/{client_id}/restrictions",
    response_model=ConsentRestrictionsRead,
)
async def get_client_communication_restrictions(
    client_id: int,
    service: ClientConsentCommentServiceDep,
) -> ConsentRestrictionsRead:
    restrictions = await service.get_restrictions_by_client(client_id)
    return ConsentRestrictionsRead(**restrictions.__dict__)


@router.post(
    "/clients/{client_id}/revoke-current",
    response_model=ClientConsentReadSchema,
)
async def revoke_current_client_consent(
    client_id: int,
    payload: RevokeConsentRequest,
    service: ClientConsentServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.revoke_current_by_client_id(
            client_id,
            comment=payload.comment,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.post(
    "/sync/external",
    response_model=ClientConsentReadSchema,
)
async def sync_external_consent(
    payload: SyncExternalConsentRequest,
    service: ClientConsentSyncServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.sync_from_external_payload(
            ExternalConsentPayload(
                organization_id=payload.organization_id,
                client_id=payload.client_id,
                service_messages_allowed=payload.service_messages_allowed,
                marketing_messages_allowed=payload.marketing_messages_allowed,
                sms_allowed=payload.sms_allowed,
                email_allowed=payload.email_allowed,
                telegram_allowed=payload.telegram_allowed,
                consent_text=payload.consent_text,
                consent_source=payload.consent_source,
                consent_given_at=payload.consent_given_at,
                comment=payload.comment,
            ),
            create_new_version=payload.create_new_version,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.post(
    "/clients/{client_id}/sync-revocation",
    response_model=ClientConsentReadSchema,
)
async def sync_external_revocation(
    client_id: int,
    payload: RevokeConsentRequest,
    service: ClientConsentSyncServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.sync_revocation(
            client_id=client_id,
            comment=payload.comment,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.get(
    "/{consent_id}",
    response_model=ClientConsentReadSchema,
)
async def get_consent(
    consent_id: int,
    service: ClientConsentServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.get(consent_id)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.patch(
    "/{consent_id}",
    response_model=ClientConsentReadSchema,
)
async def update_consent(
    consent_id: int,
    payload: ClientConsentUpdateSchema,
    service: ClientConsentServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.update(consent_id, payload)
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.post(
    "/{consent_id}/grant-all-channels",
    response_model=ClientConsentReadSchema,
)
async def grant_all_channels(
    consent_id: int,
    payload: GrantAllChannelsRequest,
    service: ClientConsentServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.grant_all_channels(
            consent_id,
            consent_text=payload.consent_text,
            consent_source=payload.consent_source,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.post(
    "/{consent_id}/revoke",
    response_model=ClientConsentReadSchema,
)
async def revoke_consent(
    consent_id: int,
    payload: RevokeConsentRequest,
    service: ClientConsentServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.revoke(
            consent_id,
            comment=payload.comment,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.get(
    "/{consent_id}/comment",
    response_model=ConsentCommentRead,
)
async def get_consent_comment(
    consent_id: int,
    service: ClientConsentCommentServiceDep,
) -> ConsentCommentRead:
    try:
        comment = await service.get_comment(consent_id)
    except Exception as exc:
        _raise_http_error(exc)

    return ConsentCommentRead(consent_id=consent_id, comment=comment)


@router.patch(
    "/{consent_id}/comment",
    response_model=ClientConsentReadSchema,
)
async def update_consent_comment(
    consent_id: int,
    payload: UpdateCommentRequest,
    service: ClientConsentCommentServiceDep,
) -> ClientConsentReadSchema:
    try:
        consent = await service.update_comment(
            consent_id,
            comment=payload.comment,
        )
    except Exception as exc:
        _raise_http_error(exc)

    return _to_read(consent)


@router.delete(
    "/{consent_id}",
    response_model=DeleteRead,
)
async def delete_consent(
    consent_id: int,
    service: ClientConsentServiceDep,
) -> DeleteRead:
    try:
        await service.delete(consent_id)
    except Exception as exc:
        _raise_http_error(exc)

    return DeleteRead(deleted=True)