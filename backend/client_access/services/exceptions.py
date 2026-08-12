from __future__ import annotations


class ClientAccessServiceError(Exception):
    pass


class ClientAccessDeniedError(ClientAccessServiceError):
    pass


class ClientAccessScopeNotFoundError(ClientAccessServiceError):
    pass


class ClientAccessScopeConflictServiceError(ClientAccessServiceError):
    pass


class ClientAccessInvalidPermissionError(ClientAccessServiceError):
    pass


class ClientAccessInvalidFieldError(ClientAccessServiceError):
    pass
