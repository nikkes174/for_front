from __future__ import annotations

from collections.abc import Mapping
from typing import Any

from client_circout.backend.client_communications.services._utils import SafeFormatDict, normalize_string
from client_circout.backend.client_communications.services.exceptions import (
    ClientCommunicationUnsupportedMessageTypeError,
)


class ClientMessageTemplateService:
    SERVICE = "service"
    MARKETING = "marketing"
    REMINDER = "reminder"
    CONFIRMATION = "confirmation"
    NOTIFICATION = "notification"

    SUPPORTED_MESSAGE_TYPES: frozenset[str] = frozenset(
        {
            SERVICE,
            MARKETING,
            REMINDER,
            CONFIRMATION,
            NOTIFICATION,
        },
    )

    MESSAGE_TYPE_ALIASES: dict[str, str] = {
        "сервисное": SERVICE,
        "service_message": SERVICE,
        "advertising": MARKETING,
        "advertisement": MARKETING,
        "promo": MARKETING,
        "promotional": MARKETING,
        "рекламное": MARKETING,
        "реклама": MARKETING,
        "напоминание": REMINDER,
        "подтверждение": CONFIRMATION,
        "уведомление": NOTIFICATION,
    }

    SERVICE_MESSAGE_TYPES: frozenset[str] = frozenset(
        {
            SERVICE,
            REMINDER,
            CONFIRMATION,
            NOTIFICATION,
        },
    )

    MARKETING_MESSAGE_TYPES: frozenset[str] = frozenset({MARKETING})

    def normalize(self, message_type: str) -> str:
        normalized = normalize_string(message_type)
        return self.MESSAGE_TYPE_ALIASES.get(normalized, normalized)

    def validate(self, message_type: str) -> str:
        normalized = self.normalize(message_type)

        if normalized not in self.SUPPORTED_MESSAGE_TYPES:
            raise ClientCommunicationUnsupportedMessageTypeError(message_type)

        return normalized

    def is_service_type(self, message_type: str) -> bool:
        return self.validate(message_type) in self.SERVICE_MESSAGE_TYPES

    def is_marketing_type(self, message_type: str) -> bool:
        return self.validate(message_type) in self.MARKETING_MESSAGE_TYPES

    def render_text(
        self,
        template: str,
        context: Mapping[str, Any] | None = None,
    ) -> str:
        if not context:
            return template

        return template.format_map(SafeFormatDict(context))
