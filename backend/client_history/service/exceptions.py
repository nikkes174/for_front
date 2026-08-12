from __future__ import annotations


class ClientHistoryServiceError(Exception):
    pass


class ClientHistoryNotFoundError(ClientHistoryServiceError):
    pass


class ClientHistoryConflictError(ClientHistoryServiceError):
    pass


class ClientHistoryValidationError(ClientHistoryServiceError):
    pass


class ClientHistoryExternalSourceError(ClientHistoryServiceError):
    pass
