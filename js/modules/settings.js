import { api } from "../api.js";
import { escapeHtml, formData, numberOrNull, optional, rows, selectField, setMessage } from "../dom.js";

import { DateTime } from "https://esm.sh/luxon@3.5.0";

const no = "Не указано";
let cache = {};
let selectedEventVisit = null;
let departmentFilterBranchId = "";
let workplaceFilterBranchId = "";
let productFilterCategoryId = "";
let serviceFilterCategoryId = "";
const TAX_SYSTEM_OPTIONS = [
  { value: "УСН Доходы", label: "УСН Доходы" },
  { value: "УСН Доходы - Расходы", label: "УСН Доходы - Расходы" },
  { value: "ОСН", label: "ОСН" },
  { value: "ПАТЕНТ", label: "ПАТЕНТ" },
  { value: "НПД", label: "НПД" },
];
const LEGAL_TYPE_OPTIONS = [
  { value: "ООО", label: "ООО" },
  { value: "ИП", label: "ИП" },
  { value: "Самозанятый", label: "Самозанятый" },
];
const PRODUCT_CATEGORY_TYPE_OPTIONS = [
  { value: "product", label: "Товар" },
  { value: "service", label: "Услуга" },
];
const ACHIEVEMENT_LOGIC_OPTIONS = [
  { value: "and", label: "Все условия" },
  { value: "or", label: "Любое условие" },
];
const ACHIEVEMENT_PARAMETER_OPTIONS = [
  { value: "client_age_days", label: "Длительность наличия в базе, дней" },
  { value: "last_visit_days_ago", label: "Последний визит, дней назад" },
  { value: "has_photo", label: "Наличие фото" },
  { value: "visit_frequency", label: "Частота посещений" },
  { value: "client_profit", label: "Прибыль от клиента" },
];
const ACHIEVEMENT_OPERATOR_OPTIONS = [
  { value: "gt", label: "Больше" },
  { value: "gte", label: "Больше или равно" },
  { value: "lt", label: "Меньше" },
  { value: "lte", label: "Меньше или равно" },
  { value: "eq", label: "Равно" },
  { value: "neq", label: "Не равно" },
];
const VAT_RATE_OPTIONS = [
  { value: "5%", label: "5%" },
  { value: "20%", label: "20%" },
];
const DEFAULT_TIMEZONE = "Europe/Moscow";
const TIMEZONE_CITY_OPTIONS = [
  { value: "Europe/Kaliningrad", label: "Калининград" },
  { value: "Europe/Moscow", label: "Москва" },
  { value: "Europe/Samara", label: "Самара" },
  { value: "Asia/Yekaterinburg", label: "Екатеринбург" },
  { value: "Asia/Omsk", label: "Омск" },
  { value: "Asia/Krasnoyarsk", label: "Красноярск" },
  { value: "Asia/Irkutsk", label: "Иркутск" },
  { value: "Asia/Yakutsk", label: "Якутск" },
  { value: "Asia/Vladivostok", label: "Владивосток" },
  { value: "Asia/Magadan", label: "Магадан" },
  { value: "Asia/Kamchatka", label: "Петропавловск-Камчатский" },
  { value: "Asia/Sakhalin", label: "Южно-Сахалинск" },
  { value: "Asia/Anadyr", label: "Анадырь" },
];

const PERMISSION_TREE = [
  {
    service: "Обзор",
    sections: [
      { name: "Главная", actions: [{ code: "overview.view", name: "Просмотр" }] },
    ],
  },
  {
    service: "CRM",
    sections: [
      { name: "Клиенты", actions: [
        { code: "clients.clients.view", name: "Просмотр" },
        { code: "clients.clients.create", name: "Создание" },
        { code: "clients.clients.edit", name: "Редактирование" },
        { code: "clients.visits.create", name: "Добавление визитов" },
      ] },
    ],
  },
  {
    service: "Лояльность",
    sections: [
      { name: "Правила", actions: [
        { code: "loyalty.rules.view", name: "Просмотр" },
        { code: "loyalty.rules.create", name: "Создание" },
        { code: "loyalty.rules.delete", name: "Удаление" },
      ] },
      { name: "Уровни", actions: [
        { code: "loyalty.levels.view", name: "Просмотр" },
        { code: "loyalty.levels.create", name: "Создание" },
        { code: "loyalty.levels.delete", name: "Удаление" },
      ] },
      { name: "Транзакции", actions: [
        { code: "loyalty.transactions.view", name: "Просмотр" },
        { code: "loyalty.transactions.create", name: "Создание" },
        { code: "loyalty.transactions.delete", name: "Удаление" },
      ] },
      { name: "Акции", actions: [
        { code: "loyalty.promotions.view", name: "Просмотр" },
        { code: "loyalty.promotions.create", name: "Создание" },
        { code: "loyalty.promotions.delete", name: "Удаление" },
      ] },
      { name: "Сертификаты", actions: [
        { code: "loyalty.certificates.view", name: "Просмотр" },
        { code: "loyalty.certificates.create", name: "Создание" },
        { code: "loyalty.certificates.delete", name: "Удаление" },
      ] },
      { name: "Абонементы", actions: [
        { code: "loyalty.subscriptions.view", name: "Просмотр" },
        { code: "loyalty.subscriptions.create", name: "Создание" },
        { code: "loyalty.subscriptions.delete", name: "Удаление" },
      ] },
      { name: "Рефералы", actions: [
        { code: "loyalty.referrals.view", name: "Просмотр" },
        { code: "loyalty.referrals.create", name: "Создание" },
        { code: "loyalty.referrals.delete", name: "Удаление" },
      ] },
    ],
  },
  {
    service: "Настройки",
    sections: [
      { name: "Юридические лица", actions: [
        { code: "settings.legal.view", name: "Просмотр" },
        { code: "settings.legal.create", name: "Создание" },
      ] },
      { name: "Категории товаров и услуг", actions: [
        { code: "settings.categories.view", name: "Просмотр" },
        { code: "settings.categories.create", name: "Создание" },
      ] },
      { name: "Товары и услуги", actions: [
        { code: "settings.items.view", name: "Просмотр" },
        { code: "settings.items.create", name: "Создание" },
      ] },
      { name: "Филиалы", actions: [
        { code: "settings.branches.view", name: "Просмотр" },
        { code: "settings.branches.create", name: "Создание" },
      ] },
      { name: "Подразделения", actions: [
        { code: "settings.departments.view", name: "Просмотр" },
        { code: "settings.departments.create", name: "Создание" },
      ] },
      { name: "Рабочие места", actions: [
        { code: "settings.workplaces.view", name: "Просмотр" },
        { code: "settings.workplaces.create", name: "Создание" },
      ] },
      { name: "Роли и права", actions: [{ code: "settings.roles.manage", name: "Управление" }] },
      { name: "Пользователи", actions: [
        { code: "settings.users.view", name: "Просмотр" },
        { code: "settings.users.create", name: "Создание" },
        { code: "settings.users.assign_roles", name: "Назначение ролей" },
      ] },
      { name: "Бренды", actions: [
        { code: "settings.brands.view", name: "Просмотр" },
        { code: "settings.brands.create", name: "Создание" },
      ] },
        { name: "Достижения", actions: [
        { code: "settings.achievements.view", name: "Просмотр" },
        { code: "settings.achievements.create", name: "Создание" },
      ] },
      { name: "Аудит", actions: [
        { code: "settings.audit.view", name: "Аудит" },
        { code: "settings.events.view", name: "События" },
      ] },
    ],
  },
];

const PERMISSIONS = PERMISSION_TREE.flatMap((service) =>
  service.sections.flatMap((section) =>
    section.actions.map((action) => ({
      ...action,
      description: `${service.service} - ${section.name} - ${action.name}`,
    })),
  ),
);

function permissionByCode(code) {
  return PERMISSIONS.find((permission) => permission.code === code);
}

function nameById(items, id) {
  return items.find((item) => item.id === id)?.name || id || no;
}

function categoryTypeLabel(value) {
  return PRODUCT_CATEGORY_TYPE_OPTIONS.find((item) => item.value === value)?.label || value || no;
}

function achievementLogicLabel(value) {
  return ACHIEVEMENT_LOGIC_OPTIONS.find((item) => item.value === value)?.label || value || no;
}

function achievementParameterLabel(value) {
  return ACHIEVEMENT_PARAMETER_OPTIONS.find((item) => item.value === value)?.label || value || no;
}

function achievementOperatorLabel(value) {
  return ACHIEVEMENT_OPERATOR_OPTIONS.find((item) => item.value === value)?.label || value || no;
}

function parseAchievementValue(value) {
  const text = String(value || "").trim();
  if (/^(да|true|1)$/i.test(text)) return true;
  if (/^(нет|false|0)$/i.test(text)) return false;
  const numeric = Number(text.replace(",", "."));
  return text && !Number.isNaN(numeric) ? numeric : text;
}

function achievementValueField(condition = {}) {
  if (condition.parameter === "has_photo") {
    const value = condition.value === true || condition.value === "true" || String(condition.value).toLowerCase() === "да" ? "true" : "false";
    return `
      <label><span>Значение</span><select name="condition_value" required>
        <option value="true" ${value === "true" ? "selected" : ""}>Да</option>
        <option value="false" ${value === "false" ? "selected" : ""}>Нет</option>
      </select></label>
    `;
  }
  return `
    <label><span>Значение</span><input name="condition_value" type="number" step="0.01" value="${escapeHtml(condition.value ?? "")}" placeholder="Например, 365" required></label>
  `;
}

function achievementConditionRow(condition = {}) {
  return `
    <div class="achievement-condition-row" data-achievement-condition-row>
      <label><span>Параметр</span><select name="condition_parameter" required>
        ${ACHIEVEMENT_PARAMETER_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}" ${condition.parameter === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
      </select></label>
      <label><span>Оператор</span><select name="condition_operator" required>
        ${ACHIEVEMENT_OPERATOR_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}" ${condition.operator === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
      </select></label>
      ${achievementValueField(condition)}
      <button type="button" class="ghost" data-remove-achievement-condition>Удалить</button>
    </div>
  `;
}

function achievementConditionsFields(conditions = []) {
  const rows = conditions.length ? conditions : [{}];
  return `
    <div class="achievement-builder modal-full">
      <div class="achievement-builder-head">
        <b>Условия</b>
        <button type="button" class="ghost" data-add-achievement-condition>Добавить условие</button>
      </div>
      <div class="achievement-conditions" data-achievement-conditions>
      ${rows.map((condition) => achievementConditionRow(condition)).join("")}
      </div>
    </div>
  `;
}

function achievementPayload(data, form) {
  const formObject = form ? new FormData(form) : null;
  const parameters = formObject?.getAll("condition_parameter") || [];
  const operators = formObject?.getAll("condition_operator") || [];
  const values = formObject?.getAll("condition_value") || [];
  const conditions = parameters
    .map((parameter, index) => ({
      parameter,
      operator: operators[index],
      value: parseAchievementValue(values[index]),
    }))
    .filter((condition) => condition.parameter && condition.operator);

  if (!conditions.length) throw new Error("Добавьте хотя бы один параметр достижения.");

  return {
    name: data.name,
    logic: data.logic || "and",
    conditions,
  };
}

function achievementDetails(item) {
  const separator = ` ${achievementLogicLabel(item.logic)} `;
  return (item.conditions || [])
    .map((condition) => `${achievementParameterLabel(condition.parameter)} ${achievementOperatorLabel(condition.operator)} ${condition.value}`)
    .join(separator);
}

function handleAchievementConditionClick(event, syncRoot = null) {
  const addButton = event.target.closest("[data-add-achievement-condition]");
  if (addButton) {
    event.preventDefault();
    event.stopPropagation();
    const form = addButton.closest("form");
    form?.querySelector("[data-achievement-conditions]")?.insertAdjacentHTML("beforeend", achievementConditionRow());
    if (syncRoot) syncRequiredPanelForms(syncRoot);
    return true;
  }

  const removeButton = event.target.closest("[data-remove-achievement-condition]");
  if (!removeButton) return false;
  event.preventDefault();
  event.stopPropagation();
  const container = removeButton.closest("[data-achievement-conditions]");
  const rows = container ? [...container.querySelectorAll("[data-achievement-condition-row]")] : [];
  if (rows.length > 1) removeButton.closest("[data-achievement-condition-row]")?.remove();
  if (syncRoot) syncRequiredPanelForms(syncRoot);
  return true;
}

function handleProductAmountClick(event, syncRoot = null) {
  const addButton = event.target.closest("[data-add-product-amount]");
  if (addButton) {
    event.preventDefault();
    event.stopPropagation();
    const form = addButton.closest("form");
    form?.querySelector("[data-product-amounts]")?.insertAdjacentHTML("beforeend", productItemActualAmountRow());
    if (syncRoot) syncRequiredPanelForms(syncRoot);
    return true;
  }

  const removeButton = event.target.closest("[data-remove-product-amount]");
  if (!removeButton) return false;
  event.preventDefault();
  event.stopPropagation();
  const container = removeButton.closest("[data-product-amounts]");
  const rows = container ? [...container.querySelectorAll("[data-product-amount-row]")] : [];
  if (rows.length > 1) removeButton.closest("[data-product-amount-row]")?.remove();
  if (syncRoot) syncRequiredPanelForms(syncRoot);
  return true;
}

function syncAchievementConditionValueField(control) {
  const row = control.closest("[data-achievement-condition-row]");
  if (!row) return;
  const valueLabel = row.querySelector('[name="condition_value"]')?.closest("label");
  if (!valueLabel) return;
  valueLabel.outerHTML = achievementValueField({
    parameter: control.value,
    operator: row.querySelector('[name="condition_operator"]')?.value,
    value: "",
  });
}

function syncBranchAchievementSummary(control) {
  const root = control.closest("[data-branch-achievement-select]");
  if (!root) return;
  const checked = [...root.querySelectorAll('input[name="branch_achievement_ids"]:checked')]
    .map((input) => input.closest("label")?.textContent?.trim())
    .filter(Boolean);
  const summary = root.querySelector("[data-branch-achievement-summary]");
  if (!summary) return;
  summary.textContent = checked.length
    ? checked.length > 2
      ? `Выбрано: ${checked.length}`
      : checked.join(", ")
    : "Не выбрано";
}

function syncServiceStaffSummary(control) {
  const root = control.closest("[data-service-staff-select]");
  if (!root) return;
  const checked = [...root.querySelectorAll('input[name="staff_user_ids"]:checked')]
    .map((input) => input.closest("label")?.textContent?.trim())
    .filter(Boolean);
  const summary = root.querySelector("[data-service-staff-summary]");
  if (!summary) return;
  summary.textContent = checked.length
    ? checked.length > 2
      ? `Выбрано: ${checked.length}`
      : checked.join(", ")
    : "Не выбрано";
}

function syncBranchProductItemSummary(control) {
  const root = control.closest("[data-branch-product-item-select]");
  if (!root) return;
  const checked = [...root.querySelectorAll("input:checked")]
    .map((input) => input.closest("label")?.textContent?.trim())
    .filter(Boolean);
  const summary = root.querySelector("[data-branch-product-item-summary]");
  if (!summary) return;
  summary.textContent = checked.length
    ? checked.length > 2
      ? `Выбрано: ${checked.length}`
      : checked.join(", ")
    : "Не выбрано";
}

function productItemDetails(item) {
  const category = (cache.categories || []).find((categoryItem) => String(categoryItem.id) === String(item.category_id));
  const categoryLabel = category ? `${category.name} (${categoryTypeLabel(category.type)})` : no;
  const price = item.price === null || item.price === undefined ? no : item.price;
  return `${categoryLabel} · Цена: ${price} · ${item.active ? "активен" : "неактивен"}`;
}

function productItemCategory(item) {
  return (cache.categories || []).find((category) => String(category.id) === String(item.category_id));
}

function categoryTypeById(categoryId) {
  return (cache.categories || []).find((category) => String(category.id) === String(categoryId))?.type;
}

function productItemStaffFields(item) {
  const selected = new Set((item.staff || []).map((staffItem) => String(staffItem.id)));
  const users = cache.users || [];
  if (!users.length) return "";
  const selectedNames = users
    .filter((user) => selected.has(String(user.id)))
    .map((user) => userLabelById(user.id));
  const summary = selectedNames.length
    ? selectedNames.length > 2
      ? `Выбрано: ${selectedNames.length}`
      : selectedNames.join(", ")
    : "Не выбрано";
  return `
    <div class="branch-multiselect modal-full" data-service-staff-select>
      <span>Сотрудники, оказывающие услугу</span>
      <details class="branch-multiselect-dropdown">
        <summary><span data-service-staff-summary>${escapeHtml(summary)}</span></summary>
        <div class="branch-multiselect-options">
          ${users.map((user) => `
            <label class="checkbox">
              <input type="checkbox" name="staff_user_ids" value="${escapeHtml(user.id)}" ${selected.has(String(user.id)) ? "checked" : ""}>
              ${escapeHtml(userLabelById(user.id))}
            </label>
          `).join("")}
        </div>
      </details>
    </div>
  `;
}

function serviceStaffPayload(form) {
  const formObject = form ? new FormData(form) : null;
  return (formObject?.getAll("staff_user_ids") || []).map((userId) => ({
    id: Number(userId),
  }));
}

function serviceImagePath(item) {
  return item.image_group?.images?.basic?.path || "";
}

function serviceImageGroupPayload(data) {
  const path = optional(data.image_path);
  if (!path) return null;
  return {
    entity: "settings_service",
    images: {
      basic: {
        path,
        version: "basic",
      },
    },
  };
}

function productItemActualAmountRow(item = {}) {
  return `
    <div class="achievement-condition-row" data-product-amount-row>
      <label><span>ID склада</span><input name="actual_amount_storage_id" type="number" step="1" min="0" value="${escapeHtml(item.storage_id ?? "")}"></label>
      <label><span>Количество</span><input name="actual_amount_value" type="number" step="0.01" min="0" value="${escapeHtml(item.amount ?? "")}"></label>
      <button type="button" class="ghost" data-remove-product-amount>Удалить</button>
    </div>
  `;
}

function productItemActualAmountsFields(items = []) {
  const rows = items.length ? items : [{}];
  return `
    <div class="achievement-builder modal-full">
      <div class="achievement-builder-head">
        <b>Остатки по складам</b>
        <button type="button" class="ghost" data-add-product-amount>Добавить остаток</button>
      </div>
      <div class="achievement-conditions" data-product-amounts>
        ${rows.map((item) => productItemActualAmountRow(item)).join("")}
      </div>
    </div>
  `;
}

function parseActualAmounts(form) {
  if (!form) return null;
  const formObject = new FormData(form);
  const storageIds = formObject.getAll("actual_amount_storage_id");
  const amounts = formObject.getAll("actual_amount_value");
  const result = storageIds
    .map((storageId, index) => ({
      storage_id: numberOrNull(storageId),
      amount: numberOrNull(amounts[index]),
    }))
    .filter((item) => item.storage_id !== null || item.amount !== null);
  if (result.some((item) => item.storage_id === null || item.amount === null)) {
    throw new Error("Для каждого остатка заполните и склад, и количество.");
  }
  return result.length ? result : null;
}

function branchProductItemFields(branch) {
  const selected = new Set((branch.product_item_ids || []).map((id) => String(id)));
  const productItems = cache.productItems || [];
  const services = productItems.filter((item) => categoryTypeById(item.category_id) === "service");
  const products = productItems.filter((item) => categoryTypeById(item.category_id) === "product");
  const serviceSummary = productItemSelectSummary(services, selected);
  const productSummary = productItemSelectSummary(products, selected);
  return `
    ${branchProductItemSelect("Услуги", "branch_service_item_ids", services, selected, serviceSummary)}
    ${branchProductItemSelect("Товары", "branch_product_item_ids", products, selected, productSummary)}
  `;
}

function productItemSelectSummary(items, selected) {
  const selectedNames = items
    .filter((item) => selected.has(String(item.id)))
    .map((item) => item.title);
  if (!selectedNames.length) return "Не выбрано";
  return selectedNames.length > 2 ? `Выбрано: ${selectedNames.length}` : selectedNames.join(", ");
}

function branchProductItemSelect(label, name, items, selected, summary) {
  return `
    <div class="branch-multiselect modal-full" data-branch-product-item-select>
      <span>${escapeHtml(label)}</span>
      <details class="branch-multiselect-dropdown">
        <summary><span data-branch-product-item-summary>${escapeHtml(summary)}</span></summary>
        <div class="branch-multiselect-options">
          ${items.length ? items.map((item) => `
            <label class="checkbox">
              <input type="checkbox" name="${escapeHtml(name)}" value="${escapeHtml(item.id)}" ${selected.has(String(item.id)) ? "checked" : ""}>
              ${escapeHtml(item.title)}
            </label>
          `).join("") : `<p class="empty">Нет доступных вариантов</p>`}
        </div>
      </details>
    </div>
  `;
}

function branchAchievementFields(branch) {
  const achievements = cache.achievements || [];
  if (!achievements.length) return "";
  const selected = new Set((branch.achievement_ids || []).map((id) => String(id)));
  const selectedNames = achievements
    .filter((achievement) => selected.has(String(achievement.id)))
    .map((achievement) => achievement.name);
  const summary = selectedNames.length
    ? selectedNames.length > 2
      ? `Выбрано: ${selectedNames.length}`
      : selectedNames.join(", ")
    : "Не выбрано";
  return `
    <div class="branch-multiselect modal-full" data-branch-achievement-select>
      <span>Достижения филиала</span>
      <details class="branch-multiselect-dropdown">
        <summary><span data-branch-achievement-summary>${escapeHtml(summary)}</span></summary>
        <div class="branch-multiselect-options">
          ${achievements.map((achievement) => `
            <label class="checkbox">
              <input type="checkbox" name="branch_achievement_ids" value="${escapeHtml(achievement.id)}" ${selected.has(String(achievement.id)) ? "checked" : ""}>
              ${escapeHtml(achievement.name)}
            </label>
          `).join("")}
        </div>
      </details>
    </div>
  `;
}

function productItemExtraFields(item) {
  const category = productItemCategory(item);
  if (category?.type === "service") return `
    <label><span>ID услуги организации</span><input name="salon_service_id" type="number" step="1" min="0" value="${escapeHtml(item.salon_service_id ?? "")}"></label>
    <label><span>Мин. цена</span><input name="price_min" type="number" step="0.01" min="0" value="${escapeHtml(item.price_min ?? "")}"></label>
    <label><span>Макс. цена</span><input name="price_max" type="number" step="0.01" min="0" value="${escapeHtml(item.price_max ?? "")}"></label>
    <label><span>Скидка</span><input name="discount" type="number" step="0.01" min="0" value="${escapeHtml(item.discount ?? "")}"></label>
    <label><span>Длительность, сек</span><input name="seance_length" type="number" step="1" min="0" value="${escapeHtml(item.seance_length ?? "")}"></label>
    <label><span>Вес сортировки</span><input name="weight" type="number" step="1" value="${escapeHtml(item.weight ?? "")}"></label>
    <label><span>Внешний ID</span><input name="api_id" value="${escapeHtml(item.api_id || "")}"></label>
    <label class="modal-full"><span>URL изображения</span><input name="image_path" type="url" value="${escapeHtml(serviceImagePath(item))}"></label>
    ${productItemStaffFields(item)}
    <label class="modal-full"><span>Комментарий</span><input name="comment" value="${escapeHtml(item.comment || "")}"></label>
  `;
  if (category?.type === "product") return `
    <label><span>ID товара</span><input name="good_id" type="number" step="1" min="0" value="${escapeHtml(item.good_id ?? "")}"></label>
    <label><span>Штрих-код</span><input name="barcode" value="${escapeHtml(item.barcode || "")}"></label>
    <label><span>ID ед. продажи</span><input name="unit_id" type="number" step="1" min="0" value="${escapeHtml(item.unit_id ?? "")}"></label>
    <label><span>Единица измерения</span><select name="unit_short_title">
      <option value="">Не выбрано</option>
      <option value="шт" ${item.unit_short_title === "шт" ? "selected" : ""}>шт</option>
      <option value="гр" ${item.unit_short_title === "гр" ? "selected" : ""}>гр</option>
    </select></label>
    <label><span>ID ед. списания</span><input name="service_unit_id" type="number" step="1" min="0" value="${escapeHtml(item.service_unit_id ?? "")}"></label>
    <label><span>Себестоимость</span><input name="actual_cost" type="number" step="0.01" min="0" value="${escapeHtml(item.actual_cost ?? "")}"></label>
    <label><span>Себестоимость единицы</span><input name="unit_actual_cost" type="number" step="0.01" min="0" value="${escapeHtml(item.unit_actual_cost ?? "")}"></label>
    <label><span>Соотношение ед.</span><input name="unit_equals" type="number" step="0.01" min="0" value="${escapeHtml(item.unit_equals ?? "")}"></label>
    ${productItemActualAmountsFields(item.actual_amounts || [])}
    <label class="modal-full"><span>Комментарий</span><input name="comment" value="${escapeHtml(item.comment || "")}"></label>
  `;
  return `
    <label class="modal-full"><span>Комментарий</span><input name="comment" value="${escapeHtml(item.comment || "")}"></label>
  `;
}

function humanizeCode(value) {
  const text = String(value || "").trim();
  if (!text) return no;
  const dictionary = {
    create: "Создание",
    created: "Создание",
    update: "Изменение",
    updated: "Изменение",
    edit: "Редактирование",
    delete: "Удаление",
    deleted: "Удаление",
    login: "Вход",
    logout: "Выход",
    renew: "Продление",
    transfer: "Перенос",
    freeze: "Заморозка",
    unfreeze: "Разморозка",
    expire: "Сгорание",
    client: "Клиент",
    visit: "Визит",
    subscription: "Абонемент",
    promotion: "Акция",
    client_created: "Создание клиента",
    visit_created: "Создание визита",
    subscription_create: "Создание абонемента",
    subscription_renew: "Продление абонемента",
    subscription_transfer: "Перенос абонемента",
    subscription_expired: "Сгорел абонемент",
    subscription_visit_consumed: "Списано посещение по абонементу",
    promotion_create: "Создание акции",
    legal: "Юридическое лицо",
    legal_entity: "Юридическое лицо",
    client_subscription: "Абонемент клиента",
    client_promotion: "Акция клиента",
    client_visit: "Визит клиента",
    branch: "Филиал",
    department: "Подразделение",
    workplace: "Рабочее место",
    role: "Роль",
    permission: "Право доступа",
    user: "Пользователь",
    system: "Система",
    membership: "Доступ пользователя",
    event: "Событие",
  };
  const phraseKey = text.toLowerCase().replace(/\s+/g, "_");
  if (dictionary[phraseKey]) return dictionary[phraseKey];
  return dictionary[text] || dictionary[text.toLowerCase()] || text
    .split(/[\s._-]+/)
    .map((part) => dictionary[part.toLowerCase()] || part)
    .join(" ");
}

function formatDateTime(value) {
  if (!value) return no;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatVisitDateTime(value) {
  if (!value) return no;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU");
}

function visitStatusLabel(status) {
  if (status === "completed") return "Завершен";
  if (status === "scheduled") return "Запланирован";
  if (status === "cancelled") return "Отменен";
  if (status === "no_show") return "Не пришел";
  return humanizeCode(status);
}

function readonly(label, value) {
  return `<div class="readonly-field"><span>${escapeHtml(label)}</span><b>${escapeHtml(String(value ?? "").trim() || no)}</b></div>`;
}

function userLabelById(id) {
  const user = (cache.users || []).find((item) => String(item.id) === String(id));
  if (!user) return id || no;
  return [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ") || user.email || user.phone || `#${user.id}`;
}

function userShortNameById(id) {
  const user = (cache.users || []).find((item) => String(item.id) === String(id));
  if (!user) return id || no;
  return [user.last_name, user.first_name].filter(Boolean).join(" ") || userLabelById(id);
}

function compactDetails(value) {
  if (!value || typeof value !== "object") return "";
  if (value.summary) return String(value.summary);
  if (Array.isArray(value.details)) return value.details.filter(Boolean).join(" · ");
  const fields = [];
  if (value.subscription_name) fields.push(`Абонемент: ${value.subscription_name}`);
  if (value.certificate_name) fields.push(`Сертификат: ${value.certificate_name}`);
  if (value.certificate_code) fields.push(`Сертификат: ${value.certificate_code}`);
  if (value.promotion_name) fields.push(`Акция: ${value.promotion_name}`);
  if (value.program_name) fields.push(`Программа: ${value.program_name}`);
  if (value.full_name) fields.push(`Клиент: ${value.full_name}`);
  if (value.client_id) fields.push(`Клиент: #${value.client_id}`);
  if (value.referrer_client_id) fields.push(`Пригласивший клиент: #${value.referrer_client_id}`);
  if (value.invited_client_id) fields.push(`Приглашенный клиент: #${value.invited_client_id}`);
  if (value.visit_status) fields.push(`Статус визита: ${value.visit_status}`);
  if (value.primary_phone) fields.push(`Телефон: ${value.primary_phone}`);
  if (value.branch_id) fields.push(`Филиал: #${value.branch_id}`);
  if (value.employee_id) fields.push(`Сотрудник: #${value.employee_id}`);
  if (value.actor_id) fields.push(`Инициатор: ${userShortNameById(value.actor_id)}`);
  if (value.bonus_type) fields.push(`Тип бонусов: ${value.bonus_type}`);
  if (value.amount !== undefined && value.amount !== null) fields.push(`Сумма: ${value.amount}`);
  if (value.balance !== undefined && value.balance !== null) fields.push(`Баланс: ${value.balance}`);
  if (value.balance_amount !== undefined && value.balance_amount !== null) fields.push(`Баланс: ${value.balance_amount}`);
  if (value.deposit_left !== undefined && value.deposit_left !== null) fields.push(`Остаток депозита: ${value.deposit_left}`);
  if (value.visits_left !== undefined && value.visits_left !== null) fields.push(`Осталось посещений: ${value.visits_left}`);
  if (value.status) fields.push(`Статус: ${humanizeCode(value.status)}`);
  if (value.reason) fields.push(`Причина: ${value.reason}`);
  if (value.expires_at) fields.push(`Действует до: ${formatDateTime(value.expires_at)}`);
  if (value.used_at) fields.push(`Использовано: ${formatDateTime(value.used_at)}`);
  return fields.join(" · ");
}

function auditDetails(item) {
  return item.reason || compactDetails(item.new_value) || compactDetails(item.old_value) || no;
}

function addDetail(fields, value) {
  if (!value || fields.includes(value)) return;
  fields.push(value);
}

function eventVisitDetails(item) {
  const payload = item.payload && typeof item.payload === "object" ? item.payload : {};
  const fields = [];
  addDetail(fields, `Клиент: ${payload.full_name || (item.client_id ? `#${item.client_id}` : no)}`);
  addDetail(fields, `Статус: ${visitStatusLabel(payload.visit_status)}`);
  addDetail(fields, `Дата визита: ${formatVisitDateTime(payload.visit_at)}`);
  if (payload.branch_id || item.branch_id) {
    addDetail(fields, `Филиал: ${nameById(cache.branches || [], payload.branch_id || item.branch_id)}`);
  }
  if (payload.employee_id) {
    addDetail(fields, `Сотрудник: ${userLabelById(payload.employee_id)}`);
  }
  if (item.actor_id || payload.actor_id) {
    addDetail(fields, `Инициатор: ${userShortNameById(item.actor_id || payload.actor_id)}`);
  }
  if (payload.total_cost !== undefined && payload.total_cost !== null) {
    addDetail(fields, `Стоимость: ${payload.total_cost}`);
  }
  if (payload.paid_amount !== undefined && payload.paid_amount !== null) {
    addDetail(fields, `Оплачено: ${payload.paid_amount}`);
  }
  return fields.join(" · ") || no;
}

function eventDetails(item) {
  if (item.entity_type === "client_visit") return eventVisitDetails(item);
  const fields = [];
  const payload = item.payload && typeof item.payload === "object" ? item.payload : {};
  if (payload.summary) addDetail(fields, String(payload.summary));
  if (Array.isArray(payload.details)) {
    payload.details.filter(Boolean).forEach((detail) => addDetail(fields, String(detail)));
  } else {
    const details = compactDetails(payload);
    if (details) details.split(" · ").forEach((detail) => addDetail(fields, detail));
  }

  const entityId = item.entity_id || payload.id || payload.subscription_id || payload.certificate_id || payload.visit_id;
  if (item.entity_type && entityId) addDetail(fields, `${humanizeCode(item.entity_type)}: #${entityId}`);
  if (item.client_id || payload.client_id) addDetail(fields, `Клиент: #${item.client_id || payload.client_id}`);
  if (item.branch_id || payload.branch_id) addDetail(fields, `Филиал: #${item.branch_id || payload.branch_id}`);
  if (payload.employee_id) addDetail(fields, `Сотрудник: #${payload.employee_id}`);
  if (item.actor_id || payload.actor_id) addDetail(fields, `Инициатор: ${userShortNameById(item.actor_id || payload.actor_id)}`);
  return fields.join(" · ") || no;
}

function jsonOrNull(value) {
  if (!String(value || "").trim()) return null;
  return JSON.parse(value);
}

function bigintIdOrNull(value) {
  const normalized = String(value ?? "").trim();
  if (!normalized) return null;
  return normalized;
}

function legalRequisites(data) {
  const vatEnabled = data.vat_enabled === "on";
  return {
    inn: optional(data.inn),
    ogrn: optional(data.ogrn),
    kpp: optional(data.kpp),
    legal_address: optional(data.legal_address),
    vat_enabled: vatEnabled || undefined,
    vat_rate: vatEnabled ? optional(data.vat_rate) : undefined,
  };
}

function bankDetails(data) {
  return {
    bank: optional(data.bank),
    bik: optional(data.bik),
    settlement_account: optional(data.settlement_account),
    correspondent_account: optional(data.correspondent_account),
  };
}

function fieldLabel(control) {
  return control.closest("label")?.querySelector("span")?.textContent?.trim()
    || control.getAttribute("name")
    || "поле";
}

function validateRequiredPanelForm(form) {
  const controls = [...form.querySelectorAll("input, select, textarea")];
  const emptyControl = controls.find((control) => {
    const type = String(control.type || "").toLowerCase();
    if (control.disabled || control.readOnly) return false;
    if (["button", "submit", "reset", "hidden", "checkbox", "radio"].includes(type)) return false;
    return !String(control.value || "").trim();
  });
  if (!emptyControl) return;
  emptyControl.focus();
  throw new Error(`Заполните поле: ${fieldLabel(emptyControl)}.`);
}

function requiredPanelControls(form) {
  return [...form.querySelectorAll("input, select, textarea")].filter((control) => {
    const type = String(control.type || "").toLowerCase();
    if (control.disabled || control.readOnly) return false;
    return !["button", "submit", "reset", "hidden", "checkbox", "radio"].includes(type);
  });
}

function syncRequiredPanelForms(root) {
  const forms = root.matches?.("[data-settings]")
    ? root.querySelectorAll("form:not([data-entity-edit])")
    : root.querySelectorAll("[data-settings] form:not([data-entity-edit])");
  forms.forEach((form) => {
    const controls = requiredPanelControls(form);
    controls.forEach((control) => {
      control.required = true;
    });
    const submit = form.querySelector('button[type="submit"], button.primary');
    if (submit) {
      submit.disabled = controls.some((control) => !String(control.value || "").trim());
    }
  });
}

function timezoneOptions(selected = DEFAULT_TIMEZONE) {
  const known = new Map(TIMEZONE_CITY_OPTIONS.map((item) => [item.value, item.label]));
  const zones = [...TIMEZONE_CITY_OPTIONS];
  if (selected && !known.has(selected)) {
    zones.unshift({ value: selected, label: selected.split("/").pop()?.replace(/_/g, " ") || selected });
  }
  return `
    <label><span>Часовой пояс</span><select name="timezone">
      ${zones.map((zone) => {
        const offset = DateTime.now().setZone(zone.value).toFormat("'UTC'ZZ");
        return `<option value="${escapeHtml(zone.value)}" ${zone.value === selected ? "selected" : ""}>${escapeHtml(`${zone.label} (${offset})`)}</option>`;
      }).join("")}
    </select></label>
  `;
}

function vatFields(selectedRate = "", enabled = false) {
  return `
    <div style="display:flex; align-items:end; gap:12px; flex-wrap:wrap;">
      <label class="checkbox" style="margin:0;">
        <input type="checkbox" name="vat_enabled" ${enabled ? "checked" : ""}>
        НДС
      </label>
      <label data-vat-rate-wrap style="min-width:220px;">
        <span>Ставка НДС</span>
        <select name="vat_rate" ${enabled ? "" : "disabled"}>
          <option value="">Не выбрано</option>
          ${VAT_RATE_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}" ${selectedRate === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
        </select>
      </label>
    </div>
  `;
}

function syncVatFields(scope) {
  const container = scope.closest("form") || scope;
  const checkbox = container.querySelector('[name="vat_enabled"]');
  const wrap = container.querySelector("[data-vat-rate-wrap]");
  const rate = container.querySelector('[name="vat_rate"]');
  if (!checkbox || !wrap || !rate) return;
  rate.disabled = !checkbox.checked;
  if (!checkbox.checked) rate.value = "";
}

function workplaceDepartmentOptions(branchId = "", selectedDepartmentId = "") {
  const filteredDepartments = cache.departments.filter((item) => String(item.branch_id) === String(branchId));
  const options = [
    `<option value="">${escapeHtml(branchId ? "Выберите подразделение" : "Сначала выберите филиал")}</option>`,
    ...filteredDepartments.map((item) => {
      const value = String(item.id);
      return `<option value="${escapeHtml(value)}" ${String(selectedDepartmentId) === value ? "selected" : ""}>${escapeHtml(item.name)}</option>`;
    }),
  ];
  return options.join("");
}

function userWorkplaceOptions(branchId = "", departmentId = "", selectedWorkplaceId = "") {
  const filteredWorkplaces = cache.workplaces.filter((item) =>
    String(item.branch_id) === String(branchId) && String(item.department_id) === String(departmentId));
  const options = [
    `<option value="">${escapeHtml(departmentId ? "Выберите рабочее место" : "Сначала выберите подразделение")}</option>`,
    ...filteredWorkplaces.map((item) => {
      const value = String(item.id);
      return `<option value="${escapeHtml(value)}" ${String(selectedWorkplaceId) === value ? "selected" : ""}>${escapeHtml(item.name)}</option>`;
    }),
  ];
  return options.join("");
}

function syncWorkplaceForm(scope) {
  const form = scope.closest("[data-workplace-create]") || scope;
  const branch = form.querySelector('[name="branch_id"]');
  const department = form.querySelector('[name="department_id"]');
  const submit = form.querySelector('button[type="submit"], button.primary');
  if (!branch || !department) return;
  const hasBranch = !!String(branch.value || "").trim();
  const currentDepartment = hasBranch ? department.value : "";
  department.innerHTML = workplaceDepartmentOptions(branch.value, currentDepartment);
  department.disabled = !hasBranch;
  if (!hasBranch) department.value = "";
  if (submit) submit.disabled = !hasBranch;
}

function syncUserDepartmentForm(scope) {
  const form = scope.closest("[data-user-create], [data-user-access-create]") || scope;
  const branch = form.querySelector('[name="branch_id"]');
  const department = form.querySelector('[name="department_id"]');
  const role = form.querySelector('[name="role_id"]');
  const workplace = form.querySelector('[name="workplace_id"]');
  const submit = form.querySelector('button[type="submit"], button.primary');
  if (!branch || !department) return;
  const hasBranch = !!String(branch.value || "").trim();
  const currentDepartment = hasBranch ? department.value : "";
  department.innerHTML = workplaceDepartmentOptions(branch.value, currentDepartment);
  department.disabled = !hasBranch;
  if (!hasBranch) department.value = "";
  const hasDepartment = !!String(department.value || "").trim();
  if (role) {
    role.disabled = !hasDepartment;
    if (!hasDepartment) role.value = "";
  }
  if (workplace) {
    const currentWorkplace = hasDepartment ? workplace.value : "";
    workplace.innerHTML = userWorkplaceOptions(branch.value, department.value, currentWorkplace);
    workplace.disabled = !hasDepartment;
    if (!hasDepartment) workplace.value = "";
  }
  if (submit) submit.disabled = !hasDepartment;
}

function section(title, body, hint = "") {
  const hintMarkup = hint
    ? `<span class="title-hint" tabindex="0" aria-label="${escapeHtml(hint)}" data-tooltip="${escapeHtml(hint)}">?</span>`
    : "";
  return `<div class="subpanel"><h3 class="subpanel-title">${escapeHtml(title)}${hintMarkup}</h3>${body}</div>`;
}

function eventEntityCell(item) {
  if (item.entity_type === "client_visit") {
    return `<button type="button" class="ghost" data-open-event-visit="${escapeHtml(item.id)}">${escapeHtml(humanizeCode(item.entity_type))}</button>`;
  }
  return escapeHtml(humanizeCode(item.entity_type));
}

function eventVisitModal() {
  if (!selectedEventVisit) return "";
  const visit = selectedEventVisit.payload || {};
  return `
    <div class="modal-backdrop" data-event-visit-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>Визит</h3>
          <button type="button" class="ghost" data-close-event-visit>Закрыть</button>
        </div>
        <div class="modal-grid">
          ${readonly("Дата и время", formatVisitDateTime(visit.visit_at))}
          ${readonly("Филиал", nameById(cache.branches || [], visit.branch_id))}
          ${readonly("Сотрудник", userLabelById(visit.employee_id))}
          ${readonly("Клиент", visit.full_name || (selectedEventVisit.client_id ? `#${selectedEventVisit.client_id}` : ""))}
          ${readonly("Статус визита", visitStatusLabel(visit.visit_status))}
          ${readonly("Стоимость", visit.total_cost)}
          ${readonly("Скидка", visit.discount_amount)}
          ${readonly("Оплачено", visit.paid_amount)}
          ${readonly("Задолженность", visit.debt_amount)}
          ${readonly("Комментарий", visit.comment)}
        </div>
      </div>
    </div>
  `;
}

function entityList(items, empty, type, title, subtitle = () => "", actions = {}) {
  if (!items.length) return `<p class="empty">${escapeHtml(empty)}</p>`;
  const deleteType = actions.deleteType || type;
  const deleteId = actions.deleteId || ((item) => item.id);
  const deleteLabel = actions.deleteLabel || "Удалить";
  return `
    <div class="entity-list">
      ${items.map((item) => {
        const subtitleText = subtitle(item);
        const itemDeleteId = deleteId(item);
        return `
          <div style="display:flex; gap:8px; align-items:stretch;">
            <button type="button" class="entity-card" data-edit-entity="${escapeHtml(type)}" data-id="${item.id}" style="flex:1; min-width:0;">
              <b>${escapeHtml(title(item))}</b>
              ${subtitleText ? `<span>${escapeHtml(subtitleText)}</span>` : ""}
            </button>
            ${itemDeleteId !== undefined && itemDeleteId !== null && itemDeleteId !== ""
              ? `<button type="button" class="ghost" data-delete-entity="${escapeHtml(deleteType)}" data-id="${escapeHtml(itemDeleteId)}">${escapeHtml(deleteLabel)}</button>`
              : ""
            }
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function departmentFilterOptions(branches, selected = "") {
  return `
    <label><span>Фильтр по филиалу</span><select data-department-filter-branch>
      <option value="" ${!selected ? "selected" : ""}>Все</option>
      ${branches.map((item) => `<option value="${escapeHtml(item.id)}" ${String(selected) === String(item.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
    </select></label>
  `;
}

function workplaceFilterOptions(branches, selected = "") {
  return `
    <label><span>Фильтр по филиалу</span><select data-workplace-filter-branch>
      <option value="" ${!selected ? "selected" : ""}>Все</option>
      ${branches.map((item) => `<option value="${escapeHtml(item.id)}" ${String(selected) === String(item.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
    </select></label>
  `;
}

function productItemCategoryFilterOptions(categories, selected = "", attr = "data-product-item-filter-category") {
  return `
    <label><span>Фильтр по категории</span><select ${attr}>
      <option value="" ${!selected ? "selected" : ""}>Все</option>
      ${categories.map((item) => `<option value="${escapeHtml(item.id)}" ${String(selected) === String(item.id) ? "selected" : ""}>${escapeHtml(item.name)} (${escapeHtml(categoryTypeLabel(item.type))})</option>`).join("")}
    </select></label>
  `;
}

function productItemCreateForm(categories, title) {
  return `
    <form class="inline-form compact" data-product-item-create data-permission="settings.items.create">
      ${selectField("Категория", "category_id", categories.map((category) => ({ id: category.id, name: category.name })), "", "Выберите категорию")}
      <label><span>Название</span><input name="title" required></label>
      <label><span>Цена</span><input name="price" type="number" step="0.01" min="0"></label>
      <label><span>Активен</span><select name="active">
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </select></label>
      <button class="primary" disabled>Добавить ${escapeHtml(title)}</button>
      <p data-message></p>
    </form>
  `;
}

function findEntity(type, id) {
  const source = {
    brand: cache.brands,
    legal: cache.legalEntities,
    category: cache.categories,
    productItem: cache.productItems,
    achievement: cache.achievements,
    branch: cache.branches,
    department: cache.departments,
    workplace: cache.workplaces,
    module: cache.modules,
    user: cache.users,
    role: cache.roles,
    permission: cache.permissions,
    branchMembership: cache.branchMemberships,
  }[type] || [];
  return source.find((item) => String(item.id) === String(id));
}

function modalFields(type, item) {
  if (type === "brand") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
  `;
  if (type === "legal") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Тип</span><select name="legal_type">
      <option value="">Не выбрано</option>
      ${LEGAL_TYPE_OPTIONS.map((itemOption) => `<option value="${escapeHtml(itemOption.value)}" ${item.legal_type === itemOption.value ? "selected" : ""}>${escapeHtml(itemOption.label)}</option>`).join("")}
    </select></label>
    <label><span>Налоговая система</span><select name="tax_system">
      <option value="">Не выбрано</option>
      ${TAX_SYSTEM_OPTIONS.map((itemOption) => `<option value="${escapeHtml(itemOption.value)}" ${item.tax_system === itemOption.value ? "selected" : ""}>${escapeHtml(itemOption.label)}</option>`).join("")}
    </select></label>
    ${vatFields(item.requisites?.vat_rate || "", !!item.requisites?.vat_enabled)}
    <label><span>ИНН</span><input name="inn" value="${escapeHtml(item.requisites?.inn || "")}"></label>
    <label><span>ОГРН/ОГРНИП</span><input name="ogrn" value="${escapeHtml(item.requisites?.ogrn || "")}"></label>
    <label><span>КПП</span><input name="kpp" value="${escapeHtml(item.requisites?.kpp || "")}"></label>
    <label><span>Юр. адрес</span><input name="legal_address" value="${escapeHtml(item.requisites?.legal_address || "")}"></label>
    <label><span>Банк</span><input name="bank" value="${escapeHtml(item.bank_details?.bank || "")}"></label>
    <label><span>БИК</span><input name="bik" value="${escapeHtml(item.bank_details?.bik || "")}"></label>
    <label><span>Расчётный счёт</span><input name="settlement_account" value="${escapeHtml(item.bank_details?.settlement_account || "")}"></label>
    <label><span>Корр. счёт</span><input name="correspondent_account" value="${escapeHtml(item.bank_details?.correspondent_account || "")}"></label>
  `;
  if (type === "category") return `
    <label><span>Название категории</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Тип</span><select name="type">
      ${PRODUCT_CATEGORY_TYPE_OPTIONS.map((itemOption) => `<option value="${escapeHtml(itemOption.value)}" ${item.type === itemOption.value ? "selected" : ""}>${escapeHtml(itemOption.label)}</option>`).join("")}
    </select></label>
  `;
  if (type === "productItem") return `
    ${selectField(
      "Категория",
      "category_id",
      cache.categories
        .filter((category) => category.type === productItemCategory(item)?.type)
        .map((category) => ({ id: category.id, name: category.name })),
      item.category_id,
      "Выберите категорию",
    )}
    <label><span>Название</span><input name="title" value="${escapeHtml(item.title)}" required></label>
    <label><span>Цена</span><input name="price" type="number" step="0.01" min="0" value="${escapeHtml(item.price ?? "")}"></label>
    ${productItemExtraFields(item)}
    <label><span>Активен</span><select name="active">
      <option value="true" ${item.active ? "selected" : ""}>Да</option>
      <option value="false" ${!item.active ? "selected" : ""}>Нет</option>
    </select></label>
  `;
  if (type === "achievement") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Клиент должен выполнить</span><select name="logic">
      ${ACHIEVEMENT_LOGIC_OPTIONS.map((itemOption) => `<option value="${escapeHtml(itemOption.value)}" ${item.logic === itemOption.value ? "selected" : ""}>${escapeHtml(itemOption.label)}</option>`).join("")}
    </select></label>
    ${achievementConditionsFields(item.conditions || [])}
  `;
  if (type === "branch") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Адрес</span><input name="address" value="${escapeHtml(item.address || "")}"></label>
    <label><span>Телефон</span><input name="phone" value="${escapeHtml(item.phone || "")}"></label>
    ${timezoneOptions(item.timezone || DEFAULT_TIMEZONE)}
    ${selectField("Юридическое лицо", "legal_entity_id", cache.legalEntities, item.legal_entity_id)}
    ${branchProductItemFields(item)}
    ${branchAchievementFields(item)}
    <label class="checkbox modal-full"><input type="checkbox" name="online_booking_enabled" ${item.online_booking_enabled ? "checked" : ""}> Онлайн-запись</label>
  `;
  if (type === "department") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
  `;
  if (type === "workplace") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    ${selectField("Подразделение", "department_id", cache.departments, item.department_id)}
  `;
  if (type === "module") return `
    <label><span>Название модуля</span><input name="module_name" value="${escapeHtml(item.module_name)}" required></label>
  `;
  if (type === "user") return `
    <div class="readonly-field"><span>ID пользователя</span><b>${escapeHtml(item.id)}</b></div>
    <div class="readonly-field"><span>Создан</span><b>${escapeHtml(item.created_at || no)}</b></div>
    <label><span>Имя</span><input name="first_name" value="${escapeHtml(item.first_name || "")}"></label>
    <label><span>Отчество</span><input name="middle_name" value="${escapeHtml(item.middle_name || "")}"></label>
    <label><span>Фамилия</span><input name="last_name" value="${escapeHtml(item.last_name || "")}"></label>
    <label><span>Телефон</span><input name="phone" value="${escapeHtml(item.phone || "")}"></label>
    <label><span>Email</span><input name="email" value="${escapeHtml(item.email || "")}"></label>
    <label><span>Telegram ID</span><input name="telegram_id" value="${escapeHtml(item.telegram_id || "")}" inputmode="numeric"></label>
    <label><span>MAX ID</span><input name="max_id" value="${escapeHtml(item.max_id || "")}" inputmode="numeric"></label>
    ${selectField("Роль в организации", "role_id", cache.roles, cache.memberships.find((membership) => membership.user_id === item.id)?.role_id)}
    <label><span>Активен</span><select name="is_active">
      <option value="true" ${item.is_active ? "selected" : ""}>Да</option>
      <option value="false" ${!item.is_active ? "selected" : ""}>Нет</option>
    </select></label>
  `;
  if (type === "role") return `
    <label class="modal-full"><span>Название роли</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <div class="permission-matrix modal-permission-matrix modal-full">
      ${PERMISSION_TREE.map((service) => `
        <div class="permission-service">
          <h5>${escapeHtml(service.service)}</h5>
          ${service.sections.map((part) => `
            <div class="permission-section">
              <strong>${escapeHtml(part.name)}</strong>
              <div class="permission-actions">
                ${part.actions.map((action) => `
                  <label class="checkbox">
                    <input
                      type="checkbox"
                      name="permission_codes"
                      value="${escapeHtml(action.code)}"
                      ${new Set((cache.rolePermissions?.[item.id] || []).map((permission) => permission.code)).has(action.code) ? "checked" : ""}
                    >
                    ${escapeHtml(action.name)}
                  </label>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      `).join("")}
    </div>
  `;
  if (type === "permission") return `
    <label><span>Код</span><input name="code" value="${escapeHtml(item.code)}" required></label>
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Описание</span><input name="description" value="${escapeHtml(item.description || "")}"></label>
  `;
  if (type === "branchMembership") return `
    ${selectField("Роль", "role_id", cache.roles, item.role_id, "Выберите роль")}
  `;
  return "";
}

function openEntityModal(type, item) {
  const titles = {
    brand: "Бренд",
    legal: "Юридическое лицо",
    category: "Категория товаров и услуг",
    productItem: "Товар или услуга",
    achievement: "Достижение",
    branch: "Филиал",
    department: "Подразделение",
    workplace: "Рабочее место",
    module: "Модуль",
    user: "Пользователь",
    role: "Роль",
    permission: "Право",
    branchMembership: "Доступ к филиалу",
  };
  const modalTitle = item.name
    || item.title
    || item.module_name
    || [item.last_name, item.first_name, item.middle_name].filter(Boolean).join(" ")
    || item.email
    || item.phone
    || `${titles[type] || "Сущность"} #${item.id}`;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-backdrop" data-settings-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>${escapeHtml(modalTitle)}</h3>
          <button type="button" class="ghost" data-close-modal>Закрыть</button>
        </div>
        <form class="modal-grid" data-entity-edit data-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}">
          ${modalFields(type, item)}
          <p data-message></p>
          <button class="primary">Сохранить</button>
        </form>
      </div>
    </div>
  `);
}

async function saveEntity(type, id, data, form = null) {
  if (type === "brand") return api.updateBrand(id, { name: data.name });
  if (type === "legal") return api.updateLegalEntity(id, {
    name: data.name,
    legal_type: optional(data.legal_type),
    tax_system: optional(data.tax_system),
    requisites: legalRequisites(data),
    bank_details: bankDetails(data),
  });
  if (type === "category") {
    if (!api.updateProductCategory) throw new Error("API категорий не подключен.");
    return api.updateProductCategory(id, {
      name: data.name,
      type: data.type,
    });
  }
  if (type === "productItem") {
    if (!api.updateProductItem) throw new Error("API товаров и услуг не подключен.");
    const categoryType = categoryTypeById(data.category_id);
    return api.updateProductItem(id, {
      category_id: Number(data.category_id),
      title: data.title,
      price: numberOrNull(data.price),
      salon_service_id: categoryType === "service" ? numberOrNull(data.salon_service_id) : null,
      price_min: categoryType === "service" ? numberOrNull(data.price_min) : null,
      price_max: categoryType === "service" ? numberOrNull(data.price_max) : null,
      discount: categoryType === "service" ? numberOrNull(data.discount) : null,
      comment: optional(data.comment),
      weight: categoryType === "service" ? numberOrNull(data.weight) : null,
      api_id: categoryType === "service" ? optional(data.api_id) : null,
      good_id: categoryType === "product" ? numberOrNull(data.good_id) : null,
      barcode: categoryType === "product" ? optional(data.barcode) : null,
      unit_id: categoryType === "product" ? numberOrNull(data.unit_id) : null,
      unit_short_title: categoryType === "product" ? optional(data.unit_short_title) : null,
      service_unit_id: categoryType === "product" ? numberOrNull(data.service_unit_id) : null,
      service_unit_short_title: categoryType === "product" ? optional(data.unit_short_title) : null,
      actual_cost: categoryType === "product" ? numberOrNull(data.actual_cost) : null,
      unit_actual_cost: categoryType === "product" ? numberOrNull(data.unit_actual_cost) : null,
      unit_equals: categoryType === "product" ? numberOrNull(data.unit_equals) : null,
      actual_amounts: categoryType === "product" ? parseActualAmounts(form) : null,
      seance_length: categoryType === "service" ? numberOrNull(data.seance_length) : null,
      staff: categoryType === "service" ? serviceStaffPayload(form) : null,
      image_group: categoryType === "service" ? serviceImageGroupPayload(data) : null,
      active: data.active === "true",
    });
  }
  if (type === "achievement") {
    if (!api.updateAchievement) throw new Error("API достижений не подключен.");
    return api.updateAchievement(id, achievementPayload(data, form));
  }
  if (type === "branch") return api.updateBranch(id, {
    name: data.name,
    address: optional(data.address),
    phone: optional(data.phone),
    timezone: optional(data.timezone),
    brand_id: numberOrNull(data.brand_id),
    legal_entity_id: numberOrNull(data.legal_entity_id),
    product_item_ids: data.product_item_ids || [],
    achievement_ids: data.achievement_ids || [],
  });
  if (type === "department") return api.updateDepartment(id, { name: data.name });
  if (type === "workplace") return api.updateWorkplace(id, {
    name: data.name,
    department_id: numberOrNull(data.department_id),
  });
  if (type === "module") return api.updateModule(id, { module_name: data.module_name });
  if (type === "user") return api.updateUser(id, {
    first_name: optional(data.first_name),
    middle_name: optional(data.middle_name),
    last_name: optional(data.last_name),
    phone: optional(data.phone),
    email: optional(data.email),
    telegram_id: bigintIdOrNull(data.telegram_id),
    max_id: bigintIdOrNull(data.max_id),
    is_active: data.is_active === "true",
    is_blocked: data.is_blocked === "true",
  }).then(async (updated) => {
    const membership = cache.memberships.find((item) => String(item.user_id) === String(id));
    const roleId = numberOrNull(data.role_id);
    if (roleId && membership) {
      await api.updateMembership(membership.id, { role_id: roleId });
    } else if (roleId) {
      await api.assignUser({ user_id: Number(id), organization_id: cache.organizationId, role_id: roleId });
    }
    return updated;
  });
  if (type === "role") return api.updateRole(id, { name: data.name }).then(async (updated) => {
    const codes = Array.isArray(data.permission_codes)
      ? data.permission_codes
      : data.permission_codes
        ? [data.permission_codes]
        : [];
    await api.replaceRolePermissions(id, {
      permissions: codes.map((code) => {
        const permission = permissionByCode(code);
        return {
          organization_id: cache.organizationId,
          code,
          name: permission?.name || code,
          description: permission?.description,
        };
      }),
    });
    return updated;
  });
  if (type === "permission") return api.updatePermission(id, {
    code: data.code,
    name: data.name,
    description: optional(data.description),
  });
  if (type === "branchMembership") return api.updateBranchMembership(id, {
    role_id: numberOrNull(data.role_id),
  });
}

async function deleteEntity(type, id) {
  if (type === "legal") return api.deleteLegalEntity(id);
  if (type === "category") {
    if (!api.deleteProductCategory) throw new Error("API категорий не подключен.");
    return api.deleteProductCategory(id);
  }
  if (type === "productItem") {
    if (!api.deleteProductItem) throw new Error("API товаров и услуг не подключен.");
    return api.deleteProductItem(id);
  }
  if (type === "achievement") {
    if (!api.deleteAchievement) throw new Error("API достижений не подключен.");
    return api.deleteAchievement(id);
  }
  if (type === "branch") return api.deleteBranch(id);
  if (type === "department") return api.deleteDepartment(id);
  if (type === "workplace") return api.deleteWorkplace(id);
  if (type === "role") return api.deleteRole(id);
  if (type === "permission") return api.deletePermission(id);
  if (type === "userAccess") return api.deleteMembership(cache.organizationId, id);
  if (type === "branchMembership") return api.deleteBranchMembership(id);
  throw new Error("Неизвестная сущность");
}

export async function settings(ctx) {
  const [
    branches,
    brands,
    legalEntities,
    categories,
    productItems,
    achievements,
    departments,
    workplaces,
    modules,
    users,
    roles,
    permissions,
    memberships,
    branchMemberships,
    auditLogs,
    events,
  ] = await Promise.all([
    api.branches(ctx.org.id).catch(() => []),
    api.brands(ctx.org.id).catch(() => []),
    api.legalEntities(ctx.org.id).catch(() => []),
    (api.productCategories?.(ctx.org.id) || Promise.resolve([])).catch(() => []),
    (api.productItems?.(ctx.org.id) || Promise.resolve([])).catch(() => []),
    (api.achievements?.(ctx.org.id) || Promise.resolve([])).catch(() => []),
    api.departments(ctx.org.id).catch(() => []),
    api.workplaces(ctx.org.id).catch(() => []),
    api.modules(ctx.org.id).catch(() => []),
    api.users(ctx.org.id, 500).catch(() => []),
    api.roles(ctx.org.id).catch(() => []),
    api.permissions(ctx.org.id).catch(() => []),
    api.memberships(ctx.org.id).catch(() => []),
    api.branchMemberships(ctx.org.id).catch(() => []),
    api.auditLogs(ctx.org.id).catch(() => []),
    api.events(ctx.org.id).catch(() => []),
  ]);
  const rolePermissions = Object.fromEntries(await Promise.all(
    roles.map(async (role) => [role.id, await api.rolePermissions(role.id).catch(() => [])]),
  ));
  const userIds = new Set(users.map((user) => String(user.id)));
  const missingActorIds = [...new Set(events
    .map((item) => item.actor_id || item.payload?.actor_id)
    .filter(Boolean)
    .map((id) => String(id))
    .filter((id) => !userIds.has(id)))];
  const actorUsers = await Promise.all(missingActorIds.map((id) => api.user(id).catch(() => null)));
  const usersWithActors = [
    ...users,
    ...actorUsers.filter(Boolean).filter((user) => !userIds.has(String(user.id))),
  ];
  const filteredDepartments = departmentFilterBranchId
    ? departments.filter((item) => String(item.branch_id) === String(departmentFilterBranchId))
    : departments;
  const filteredWorkplaces = workplaceFilterBranchId
    ? workplaces.filter((item) => String(item.branch_id) === String(workplaceFilterBranchId))
    : workplaces;

  cache = { organizationId: ctx.org.id, branches, brands, legalEntities, categories, productItems, achievements, departments, workplaces, modules, users: usersWithActors, roles, permissions, memberships, branchMemberships, rolePermissions, events };
  const productCategories = categories.filter((category) => category.type === "product");
  const serviceCategories = categories.filter((category) => category.type === "service");
  const products = productItems
    .filter((item) => categoryTypeById(item.category_id) === "product")
    .filter((item) => !productFilterCategoryId || String(item.category_id) === String(productFilterCategoryId));
  const services = productItems
    .filter((item) => categoryTypeById(item.category_id) === "service")
    .filter((item) => !serviceFilterCategoryId || String(item.category_id) === String(serviceFilterCategoryId));

  return `
    <section class="panel" data-settings>
      <h2>${escapeHtml(ctx.org.name)}</h2>

      <div id="legal" data-permission="settings.legal.view">
        ${section("Юридические лица", `
          <form class="inline-form compact" data-legal-create data-permission="settings.legal.create">
            <label><span>Название</span><input name="name" required></label>
            <label><span>Тип</span><select name="legal_type">
              <option value="">Не выбрано</option>
              ${LEGAL_TYPE_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}
            </select></label>
            <label><span>Налоги</span><select name="tax_system">
              <option value="">Не выбрано</option>
              ${TAX_SYSTEM_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}
            </select></label>
            ${vatFields()}
            <label><span>ИНН</span><input name="inn"></label>
            <label><span>ОГРН/ОГРНИП</span><input name="ogrn"></label>
            <label><span>КПП</span><input name="kpp"></label>
            <label><span>Юр. адрес</span><input name="legal_address"></label>
            <label><span>Банк</span><input name="bank"></label>
            <label><span>БИК</span><input name="bik"></label>
            <label><span>Расчётный счёт</span><input name="settlement_account"></label>
            <label><span>Корр. счёт</span><input name="correspondent_account"></label>
            <button class="primary" disabled>Добавить Юридическое лицо</button>
            <p data-message></p>
          </form>
          ${entityList(legalEntities, "Юридических лиц пока нет", "legal", (item) => item.name, (item) => `${item.legal_type || no} · ИНН ${item.requisites?.inn || no}`, {
            deleteLabel: "Удалить",
          })}
        `, "Юридические лица — это функциональная зона или отдел внутри бизнеса.")}
      </div>

      <div id="categories" data-permission="settings.categories.view">
        ${section("Категории товаров и услуг", `
          <form class="inline-form compact" data-category-create data-permission="settings.categories.create">
            <label><span>Название категории</span><input name="name" required></label>
            <label><span>Тип</span><select name="type">
              ${PRODUCT_CATEGORY_TYPE_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}
            </select></label>
            <button class="primary" disabled>Добавить категорию</button>
            <p data-message></p>
          </form>
          ${entityList(categories, "Категорий пока нет", "category", (item) => item.name, (item) => categoryTypeLabel(item.type), {
            deleteLabel: "Удалить",
          })}
        `, "Категории товаров и услуг — это категории, приписанные к организации.")}
      </div>

      <div id="product-items" data-permission="settings.items.view">
        ${section("Товары", `
          ${productItemCreateForm(productCategories, "товар")}
          <form class="inline-form compact">
            ${productItemCategoryFilterOptions(productCategories, productFilterCategoryId, "data-product-filter-category")}
          </form>
          ${entityList(products, "Товаров пока нет", "productItem", (item) => item.title, productItemDetails, {
            deleteLabel: "Удалить",
          })}
        `, "Товары привязаны к товарным категориям организации.")}
      </div>

      <div id="service-items" data-permission="settings.items.view">
        ${section("Услуги", `
          ${productItemCreateForm(serviceCategories, "услугу")}
          <form class="inline-form compact">
            ${productItemCategoryFilterOptions(serviceCategories, serviceFilterCategoryId, "data-service-filter-category")}
          </form>
          ${entityList(services, "Услуг пока нет", "productItem", (item) => item.title, productItemDetails, {
            deleteLabel: "Удалить",
          })}
        `, "Услуги привязаны к категориям услуг организации.")}
      </div>

      <div id="achievements" data-permission="settings.achievements.view">
        ${section("Достижения", `
          <form class="inline-form compact" data-achievement-create data-permission="settings.achievements.create">
            <label><span>Название</span><input name="name" required></label>
            <label><span>Клиент должен выполнить</span><select name="logic">
              ${ACHIEVEMENT_LOGIC_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}
            </select></label>
            ${achievementConditionsFields()}
            <button class="primary" disabled>Добавить достижение</button>
            <p data-message></p>
          </form>
          ${entityList(achievements, "Достижений пока нет", "achievement", (item) => item.name, achievementDetails, {
            deleteLabel: "Удалить",
          })}
        `, "Достижения собираются из одного или нескольких параметров клиента.")}
      </div>

      <div id="branches" data-permission="settings.branches.view">
        ${section("Филиалы", `
          <form class="inline-form compact" data-branch-create data-permission="settings.branches.create">
            <label><span>Название</span><input name="name" required></label>
            <label><span>Адрес</span><input name="address"></label>
            <label><span>Телефон</span><input name="phone"></label>
            ${timezoneOptions()}
            ${selectField("Юридическое лицо", "legal_entity_id", legalEntities)}
            <label class="checkbox"><input type="checkbox" name="online_booking_enabled" checked> Онлайн-запись</label>
            <button class="primary" disabled>Добавить филиал</button>
            <p data-message></p>
          </form>
          ${entityList(branches, "Филиалов пока нет", "branch", (branch) => branch.name, (branch) => `${branch.address || no} · ${branch.phone || no}`, {
            deleteLabel: "Удалить",
          })}
        `, "Филиалы — это отдельные точки или локации организации.")}
      </div>

      <div id="departments" data-permission="settings.departments.view">
        ${section("Подразделения", `
          <form class="inline-form compact" data-department-create data-permission="settings.departments.create">
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал")}
            <label><span>Название</span><input name="name" required></label>
            <button class="primary" disabled>Добавить Подразделение</button>
            <p data-message></p>
          </form>
          <form class="inline-form compact">
            ${departmentFilterOptions(branches, departmentFilterBranchId)}
          </form>
          ${entityList(filteredDepartments, "Подразделениеов пока нет", "department", (item) => item.name, (item) => `Филиал: ${nameById(branches, item.branch_id)}`, {
            deleteLabel: "Удалить",
          })}
        `, "Подразделения — это отделы внутри филиала, например администрация или мастера.")}
      </div>

      <div id="workplaces" data-permission="settings.workplaces.view">
        ${section("Рабочие места", `
          <form class="inline-form compact" data-workplace-create data-permission="settings.workplaces.create">
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал")}
            <label><span>Подразделение</span><select name="department_id" disabled>${workplaceDepartmentOptions()}</select></label>
            <label><span>Название</span><input name="name" required></label>
            <button class="primary" disabled>Добавить рабочее место</button>
            <p data-message></p>
          </form>
          <form class="inline-form compact">
            ${workplaceFilterOptions(branches, workplaceFilterBranchId)}
          </form>
          ${entityList(filteredWorkplaces, "Рабочих мест пока нет", "workplace", (item) => item.name, (item) => `${nameById(branches, item.branch_id)} · ${nameById(departments, item.department_id)}`, {
            deleteLabel: "Удалить",
          })}
        `, "Рабочие места — это конкретные места оказания услуг внутри подразделений.")}
      </div>

      <div id="roles-rights" data-permission="settings.roles.manage">
        ${section("Роли и права", `
          <form class="inline-form compact" data-role-create>
            <label><span>Роль</span><input name="name" required placeholder="собственник / администратор / мастер"></label>
            <button class="primary" disabled>Создать роль</button>
            <p data-message></p>
          </form>
          ${section("Список ролей", `
            ${entityList(roles, "Ролей пока нет", "role", (role) => role.name, () => "", {
              deleteLabel: "Удалить",
            })}
          `, "Список ролей показывает созданные роли и их права доступа.")}
        `, "Роли и права определяют, что пользователи могут видеть и изменять.")}
      </div>

      <div id="users" data-permission="settings.users.view">
        ${section("Пользователи и доступ", `
          <form class="inline-form compact" data-user-create data-permission="settings.users.create">
            <label><span>Имя</span><input name="first_name" required></label>
            <label><span>Отчество</span><input name="middle_name"></label>
            <label><span>Фамилия</span><input name="last_name"></label>
            <label><span>Телефон</span><input name="phone"></label>
            <label><span>Email</span><input name="email"></label>
            <label><span>Пароль/хеш</span><input name="password" type="password" required></label>
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал")}
            <label><span>Подразделение</span><select name="department_id" disabled>${workplaceDepartmentOptions()}</select></label>
            <label><span>Роль</span><select name="role_id" disabled>
              <option value="">Не выбрано</option>
              ${roles.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}
            </select></label>
            <label><span>Рабочее место</span><select name="workplace_id" disabled>${userWorkplaceOptions()}</select></label>
            <button class="primary" disabled>Создать пользователя</button>
            <p data-message></p>
          </form>

          <form class="inline-form compact" data-user-access-create data-permission="settings.users.assign_roles">
            ${selectField("Пользователь", "user_id", users.map((user) => ({ id: user.id, name: [user.last_name, user.first_name, user.middle_name, user.email, user.phone].filter(Boolean).join(" ") || `#${user.id}` })), "", "Выберите пользователя")}
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал")}
            <label><span>Подразделение</span><select name="department_id" disabled>${workplaceDepartmentOptions()}</select></label>
            <label><span>Роль</span><select name="role_id" disabled>
              <option value="">Выберите роль</option>
              ${roles.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}
            </select></label>
            <button class="primary" disabled>Выдать доступ</button>
            <p data-message></p>
          </form>

          ${entityList(users, "Пользователей пока нет", "user", (user) => [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ") || `#${user.id}`, (user) => {
              const membership = memberships.find((item) => item.user_id === user.id);
              const status = user.is_blocked ? "заблокирован" : user.is_active ? "активен" : "неактивен";
              return `${[user.phone, user.email].filter(Boolean).join(" / ") || no} · ${nameById(roles, membership?.role_id)} · ${status}`;
            }, {
              deleteType: "userAccess",
              deleteId: (user) => user.id,
              deleteLabel: "Удалить",
            })}
        `, "Пользователи и доступ — это сотрудники и их роли в организации или филиалах.")}
      </div>

      <div id="audit" data-permission="settings.audit.view">
        ${section("Аудит и события", `
          <table><thead><tr><th>Действие</th><th>Сущность</th><th>Детали</th><th>Дата и время</th></tr></thead><tbody>
            ${rows(auditLogs, "Записей аудита пока нет", (item) => `
              <tr>
                <td>${escapeHtml(humanizeCode(item.action))}</td>
                <td>${escapeHtml(humanizeCode(item.entity_type || item.entity))}</td>
                <td>${escapeHtml(auditDetails(item))}</td>
                <td>${escapeHtml(formatDateTime(item.created_at))}</td>
              </tr>
            `)}
          </tbody></table>
        `, "Аудит и события показывает важные действия и изменения в системе.")}
      </div>

      <div id="events" data-permission="settings.events.view">
        ${section("События", `
          <table><thead><tr><th>Событие</th><th>Сущность</th><th>Детали</th><th>Дата и время</th></tr></thead><tbody>
            ${rows(events, "Событий пока нет", (item) => `
              <tr>
                <td>${escapeHtml(humanizeCode(item.event_type || item.event_name || item.name))}</td>
                <td>${eventEntityCell(item)}</td>
                <td>${escapeHtml(eventDetails(item))}</td>
                <td>${escapeHtml(formatDateTime(item.created_at))}</td>
              </tr>
            `)}
          </tbody></table>
        `, "События — это системные записи о произошедших действиях.")}
      </div>
      ${eventVisitModal()}
    </section>
  `;
}

export function bindSettings(root, ctx) {
  syncRequiredPanelForms(root);

  root.addEventListener("input", (event) => {
    if (event.target.closest("[data-settings] form:not([data-entity-edit])")) {
      syncRequiredPanelForms(root);
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-department-filter-branch]")) {
      departmentFilterBranchId = event.target.value || "";
      ctx.reload();
      return;
    }
    if (event.target.matches("[data-workplace-filter-branch]")) {
      workplaceFilterBranchId = event.target.value || "";
      ctx.reload();
      return;
    }
    if (event.target.matches("[data-product-filter-category]")) {
      productFilterCategoryId = event.target.value || "";
      ctx.reload();
      return;
    }
    if (event.target.matches("[data-service-filter-category]")) {
      serviceFilterCategoryId = event.target.value || "";
      ctx.reload();
      return;
    }
    if (event.target.matches('[name="vat_enabled"]')) {
      syncVatFields(event.target);
      syncRequiredPanelForms(root);
    }
    if (event.target.closest("[data-workplace-create]") && event.target.matches('[name="branch_id"]')) {
      syncWorkplaceForm(event.target);
      syncRequiredPanelForms(root);
    }
    if (event.target.closest("[data-user-create]") && event.target.matches('[name="branch_id"]')) {
      syncUserDepartmentForm(event.target);
      syncRequiredPanelForms(root);
    }
    if (event.target.closest("[data-user-create]") && event.target.matches('[name="department_id"]')) {
      syncUserDepartmentForm(event.target);
      syncRequiredPanelForms(root);
    }
    if (event.target.closest("[data-user-access-create]") && event.target.matches('[name="branch_id"]')) {
      syncUserDepartmentForm(event.target);
      syncRequiredPanelForms(root);
    }
    if (event.target.closest("[data-user-access-create]") && event.target.matches('[name="department_id"]')) {
      syncUserDepartmentForm(event.target);
      syncRequiredPanelForms(root);
    }
    if (event.target.matches('[name="condition_parameter"]')) {
      syncAchievementConditionValueField(event.target);
      syncRequiredPanelForms(root);
    }
    if (event.target.closest("[data-settings] form:not([data-entity-edit])")) {
      syncRequiredPanelForms(root);
    }
  });

  root.querySelectorAll("[data-workplace-create]").forEach((form) => syncWorkplaceForm(form));
  root.querySelectorAll("[data-user-create]").forEach((form) => syncUserDepartmentForm(form));
  root.querySelectorAll("[data-user-access-create]").forEach((form) => syncUserDepartmentForm(form));
  syncRequiredPanelForms(root);

  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-settings] form");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");

    try {
      validateRequiredPanelForm(form);
      if (!form.reportValidity()) return;
      const data = formData(form);
      if (form.matches("[data-brand-create]")) {
        await api.createBrand({ organization_id: ctx.org.id, name: data.name });
      } else if (form.matches("[data-legal-create]")) {
        await api.createLegalEntity({
          organization_id: ctx.org.id,
          name: data.name,
          legal_type: optional(data.legal_type),
          tax_system: optional(data.tax_system),
          requisites: legalRequisites(data),
          bank_details: bankDetails(data),
        });
      } else if (form.matches("[data-category-create]")) {
        if (!api.createProductCategory) throw new Error("API категорий не подключен.");
        await api.createProductCategory({
          organization_id: ctx.org.id,
          name: data.name,
          type: data.type,
        });
      } else if (form.matches("[data-product-item-create]")) {
        if (!api.createProductItem) throw new Error("API товаров и услуг не подключен.");
        await api.createProductItem({
          organization_id: ctx.org.id,
          category_id: Number(data.category_id),
          title: data.title,
          price: numberOrNull(data.price),
          comment: optional(data.comment),
          active: data.active === "true",
        });
      } else if (form.matches("[data-achievement-create]")) {
        if (!api.createAchievement) throw new Error("API достижений не подключен.");
        await api.createAchievement({
          organization_id: ctx.org.id,
          ...achievementPayload(data, form),
        });
      } else if (form.matches("[data-branch-create]")) {
        await api.createBranch({
          organization_id: ctx.org.id,
          name: data.name,
          address: optional(data.address),
          phone: optional(data.phone),
          timezone: optional(data.timezone) || "Europe/Moscow",
          brand_id: numberOrNull(data.brand_id),
          legal_entity_id: numberOrNull(data.legal_entity_id),
          online_booking_enabled: data.online_booking_enabled === "on",
        });
      } else if (form.matches("[data-department-create]")) {
        await api.createDepartment({
          organization_id: ctx.org.id,
          branch_id: Number(data.branch_id),
          name: data.name,
        });
      } else if (form.matches("[data-workplace-create]")) {
        if (!data.branch_id) throw new Error("Сначала выберите филиал.");
        await api.createWorkplace({
          organization_id: ctx.org.id,
          branch_id: Number(data.branch_id),
          department_id: numberOrNull(data.department_id),
          name: data.name,
        });
      } else if (form.matches("[data-user-create]")) {
        if (!data.department_id) throw new Error("Сначала выберите подразделение.");
        if (!data.workplace_id) throw new Error("Сначала выберите рабочее место.");
        const created = await api.createUser({
          first_name: data.first_name,
          middle_name: optional(data.middle_name),
          last_name: optional(data.last_name),
          phone: optional(data.phone),
          email: optional(data.email),
          password_hash: data.password,
        });
        if (data.role_id) {
          await api.assignUser({
            user_id: created.id,
            organization_id: ctx.org.id,
            role_id: Number(data.role_id),
          });
        }
        if (data.branch_id && data.role_id) {
          await api.assignUserToBranch({
            organization_id: ctx.org.id,
            user_id: created.id,
            branch_id: Number(data.branch_id),
            department_id: numberOrNull(data.department_id),
            workplace_id: numberOrNull(data.workplace_id),
            role_id: Number(data.role_id),
          });
        }
      } else if (form.matches("[data-role-create]")) {
        await api.createRole({ organization_id: ctx.org.id, name: data.name });
      } else if (form.matches("[data-user-access-create]")) {
        if (!data.user_id) throw new Error("Сначала выберите пользователя.");
        if (!data.branch_id) throw new Error("Сначала выберите филиал.");
        if (!data.department_id) throw new Error("Сначала выберите подразделение.");
        if (!data.role_id) throw new Error("Сначала выберите роль.");
        await api.assignUserToBranch({
          organization_id: ctx.org.id,
          user_id: Number(data.user_id),
          branch_id: Number(data.branch_id),
          department_id: numberOrNull(data.department_id),
          role_id: Number(data.role_id),
        });
      }
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });

  root.addEventListener("click", async (event) => {
    if (handleAchievementConditionClick(event, root)) return;
    if (handleProductAmountClick(event, root)) return;

    const openVisitButton = event.target.closest("[data-open-event-visit]");
    if (openVisitButton) {
      selectedEventVisit = (cache.events || []).find((item) => String(item.id) === String(openVisitButton.dataset.openEventVisit)) || null;
      ctx.reload();
      return;
    }

    const closeVisitButton = event.target.closest("[data-close-event-visit]");
    if (closeVisitButton) {
      selectedEventVisit = null;
      ctx.reload();
      return;
    }

    const editButton = event.target.closest("[data-edit-entity]");
    if (editButton) {
      const item = findEntity(editButton.dataset.editEntity, editButton.dataset.id);
      if (item) openEntityModal(editButton.dataset.editEntity, item);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-entity]");
    if (!deleteButton) return;
    const type = deleteButton.dataset.deleteEntity;
    const labels = {
      legal: "Удалить юридическое лицо?",
      category: "Удалить категорию?",
      productItem: "Удалить товар или услугу?",
      achievement: "Удалить достижение?",
      branch: "Удалить филиал?",
      department: "Удалить подразделение?",
      workplace: "Удалить рабочее место?",
      role: "Удалить роль?",
      permission: "Удалить право доступа?",
      userAccess: "Удалить доступ пользователя к организации?",
      branchMembership: "Удалить доступ пользователя к филиалу?",
    };
    if (!confirm(labels[type] || "Удалить запись?")) return;
    try {
      await deleteEntity(type, deleteButton.dataset.id);
      ctx.reload();
    } catch (error) {
      alert(error.message);
    }
  });

  document.addEventListener("click", (event) => {
    if (handleAchievementConditionClick(event)) return;
    if (handleProductAmountClick(event)) return;

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      closeButton.closest("[data-settings-modal]")?.remove();
    }
  });

  document.addEventListener("mousedown", (event) => {
    if (event.target.matches("[data-event-visit-modal]")) {
      selectedEventVisit = null;
      ctx.reload();
      return;
    }
    if (!event.target.closest("[data-branch-achievement-select]")) {
      document.querySelectorAll("[data-branch-achievement-select] details[open]").forEach((item) => {
        item.removeAttribute("open");
      });
    }
    if (!event.target.closest("[data-service-staff-select]")) {
      document.querySelectorAll("[data-service-staff-select] details[open]").forEach((item) => {
        item.removeAttribute("open");
      });
    }
    if (!event.target.closest("[data-branch-product-item-select]")) {
      document.querySelectorAll("[data-branch-product-item-select] details[open]").forEach((item) => {
        item.removeAttribute("open");
      });
    }
    if (event.target.matches("[data-settings-modal]")) {
      event.target.remove();
    }
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-entity-edit]");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");
    try {
      const payload = formData(form);
      if (form.dataset.type === "role") {
        payload.permission_codes = new FormData(form).getAll("permission_codes");
      }
      if (form.dataset.type === "productItem") {
        payload.staff_user_ids = new FormData(form).getAll("staff_user_ids");
      }
      if (form.dataset.type === "branch") {
        payload.product_item_ids = [
          ...new FormData(form).getAll("branch_service_item_ids"),
          ...new FormData(form).getAll("branch_product_item_ids"),
        ]
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id));
        payload.achievement_ids = new FormData(form)
          .getAll("branch_achievement_ids")
          .map((id) => Number(id))
          .filter((id) => Number.isFinite(id));
      }
      await saveEntity(form.dataset.type, form.dataset.id, payload, form);
      form.closest("[data-settings-modal]")?.remove();
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches('[name="vat_enabled"]')) {
      syncVatFields(event.target);
    }
    if (event.target.matches('[name="condition_parameter"]')) {
      syncAchievementConditionValueField(event.target);
    }
    if (event.target.matches('[name="branch_achievement_ids"]')) {
      syncBranchAchievementSummary(event.target);
    }
    if (event.target.matches('[name="staff_user_ids"]')) {
      syncServiceStaffSummary(event.target);
    }
    if (event.target.matches('[name="branch_service_item_ids"], [name="branch_product_item_ids"]')) {
      syncBranchProductItemSummary(event.target);
    }
  });
}
