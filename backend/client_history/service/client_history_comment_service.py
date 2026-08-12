from __future__ import annotations

from client_circout.backend.client_history.models.visits import ClientHistoryVisitModel
from client_circout.backend.client_history.service.client_visit_history_service import ClientVisitHistoryService


class ClientHistoryCommentService:
    def __init__(self, visit_history_service: ClientVisitHistoryService) -> None:
        self._visit_history_service = visit_history_service

    async def get_comment(self, visit_id: int) -> str | None:
        visit = await self._visit_history_service.get_visit(visit_id)
        return visit.comment

    async def set_comment(
        self,
        *,
        visit_id: int,
        comment: str | None,
    ) -> ClientHistoryVisitModel:
        return await self._visit_history_service.update_visit(
            visit_id,
            {"comment": comment},
            recalculate_debt=False,
        )

    async def clear_comment(self, visit_id: int) -> ClientHistoryVisitModel:
        return await self.set_comment(visit_id=visit_id, comment=None)
