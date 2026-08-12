from __future__ import annotations

import asyncio
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone

from sqlalchemy import BigInteger, DateTime, Integer, String, Text, UniqueConstraint, and_, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from client_circout.backend.client_segments.crud import ClientSegmentCrud, ClientSegmentMemberCrud
from client_circout.backend.client_segments.service.external_data_provider import SegmentExternalDataProvider
from client_circout.backend.client_segments.service.segment_membership_service import SegmentMembershipService
from client_circout.backend.client_segments.service.segment_preview_service import SegmentPreviewService
from client_circout.backend.client_segments.service.segment_recalculation_service import SegmentRecalculationService
from client_circout.backend.client_segments.service.segment_rules_service import SegmentRulesService
from client_circout.backend.client_segments.service.segment_service import SegmentService
from client_circout.backend.client_segments.service.segment_trigger_service import SegmentTriggerService
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.config import AUTH_AND_LOGGING_API_URL, LOYLYTY_API_URL
from client_circout.backend.db.db import Base, SessionFactory
from client_circout.backend.integrations.auth_logging import AuthLoggingPublisher
from client_circout.backend.logger import get_logger
from contracts.api.auth_logging import AuditApiClient, EventsApiClient
from contracts.api.loyalty import LoyaltyApiClient


logger = get_logger(__name__)
MAX_ATTEMPTS = 5
STALE_JOB_AFTER = timedelta(minutes=30)


class VisitPostProcessingJobModel(Base):
    __tablename__ = "visit_postprocessing_jobs"
    __table_args__ = (
        UniqueConstraint("visit_id", "event_type", name="uq_visit_postprocessing_visit_event"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    visit_id: Mapped[int] = mapped_column(BigInteger, nullable=False, index=True)
    actor_id: Mapped[int | None] = mapped_column(BigInteger, nullable=True)
    event_type: Mapped[str] = mapped_column(String(32), nullable=False, default="created")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="queued", index=True)
    attempts: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    available_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_text: Mapped[str | None] = mapped_column(Text, nullable=True)


@dataclass(slots=True, frozen=True)
class ClaimedVisitJob:
    id: int
    visit_id: int
    actor_id: int | None
    event_type: str
    attempts: int


async def enqueue_visit_created_postprocessing(
    session: AsyncSession,
    *,
    visit_id: int,
    actor_id: int | None,
) -> None:
    now = datetime.now(timezone.utc)
    session.add_all([
        VisitPostProcessingJobModel(
            visit_id=visit_id,
            actor_id=actor_id,
            event_type=event_type,
            status="queued",
            attempts=0,
            available_at=now,
            created_at=now,
            updated_at=now,
        )
        for event_type in ("event_created", "loyalty_created", "segments_changed")
    ])
    await session.flush()


async def _claim_next_job(event_type: str) -> ClaimedVisitJob | None:
    now = datetime.now(timezone.utc)
    stale_before = now - STALE_JOB_AFTER
    async with SessionFactory() as session:
        async with session.begin():
            statement = (
                select(VisitPostProcessingJobModel)
                .where(
                    VisitPostProcessingJobModel.attempts < MAX_ATTEMPTS,
                    VisitPostProcessingJobModel.event_type == event_type,
                    VisitPostProcessingJobModel.available_at <= now,
                    or_(
                        VisitPostProcessingJobModel.status.in_(("queued", "retry")),
                        and_(
                            VisitPostProcessingJobModel.status == "running",
                            VisitPostProcessingJobModel.updated_at < stale_before,
                        ),
                    ),
                )
                .order_by(VisitPostProcessingJobModel.id.asc())
                .limit(1)
            )
            if session.get_bind().dialect.name == "postgresql":
                statement = statement.with_for_update(skip_locked=True)
            job = await session.scalar(statement)
            if job is None:
                return None
            job.status = "running"
            job.attempts += 1
            job.updated_at = now
            job.error_text = None
            return ClaimedVisitJob(
                id=job.id,
                visit_id=job.visit_id,
                actor_id=job.actor_id,
                event_type=job.event_type,
                attempts=job.attempts,
            )


async def _run_segment_postprocessing(visit) -> None:
    async with SessionFactory() as session:
        rules_service = SegmentRulesService()
        segment_service = SegmentService(
            segment_crud=ClientSegmentCrud(session),
            rules_service=rules_service,
        )
        membership_service = SegmentMembershipService(ClientSegmentMemberCrud(session))
        preview_service = SegmentPreviewService(session=session, rules_service=rules_service)
        recalculation_service = SegmentRecalculationService(
            segment_service=segment_service,
            membership_service=membership_service,
            preview_service=preview_service,
        )
        trigger_service = SegmentTriggerService(recalculation_service)
        loyalty_api = LoyaltyApiClient(LOYLYTY_API_URL)
        context = SegmentExternalDataProvider(session=session, loyalty_api=loyalty_api)
        try:
            await trigger_service.on_visit_changed(
                organization_id=visit.organization_id,
                client_id=visit.client_id,
                is_cancelled=False,
                context=context,
            )
        finally:
            await loyalty_api.aclose()


async def _process_visit_job(job: ClaimedVisitJob) -> None:
    from client_circout.backend.client_history.routers import (
        _process_loyalty_after_visit,
        _publish_visit_created,
        _visit_read,
    )
    from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel

    async with SessionFactory() as session:
        visit = await session.get(ClientHistoryVisitModel, job.visit_id)
        if visit is None:
            logger.info(
                "visit postprocessing skipped for deleted visit visit_id=%s event_type=%s",
                job.visit_id,
                job.event_type,
            )
            return
        if job.event_type == "event_created":
            client = await session.get(ClientModel, visit.client_id)
            client_name = None
            if client is not None:
                client_name = client.full_name or " ".join(
                    part for part in (client.last_name, client.first_name, client.middle_name) if part
                ) or None
            visit_read = _visit_read(visit)

    if job.event_type == "segments_changed":
        await _run_segment_postprocessing(visit)
        return
    if job.event_type == "loyalty_created":
        await _process_loyalty_after_visit(visit, raise_errors=True)
        return
    if job.event_type != "event_created":
        raise RuntimeError(f"unknown visit postprocessing event: {job.event_type}")

    events_client = EventsApiClient(AUTH_AND_LOGGING_API_URL)
    audit_client = AuditApiClient(AUTH_AND_LOGGING_API_URL)
    try:
        publisher = AuthLoggingPublisher(events_client, audit_client)
        await _publish_visit_created(
            publisher,
            visit_read,
            job.actor_id,
            client_name,
            raise_errors=True,
        )
    finally:
        await events_client.aclose()
        await audit_client.aclose()


async def _finish_job(job_id: int) -> None:
    now = datetime.now(timezone.utc)
    async with SessionFactory() as session:
        job = await session.get(VisitPostProcessingJobModel, job_id)
        if job is None:
            return
        job.status = "completed"
        job.completed_at = now
        job.updated_at = now
        job.error_text = None
        await session.commit()


async def _retry_job(job: ClaimedVisitJob, exc: Exception) -> None:
    now = datetime.now(timezone.utc)
    async with SessionFactory() as session:
        stored = await session.get(VisitPostProcessingJobModel, job.id)
        if stored is None:
            return
        stored.status = "failed" if job.attempts >= MAX_ATTEMPTS else "retry"
        stored.available_at = now + timedelta(seconds=min(300, 5 * (2 ** max(job.attempts - 1, 0))))
        stored.updated_at = now
        stored.completed_at = now if stored.status == "failed" else None
        stored.error_text = str(exc)[:4000]
        await session.commit()


async def _visit_postprocessing_worker(stop_event: asyncio.Event, event_type: str) -> None:
    while not stop_event.is_set():
        try:
            job = await _claim_next_job(event_type)
            if job is None:
                try:
                    await asyncio.wait_for(stop_event.wait(), timeout=1.0)
                except asyncio.TimeoutError:
                    pass
                continue
            try:
                await _process_visit_job(job)
            except Exception as exc:
                logger.exception(
                    "visit postprocessing failed visit_id=%s event_type=%s attempt=%s",
                    job.visit_id,
                    job.event_type,
                    job.attempts,
                )
                await _retry_job(job, exc)
            else:
                await _finish_job(job.id)
        except asyncio.CancelledError:
            raise
        except Exception:
            logger.exception("visit postprocessing worker iteration failed event_type=%s", event_type)
            try:
                await asyncio.wait_for(stop_event.wait(), timeout=2.0)
            except asyncio.TimeoutError:
                pass


_worker_tasks: list[asyncio.Task] = []
_worker_stop_event: asyncio.Event | None = None


async def start_visit_postprocessing_worker() -> None:
    global _worker_tasks, _worker_stop_event
    if any(not task.done() for task in _worker_tasks):
        return
    _worker_stop_event = asyncio.Event()
    _worker_tasks = [
        asyncio.create_task(
            _visit_postprocessing_worker(_worker_stop_event, event_type),
            name=f"visit-postprocessing-{event_type}",
        )
        for event_type in ("event_created", "loyalty_created", "segments_changed")
    ]


async def stop_visit_postprocessing_worker() -> None:
    global _worker_tasks, _worker_stop_event
    if not _worker_tasks:
        return
    if _worker_stop_event is not None:
        _worker_stop_event.set()
    try:
        await asyncio.wait_for(asyncio.gather(*_worker_tasks), timeout=5.0)
    except asyncio.TimeoutError:
        for task in _worker_tasks:
            task.cancel()
        await asyncio.gather(*_worker_tasks, return_exceptions=True)
    finally:
        _worker_tasks = []
        _worker_stop_event = None
