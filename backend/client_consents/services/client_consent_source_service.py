from __future__ import annotations

from client_circout.backend.client_consents.services.exceptions import ClientConsentInvalidSourceError


class ClientConsentSourceService:
    WEBSITE = "website"
    ACCOUNT = "account"
    ADMIN = "admin"
    FORM = "form"
    MESSENGER = "messenger"
    API = "api"

    _ALIASES: dict[str, str] = {
        "site": WEBSITE,
        "website": WEBSITE,
        "сайт": WEBSITE,
        "lk": ACCOUNT,
        "account": ACCOUNT,
        "личный кабинет": ACCOUNT,
        "cabinet": ACCOUNT,
        "admin": ADMIN,
        "administrator": ADMIN,
        "администратор": ADMIN,
        "crm": ADMIN,
        "form": FORM,
        "форма": FORM,
        "messenger": MESSENGER,
        "мессенджер": MESSENGER,
        "telegram": MESSENGER,
        "vk": MESSENGER,
        "max": MESSENGER,
        "api": API,
    }

    @classmethod
    def allowed_sources(cls) -> set[str]:
        return {
            cls.WEBSITE,
            cls.ACCOUNT,
            cls.ADMIN,
            cls.FORM,
            cls.MESSENGER,
            cls.API,
        }

    def normalize(self, source: str | None) -> str | None:
        if source is None:
            return None

        normalized = source.strip().lower()
        if not normalized:
            return None

        value = self._ALIASES.get(normalized)
        if value is None:
            raise ClientConsentInvalidSourceError(source)

        return value

    def normalize_payload(self, payload: dict) -> dict:
        source = payload.get("consent_source")
        if source is None:
            return payload

        return {**payload, "consent_source": self.normalize(source)}
