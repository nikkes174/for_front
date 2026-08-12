from __future__ import annotations

from collections.abc import Iterable, Sequence

from client_circout.backend.client_segments.crud import ClientSegmentMemberCrud
from client_circout.backend.client_segments.models import ClientSegmentMemberModel
from client_circout.backend.client_segments.schemas import ClientSegmentMemberCreateSchema, ClientSegmentMemberUpdateSchema
from client_circout.backend.client_segments.service._utils import utcnow, to_payload
from client_circout.backend.client_segments.service.exceptions import SegmentMemberNotFoundError


class SegmentMembershipService:
    ACTIVE_STATUS = "active"
    EXITED_STATUS = "exited"

    def __init__(self, member_crud: ClientSegmentMemberCrud) -> None:
        self._member_crud = member_crud

    async def add_client(
        self,
        *,
        segment_id: int,
        client_id: int,
    ) -> ClientSegmentMemberModel:
        existing = await self._member_crud.get_by_segment_and_client(
            segment_id=segment_id,
            client_id=client_id,
        )

        if existing is not None:
            if existing.membership_status == self.ACTIVE_STATUS:
                return existing

            return await self._member_crud.update(
                existing,
                {
                    "entered_at": utcnow(),
                    "exited_at": None,
                    "membership_status": self.ACTIVE_STATUS,
                },
            )

        return await self._member_crud.create(
            {
                "segment_id": segment_id,
                "client_id": client_id,
                "entered_at": utcnow(),
                "exited_at": None,
                "membership_status": self.ACTIVE_STATUS,
            },
        )

    async def create(
        self,
        payload: ClientSegmentMemberCreateSchema | dict,
    ) -> ClientSegmentMemberModel:
        data = to_payload(payload)
        data["entered_at"] = data.get("entered_at") or utcnow()
        data["membership_status"] = data.get("membership_status") or self.ACTIVE_STATUS
        return await self._member_crud.create(data)

    async def get(self, member_id: int) -> ClientSegmentMemberModel:
        member = await self._member_crud.get_by_id(member_id)
        if member is None:
            raise SegmentMemberNotFoundError(f"Segment member {member_id} not found")
        return member

    async def get_by_segment_and_client(
        self,
        *,
        segment_id: int,
        client_id: int,
    ) -> ClientSegmentMemberModel:
        member = await self._member_crud.get_by_segment_and_client(
            segment_id=segment_id,
            client_id=client_id,
        )
        if member is None:
            raise SegmentMemberNotFoundError(
                f"Client {client_id} is not linked to segment {segment_id}",
            )
        return member

    async def list(
        self,
        *,
        segment_id: int | None = None,
        client_id: int | None = None,
        membership_status: str | None = None,
        offset: int = 0,
        limit: int = 100,
    ) -> Sequence[ClientSegmentMemberModel]:
        return await self._member_crud.list(
            segment_id=segment_id,
            client_id=client_id,
            membership_status=membership_status,
            offset=offset,
            limit=limit,
        )

    async def update(
        self,
        member_id: int,
        payload: ClientSegmentMemberUpdateSchema | dict,
    ) -> ClientSegmentMemberModel:
        member = await self.get(member_id)
        return await self._member_crud.update(
            member,
            to_payload(payload, exclude_unset=True),
        )

    async def remove_client(
        self,
        *,
        segment_id: int,
        client_id: int,
    ) -> ClientSegmentMemberModel:
        member = await self.get_by_segment_and_client(
            segment_id=segment_id,
            client_id=client_id,
        )

        if member.membership_status == self.EXITED_STATUS:
            return member

        return await self._member_crud.update(
            member,
            {
                "exited_at": utcnow(),
                "membership_status": self.EXITED_STATUS,
            },
        )

    async def hard_delete(self, member_id: int) -> None:
        member = await self.get(member_id)
        await self._member_crud.delete(member)

    async def replace_segment_members(
        self,
        *,
        segment_id: int,
        client_ids: Iterable[int],
    ) -> dict[str, int]:
        target_ids = set(client_ids)
        active_members = await self._member_crud.list(
            segment_id=segment_id,
            membership_status=self.ACTIVE_STATUS,
            limit=100_000,
        )
        current_ids = {member.client_id for member in active_members}

        added = 0
        removed = 0

        for client_id in target_ids - current_ids:
            await self.add_client(segment_id=segment_id, client_id=client_id)
            added += 1

        for client_id in current_ids - target_ids:
            await self.remove_client(segment_id=segment_id, client_id=client_id)
            removed += 1

        return {
            "added": added,
            "removed": removed,
            "active_total": len(target_ids),
        }
