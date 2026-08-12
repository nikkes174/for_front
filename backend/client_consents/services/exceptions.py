from __future__ import annotations


class ClientConsentServiceError(Exception):
    pass


class ClientConsentNotFoundError(ClientConsentServiceError):
    pass


class ClientConsentAccessDeniedError(ClientConsentServiceError):
    pass


class ClientConsentInvalidSourceError(ClientConsentServiceError):
    pass


class ClientConsentInvalidChannelError(ClientConsentServiceError):
    pass


class ClientConsentInvalidMessageTypeError(ClientConsentServiceError):
    pass
