from __future__ import annotations

from typing import Any

from sqlalchemy import select, exists, and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.models.client import ClientModel, client_organization_filter
from client_circout.backend.client_profile.models.profile_metrics import ClientProfileMetricModel
from client_circout.backend.client_communications.models import ClientPushSubscriptionModel, ClientPushPreferenceModel


class SegmentTableService:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_clients(
        self,
        *,
        organization_id: int,
        offset: int = 0,
        limit: int = 10000,
    ) -> list[dict[str, Any]]:
        # Subquery for app_installed using correlated EXISTS
        app_installed_subq = select(1).where(
            and_(
                ClientPushSubscriptionModel.client_id == ClientModel.id,
                ClientPushSubscriptionModel.organization_id == organization_id,
                ClientPushSubscriptionModel.is_active.is_(True),
            )
        ).exists()

        # has_phone: check if primary_phone or secondary_phone has non-empty string
        has_phone_expr = (
            (ClientModel.primary_phone.isnot(None) & (func.trim(ClientModel.primary_phone) != ""))
            | (ClientModel.secondary_phone.isnot(None) & (func.trim(ClientModel.secondary_phone) != ""))
        )

        stmt = (
            select(
                ClientModel.id,
                ClientModel.full_name,
                ClientModel.last_name,
                ClientModel.first_name,
                ClientModel.middle_name,
                ClientModel.primary_phone,
                ClientModel.secondary_phone,
                ClientModel.email,
                ClientModel.telegram_id,
                ClientModel.max_id,
                ClientModel.birth_date,
                ClientProfileMetricModel.visits_count,
                ClientProfileMetricModel.paid_amount.label("spent_amount"),
                has_phone_expr.label("has_phone"),
                app_installed_subq.label("app_installed"),
                func.coalesce(ClientPushPreferenceModel.enabled, False).label("notifications_enabled"),
            )
            .select_from(ClientModel)
            .where(client_organization_filter(organization_id))
            .outerjoin(
                ClientProfileMetricModel,
                and_(
                    ClientProfileMetricModel.client_id == ClientModel.id,
                    ClientProfileMetricModel.organization_id == organization_id,
                ),
            )
            .outerjoin(
                ClientPushPreferenceModel,
                and_(
                    ClientPushPreferenceModel.client_id == ClientModel.id,
                    ClientPushPreferenceModel.organization_id == organization_id,
                ),
            )
            .order_by(ClientModel.id.asc())
            .offset(offset)
            .limit(limit)
        )

        result = await self._session.execute(stmt)
        return [dict(row._mapping) for row in result]