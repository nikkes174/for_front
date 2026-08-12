from __future__ import annotations


class ClientFilesError(Exception):
    pass


class ClientFileNotFoundError(ClientFilesError):
    pass


class ClientFileConflictError(ClientFilesError):
    pass


class ClientFileValidationError(ClientFilesError):
    pass


class ClientFileStorageError(ClientFilesError):
    pass


class ClientFileAccessDeniedError(ClientFilesError):
    pass
