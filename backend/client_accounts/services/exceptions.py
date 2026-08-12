from __future__ import annotations


class ClientAccountServiceError(Exception):
    pass


class ClientAccountNotFoundError(ClientAccountServiceError):
    pass


class ClientAccountReadOnlyError(ClientAccountServiceError):
    pass


class ClientAccountSyncError(ClientAccountServiceError):
    pass


class ClientAccountExternalProviderError(ClientAccountServiceError):
    pass
