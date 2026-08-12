from __future__ import annotations

import asyncio
from decimal import Decimal, ROUND_HALF_UP

import httpx

from contracts.api.loyalty import LoyaltyApiClient
from contracts.loyalty import BonusAccrualDTO, LoyaltyClientCreateDTO
from client_circout.backend.clients_core.models.client import ClientModel
from client_circout.backend.config import LOYLYTY_API_URL
from client_circout.backend.logger import get_logger


logger = get_logger(__name__)
LOG_BRIGHT_BLUE = "\033[94m"
LOG_RESET = "\033[0m"


class LoyaltySyncError(Exception):
    pass


class LoyaltyClientProjectionService:
    def __init__(self, api_client: LoyaltyApiClient) -> None:
        self._api_client = api_client

    async def create_client_projection(self, client: ClientModel) -> None:
        payload = LoyaltyClientCreateDTO(
            id=client.id,
            phone=client.primary_phone,
            telegram_id=str(client.telegram_id) if client.telegram_id is not None else None,
            max_id=str(client.max_id) if client.max_id is not None else None,
            vk_id=str(client.vk_id) if client.vk_id is not None else None,
            full_name=client.full_name,
        )
        last_error: Exception | None = None
        for attempt in range(3):
            try:
                await self._api_client.sync_client(payload)
                return
            except httpx.HTTPStatusError as exc:
                if exc.response.status_code == 409:
                    logger.info("loyalty client projection already exists for crm client_id=%s", client.id)
                    return
                last_error = exc
                logger.warning(
                    "loyalty client sync failed for crm client_id=%s attempt=%s status=%s body=%s",
                    client.id,
                    attempt + 1,
                    exc.response.status_code,
                    exc.response.text,
                )
                if exc.response.status_code < 500 or attempt == 2:
                    raise LoyaltySyncError("Failed to create loyalty client projection") from exc
                await asyncio.sleep(0.2)
            except httpx.HTTPError as exc:
                last_error = exc
                logger.warning(
                    "loyalty client sync transport error for crm client_id=%s attempt=%s: %s",
                    client.id,
                    attempt + 1,
                    exc,
                )
                if attempt == 2:
                    raise LoyaltySyncError("Failed to reach loyalty API") from exc
                await asyncio.sleep(0.2)
        raise LoyaltySyncError("Failed to create loyalty client projection") from last_error

    async def apply_level_transitions(self, *, client_id: int, organization_id: int) -> dict | None:
        try:
            return await self._api_client.apply_level_transitions(client_id, organization_id=organization_id)
        except httpx.HTTPError as exc:
            logger.warning(
                "loyalty level transition check failed client_id=%s organization_id=%s: %s",
                client_id,
                organization_id,
                exc,
            )
            return None

    async def apply_created_event(self, *, client_id: int, organization_id: int) -> list[dict]:
        async with httpx.AsyncClient(timeout=10.0, trust_env=False) as client:
            response = await client.post(
                f"{LOYLYTY_API_URL.rstrip('/')}/client-bonuses/events/rules/apply",
                json={"client_id": client_id, "organization_id": organization_id, "event_type": "created"},
            )
            response.raise_for_status()
            return response.json()

    async def accrue_completed_visit_cashback(
        self,
        *,
        client_id: int,
        organization_id: int,
        visit_id: int,
        visit_status: str,
        total_cost: Decimal,
        paid_amount: Decimal,
        comment: str | None,
    ) -> None:
        logger.info(
            "loyalty visit processing started visit_id=%s client_id=%s organization_id=%s status=%s total=%s paid=%s comment=%r",
            visit_id,
            client_id,
            organization_id,
            visit_status,
            total_cost,
            paid_amount,
            comment,
        )
        if visit_status.strip().lower() != "completed":
            logger.info("loyalty cashback skipped visit_id=%s reason=status status=%s", visit_id, visit_status)
            return

        base = paid_amount or total_cost or Decimal("0")
        if base <= 0:
            logger.warning(
                "loyalty cashback skipped visit_id=%s reason=zero_amount total_cost=%s paid_amount=%s",
                visit_id,
                total_cost,
                paid_amount,
            )
            return

        await self.apply_level_transitions(client_id=client_id, organization_id=organization_id)

        try:
            history = await self._api_client.get_bonus_history(client_id)
            if any(
                item.get("transaction_type") == "accrual"
                and item.get("target_type") == "client_history_visit"
                and str(item.get("target_id")) == str(visit_id)
                for item in history
            ):
                logger.info("loyalty cashback skipped visit_id=%s reason=already_accrued", visit_id)
                return

            rules = await self._api_client.list_bonus_rules(organization_id)
            level_name = self._current_level_name(history)
            service_amount, product_amount = self._visit_item_amounts(comment)
            logger.info(
                LOG_BRIGHT_BLUE + "loyalty visit rules input visit_id=%s client_id=%s level=%s service_amount=%s product_amount=%s rules=%s" + LOG_RESET,
                visit_id,
                client_id,
                level_name,
                service_amount,
                product_amount,
                len(rules),
            )
            amount, has_item_rule, accrual_bonus_type, service_bonus, product_bonus, applied_rules = self._cashback_amount_from_visit_rules(
                rules,
                level_name,
                service_amount,
                product_amount,
            )
            percent = Decimal("0")
            logger.info(
                LOG_BRIGHT_BLUE + "loyalty visit calculation visit_id=%s client_id=%s item_rule=%s bonus_type=%s percent=%s amount=%s base=%s" + LOG_RESET,
                visit_id,
                client_id,
                has_item_rule,
                accrual_bonus_type,
                percent,
                amount,
                base,
            )
            if amount <= 0:
                logger.warning(
                    "loyalty cashback skipped visit_id=%s reason=no_matching_level_rule base=%s level=%s rules=%s",
                    visit_id,
                    base,
                    level_name,
                    len(rules),
                )
                return

            await self._api_client.accrue_bonus(
                BonusAccrualDTO(
                    client_id=client_id,
                    amount=amount,
                    bonus_type=accrual_bonus_type,
                    reason=f"\u041a\u044d\u0448\u0431\u044d\u043a \u0437\u0430 \u0432\u0438\u0437\u0438\u0442 #{visit_id}",
                    target_type="client_history_visit",
                    target_id=visit_id,
                    client_level=level_name,
                    usage_restrictions={
                        "accrual_details": {
                            "level": level_name,
                            "rules": applied_rules,
                            "service_bonus": service_bonus,
                            "product_bonus": product_bonus,
                        },
                    },
                )
            )
            logger.info(
                "loyalty cashback accrued visit_id=%s client_id=%s level=%s rules=%s total_bonus=%s service_bonus=%s product_bonus=%s percent=%s base=%s",
                visit_id,
                client_id,
                level_name,
                applied_rules,
                amount,
                service_bonus,
                product_bonus,
                percent,
                base,
            )
        except httpx.HTTPError as exc:
            logger.warning("visit saved, but loyalty cashback accrual failed visit_id=%s: %s", visit_id, exc)

    async def process_referral_first_visit(
        self, *, client_id: int, organization_id: int, visit_id: int, visit_status: str,
        total_cost: Decimal, paid_amount: Decimal, visit_at: object, branch_id: int | None,
    ) -> dict | None:
        if visit_status.strip().lower() != "completed":
            return None
        return await self._api_client.process_referral_visit({
            "invited_client_id": client_id, "organization_id": organization_id,
            "visit_id": visit_id, "visit_amount": str(paid_amount or total_cost or Decimal("0")),
            "visited_at": visit_at.isoformat() if hasattr(visit_at, "isoformat") else None,
            "branch_id": branch_id,
        })

    @staticmethod
    def _current_level_name(history: list[dict]) -> str | None:
        return next(
            (
                item.get("client_level")
                for item in history
                if item.get("target_type") in {"level_assignment", "level_transition"} and item.get("client_level")
            ),
            None,
        )

    @staticmethod
    def _cashback_percent(history: list[dict]) -> Decimal:
        for item in history:
            params = item.get("level_params") if item.get("client_level") else None
            if isinstance(params, dict) and params.get("cashback") not in (None, ""):
                return Decimal(str(params["cashback"]))
        return Decimal("0")

    @staticmethod
    def _is_transition_rule(rule: dict) -> bool:
        restrictions = rule.get("usage_restrictions") if isinstance(rule.get("usage_restrictions"), dict) else {}
        return rule.get("target_type") == "level_transition" or restrictions.get("transition_rule") is True

    @staticmethod
    def _rule_applies_to_type(rule: dict, rule_type: str) -> bool:
        restrictions = rule.get("usage_restrictions") if isinstance(rule.get("usage_restrictions"), dict) else {}
        types = restrictions.get("accrual_rule_types")
        return rule_type in types if isinstance(types, list) else rule.get("rule_type") == rule_type

    @staticmethod
    def _rule_applies_to_level(rule: dict, level_name: str | None) -> bool:
        return bool(level_name) and str(rule.get("client_level") or "").strip() == str(level_name).strip()

    @classmethod
    def _cashback_percent_from_rules(cls, rules: list[dict], level_name: str | None) -> Decimal:
        if not level_name:
            return Decimal("0")
        total = Decimal("0")
        for rule in rules:
            if not rule.get("is_active", True) or rule.get("referral_source_id") or cls._is_transition_rule(rule):
                continue
            bonus_type = str(rule.get("bonus_type") or "").strip().lower()
            if bonus_type not in {"cashback", "кэшбэк", "кешбэк", "кэшбек", "кешбек"} or not cls._rule_applies_to_level(rule, level_name):
                continue
            params = rule.get("level_params")
            if isinstance(params, dict) and params.get("cashback") not in (None, ""):
                total += Decimal(str(params["cashback"]))
        return total

    @staticmethod
    def _visit_item_amounts(comment: str | None) -> tuple[Decimal, Decimal]:
        values = {"__service_cost:": Decimal("0"), "__product_cost:": Decimal("0")}
        for line in str(comment or "").splitlines():
            for prefix in values:
                if line.startswith(prefix):
                    try:
                        values[prefix] = Decimal(line[len(prefix):].strip() or "0")
                    except Exception:
                        values[prefix] = Decimal("0")
        return values["__service_cost:"], values["__product_cost:"]

    @classmethod
    def _cashback_amount_from_visit_rules(
        cls,
        rules: list[dict],
        level_name: str | None,
        service_amount: Decimal,
        product_amount: Decimal,
    ) -> tuple[int, bool, str, int, int, list[str]]:
        if not level_name:
            return 0, False, "cashback", 0, 0, []
        total = 0
        bonuses = {"service": 0, "product": 0}
        applied_rules: list[str] = []
        has_item_rule = False
        accrual_bonus_type = "cashback"
        for rule_type, base in (("service", service_amount), ("product", product_amount)):
            matching = [
                rule
                for rule in rules
                if rule.get("is_active", True)
                and not rule.get("referral_source_id")
                and not cls._is_transition_rule(rule)
                and cls._rule_applies_to_type(rule, rule_type)
                and cls._rule_applies_to_level(rule, level_name)
            ]
            if not matching:
                continue
            has_item_rule = True
            accrual_bonus_type = str(matching[0].get("bonus_type") or "cashback")
            if base <= 0:
                continue
            fixed = sum(
                max(int(rule.get("amount") or 0), 0)
                for rule in matching
                if not isinstance(rule.get("level_params"), dict)
                or rule["level_params"].get("cashback") in (None, "")
            )
            percent = sum(
                Decimal(str(rule["level_params"]["cashback"]))
                for rule in matching
                if isinstance(rule.get("level_params"), dict)
                and rule["level_params"].get("cashback") not in (None, "")
            )
            rule_bonus = fixed or int((base * percent / Decimal("100")).quantize(Decimal("1"), rounding=ROUND_HALF_UP))
            total += rule_bonus
            bonuses[rule_type] += rule_bonus
            applied_rules.extend(f"{rule.get('id')}:{rule.get('name') or rule_type}" for rule in matching)
        return total, has_item_rule, accrual_bonus_type, bonuses["service"], bonuses["product"], applied_rules

    @classmethod
    def _fixed_cashback_amount_from_rules(cls, rules: list[dict], level_name: str | None) -> int:
        if not level_name:
            return 0
        total = 0
        for rule in rules:
            if not rule.get("is_active", True) or rule.get("referral_source_id") or cls._is_transition_rule(rule):
                continue
            bonus_type = str(rule.get("bonus_type") or "").strip().lower()
            if bonus_type not in {"cashback", "кэшбэк", "кешбэк", "кэшбек", "кешбек"} or not cls._rule_applies_to_level(rule, level_name):
                continue
            if not isinstance(rule.get("level_params"), dict) or rule["level_params"].get("cashback") in (None, ""):
                total += max(int(rule.get("amount") or 0), 0)
        return total

    @staticmethod
    def _first_level_name(levels: list[dict]) -> str | None:
        if not levels:
            return None
        ordered = sorted(levels, key=lambda item: (item.get("min_points") or 0, item.get("id") or 0))
        return ordered[0].get("name")

    @staticmethod
    def _cashback_percent_from_levels(levels: list[dict], level_name: str | None) -> Decimal:
        if not levels:
            return Decimal("0")
        level = next((item for item in levels if item.get("name") == level_name), None) if level_name else None
        params = (level or levels[0]).get("params")
        if isinstance(params, dict) and params.get("cashback") not in (None, ""):
            return Decimal(str(params["cashback"]))
        return Decimal("0")

    async def aclose(self) -> None:
        await self._api_client.aclose()


def create_loyalty_client_projection_service() -> LoyaltyClientProjectionService:
    return LoyaltyClientProjectionService(LoyaltyApiClient(LOYLYTY_API_URL))
