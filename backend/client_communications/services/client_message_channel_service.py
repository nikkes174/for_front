from __future__ import annotations

from client_circout.backend.client_communications.services._utils import normalize_string
from client_circout.backend.client_communications.services.exceptions import (
    ClientCommunicationUnsupportedChannelError,
)


class ClientMessageChannelService:
    SMS = "sms"
    TELEGRAM = "telegram"
    WHATSAPP = "whatsapp"
    VK = "vk"
    EMAIL = "email"
    PUSH = "push"

    SUPPORTED_CHANNELS: frozenset[str] = frozenset(
        {
            SMS,
            TELEGRAM,
            WHATSAPP,
            VK,
            EMAIL,
            PUSH,
        },
    )

    CHANNEL_ALIASES: dict[str, str] = {
        "смс": SMS,
        "tg": TELEGRAM,
        "телеграм": TELEGRAM,
        "telegram_bot": TELEGRAM,
        "wa": WHATSAPP,
        "ватсап": WHATSAPP,
        "вк": VK,
        "mail": EMAIL,
        "e_mail": EMAIL,
        "почта": EMAIL,
        "push_notification": PUSH,
    }

    CONSENT_FIELD_BY_CHANNEL: dict[str, str | None] = {
        SMS: "sms_allowed",
        TELEGRAM: "telegram_allowed",
        EMAIL: "email_allowed",
        WHATSAPP: None,
        VK: None,
        PUSH: None,
    }

    def normalize(self, channel: str) -> str:
        normalized = normalize_string(channel)
        return self.CHANNEL_ALIASES.get(normalized, normalized)

    def validate(self, channel: str) -> str:
        normalized = self.normalize(channel)

        if normalized not in self.SUPPORTED_CHANNELS:
            raise ClientCommunicationUnsupportedChannelError(channel)

        return normalized

    def get_consent_field(self, channel: str) -> str | None:
        return self.CONSENT_FIELD_BY_CHANNEL[self.validate(channel)]

    def is_supported(self, channel: str) -> bool:
        return self.normalize(channel) in self.SUPPORTED_CHANNELS
