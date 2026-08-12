from __future__ import annotations

from dataclasses import dataclass

from client_circout.backend.client_files.service._utils import normalize_text
from client_circout.backend.client_files.service.exceptions import ClientFileValidationError


@dataclass(frozen=True, slots=True)
class ClientFileCategory:
    code: str
    title: str
    description: str


class ClientFileCategoryService:
    PHOTO = "photo"
    DOCUMENT = "document"
    CONSENT = "consent"
    QUESTIONNAIRE = "questionnaire"
    PROCEDURE_RESULT = "procedure_result"
    BEFORE_AFTER = "before_after"
    ARCHIVED = "archived"

    DEFAULT_CATEGORIES: tuple[ClientFileCategory, ...] = (
        ClientFileCategory(PHOTO, "Фотографии", "Фото клиента и связанные изображения"),
        ClientFileCategory(DOCUMENT, "Документы", "Паспорта, договоры и прочие документы"),
        ClientFileCategory(CONSENT, "Согласия", "Согласия на обработку данных, рассылки и процедуры"),
        ClientFileCategory(QUESTIONNAIRE, "Анкеты", "Анкеты клиента и опросные листы"),
        ClientFileCategory(PROCEDURE_RESULT, "Результаты процедур", "Файлы с результатами процедур"),
        ClientFileCategory(BEFORE_AFTER, "До/после", "Файлы сравнения до и после процедуры"),
        ClientFileCategory(ARCHIVED, "Архив", "Логически архивированные файлы"),
    )

    def __init__(self, *, allow_custom_categories: bool = False) -> None:
        self._allow_custom_categories = allow_custom_categories
        self._categories = {category.code: category for category in self.DEFAULT_CATEGORIES}

    def list_categories(self) -> tuple[ClientFileCategory, ...]:
        return tuple(self._categories.values())

    def normalize_category(self, file_category: str) -> str:
        category = normalize_text(file_category)
        if not category:
            raise ClientFileValidationError("file_category is required")
        return category

    def validate_category(self, file_category: str) -> str:
        category = self.normalize_category(file_category)

        if self._allow_custom_categories or category in self._categories:
            return category

        allowed = ", ".join(sorted(self._categories))
        raise ClientFileValidationError(f"Unsupported file_category={file_category!r}. Allowed: {allowed}")

    def is_known_category(self, file_category: str) -> bool:
        return self.normalize_category(file_category) in self._categories
