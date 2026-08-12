from __future__ import annotations


class ClientCommunicationError(Exception):
    pass


class ClientCommunicationNotFoundError(ClientCommunicationError):
    pass


class ClientCommunicationConflictError(ClientCommunicationError):
    pass


class ClientCommunicationValidationError(ClientCommunicationError):
    pass


class ClientCommunicationConsentDeniedError(ClientCommunicationError):
    pass


class ClientCommunicationUnsupportedChannelError(ClientCommunicationValidationError):
    pass


class ClientCommunicationUnsupportedMessageTypeError(ClientCommunicationValidationError):
    pass
