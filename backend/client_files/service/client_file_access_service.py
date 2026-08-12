from __future__ import annotations

from dataclasses import dataclass, field
from enum import StrEnum

from client_circout.backend.client_files.models import ClientFileModel
from client_circout.backend.client_files.service.exceptions import ClientFileAccessDeniedError


class ClientFilePermission(StrEnum):
    READ = "client_files:read"
    UPLOAD = "client_files:upload"
    UPDATE = "client_files:update"
    DELETE = "client_files:delete"
    DOWNLOAD = "client_files:download"


@dataclass(frozen=True, slots=True)
class ClientFileAccessContext:
    user_id: int | None
    organization_id: int
    role: str | None = None
    permissions: frozenset[str] = field(default_factory=frozenset)
    allowed_client_ids: frozenset[int] | None = None


class ClientFileAccessService:
    ADMIN_ROLES = frozenset({"owner", "admin", "superadmin"})

    def can_view_file(self, *, file: ClientFileModel, context: ClientFileAccessContext) -> bool:
        return self._can_access_file(
            file=file,
            context=context,
            permission=ClientFilePermission.READ,
        )

    def can_download_file(self, *, file: ClientFileModel, context: ClientFileAccessContext) -> bool:
        return self._can_access_file(
            file=file,
            context=context,
            permission=ClientFilePermission.DOWNLOAD,
        )

    def can_update_file(self, *, file: ClientFileModel, context: ClientFileAccessContext) -> bool:
        return self._can_access_file(
            file=file,
            context=context,
            permission=ClientFilePermission.UPDATE,
        )

    def can_delete_file(self, *, file: ClientFileModel, context: ClientFileAccessContext) -> bool:
        return self._can_access_file(
            file=file,
            context=context,
            permission=ClientFilePermission.DELETE,
        )

    def can_upload_file(
        self,
        *,
        organization_id: int,
        client_id: int,
        context: ClientFileAccessContext,
    ) -> bool:
        if organization_id != context.organization_id:
            return False
        if not self._client_allowed(client_id=client_id, context=context):
            return False
        return self._is_admin(context) or ClientFilePermission.UPLOAD in context.permissions

    def ensure_can_view_file(self, *, file: ClientFileModel, context: ClientFileAccessContext) -> None:
        if not self.can_view_file(file=file, context=context):
            raise ClientFileAccessDeniedError("Access denied to view client file")

    def ensure_can_download_file(self, *, file: ClientFileModel, context: ClientFileAccessContext) -> None:
        if not self.can_download_file(file=file, context=context):
            raise ClientFileAccessDeniedError("Access denied to download client file")

    def ensure_can_update_file(self, *, file: ClientFileModel, context: ClientFileAccessContext) -> None:
        if not self.can_update_file(file=file, context=context):
            raise ClientFileAccessDeniedError("Access denied to update client file")

    def ensure_can_delete_file(self, *, file: ClientFileModel, context: ClientFileAccessContext) -> None:
        if not self.can_delete_file(file=file, context=context):
            raise ClientFileAccessDeniedError("Access denied to delete client file")

    def ensure_can_upload_file(
        self,
        *,
        organization_id: int,
        client_id: int,
        context: ClientFileAccessContext,
    ) -> None:
        if not self.can_upload_file(
            organization_id=organization_id,
            client_id=client_id,
            context=context,
        ):
            raise ClientFileAccessDeniedError("Access denied to upload client file")

    def _can_access_file(
        self,
        *,
        file: ClientFileModel,
        context: ClientFileAccessContext,
        permission: ClientFilePermission,
    ) -> bool:
        if file.organization_id != context.organization_id:
            return False
        if not self._client_allowed(client_id=file.client_id, context=context):
            return False
        return self._is_admin(context) or permission in context.permissions

    def _client_allowed(self, *, client_id: int, context: ClientFileAccessContext) -> bool:
        return context.allowed_client_ids is None or client_id in context.allowed_client_ids

    def _is_admin(self, context: ClientFileAccessContext) -> bool:
        return (context.role or "").lower() in self.ADMIN_ROLES
