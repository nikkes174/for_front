from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from client_circout.backend.clients_core.crud.client import ClientCrud
from client_circout.backend.clients_core.crud.client_additional import (
    ClientAdditionalFieldCrud,
    ClientAdditionalFieldValueCrud,
)
from client_circout.backend.clients_core.crud.client_batch import (
    ClientExportBatchCrud,
    ClientImportBatchCrud,
)
from client_circout.backend.clients_core.crud.client_branch import ClientBranchCrud
from client_circout.backend.clients_core.crud.client_categories import (
    ClientCategoryCrud,
    ClientCategoryLinkCrud,
)
from client_circout.backend.clients_core.crud.client_duplicate_candidates import (
    ClientDuplicateCandidateCrud,
)
from client_circout.backend.clients_core.crud.client_import_rows import ClientImportRowCrud
from client_circout.backend.clients_core.crud.client_merge_operations import (
    ClientMergeOperationCrud,
)
from client_circout.backend.clients_core.service.client_additional_fields_service import (
    ClientAdditionalFieldsService,
)
from client_circout.backend.clients_core.service.client_branch_service import ClientBranchService
from client_circout.backend.clients_core.service.client_category_service import ClientCategoryService
from client_circout.backend.clients_core.service.client_duplicates_service import ClientDuplicatesService
from client_circout.backend.clients_core.service.client_import_export_service import (
    ClientImportExportService,
)
from client_circout.backend.clients_core.service.client_merge_service import ClientMergeService
from client_circout.backend.clients_core.service.client_service import ClientService
from client_circout.backend.db.db import SessionFactory


async def get_clients_core_db_session() -> AsyncIterator[AsyncSession]:
    async with SessionFactory() as session:
        yield session


ClientsCoreSessionDep = Annotated[
    AsyncSession,
    Depends(get_clients_core_db_session),
]


def get_client_crud(
    session: ClientsCoreSessionDep,
) -> ClientCrud:
    return ClientCrud(session)


ClientCrudDep = Annotated[
    ClientCrud,
    Depends(get_client_crud),
]


def get_client_service(
    client_crud: ClientCrudDep,
) -> ClientService:
    return ClientService(client_crud)


ClientServiceDep = Annotated[
    ClientService,
    Depends(get_client_service),
]


def get_client_category_crud(
    session: ClientsCoreSessionDep,
) -> ClientCategoryCrud:
    return ClientCategoryCrud(session)


ClientCategoryCrudDep = Annotated[
    ClientCategoryCrud,
    Depends(get_client_category_crud),
]


def get_client_category_link_crud(
    session: ClientsCoreSessionDep,
) -> ClientCategoryLinkCrud:
    return ClientCategoryLinkCrud(session)


ClientCategoryLinkCrudDep = Annotated[
    ClientCategoryLinkCrud,
    Depends(get_client_category_link_crud),
]


def get_client_category_service(
    client_crud: ClientCrudDep,
    category_crud: ClientCategoryCrudDep,
    category_link_crud: ClientCategoryLinkCrudDep,
) -> ClientCategoryService:
    return ClientCategoryService(
        client_crud=client_crud,
        category_crud=category_crud,
        category_link_crud=category_link_crud,
    )


ClientCategoryServiceDep = Annotated[
    ClientCategoryService,
    Depends(get_client_category_service),
]


def get_client_additional_field_crud(
    session: ClientsCoreSessionDep,
) -> ClientAdditionalFieldCrud:
    return ClientAdditionalFieldCrud(session)


ClientAdditionalFieldCrudDep = Annotated[
    ClientAdditionalFieldCrud,
    Depends(get_client_additional_field_crud),
]


def get_client_additional_field_value_crud(
    session: ClientsCoreSessionDep,
) -> ClientAdditionalFieldValueCrud:
    return ClientAdditionalFieldValueCrud(session)


ClientAdditionalFieldValueCrudDep = Annotated[
    ClientAdditionalFieldValueCrud,
    Depends(get_client_additional_field_value_crud),
]


def get_client_additional_fields_service(
    client_crud: ClientCrudDep,
    field_crud: ClientAdditionalFieldCrudDep,
    value_crud: ClientAdditionalFieldValueCrudDep,
) -> ClientAdditionalFieldsService:
    return ClientAdditionalFieldsService(
        client_crud=client_crud,
        field_crud=field_crud,
        value_crud=value_crud,
    )


ClientAdditionalFieldsServiceDep = Annotated[
    ClientAdditionalFieldsService,
    Depends(get_client_additional_fields_service),
]


def get_client_branch_crud(
    session: ClientsCoreSessionDep,
) -> ClientBranchCrud:
    return ClientBranchCrud(session)


ClientBranchCrudDep = Annotated[
    ClientBranchCrud,
    Depends(get_client_branch_crud),
]


def get_client_branch_service(
    client_crud: ClientCrudDep,
    client_branch_crud: ClientBranchCrudDep,
) -> ClientBranchService:
    return ClientBranchService(
        client_crud=client_crud,
        client_branch_crud=client_branch_crud,
    )


ClientBranchServiceDep = Annotated[
    ClientBranchService,
    Depends(get_client_branch_service),
]


def get_client_import_batch_crud(
    session: ClientsCoreSessionDep,
) -> ClientImportBatchCrud:
    return ClientImportBatchCrud(session)


ClientImportBatchCrudDep = Annotated[
    ClientImportBatchCrud,
    Depends(get_client_import_batch_crud),
]


def get_client_import_row_crud(
    session: ClientsCoreSessionDep,
) -> ClientImportRowCrud:
    return ClientImportRowCrud(session)


ClientImportRowCrudDep = Annotated[
    ClientImportRowCrud,
    Depends(get_client_import_row_crud),
]


def get_client_export_batch_crud(
    session: ClientsCoreSessionDep,
) -> ClientExportBatchCrud:
    return ClientExportBatchCrud(session)


ClientExportBatchCrudDep = Annotated[
    ClientExportBatchCrud,
    Depends(get_client_export_batch_crud),
]


def get_client_import_export_service(
    import_batch_crud: ClientImportBatchCrudDep,
    import_row_crud: ClientImportRowCrudDep,
    export_batch_crud: ClientExportBatchCrudDep,
) -> ClientImportExportService:
    return ClientImportExportService(
        import_batch_crud=import_batch_crud,
        import_row_crud=import_row_crud,
        export_batch_crud=export_batch_crud,
    )


ClientImportExportServiceDep = Annotated[
    ClientImportExportService,
    Depends(get_client_import_export_service),
]


def get_client_duplicate_candidate_crud(
    session: ClientsCoreSessionDep,
) -> ClientDuplicateCandidateCrud:
    return ClientDuplicateCandidateCrud(session)


ClientDuplicateCandidateCrudDep = Annotated[
    ClientDuplicateCandidateCrud,
    Depends(get_client_duplicate_candidate_crud),
]


def get_client_duplicates_service(
    client_crud: ClientCrudDep,
    duplicate_candidate_crud: ClientDuplicateCandidateCrudDep,
) -> ClientDuplicatesService:
    return ClientDuplicatesService(
        client_crud=client_crud,
        duplicate_candidate_crud=duplicate_candidate_crud,
    )


ClientDuplicatesServiceDep = Annotated[
    ClientDuplicatesService,
    Depends(get_client_duplicates_service),
]


def get_client_merge_operation_crud(
    session: ClientsCoreSessionDep,
) -> ClientMergeOperationCrud:
    return ClientMergeOperationCrud(session)


ClientMergeOperationCrudDep = Annotated[
    ClientMergeOperationCrud,
    Depends(get_client_merge_operation_crud),
]


def get_client_merge_service(
    client_crud: ClientCrudDep,
    merge_operation_crud: ClientMergeOperationCrudDep,
    category_link_crud: ClientCategoryLinkCrudDep,
    additional_value_crud: ClientAdditionalFieldValueCrudDep,
    branch_crud: ClientBranchCrudDep,
) -> ClientMergeService:
    return ClientMergeService(
        client_crud=client_crud,
        merge_operation_crud=merge_operation_crud,
        category_link_crud=category_link_crud,
        additional_value_crud=additional_value_crud,
        branch_crud=branch_crud,
    )


ClientMergeServiceDep = Annotated[
    ClientMergeService,
    Depends(get_client_merge_service),
]