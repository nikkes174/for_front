from __future__ import annotations


class ClientProfileServiceError(Exception):
    pass


class ProfileEntityNotFoundError(ClientProfileServiceError):
    def __init__(self, entity: str, entity_id: int) -> None:
        super().__init__(f"{entity} with id={entity_id} not found")
        self.entity = entity
        self.entity_id = entity_id


class ProfileEntityConflictError(ClientProfileServiceError):
    pass


class ProfileValidationError(ClientProfileServiceError):
    pass


class ProfileIntegrationError(ClientProfileServiceError):
    pass
