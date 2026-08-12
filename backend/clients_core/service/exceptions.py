from __future__ import annotations


class ClientCoreServiceError(Exception):
    pass


class EntityNotFoundError(ClientCoreServiceError):
    def __init__(self, entity: str, entity_id: int) -> None:
        super().__init__(f"{entity} with id={entity_id} not found")
        self.entity = entity
        self.entity_id = entity_id


class EntityConflictError(ClientCoreServiceError):
    pass


class ValidationServiceError(ClientCoreServiceError):
    pass


class MergeServiceError(ClientCoreServiceError):
    pass
