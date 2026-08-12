from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, File, HTTPException, Query, UploadFile, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
import asyncio
from uuid import uuid4

from client_circout.backend.client_communications.dependencies import (
    ClientMessageCrudDep,
    ClientMessageQueryServiceDep,
    ClientCommunicationsSessionDep,
    ClientMessageDeliveryLogCrudDep,
)
from client_circout.backend.client_communications.models import (
    ClientMessageDeliveryLogModel,
    ClientMessageModel,
    ClientPushPreferenceModel,
    ClientPushSubscriptionModel,
    ClientPushJobModel,
)
from client_circout.backend.client_communications.schemas import (
    ClientMessageCreateSchema,
    ClientMessageReadSchema,
    ClientMessageUpdateSchema,
    ClientMessageDeliveryLogCreateSchema,
    ClientMessageDeliveryLogReadSchema,
    ClientMessageDeliveryLogUpdateSchema,
    ClientPushPreferenceUpdateSchema,
    ClientPushSendSchema,
    ClientPushStatusSchema,
    ClientPushSubscriptionCreateSchema,
    ClientPushSubscriptionDeleteSchema,
)
from client_circout.backend.client_communications.services.web_push_service import (
    web_push_configured,
)
from client_circout.backend.client_communications.services.push_broadcast_service import send_push_broadcast
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.config import WEB_PUSH_VAPID_PUBLIC_KEY
from client_circout.backend.db.db import SessionFactory

router = APIRouter(
    prefix="/client-communications",
    tags=["client-communications"],
)

PUSH_NOTIFICATION_IMAGES_DIR = Path(__file__).resolve().parents[2] / "uploads" / "push-notification-images"
PUSH_NOTIFICATION_IMAGE_SUFFIXES = {".jpg", ".jpeg", ".png", ".webp", ".gif"}
PUSH_NOTIFICATION_IMAGE_MAX_BYTES = 10 * 1024 * 1024


@router.post("/push/images")
async def upload_push_images(files: list[UploadFile] = File(...)) -> dict[str, list[str]]:
    if not files or len(files) > 10:
        raise HTTPException(status_code=422, detail="Можно прикрепить от 1 до 10 изображений")
    PUSH_NOTIFICATION_IMAGES_DIR.mkdir(parents=True, exist_ok=True)
    image_urls: list[str] = []
    for file in files:
        suffix = Path(file.filename or "").suffix.lower()
        if suffix not in PUSH_NOTIFICATION_IMAGE_SUFFIXES or not str(file.content_type or "").startswith("image/"):
            raise HTTPException(status_code=422, detail="Поддерживаются изображения JPG, PNG, WEBP и GIF")
        content = await file.read(PUSH_NOTIFICATION_IMAGE_MAX_BYTES + 1)
        if len(content) > PUSH_NOTIFICATION_IMAGE_MAX_BYTES:
            raise HTTPException(status_code=413, detail="Размер одного изображения не должен превышать 10 МБ")
        filename = f"{uuid4().hex}{suffix}"
        (PUSH_NOTIFICATION_IMAGES_DIR / filename).write_bytes(content)
        image_urls.append(f"/crm-api/client-communications/push/images/{filename}")
    return {"image_urls": image_urls}


@router.get("/push/images/{filename}", response_class=FileResponse)
async def get_push_image(filename: str) -> FileResponse:
    safe_name = Path(filename).name
    path = PUSH_NOTIFICATION_IMAGES_DIR / safe_name
    if safe_name != filename or path.suffix.lower() not in PUSH_NOTIFICATION_IMAGE_SUFFIXES or not path.is_file():
        raise HTTPException(status_code=404, detail="Изображение не найдено")
    return FileResponse(path)


class MessageStatusUpdateRequest(BaseModel):
    status: str = Field(max_length=64)
    delivered_at: datetime | None = None
    error_text: str | None = None


class DeleteRead(BaseModel):
    deleted: bool


class MessageStatsRead(BaseModel):
    client_id: int | None = None
    total: int
    by_channel: dict[str, int]
    by_status: dict[str, int]


class ClientPushSendRead(BaseModel):
    ok: bool
    recipients: int
    sent: int


async def _client_organization_id(session: ClientCommunicationsSessionDep, client_id: int) -> int | None:
    return await session.scalar(
        select(ClientModel.organization_id).where(ClientModel.id == client_id)
    )


def _to_read(
    message: ClientMessageDeliveryLogModel,
) -> ClientMessageDeliveryLogReadSchema:
    return ClientMessageDeliveryLogReadSchema.model_validate(message)


def _to_message_read(
    message: ClientMessageModel,
) -> ClientMessageReadSchema:
    return ClientMessageReadSchema.model_validate(message)


async def _get_message_or_404(
    crud: ClientMessageDeliveryLogCrudDep,
    message_id: int,
) -> ClientMessageDeliveryLogModel:
    message = await crud.get_by_id(message_id)

    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сообщение не найдено",
        )

    return message


async def _get_client_message_or_404(
    crud: ClientMessageCrudDep,
    message_id: int,
) -> ClientMessageModel:
    message = await crud.get_by_id(message_id)

    if message is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Сообщение не найдено",
        )

    return message


@router.post(
    "/messages/history",
    response_model=ClientMessageReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_message(
    payload: ClientMessageCreateSchema,
    crud: ClientMessageCrudDep,
) -> ClientMessageReadSchema:
    message = await crud.create(payload.model_dump())
    return _to_message_read(message)


@router.get(
    "/messages/history/{message_id}",
    response_model=ClientMessageReadSchema,
)
async def get_message(
    message_id: int,
    crud: ClientMessageCrudDep,
) -> ClientMessageReadSchema:
    message = await _get_client_message_or_404(crud, message_id)
    return _to_message_read(message)


@router.post(
    "/messages",
    response_model=ClientMessageDeliveryLogReadSchema,
    status_code=status.HTTP_201_CREATED,
)
async def create_message_log(
    payload: ClientMessageDeliveryLogCreateSchema,
    crud: ClientMessageDeliveryLogCrudDep,
) -> ClientMessageDeliveryLogReadSchema:
    message = await crud.create(payload.model_dump())
    return _to_read(message)


@router.get(
    "/messages/{message_id}",
    response_model=ClientMessageDeliveryLogReadSchema,
)
async def get_message_log(
    message_id: int,
    crud: ClientMessageDeliveryLogCrudDep,
) -> ClientMessageDeliveryLogReadSchema:
    message = await _get_message_or_404(crud, message_id)
    return _to_read(message)


@router.get(
    "/clients/{client_id}/messages",
    response_model=list[ClientMessageReadSchema],
)
async def list_client_messages(
    client_id: int,
    service: ClientMessageQueryServiceDep,
    channel: str | None = Query(default=None, max_length=64),
    message_type: str | None = Query(default=None, max_length=64),
    status_value: str | None = Query(default=None, alias="status", max_length=64),
    employee_id: int | None = Query(default=None),
    related_visit_id: int | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[ClientMessageReadSchema]:
    messages = await service.list_messages(
        client_id=client_id,
        channel=channel,
        message_type=message_type,
        delivery_status=status_value,
        employee_id=employee_id,
        related_visit_id=related_visit_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return [_to_message_read(message) for message in messages]


@router.get(
    "/messages",
    response_model=list[ClientMessageReadSchema],
)
async def list_messages(
    service: ClientMessageQueryServiceDep,
    client_id: int | None = Query(default=None),
    organization_id: int | None = Query(default=None),
    channel: str | None = Query(default=None, max_length=64),
    message_type: str | None = Query(default=None, max_length=64),
    status_value: str | None = Query(default=None, alias="status", max_length=64),
    employee_id: int | None = Query(default=None),
    related_visit_id: int | None = Query(default=None),
    date_from: datetime | None = Query(default=None),
    date_to: datetime | None = Query(default=None),
    limit: int = Query(default=100, ge=1, le=1000),
    offset: int = Query(default=0, ge=0),
) -> list[ClientMessageReadSchema]:
    messages = await service.list_messages(
        organization_id=organization_id,
        client_id=client_id,
        channel=channel,
        message_type=message_type,
        delivery_status=status_value,
        employee_id=employee_id,
        related_visit_id=related_visit_id,
        date_from=date_from,
        date_to=date_to,
        limit=limit,
        offset=offset,
    )
    return [_to_message_read(message) for message in messages]


@router.patch(
    "/messages/history/{message_id}",
    response_model=ClientMessageReadSchema,
)
async def update_message(
    message_id: int,
    payload: ClientMessageUpdateSchema,
    crud: ClientMessageCrudDep,
) -> ClientMessageReadSchema:
    message = await _get_client_message_or_404(crud, message_id)
    updated_message = await crud.update(
        message,
        payload.model_dump(exclude_unset=True),
    )
    return _to_message_read(updated_message)


@router.patch(
    "/messages/{message_id}",
    response_model=ClientMessageDeliveryLogReadSchema,
)
async def update_message_log(
    message_id: int,
    payload: ClientMessageDeliveryLogUpdateSchema,
    crud: ClientMessageDeliveryLogCrudDep,
) -> ClientMessageDeliveryLogReadSchema:
    message = await _get_message_or_404(crud, message_id)
    updated_message = await crud.update(
        message,
        payload.model_dump(exclude_unset=True),
    )
    return _to_read(updated_message)


@router.patch(
    "/messages/{message_id}/status",
    response_model=ClientMessageDeliveryLogReadSchema,
)
async def update_message_status(
    message_id: int,
    payload: MessageStatusUpdateRequest,
    crud: ClientMessageDeliveryLogCrudDep,
) -> ClientMessageDeliveryLogReadSchema:
    message = await _get_message_or_404(crud, message_id)

    updated_message = await crud.update(
        message,
        payload.model_dump(exclude_unset=True),
    )
    return _to_read(updated_message)


@router.post(
    "/messages/{message_id}/mark-sent",
    response_model=ClientMessageDeliveryLogReadSchema,
)
async def mark_message_sent(
    message_id: int,
    crud: ClientMessageDeliveryLogCrudDep,
) -> ClientMessageDeliveryLogReadSchema:
    message = await _get_message_or_404(crud, message_id)

    updated_message = await crud.update(
        message,
        {"status": "sent"},
    )
    return _to_read(updated_message)


@router.post(
    "/messages/{message_id}/mark-delivered",
    response_model=ClientMessageDeliveryLogReadSchema,
)
async def mark_message_delivered(
    message_id: int,
    crud: ClientMessageDeliveryLogCrudDep,
) -> ClientMessageDeliveryLogReadSchema:
    message = await _get_message_or_404(crud, message_id)

    updated_message = await crud.update(
        message,
        {
            "status": "delivered",
            "delivered_at": datetime.utcnow(),
        },
    )
    return _to_read(updated_message)


@router.post(
    "/messages/{message_id}/mark-failed",
    response_model=ClientMessageDeliveryLogReadSchema,
)
async def mark_message_failed(
    message_id: int,
    crud: ClientMessageDeliveryLogCrudDep,
    error_text: str | None = Query(default=None),
) -> ClientMessageDeliveryLogReadSchema:
    message = await _get_message_or_404(crud, message_id)

    updated_message = await crud.update(
        message,
        {
            "status": "failed",
            "error_text": error_text,
        },
    )
    return _to_read(updated_message)


@router.delete(
    "/messages/{message_id}",
    response_model=DeleteRead,
)
async def delete_message_log(
    message_id: int,
    crud: ClientMessageDeliveryLogCrudDep,
) -> DeleteRead:
    message = await _get_message_or_404(crud, message_id)
    await crud.delete(message)

    return DeleteRead(deleted=True)


@router.get(
    "/clients/{client_id}/messages/stats",
    response_model=MessageStatsRead,
)
async def get_client_message_stats(
    client_id: int,
    session: ClientCommunicationsSessionDep,
) -> MessageStatsRead:
    stmt = select(ClientMessageDeliveryLogModel).where(
        ClientMessageDeliveryLogModel.client_id == client_id,
    )
    result = await session.execute(stmt)
    messages = result.scalars().all()

    by_channel: dict[str, int] = {}
    by_status: dict[str, int] = {}

    for message in messages:
        channel = str(message.channel)
        status_value = str(message.status)

        by_channel[channel] = by_channel.get(channel, 0) + 1
        by_status[status_value] = by_status.get(status_value, 0) + 1

    return MessageStatsRead(
        client_id=client_id,
        total=len(messages),
        by_channel=by_channel,
        by_status=by_status,
    )


@router.get("/push/status", response_model=ClientPushStatusSchema)
async def push_status(
    session: ClientCommunicationsSessionDep,
    organization_id: int | None = Query(default=None),
    client_id: int | None = Query(default=None),
    endpoint: str | None = Query(default=None),
) -> ClientPushStatusSchema:
    if client_id is not None:
        client_organization_id = await _client_organization_id(session, client_id)
        if client_organization_id is not None:
            organization_id = client_organization_id

    active_count = 0
    max_count = 0
    telegram_count = 0
    enabled = False
    if organization_id is not None:
        active_count = int(await session.scalar(
            select(func.count(func.distinct(ClientPushPreferenceModel.client_id)))
            .join(ClientModel, ClientModel.id == ClientPushPreferenceModel.client_id)
            .where(
                ClientModel.organization_id == organization_id,
                ClientPushPreferenceModel.enabled.is_(True),
            )
        ) or 0)
        max_count = int(await session.scalar(
            select(func.count(ClientModel.id)).where(
                ClientModel.organization_id == organization_id,
                ClientModel.max_id.is_not(None),
            )
        ) or 0)
        telegram_count = int(await session.scalar(
            select(func.count(ClientModel.id)).where(
                ClientModel.organization_id == organization_id,
                ClientModel.telegram_id.is_not(None),
            )
        ) or 0)
    endpoint = endpoint.strip() if endpoint else ""
    if endpoint:
        enabled = bool(await session.scalar(
            select(func.count(ClientPushSubscriptionModel.id)).where(
                ClientPushSubscriptionModel.endpoint == endpoint,
                ClientPushSubscriptionModel.is_active.is_(True),
            )
        ))
    if organization_id is not None and client_id is not None:
        preference_enabled = await session.scalar(
            select(ClientPushPreferenceModel.enabled).where(
                ClientPushPreferenceModel.client_id == client_id,
            )
        )
        if preference_enabled is not None:
            enabled = bool(preference_enabled)
        elif not enabled:
            enabled = bool(await session.scalar(
                select(func.count(ClientPushSubscriptionModel.id)).where(
                    ClientPushSubscriptionModel.client_id == client_id,
                    ClientPushSubscriptionModel.is_active.is_(True),
                )
            ))
    return ClientPushStatusSchema(
        configured=web_push_configured(),
        public_key=WEB_PUSH_VAPID_PUBLIC_KEY,
        enabled=enabled,
        active_count=active_count,
        max_count=max_count,
        telegram_count=telegram_count,
    )


@router.post("/push/preference", response_model=ClientPushStatusSchema)
async def push_preference(
    payload: ClientPushPreferenceUpdateSchema,
    session: ClientCommunicationsSessionDep,
) -> ClientPushStatusSchema:
    organization_id = await _client_organization_id(session, payload.client_id)
    if organization_id is None:
        raise HTTPException(status_code=404, detail="Client not found")

    item = await session.scalar(
        select(ClientPushPreferenceModel).where(ClientPushPreferenceModel.client_id == payload.client_id)
    )
    values = {
        "organization_id": organization_id,
        "client_id": payload.client_id,
        "enabled": payload.enabled,
    }
    if item is None:
        session.add(ClientPushPreferenceModel(**values))
    else:
        for key, value in values.items():
            setattr(item, key, value)
    await session.commit()
    return await push_status(session, organization_id=organization_id, client_id=payload.client_id, endpoint="")


@router.post("/push/subscribe", response_model=ClientPushStatusSchema)
async def push_subscribe(
    payload: ClientPushSubscriptionCreateSchema,
    session: ClientCommunicationsSessionDep,
) -> ClientPushStatusSchema:
    endpoint = payload.endpoint.strip()
    p256dh = (payload.keys or {}).get("p256dh", "").strip()
    auth = (payload.keys or {}).get("auth", "").strip()
    if not endpoint or not p256dh or not auth:
        raise HTTPException(status_code=400, detail="endpoint, p256dh and auth are required")

    organization_id = await _client_organization_id(session, payload.client_id)
    if organization_id is None:
        raise HTTPException(status_code=404, detail="Client not found")

    item = await session.scalar(
        select(ClientPushSubscriptionModel).where(ClientPushSubscriptionModel.endpoint == endpoint)
    )
    values = {
        "organization_id": organization_id,
        "client_id": payload.client_id,
        "endpoint": endpoint,
        "p256dh": p256dh,
        "auth": auth,
        "platform": (payload.platform or "")[:64],
        "user_agent": payload.user_agent[:1000] if payload.user_agent else "",
        "is_active": True,
        "last_error": "",
    }
    if item is None:
        session.add(ClientPushSubscriptionModel(**values))
    else:
        for key, value in values.items():
            setattr(item, key, value)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise HTTPException(status_code=409, detail="Push subscription already exists") from None
    return await push_status(session, organization_id=organization_id, client_id=payload.client_id, endpoint="")


@router.delete("/push/subscribe", response_model=ClientPushStatusSchema)
async def push_unsubscribe(
    payload: ClientPushSubscriptionDeleteSchema,
    session: ClientCommunicationsSessionDep,
) -> ClientPushStatusSchema:
    item = await session.scalar(
        select(ClientPushSubscriptionModel).where(ClientPushSubscriptionModel.endpoint == payload.endpoint.strip())
    )
    organization_id = item.organization_id if item else None
    client_id = item.client_id if item else None
    if item is not None:
        item.is_active = False
        await session.commit()
    return await push_status(session, organization_id=organization_id, client_id=client_id, endpoint="")


class ClientPushJobRead(BaseModel):
    id: str
    organization_id: int
    name: str
    type: str
    status: str
    checked: int = 0
    total: int = 0
    sent: int = 0
    progress: int = 0
    message: str | None = None
    title: str = ""
    broadcast_message: str = ""
    channels: list[str] = Field(default_factory=list)
    image_urls: list[str] = Field(default_factory=list)
    single_delivery: bool = False
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None = None


_push_jobs: dict[str, dict[str, Any]] = {}
_push_job_tasks: dict[str, asyncio.Task[None]] = {}


def _job_read(job: dict[str, Any]) -> ClientPushJobRead:
    total = int(job.get("total") or 0)
    progress = 100 if job.get("status") == "completed" else (min(100, int(job.get("checked", 0) * 100 / total)) if total else 0)
    return ClientPushJobRead(**job, progress=progress)


def _job_dict(item: ClientPushJobModel) -> dict[str, Any]:
    job = {field: getattr(item, field) for field in ("id", "organization_id", "name", "type", "status", "checked", "total", "sent", "created_at", "updated_at", "completed_at")}
    job.update(title=item.title, broadcast_message=item.message, channels=item.channels or [], image_urls=item.image_urls or [], single_delivery=item.single_delivery, message=item.error_text or ("\u0417\u0430\u0434\u0430\u0447\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043d\u0430" if item.status == "completed" else "\u0417\u0430\u0434\u0430\u0447\u0430 \u043f\u043e\u0441\u0442\u0430\u0432\u043b\u0435\u043d\u0430 \u0432 \u043e\u0447\u0435\u0440\u0435\u0434\u044c"))
    return job


def _job_model(job: dict[str, Any], payload: ClientPushSendSchema, error_text: str | None = None) -> ClientPushJobModel:
    return ClientPushJobModel(
        id=job["id"], organization_id=job["organization_id"], name=job["name"], type=job["type"],
        status=job["status"], checked=job["checked"], total=job["total"], sent=job["sent"],
        title=payload.title, message=payload.message, channels=list(payload.channels), image_urls=list(payload.image_urls),
        single_delivery=payload.single_delivery, error_text=error_text, created_at=job["created_at"],
        updated_at=job["updated_at"], completed_at=job["completed_at"],
    )


async def _run_push_job(job_id: str, payload: ClientPushSendSchema) -> None:
    try:
        async with SessionFactory() as session:
            job = _push_jobs[job_id]
            job.update(status="running", updated_at=datetime.now(timezone.utc))
            await session.merge(_job_model(job, payload))
            await session.commit()
            result = await send_push_broadcast(session, payload)
            job.update(status="completed", checked=result.recipients, total=result.recipients, sent=result.sent, message="Задача завершена", completed_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
            await session.merge(_job_model(job, payload))
            await session.commit()
    except asyncio.CancelledError:
        job = _push_jobs.get(job_id)
        if job:
            job.update(status="stopped", message="Задача остановлена", completed_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
            async with SessionFactory() as session:
                await session.merge(_job_model(job, payload))
                await session.commit()
        raise
    except Exception as exc:
        job = _push_jobs.get(job_id)
        if job:
            job.update(status="failed", message=str(exc), completed_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
            async with SessionFactory() as session:
                await session.merge(_job_model(job, payload, str(exc)))
                await session.commit()


@router.post("/push/send-jobs", response_model=ClientPushJobRead, status_code=status.HTTP_202_ACCEPTED)
async def start_push_job(payload: ClientPushSendSchema) -> ClientPushJobRead:
    now = datetime.now(timezone.utc)
    job_id = str(uuid4())
    job = {"id": job_id, "organization_id": payload.organization_id, "name": f"Рассылка «{payload.title}»", "type": "push_broadcast", "status": "queued", "checked": 0, "total": 0, "sent": 0, "message": "Задача поставлена в очередь", "created_at": now, "updated_at": now, "completed_at": None}
    job.update(title=payload.title, broadcast_message=payload.message, channels=list(payload.channels), image_urls=list(payload.image_urls), single_delivery=payload.single_delivery)
    _push_jobs[job_id] = job
    async with SessionFactory() as session:
        session.add(_job_model(job, payload))
        await session.commit()
    _push_job_tasks[job_id] = asyncio.create_task(_run_push_job(job_id, payload))
    return _job_read(job)


@router.get("/push/send-jobs", response_model=list[ClientPushJobRead])
async def list_push_jobs(organization_id: int | None = Query(default=None, ge=1)) -> list[ClientPushJobRead]:
    async with SessionFactory() as session:
        stmt = select(ClientPushJobModel).order_by(ClientPushJobModel.created_at.desc()).limit(100)
        if organization_id is not None:
            stmt = stmt.where(ClientPushJobModel.organization_id == organization_id)
        items = await session.scalars(stmt)
        jobs = [_push_jobs.get(item.id, _job_dict(item)) for item in items]
    return [_job_read(job) for job in jobs]


@router.delete("/push/send-jobs/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_push_job(job_id: str, organization_id: int = Query(ge=1)) -> None:
    async with SessionFactory() as session:
        item = await session.get(ClientPushJobModel, job_id)
        if item is None or item.organization_id != organization_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="\u0420\u0430\u0441\u0441\u044b\u043b\u043a\u0430 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430")
        if item.status in {"queued", "running"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="\u041d\u0435\u043b\u044c\u0437\u044f \u0443\u0434\u0430\u043b\u0438\u0442\u044c \u0432\u044b\u043f\u043e\u043b\u043d\u044f\u044e\u0449\u0443\u044e\u0441\u044f \u0440\u0430\u0441\u0441\u044b\u043b\u043a\u0443")
        await session.delete(item)
        await session.commit()
    _push_jobs.pop(job_id, None)


@router.post("/push/send-jobs/{job_id}/stop", response_model=ClientPushJobRead)
async def stop_push_job(job_id: str, organization_id: int = Query(ge=1)) -> ClientPushJobRead:
    async with SessionFactory() as session:
        item = await session.get(ClientPushJobModel, job_id)
        if item is None or item.organization_id != organization_id:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="???????? ?? ???????")
        if item.status not in {"queued", "running"}:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="???????? ??? ?????????")
        job = _push_jobs.get(job_id, _job_dict(item))
        job.update(status="stopped", message="?????? ???????????", completed_at=datetime.now(timezone.utc), updated_at=datetime.now(timezone.utc))
        _push_jobs[job_id] = job
        await session.merge(_job_model(job, ClientPushSendSchema(organization_id=job["organization_id"], title=job.get("title", ""), message=job.get("broadcast_message", ""), channels=job.get("channels", []), image_urls=job.get("image_urls", []), single_delivery=job.get("single_delivery", False))))
        await session.commit()
    task = _push_job_tasks.get(job_id)
    if task is not None and not task.done():
        task.cancel()
    return _job_read(job)


@router.post("/push/send", response_model=ClientPushSendRead)
async def push_send(
    payload: ClientPushSendSchema,
    session: ClientCommunicationsSessionDep,
) -> ClientPushSendRead:
    result = await send_push_broadcast(session, payload)
    return ClientPushSendRead(ok=True, recipients=result.recipients, sent=result.sent)
