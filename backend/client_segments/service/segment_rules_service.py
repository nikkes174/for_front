from __future__ import annotations

from collections.abc import Iterable
from datetime import UTC, date, datetime, timedelta
from typing import Any, Protocol

from client_circout.backend.client_segments.service._utils import utcnow, normalize_datetime
from client_circout.backend.client_segments.service.exceptions import SegmentRuleValidationError, SegmentRuleUnsupportedError

RuleNode = dict[str, Any]


class SegmentRuleDataProvider(Protocol):
    async def get_average_check(self, client_id: int) -> float | None: ...

    async def get_days_since_last_visit(self, client_id: int) -> int | None: ...

    async def get_cancelled_visits_count(
        self,
        client_id: int,
        *,
        days: int | None = None,
    ) -> int: ...

    async def has_bought_service(self, client_id: int, service_id: int) -> bool: ...

    async def has_unused_certificate(self, client_id: int) -> bool: ...

    async def has_visited_employee(self, client_id: int, employee_id: int) -> bool: ...


class SegmentRulesService:
    CLIENT_ONLY_RULE_TYPES = {
        "new_clients",
        "source_equals",
        "birthday_in_days",
        "has_email",
        "has_primary_phone",
    }

    EXTERNAL_RULE_TYPES = {
        "inactive_more_than_days",
        "frequent_cancellations",
        "bought_service",
        "average_check_gt",
        "has_unused_certificate",
        "visited_employee",
    }

    ALLOWED_RULE_TYPES = CLIENT_ONLY_RULE_TYPES | EXTERNAL_RULE_TYPES

    def validate_rules(self, rules: RuleNode | None) -> RuleNode:
        if not rules:
            return {"logic": "and", "conditions": []}

        if not isinstance(rules, dict):
            raise SegmentRuleValidationError("rules_json must be an object")

        normalized = self._normalize_group(rules)
        self._validate_group(normalized)
        return normalized

    def collect_rule_types(self, rules: RuleNode | None) -> set[str]:
        normalized = self.validate_rules(rules)
        return {self._condition_type(condition) for condition in self._iter_conditions(normalized)}

    def collect_external_rule_types(self, rules: RuleNode | None) -> set[str]:
        return self.collect_rule_types(rules) & self.EXTERNAL_RULE_TYPES

    async def matches_client(
        self,
        *,
        client: Any,
        rules: RuleNode | None,
        context: SegmentRuleDataProvider | None = None,
        now: datetime | None = None,
    ) -> bool:
        normalized = self.validate_rules(rules)
        return await self._matches_group(
            client=client,
            group=normalized,
            context=context,
            now=now or utcnow(),
        )

    def _normalize_group(self, group: RuleNode) -> RuleNode:
        logic = str(group.get("logic", "and")).lower()
        conditions = group.get("conditions", group.get("rules", []))

        if logic not in {"and", "or"}:
            raise SegmentRuleValidationError("rules_json.logic must be 'and' or 'or'")

        if not isinstance(conditions, list):
            raise SegmentRuleValidationError("rules_json.conditions must be a list")

        normalized_conditions: list[RuleNode] = []
        for condition in conditions:
            if not isinstance(condition, dict):
                raise SegmentRuleValidationError("Each segment rule must be an object")

            if "conditions" in condition or "rules" in condition:
                normalized_conditions.append(self._normalize_group(condition))
                continue

            normalized_conditions.append(self._normalize_condition(condition))

        return {"logic": logic, "conditions": normalized_conditions}

    def _normalize_condition(self, condition: RuleNode) -> RuleNode:
        rule_type = condition.get("type")

        if rule_type is None:
            field = str(condition.get("field", "")).lower()
            operator = str(condition.get("operator", condition.get("op", ""))).lower()
            rule_type = self._resolve_rule_type(field=field, operator=operator)

        normalized = dict(condition)
        normalized["type"] = str(rule_type).lower()
        return normalized

    def _resolve_rule_type(self, *, field: str, operator: str) -> str:
        if field in {"new_clients", "new_client", "created_at"}:
            return "new_clients"
        if field in {"days_since_last_visit", "last_visit_at", "inactive"}:
            return "inactive_more_than_days"
        if field in {"cancellations", "cancelled_visits", "canceled_visits"}:
            return "frequent_cancellations"
        if field in {"service_id", "service", "bought_service"}:
            return "bought_service"
        if field in {"average_check", "avg_check"}:
            return "average_check_gt"
        if field in {"source", "creation_source", "acquisition_channel"}:
            return "source_equals"
        if field in {"unused_certificate", "certificate", "has_unused_certificate"}:
            return "has_unused_certificate"
        if field in {"birthday", "birth_date"} and operator in {"in_next_days", "soon", "lte", "within"}:
            return "birthday_in_days"
        if field in {"employee_id", "employee", "visited_employee"}:
            return "visited_employee"
        if field in {"email", "has_email"}:
            return "has_email"
        if field in {"primary_phone", "phone", "has_primary_phone"}:
            return "has_primary_phone"
        raise SegmentRuleValidationError(f"Unsupported segment rule field: {field}")

    def _validate_group(self, group: RuleNode) -> None:
        for condition in group["conditions"]:
            if "conditions" in condition:
                self._validate_group(condition)
                continue

            rule_type = self._condition_type(condition)
            if rule_type not in self.ALLOWED_RULE_TYPES:
                raise SegmentRuleValidationError(f"Unsupported segment rule type: {rule_type}")

            self._validate_condition(condition, rule_type=rule_type)

    def _validate_condition(self, condition: RuleNode, *, rule_type: str) -> None:
        match rule_type:
            case "new_clients" | "inactive_more_than_days" | "birthday_in_days":
                self._int_value(condition, "days", "value", default=None, required=True)
            case "frequent_cancellations":
                self._int_value(condition, "min_count", "value", default=None, required=True)
                self._int_value(condition, "days", default=None, required=False)
            case "bought_service":
                self._int_value(condition, "service_id", "value", default=None, required=True)
            case "average_check_gt":
                self._float_value(condition, "amount", "value", default=None, required=True)
            case "source_equals":
                self._str_value(condition, "source", "value", default=None, required=True)
            case "visited_employee":
                self._int_value(condition, "employee_id", "value", default=None, required=True)
            case "has_unused_certificate" | "has_email" | "has_primary_phone":
                return
            case _:
                raise SegmentRuleValidationError(f"Unsupported segment rule type: {rule_type}")

    async def _matches_group(
        self,
        *,
        client: Any,
        group: RuleNode,
        context: SegmentRuleDataProvider | None,
        now: datetime,
    ) -> bool:
        results: list[bool] = []

        for condition in group["conditions"]:
            if "conditions" in condition:
                result = await self._matches_group(
                    client=client,
                    group=condition,
                    context=context,
                    now=now,
                )
            else:
                result = await self._matches_condition(
                    client=client,
                    condition=condition,
                    context=context,
                    now=now,
                )
            results.append(result)

        if not results:
            return True

        return all(results) if group["logic"] == "and" else any(results)

    async def _matches_condition(
        self,
        *,
        client: Any,
        condition: RuleNode,
        context: SegmentRuleDataProvider | None,
        now: datetime,
    ) -> bool:
        rule_type = self._condition_type(condition)

        match rule_type:
            case "new_clients":
                days = self._int_value(condition, "days", "value", default=30)
                created_at = getattr(client, "created_at", None)
                if created_at is None:
                    return False
                return normalize_datetime(created_at) >= now - timedelta(days=days)

            case "source_equals":
                expected = self._str_value(condition, "source", "value")
                source = getattr(client, "creation_source", None)
                return source is not None and source.lower() == expected.lower()

            case "birthday_in_days":
                days = self._int_value(condition, "days", "value", default=7)
                birth_date = getattr(client, "birth_date", None)
                return self._birthday_in_days(birth_date=birth_date, days=days, now=now)

            case "has_email":
                return bool(getattr(client, "email", None))

            case "has_primary_phone":
                return bool(getattr(client, "primary_phone", None))

            case "inactive_more_than_days":
                provider = self._require_context(context, rule_type)
                min_days = self._int_value(condition, "days", "value")
                days_since_last_visit = await provider.get_days_since_last_visit(client.id)
                return days_since_last_visit is not None and days_since_last_visit > min_days

            case "frequent_cancellations":
                provider = self._require_context(context, rule_type)
                min_count = self._int_value(condition, "min_count", "value")
                days = self._int_value(condition, "days", default=None, required=False)
                count = await provider.get_cancelled_visits_count(client.id, days=days)
                return count >= min_count

            case "bought_service":
                provider = self._require_context(context, rule_type)
                service_id = self._int_value(condition, "service_id", "value")
                return await provider.has_bought_service(client.id, service_id)

            case "average_check_gt":
                provider = self._require_context(context, rule_type)
                amount = self._float_value(condition, "amount", "value")
                average_check = await provider.get_average_check(client.id)
                return average_check is not None and average_check > amount

            case "has_unused_certificate":
                provider = self._require_context(context, rule_type)
                expected = bool(condition.get("value", True))
                return await provider.has_unused_certificate(client.id) is expected

            case "visited_employee":
                provider = self._require_context(context, rule_type)
                employee_id = self._int_value(condition, "employee_id", "value")
                return await provider.has_visited_employee(client.id, employee_id)

            case _:
                raise SegmentRuleValidationError(f"Unsupported segment rule type: {rule_type}")

    def _require_context(
        self,
        context: SegmentRuleDataProvider | None,
        rule_type: str,
    ) -> SegmentRuleDataProvider:
        if context is None:
            raise SegmentRuleUnsupportedError(
                f"Rule '{rule_type}' requires external segment data provider",
            )
        return context

    def _iter_conditions(self, group: RuleNode) -> Iterable[RuleNode]:
        for condition in group.get("conditions", []):
            if "conditions" in condition:
                yield from self._iter_conditions(condition)
            else:
                yield condition

    def _condition_type(self, condition: RuleNode) -> str:
        return str(condition.get("type", "")).lower()

    def _birthday_in_days(
        self,
        *,
        birth_date: date | None,
        days: int,
        now: datetime,
    ) -> bool:
        if birth_date is None:
            return False

        today = now.date()
        current_year_birthday = birth_date.replace(year=today.year)
        if current_year_birthday < today:
            current_year_birthday = current_year_birthday.replace(year=today.year + 1)

        return 0 <= (current_year_birthday - today).days <= days

    def _int_value(
        self,
        condition: RuleNode,
        *keys: str,
        default: int | None = None,
        required: bool = True,
    ) -> int:
        value = self._first_value(condition, keys, default=default, required=required)
        if value is None:
            return 0
        try:
            return int(value)
        except (TypeError, ValueError) as exc:
            raise SegmentRuleValidationError(f"Rule value must be int: {condition}") from exc

    def _float_value(
        self,
        condition: RuleNode,
        *keys: str,
        default: float | None = None,
        required: bool = True,
    ) -> float:
        value = self._first_value(condition, keys, default=default, required=required)
        if value is None:
            return 0.0
        try:
            return float(value)
        except (TypeError, ValueError) as exc:
            raise SegmentRuleValidationError(f"Rule value must be float: {condition}") from exc

    def _str_value(
        self,
        condition: RuleNode,
        *keys: str,
        default: str | None = None,
        required: bool = True,
    ) -> str:
        value = self._first_value(condition, keys, default=default, required=required)
        return "" if value is None else str(value)

    def _first_value(
        self,
        condition: RuleNode,
        keys: tuple[str, ...],
        *,
        default: Any,
        required: bool,
    ) -> Any:
        for key in keys:
            if key in condition:
                return condition[key]

        if required:
            raise SegmentRuleValidationError(f"Missing required rule value: {condition}")

        return default
