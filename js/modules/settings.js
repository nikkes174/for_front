import { api } from "../api.js";
import { escapeHtml, formData, numberOrNull, optional, rows, selectField, setMessage } from "../dom.js";
import { branchDateTimeToUtc, dateTimeInputInTimezone, formatDateTimeInTimezone } from "../timezone.js";
import { openExternalClientCard } from "./clients.js";


const no = "Не указано";
let cache = {};
const productExcelPreviewState = new WeakMap();
let selectedEventVisit = null;
let departmentFilterBranchId = "";
let workplaceFilterBranchId = "";
let productFilterCategoryId = "";
let serviceFilterCategoryId = "";
let productSearchQuery = "";
let serviceSearchQuery = "";
let userFilterBranchId = "";
let userFilterRoleId = "";
let userFilterDepartmentId = "";
let userFilterWorkplaceId = "";
let userSearchQuery = "";
let userHideInactive = false;
let userPage = 1;
let auditPage = 1;
let eventsPage = 1;
let auditPageSize = 10;
let eventsPageSize = 10;
let eventTypeFilters = new Set();
const USER_PAGE_SIZE = 20;
const LOG_PAGE_SIZE_OPTIONS = [10, 20, 50];
const SETTINGS_TABS = [
  { slug: "legal", label: "Юр лица", permissions: ["settings.legal.view", "settings.legal.create"] },
  { slug: "org", label: "Организации", permissions: ["settings.org.view", "settings.org.create"] },
  { slug: "branches", label: "Филиалы", permissions: ["settings.branches.view", "settings.branches.create"] },
  { slug: "departments", label: "Подразделения", permissions: ["settings.departments.view", "settings.departments.create"] },
  { slug: "workplaces", label: "Рабочие места", permissions: ["settings.workplaces.view", "settings.workplaces.create"] },
  { slug: "roles", label: "Роли и права", permissions: ["settings.roles.manage"] },
  { slug: "users", label: "Пользователи", permissions: ["settings.users.view", "settings.users.create", "settings.users.assign_roles"] },
  { slug: "logs", label: "Логи работы", permissions: ["settings.audit.view", "settings.events.view"] },
  { slug: "bots", label: "Боты", permissions: ["settings.bots.view"] },
];
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
  { value: "level_transition", label: "Переход на уровень" },
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
const YCLIENTS_TERMINAL_NAMES = {
  1061332: "Республики",
  435801: "Газовиков",
  505058: "Видный",
};
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
  return items.find((item) => String(item.id) === String(id))?.name || id || no;
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

function achievementConditionControls(condition = {}) {
  if (condition.parameter === "level_transition") {
    return `<span data-achievement-condition-controls>
      <input type="hidden" name="condition_operator" value="eq">
      ${selectField("Уровень", "condition_value", (cache.bonusLevels || []).map((level) => ({ value: level.name, label: level.name })), condition.value || cache.bonusLevels?.[0]?.name || "", "Выберите уровень")}
    </span>`;
  }
  return `<span data-achievement-condition-controls>
    <label><span>Оператор</span><select name="condition_operator" required>
      ${ACHIEVEMENT_OPERATOR_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}" ${condition.operator === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
    </select></label>
    ${achievementValueField(condition)}
  </span>`;
}

function achievementConditionRow(condition = {}) {
  return `
    <div class="achievement-condition-row" data-achievement-condition-row>
      <label><span>Параметр</span><select name="condition_parameter" required>
        ${ACHIEVEMENT_PARAMETER_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}" ${condition.parameter === item.value ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
      </select></label>
      ${achievementConditionControls(condition)}
      <button type="button" class="client-delete-icon-button" data-remove-achievement-condition aria-label="Delete" title="Delete"><img src="/fronted/icons/basket.svg" alt=""></button>
    </div>
  `;
}

function achievementConditionsFields(conditions = [], includeAddButton = true) {
  const rows = conditions.length ? conditions : [{}];
  return `
    <div class="achievement-builder modal-full">
      <div class="achievement-builder-head">
        <b>Условия</b>
        ${includeAddButton ? `<button type="button" class="ghost btn-ghost-secondary" data-add-achievement-condition>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0443\u0441\u043b\u043e\u0432\u0438\u0435</button>` : ""}
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
    notification_enabled: formObject?.has("notification_enabled") ? formObject.get("notification_enabled") === "on" : true,
    notification_channel: formObject?.get("notification_channel") || "application",
  };
}

function achievementDetails(item) {
  const separator = ` ${achievementLogicLabel(item.logic)} `;
  return (item.conditions || [])
    .map((condition) => condition.parameter === "level_transition"
      ? `${achievementParameterLabel(condition.parameter)} ${condition.value}`
      : `${achievementParameterLabel(condition.parameter)} ${achievementOperatorLabel(condition.operator)} ${condition.value}`)
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
  const controls = row.querySelector("[data-achievement-condition-controls]");
  if (!controls) return;
  controls.outerHTML = achievementConditionControls({
    parameter: control.value,
    value: control.value === "level_transition" ? cache.bonusLevels?.[0]?.name || "" : "",
  });
}

function achievementPhotoUrl(item) {
  if (!item?.id || !item.photo_file_id) return "";
  const version = item.updated_at ? encodeURIComponent(item.updated_at) : encodeURIComponent(item.photo_file_id);
  return `/organizations/achievements/${item.id}/photo?v=${version}`;
}

function achievementPhotoField(item) {
  const photoUrl = achievementPhotoUrl(item);
  return `
    <div class="achievement-photo-field">
      <label class="photo-upload-control">
        <input name="photo_file" type="file" accept="image/*" hidden>
        <span class="photo-upload-button">${photoUrl ? "Заменить фото" : "Добавить фото"}</span>
      </label>
      ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="Фото достижения" class="achievement-photo-preview">` : ""}
    </div>
  `;
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

function syncProductBranchSummary(control) {
  const root = control.closest("[data-product-branch-select]");
  if (!root) return;
  const all = root.querySelector('[name="product_branch_all"]');
  const branches = [...root.querySelectorAll('[name="product_branch_ids"]')];
  const checked = branches.filter((input) => input.checked);
  if (all) all.checked = branches.length > 0 && checked.length === branches.length;
  const summary = root.querySelector("[data-product-branch-summary]");
  if (!summary) return;
  const names = checked
    .map((input) => input.closest("label")?.textContent?.trim())
    .filter(Boolean);
  summary.textContent = names.length
    ? names.length > 2
      ? `Выбрано: ${names.length}`
      : names.join(", ")
    : "Не выбрано";
}

function productItemDetails(item) {
  const category = (cache.categories || []).find((categoryItem) => String(categoryItem.id) === String(item.category_id));
  const categoryLabel = category ? `${category.name} (${categoryTypeLabel(category.type)})` : no;
  const price = item.price === null || item.price === undefined ? no : item.price;
  return `${categoryLabel} · Цена: ${price} · ${item.active ? "активен" : "неактивен"}`;
}

function catalogItemListMarkup(itemType) {
  const isService = itemType === "service";
  const selectedCategoryId = isService ? serviceFilterCategoryId : productFilterCategoryId;
  const searchQuery = (isService ? serviceSearchQuery : productSearchQuery).trim().toLowerCase();
  const items = (cache.productItems || [])
    .filter((item) => categoryTypeById(item.category_id) === itemType)
    .filter((item) => !selectedCategoryId || String(item.category_id) === String(selectedCategoryId))
    .filter((item) => !searchQuery || `${item.title || ""} ${productItemDetails(item)}`.toLowerCase().includes(searchQuery));
  return entityList(items, searchQuery ? "Ничего не найдено" : (isService ? "Услуг пока нет" : "Товаров пока нет"), "productItem", (item) => item.title, productItemDetails, {
    deleteIcon: true,
    deleteLabel: "Удалить",
  });
}

function productItemCategory(item) {
  return (cache.categories || []).find((category) => String(category.id) === String(item.category_id));
}

function categoryTypeById(categoryId) {
  return (cache.categories || []).find((category) => String(category.id) === String(categoryId))?.type;
}

function branchWorkScheduleFields(schedule = {}) {
  const slotInterval = Math.max(1, Number(schedule?.slot_interval_minutes) || 30);
  return `
    <label><span>Работа с</span><input name="work_schedule_from" type="time" value="${escapeHtml(schedule?.from || "")}"></label>
    <label><span>Работа до</span><input name="work_schedule_to" type="time" value="${escapeHtml(schedule?.to || "")}"></label>
    <label><span>Обед с</span><input name="work_schedule_lunch_from" type="time" value="${escapeHtml(schedule?.lunch_from || "")}"></label>
    <label><span>Обед до</span><input name="work_schedule_lunch_to" type="time" value="${escapeHtml(schedule?.lunch_to || "")}"></label>
    <label><span>Интервал онлайн-записи, минут</span><input name="work_schedule_slot_interval_minutes" type="number" min="1" max="1440" step="1" value="${slotInterval}"></label>
  `;
}

function branchWorkSchedulePayload(data) {
  const from = optional(data.work_schedule_from);
  const to = optional(data.work_schedule_to);
  const lunchFrom = optional(data.work_schedule_lunch_from);
  const lunchTo = optional(data.work_schedule_lunch_to);
  const slotIntervalMinutes = Math.max(1, Math.min(1440, Number(data.work_schedule_slot_interval_minutes) || 30));
  return from || to || lunchFrom || lunchTo || slotIntervalMinutes
    ? { from, to, lunch_from: lunchFrom, lunch_to: lunchTo, slot_interval_minutes: slotIntervalMinutes }
    : null;
}

function productItemStaffFields(item) {
  const users = cache.users || [];
  if (!users.length) return "";
  const pairsByMaster = new Map((item.master_services || []).map((pair) => [String(pair.master_id), pair]));
  const selectedMasterIds = new Set([
    ...pairsByMaster.keys(),
    ...(item.staff || []).map((staff) => String(staff.id)),
  ]);
  return `
    <div class="service-staff-editor modal-full" data-service-staff-editor>
      <div class="service-staff-editor-head">
        <strong>Сотрудники, оказывающие услугу</strong>
        <div class="service-staff-editor-actions">
          <label class="service-staff-filter"><input type="checkbox" data-select-all-service-staff ${users.length && users.every((user) => selectedMasterIds.has(String(user.id))) ? "checked" : ""}> <span>Выбрать всех</span></label>
          <label class="service-staff-filter"><input type="checkbox" data-hide-inactive-service-staff> <span>Скрыть неактивных</span></label>
        </div>
      </div>
      <div class="service-staff-table-wrap">
        <table class="service-staff-table app-table">
          <thead><tr><th>Оказывает услугу</th><th>Сотрудник</th><th>Цена от</th><th>Цена до</th><th>Длительность</th><th>Тех. перерыв, мин</th></tr></thead>
          <tbody data-service-staff-grid>
            ${users.map((user) => serviceStaffRow(user, pairsByMaster.get(String(user.id)), item, selectedMasterIds.has(String(user.id)))).join("")}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function userPhotoField(item) {
  const photoUrl = item?.id && item.photo_file_id ? `/users-access/users/${item.id}/photo?v=${encodeURIComponent(item.updated_at || item.photo_file_id)}` : "";
  const initials = [item?.first_name, item?.last_name].filter(Boolean).map((part) => String(part).trim().charAt(0)).join("").slice(0, 2).toUpperCase() || "П";
  return `
    <div class="user-photo-field">
      <div class="user-profile-avatar" data-user-photo-preview>${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="Фото пользователя">` : `<span>${escapeHtml(initials)}</span>`}</div>
      <label class="photo-upload-control">
        <input name="user_photo_file" type="file" accept="image/*" hidden>
        <span class="photo-upload-button">${photoUrl ? "Заменить фото" : "Добавить фото"}</span>
      </label>
    </div>
  `;
}

function userBookingBlockRow(block = {}) {
  return `
    <div class="user-booking-block-row" data-user-booking-block>
      <label><span>Дата с</span><input type="date" data-booking-block-date-from value="${escapeHtml(block.date_from || "")}"></label>
      <label><span>Дата по</span><input type="date" data-booking-block-date-to value="${escapeHtml(block.date_to || block.date_from || "")}"></label>
      <label><span>Время с</span><input type="time" data-booking-block-time-from value="${escapeHtml(block.time_from || "")}"></label>
      <label><span>Время по</span><input type="time" data-booking-block-time-to value="${escapeHtml(block.time_to || "")}"></label>
      <button type="button" class="client-delete-icon-button" data-remove-user-booking-block aria-label="Удалить" title="Удалить"><img src="/fronted/icons/basket.svg" alt=""></button>
    </div>
  `;
}

function userBookingBlocksField(item) {
  const blocks = (Array.isArray(item.booking_blocks) ? item.booking_blocks : [])
    .filter((block) => block.organization_id == null || String(block.organization_id) === String(cache.organizationId));
  return `
    <div class="user-profile-section">
      <h5>Перекрыть запись</h5>
      <p class="user-booking-block-hint">Время можно не указывать: тогда запись будет перекрыта на весь выбранный день или период.</p>
      <div class="user-booking-blocks" data-user-booking-blocks>
        ${blocks.map((block) => userBookingBlockRow(block)).join("")}
      </div>
      <button type="button" class="ghost user-booking-block-add btn-ghost-secondary" data-add-user-booking-block>Добавить период</button>
    </div>
  `;
}

function userBookingBlocksPayload(form) {
  return [...form.querySelectorAll("[data-user-booking-block]")].map((row) => {
    const dateFrom = row.querySelector("[data-booking-block-date-from]")?.value || "";
    const dateTo = row.querySelector("[data-booking-block-date-to]")?.value || dateFrom;
    const timeFrom = row.querySelector("[data-booking-block-time-from]")?.value || "";
    const timeTo = row.querySelector("[data-booking-block-time-to]")?.value || "";
    if (!dateFrom) throw new Error("Заполните дату перекрытия записи.");
    if (dateTo < dateFrom) throw new Error("Дата окончания перекрытия не может быть раньше даты начала.");
    if (Boolean(timeFrom) !== Boolean(timeTo)) throw new Error("Укажите оба значения времени или оставьте оба поля пустыми.");
    if (timeFrom && timeTo && timeTo <= timeFrom) throw new Error("Время окончания перекрытия должно быть позже времени начала.");
    return { organization_id: Number(cache.organizationId), date_from: dateFrom, date_to: dateTo, time_from: timeFrom, time_to: timeTo };
  });
}

function serviceStaffRow(user, pair = {}, item = {}, enabled = false) {
  const durationSeconds = Number(pair?.service_duration || 0);
  const durationHours = Math.floor(durationSeconds / 3600);
  const durationMinutes = Math.floor((durationSeconds % 3600) / 60);
  const defaultDurationSeconds = Number(item.seance_length || 0);
  const defaultDurationHours = Math.floor(defaultDurationSeconds / 3600);
  const defaultDurationMinutes = Math.floor((defaultDurationSeconds % 3600) / 60);
  const technicalBreakMinutes = Math.floor(Number(pair?.technical_break_duration ?? 0) / 60);
  const disabled = enabled ? "" : " disabled";
  return `<tr class="service-staff-row${enabled ? "" : " is-disabled"}" data-master-service-row data-pair-id="${escapeHtml(pair?.id || "")}" data-master-id="${escapeHtml(user.id)}">
    <td><label class="service-staff-enabled"><input type="checkbox" data-master-service-enabled ${enabled ? "checked" : ""}> <span>Активен</span></label></td>
    <td><strong>${escapeHtml(userLabelById(user.id))}</strong></td>
    <td><input name="master_price_min" aria-label="Цена от для ${escapeHtml(userLabelById(user.id))}" type="number" step="0.01" min="0" placeholder="${escapeHtml(item.price ?? "не указана")}" value="${escapeHtml(pair?.price_min ?? "")}"${disabled}></td>
    <td><input name="master_price_max" aria-label="Цена до для ${escapeHtml(userLabelById(user.id))}" type="number" step="0.01" min="0" placeholder="${escapeHtml(item.price ?? "не указана")}" value="${escapeHtml(pair?.price_max ?? "")}"${disabled}></td>
    <td><span class="service-duration-inputs"><input name="master_service_duration_hours" aria-label="Часы длительности для ${escapeHtml(userLabelById(user.id))}" type="number" min="0" step="1" placeholder="${escapeHtml(defaultDurationHours)}" value="${durationSeconds ? escapeHtml(durationHours) : ""}"${disabled}><i>ч</i><input name="master_service_duration_minutes" aria-label="Минуты длительности для ${escapeHtml(userLabelById(user.id))}" type="number" min="0" max="59" step="1" placeholder="${escapeHtml(defaultDurationMinutes)}" value="${durationSeconds ? escapeHtml(durationMinutes) : ""}"${disabled}><i>мин</i></span></td>
    <td><input name="master_technical_break_minutes" aria-label="Технический перерыв для ${escapeHtml(userLabelById(user.id))}" type="number" step="1" min="0" value="${escapeHtml(technicalBreakMinutes)}" required${disabled}></td>
  </tr>`;
}

function serviceStaffPayload(form) {
  return [...form.querySelectorAll("[data-master-service-row]")]
    .filter((row) => row.querySelector("[data-master-service-enabled]")?.checked)
    .map((row) => ({ id: Number(row.dataset.masterId) }));
}

function syncServiceStaffRow(row) {
  if (!row) return;
  const enabled = Boolean(row.querySelector("[data-master-service-enabled]")?.checked);
  row.classList.toggle("is-disabled", !enabled);
  row.querySelectorAll("input:not([data-master-service-enabled])").forEach((input) => {
    input.disabled = !enabled;
  });
  const hideInactive = row.closest("[data-service-staff-editor]")?.querySelector("[data-hide-inactive-service-staff]")?.checked;
  row.hidden = Boolean(hideInactive && !enabled);
}

function syncServiceStaffTable(editor) {
  editor?.querySelectorAll("[data-master-service-row]").forEach(syncServiceStaffRow);
  const selectAll = editor?.querySelector("[data-select-all-service-staff]");
  const toggles = [...(editor?.querySelectorAll("[data-master-service-enabled]") || [])];
  if (selectAll) {
    selectAll.checked = Boolean(toggles.length && toggles.every((input) => input.checked));
    selectAll.indeterminate = Boolean(toggles.some((input) => input.checked) && !selectAll.checked);
  }
}

function masterServicePayload(form) {
  return [...form.querySelectorAll("[data-master-service-row]")]
    .filter((row) => row.querySelector("[data-master-service-enabled]")?.checked)
    .map((row) => ({
    pairId: Number(row.dataset.pairId) || null,
    master_id: Number(row.dataset.masterId),
    price_min: numberOrNull(row.querySelector('[name="master_price_min"]')?.value),
    price_max: numberOrNull(row.querySelector('[name="master_price_max"]')?.value),
    service_duration: (Number(row.querySelector('[name="master_service_duration_hours"]')?.value || 0) * 3600)
      + (Number(row.querySelector('[name="master_service_duration_minutes"]')?.value || 0) * 60),
    technical_break_duration: Number(row.querySelector('[name="master_technical_break_minutes"]')?.value || 0) * 60,
  }));
}

function serviceImageEntries(item) {
  const images = item.image_group?.images || {};
  const album = Array.isArray(images.album) ? images.album.filter((image) => image?.path) : [];
  if (album.length) return album;
  return images.basic?.path ? [{ path: images.basic.path }] : [];
}

function serviceImageAlbumField(item) {
  const images = serviceImageEntries(item);
  return `<div class="service-image-album modal-full" data-service-image-album data-existing-images-count="${images.length}">
    <div class="service-image-album-head"><strong>Изображения услуги</strong><small>До 10 изображений</small></div>
    <label class="photo-upload-control">
      <input name="service_images" type="file" accept="image/*" multiple hidden>
      <span class="photo-upload-button">Добавить изображения</span>
    </label>
    <div class="service-image-previews" data-service-image-previews>
      ${images.map((image) => `<figure class="service-image-preview" data-service-image-id="${escapeHtml(image.id || "")}"><img src="${escapeHtml(image.path)}" alt="Изображение услуги">${image.id ? `<button type="button" class="client-delete-icon-button" data-remove-service-image data-image-id="${escapeHtml(image.id)}" aria-label="Удалить" title="Удалить"><img src="/fronted/icons/basket.svg" alt=""></button>` : ""}</figure>`).join("")}
    </div>
  </div>`;
}

function productItemActualAmountRow(item = {}) {
  return `
    <div class="achievement-condition-row" data-product-amount-row>
      <label><span>ID склада</span><input name="actual_amount_storage_id" type="number" step="1" min="0" value="${escapeHtml(item.storage_id ?? "")}"></label>
      <label><span>Количество</span><input name="actual_amount_value" type="number" step="0.01" min="0" value="${escapeHtml(item.amount ?? "")}"></label>
      <button type="button" class="client-delete-icon-button" data-remove-product-amount aria-label="Удалить" title="Удалить"><img src="/fronted/icons/basket.svg" alt=""></button>
    </div>
  `;
}

function productItemActualAmountsFields(items = []) {
  const rows = items.length ? items : [{}];
  return `
    <div class="achievement-builder modal-full">
      <div class="achievement-builder-head">
        <b>Остатки по складам</b>
      </div>
      <div class="achievement-conditions" data-product-amounts>
        ${rows.map((item) => productItemActualAmountRow(item)).join("")}
      </div>
      <button type="button" class="ghost product-add-amount btn-ghost-secondary" data-add-product-amount>Добавить склад</button>
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

async function syncProductItemBranchAvailability(productItemId, branchIds = []) {
  const selected = new Set(branchIds.map((id) => String(id)));
  const updates = (cache.branches || []).map((branch) => {
    const current = (branch.product_item_ids || []).map((id) => String(id));
    const hasItem = current.includes(String(productItemId));
    const shouldHaveItem = selected.has(String(branch.id));
    if (hasItem === shouldHaveItem) return null;
    const next = shouldHaveItem
      ? [...current, String(productItemId)]
      : current.filter((id) => id !== String(productItemId));
    return api.updateBranch(branch.id, {
      product_item_ids: next.map((id) => Number(id)).filter((id) => Number.isFinite(id)),
    });
  }).filter(Boolean);
  await Promise.all(updates);
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

function productBranchAvailabilityFields(item) {
  const branches = cache.branches || [];
  if (!branches.length) return "";
  const selected = new Set(branches
    .filter((branch) => (branch.product_item_ids || []).some((id) => String(id) === String(item.id)))
    .map((branch) => String(branch.id)));
  const selectedNames = branches
    .filter((branch) => selected.has(String(branch.id)))
    .map((branch) => branch.name);
  const summary = selectedNames.length
    ? selectedNames.length > 2
      ? `Выбрано: ${selectedNames.length}`
      : selectedNames.join(", ")
    : "Не выбрано";
  return `
    <div class="branch-multiselect modal-full" data-product-branch-select>
      <span>Доступность в филиалах</span>
      <details class="branch-multiselect-dropdown">
        <summary><span data-product-branch-summary>${escapeHtml(summary)}</span></summary>
        <div class="branch-multiselect-options">
          <label class="checkbox">
            <input type="checkbox" name="product_branch_all" ${selected.size === branches.length ? "checked" : ""}>
            Выбрать все филиалы
          </label>
          ${branches.map((branch) => `
            <label class="checkbox">
              <input type="checkbox" name="product_branch_ids" value="${escapeHtml(branch.id)}" ${selected.has(String(branch.id)) ? "checked" : ""}>
              ${escapeHtml(branch.name)}
            </label>
          `).join("")}
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
  const durationSeconds = Number(item.seance_length || 0);
  const durationHours = Math.floor(durationSeconds / 3600);
  const durationMinutes = Math.floor((durationSeconds % 3600) / 60);
  if (category?.type === "service") return `
    <label><span>Скидка</span><input name="discount" type="number" step="0.01" min="0" value="${escapeHtml(item.discount ?? "")}"></label>
    <label><span>Длительность</span><span class="service-duration-inputs"><input name="service_duration_hours" type="number" min="0" step="1" value="${escapeHtml(durationHours)}"><i>ч</i><input name="service_duration_minutes" type="number" min="0" max="59" step="1" value="${escapeHtml(durationMinutes)}"><i>мин</i></span></label>
    <label><span>Внешний ID</span><input name="api_id" value="${escapeHtml(item.api_id || "")}"></label>
    ${serviceImageAlbumField(item)}
    ${productItemStaffFields(item)}
    <label class="modal-full"><span>Комментарий</span><input name="comment" value="${escapeHtml(item.comment || "")}"></label>
  `;
  if (category?.type === "product") return `
    <label><span>Название в чеке</span><input name="receipt_title" value="${escapeHtml(item.receipt_title || "")}"></label>
    <label><span>Артикул</span><input name="sku" value="${escapeHtml(item.sku || "")}"></label>
    <label><span>Штрих-код</span><input name="barcode" value="${escapeHtml(item.barcode || "")}"></label>
    <label><span>Ед. продажи</span><input name="sale_unit" value="${escapeHtml(item.sale_unit || item.unit_short_title || "")}"></label>
    <label><span>Ед. списания</span><input name="writeoff_unit" value="${escapeHtml(item.writeoff_unit || item.service_unit_short_title || "")}"></label>
    <label><span>Коэффициент списания</span><input name="writeoff_ratio" type="number" step="0.001" min="0" value="${escapeHtml(item.writeoff_ratio ?? item.unit_equals ?? "")}"></label>
    <label><span>Масса нетто, гр.</span><input name="net_weight" type="number" step="0.01" min="0" value="${escapeHtml(item.net_weight ?? "")}"></label>
    <label><span>Масса брутто, гр.</span><input name="gross_weight" type="number" step="0.01" min="0" value="${escapeHtml(item.gross_weight ?? "")}"></label>
    <label><span>Себестоимость</span><input name="cost" type="number" step="0.01" min="0" value="${escapeHtml(item.cost ?? item.actual_cost ?? "")}"></label>
    <label><span>Критический остаток</span><input name="critical_stock" type="number" step="0.01" min="0" value="${escapeHtml(item.critical_stock ?? "")}"></label>
    <label><span>Желаемый остаток</span><input name="desired_stock" type="number" step="0.01" min="0" value="${escapeHtml(item.desired_stock ?? "")}"></label>
    <label><span>Редактирование только в сети</span><select name="network_editable"><option value="true" ${item.network_editable !== false ? "selected" : ""}>Да</option><option value="false" ${item.network_editable === false ? "selected" : ""}>Нет</option></select></label>
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
    complete: "Завершение",
    completed: "Завершение",
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
    "visit.completed": "Завершение визита",
    "visit.complete": "Завершение визита",
    "visit.cancelled": "Отмена визита",
    "referral.visit": "Визит реферала",
    "visit.cancel": "Отмена визита",
    visit_completed: "Завершение визита",
    visit_complete: "Завершение визита",
    visit_cancelled: "Отмена визита",
    visit_cancel: "Отмена визита",
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

function branchTimezone(branchId) {
  return (cache.branches || []).find((branch) => String(branch.id) === String(branchId))?.timezone || DEFAULT_TIMEZONE;
}

function formatVisitDateTime(value, branchId) {
  if (!value) return no;
  return formatDateTimeInTimezone(value, branchTimezone(branchId));
}

function dateTimeInput(value, branchId) {
  return dateTimeInputInTimezone(value, branchTimezone(branchId));
}

function timezoneOffsetLabel(timezone) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    return parts.find((part) => part.type === "timeZoneName")?.value?.replace("GMT", "UTC") || "UTC";
  } catch {
    return "UTC";
  }
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

function yclientsTerminalLabel(id) {
  const name = YCLIENTS_TERMINAL_NAMES[String(id)];
  return name || "";
}

function branchLabel(id) {
  if (!id) return no;
  return yclientsTerminalLabel(id) || nameById(cache.branches || [], id) || `#${id}`;
}

function eventBranchId(item, payload = {}) {
  return item.branch_id
    || payload.branch_id
    || payload.company_id
    || payload.yclients_company_id
    || payload.yclients_terminal_id
    || payload.terminal_id;
}

function clientEventButton(clientId, label) {
  const text = String(label || (clientId ? `#${clientId}` : no)).trim() || no;
  if (!clientId) return escapeHtml(text);
  return `<button type="button" class="ghost" data-open-settings-client="${escapeHtml(clientId)}">${escapeHtml(text)}</button>`;
}

function openClientUrl(ctx, clientId) {
  const params = new URLSearchParams();
  params.set("client_id", clientId);
  params.set("return_to", `${location.pathname}${location.hash || ""}`);
  return `/organizations/${ctx.org.id}/clients?${params.toString()}`;
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
  if (value.branch_id) fields.push(`Филиал: ${branchLabel(value.branch_id)}`);
  if (value.terminal_id) fields.push(`Терминал: ${yclientsTerminalLabel(value.terminal_id) || `#${value.terminal_id}`}`);
  if (value.yclients_terminal_id) fields.push(`Филиал: ${branchLabel(value.yclients_terminal_id)}`);
  if (value.company_id) fields.push(`Филиал: ${branchLabel(value.company_id)}`);
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

function auditDetailsHtml(item) {
  if (item.reason) return escapeHtml(item.reason);
  const value = item.new_value && typeof item.new_value === "object" ? item.new_value : item.old_value;
  if (!value || typeof value !== "object") return escapeHtml(auditDetails(item));
  if ((item.entity_type || item.entity) === "client_visit") {
    const clientId = item.client_id || value.client_id;
    const clientLabel = value.full_name || (clientId ? `#${clientId}` : no);
    const summary = String(value.summary || auditDetails(item)).replace(/\s+\u0434\u043b\u044f \u043a\u043b\u0438\u0435\u043d\u0442\u0430\s+.+$/i, "");
    return [
      `Клиент: ${clientEventButton(clientId, clientLabel)}`,
      `<button type="button" class="ghost" data-open-event-visit="audit:${escapeHtml(item.id)}">${escapeHtml(summary)}</button>`,
    ].join(" \u00b7 ");
  }
  const clientId = item.client_id || value.client_id || (item.entity_type === "client" ? item.entity_id : null);
  const details = compactDetails(value)
    .split(" · ")
    .filter((detail) => detail && !(clientId && detail.startsWith("Клиент:")));
  const fields = clientId
    ? [`Клиент: ${clientEventButton(clientId, value.full_name || (clientId ? `#${clientId}` : no))}`]
    : [];
  fields.push(...details.map((detail) => escapeHtml(detail)));
  return fields.join(" · ") || no;
}

function addDetail(fields, value) {
  if (!value || fields.includes(value)) return;
  fields.push(value);
}

function eventVisitDetails(item) {
  const payload = item.payload && typeof item.payload === "object" ? item.payload : {};
  const branchId = eventBranchId(item, payload);
  const fields = [];
  addDetail(fields, `Клиент: ${payload.full_name || (item.client_id ? `#${item.client_id}` : no)}`);
  addDetail(fields, `Статус: ${visitStatusLabel(payload.visit_status)}`);
  addDetail(fields, `Дата визита: ${formatVisitDateTime(payload.visit_at, branchId)}`);
  if (branchId) {
    addDetail(fields, `Филиал: ${branchLabel(branchId)}`);
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

function eventVisitDetailsHtml(item) {
  const payload = item.payload && typeof item.payload === "object" ? item.payload : {};
  const clientId = item.client_id || payload.client_id;
  const branchId = eventBranchId(item, payload);
  const fields = [
    `Клиент: ${clientEventButton(clientId, payload.full_name || (clientId ? `#${clientId}` : no))}`,
    `Статус: ${escapeHtml(visitStatusLabel(payload.visit_status))}`,
    `Дата визита: ${escapeHtml(formatVisitDateTime(payload.visit_at, branchId))}`,
  ];
  if (branchId) {
    fields.push(`Филиал: ${escapeHtml(branchLabel(branchId))}`);
  }
  if (payload.employee_name) {
    fields.push(`Мастер: ${escapeHtml(payload.employee_name)}`);
  } else if (payload.employee_id) {
    fields.push(`Мастер: ${escapeHtml(userLabelById(payload.employee_id))}`);
  }
  if (Array.isArray(payload.service_titles) && payload.service_titles.length) {
    fields.push(`Услуги: ${escapeHtml(payload.service_titles.join(", "))}`);
  }
  if (payload.total_cost !== undefined && payload.total_cost !== null) {
    fields.push(`Стоимость: ${escapeHtml(payload.total_cost)}`);
  }
  if (payload.paid_amount !== undefined && payload.paid_amount !== null) {
    fields.push(`Оплачено: ${escapeHtml(payload.paid_amount)}`);
  }
  if (payload.program_name) fields.push(`Реферальная программа: ${escapeHtml(payload.program_name)}`);
  if (payload.bonus_amount !== undefined && payload.bonus_amount !== null) {
    fields.push(`Начислено: ${escapeHtml(payload.bonus_amount)} баллов`);
  }
  return fields.filter(Boolean).join(" · ") || no;
}

function clientEventDetailsHtml(item) {
  const payload = item.payload && typeof item.payload === "object" ? item.payload : {};
  const clientId = item.client_id || payload.client_id || payload.id || item.entity_id;
  const branchId = eventBranchId(item, payload);
  const fields = [];
  fields.push(`Клиент: ${clientEventButton(clientId, payload.full_name || (clientId ? `#${clientId}` : no))}`);
  if (payload.primary_phone) fields.push(`Телефон: ${escapeHtml(payload.primary_phone)}`);
  if (branchId) fields.push(`Филиал: ${escapeHtml(branchLabel(branchId))}`);
  return fields.join(" · ") || no;
}

function reviewEventDetailsHtml(item) {
  const payload = item.payload && typeof item.payload === "object" ? item.payload : {};
  const clientId = item.client_id || payload.client_id;
  const clientName = payload.client_name || (clientId ? `#${clientId}` : no);
  const masterName = userShortNameById(payload.employee_id);
  return `Клиент: ${clientEventButton(clientId, clientName)} · Мастер: ${escapeHtml(masterName)}`;
}

function openReviewTextModal(item) {
  const payload = item?.payload && typeof item.payload === "object" ? item.payload : {};
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-backdrop" data-settings-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>Отзыв</h3>
          <button type="button" class="modal-close-icon" aria-label="Закрыть" title="Закрыть" data-close-modal><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button>
        </div>
        <div class="modal-grid">
          ${readonly("Текст отзыва", payload.text)}
        </div>
      </div>
    </div>
  `);
}

function eventDetailsHtml(item) {
  if (item.entity_type === "client_review") return reviewEventDetailsHtml(item);
  if (item.entity_type === "client_visit") return eventVisitDetailsHtml(item);
  if (item.entity_type === "client" || item.client_id || item.payload?.client_id) return clientEventDetailsHtml(item);
  return escapeHtml(eventDetails(item));
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
  const terminalLabel = yclientsTerminalLabel(entityId);
  if (terminalLabel) addDetail(fields, `Терминал: ${terminalLabel}`);
  else if (item.entity_type && entityId) addDetail(fields, `${humanizeCode(item.entity_type)}: #${entityId}`);
  if (item.client_id || payload.client_id) addDetail(fields, `Клиент: #${item.client_id || payload.client_id}`);
  const branchId = eventBranchId(item, payload);
  if (branchId) addDetail(fields, `Филиал: ${branchLabel(branchId)}`);
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
    if (control.dataset.optional === "true") return false;
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
    if (control.dataset.optional === "true") return false;
    return !["button", "submit", "reset", "hidden", "checkbox", "radio"].includes(type);
  });
}

function syncRequiredPanelForms(root) {
  const forms = root.matches?.("[data-settings]")
    ? root.querySelectorAll("form:not([data-entity-edit])")
    : root.querySelectorAll("[data-settings] form:not([data-entity-edit])");
  forms.forEach((form) => {
    if (form.matches("[data-achievement-create]")) {
      syncAchievementCreateForm(form);
      return;
    }
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

function syncAchievementCreateForm(form) {
  const controls = requiredPanelControls(form);
  controls.forEach((control) => {
    control.required = true;
  });
  const submit = form.querySelector('button[type="submit"], button.primary');
  if (!submit) return;
  // This form changes its condition controls dynamically; validate on submit instead.
  submit.disabled = false;
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
        const offset = timezoneOffsetLabel(zone.value);
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

function departmentBranchIds(item) {
  return [...new Set((item?.branch_ids?.length ? item.branch_ids : [item?.branch_id]).filter(Boolean).map(String))];
}

function branchPhotoField(item) {
  const photoUrl = item?.id && item.photo_file_id
    ? `/organizations/branches/${item.id}/photo?v=${encodeURIComponent(item.updated_at || item.photo_file_id)}`
    : "";
  return `
    <div class="achievement-photo-field modal-full">
      <label class="photo-upload-control">
        <input name="branch_photo_file" type="file" accept="image/*" hidden>
        <span class="photo-upload-button">${photoUrl ? "Заменить фото" : "Добавить фото"}</span>
      </label>
      ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="Фото филиала" class="achievement-photo-preview">` : ""}
    </div>
  `;
}

function organizationPhotoField(item) {
  const photoUrl = item?.id && item.photo_file_id
    ? `/organizations/${item.id}/photo?v=${encodeURIComponent(item.updated_at || item.photo_file_id)}`
    : "";
  return `
    <div class="achievement-photo-field modal-full">
      <label class="photo-upload-control">
        <input name="organization_photo_file" type="file" accept="image/*" hidden>
        <span class="photo-upload-button">${photoUrl ? "\u0417\u0430\u043c\u0435\u043d\u0438\u0442\u044c \u0444\u043e\u0442\u043e" : "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0444\u043e\u0442\u043e"}</span>
      </label>
      ${photoUrl ? `<img src="${escapeHtml(photoUrl)}" alt="\u0424\u043e\u0442\u043e \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u0438" class="achievement-photo-preview">` : ""}
    </div>
  `;
}

function departmentBranchEditFields(item) {
  const selected = departmentBranchIds(item);
  const branches = cache.branches || [];
  const summary = selected.map((id) => nameById(branches, id)).join(", ") || "Выберите филиалы";
  return `
    <div class="branch-multiselect modal-full" data-department-edit-branch-select>
      <span>Филиалы</span>
      <details class="branch-multiselect-dropdown">
        <summary><span data-department-edit-branch-summary>${escapeHtml(summary)}</span></summary>
        <div class="branch-multiselect-options">
          <label class="checkbox"><input type="checkbox" data-department-edit-branches-all ${selected.length === branches.length ? "checked" : ""}> Выбрать все филиалы</label>
          ${branches.map((branch) => `<label class="checkbox"><input type="checkbox" name="department_branch_ids" value="${escapeHtml(branch.id)}" ${selected.includes(String(branch.id)) ? "checked" : ""}> ${escapeHtml(branch.name)}</label>`).join("")}
        </div>
      </details>
    </div>
  `;
}

function syncDepartmentBranchEditForm(scope) {
  const form = scope.closest("[data-entity-edit]") || scope;
  const checkboxes = [...form.querySelectorAll('[name="department_branch_ids"]')];
  const selected = checkboxes.filter((input) => input.checked);
  const all = form.querySelector("[data-department-edit-branches-all]");
  const summary = form.querySelector("[data-department-edit-branch-summary]");
  if (all) all.checked = checkboxes.length > 0 && selected.length === checkboxes.length;
  if (summary) summary.textContent = selected.map((input) => nameById(cache.branches || [], input.value)).join(", ") || "Выберите филиалы";
}

function workplaceDepartmentOptions(branchId = "", selectedDepartmentId = "") {
  const filteredDepartments = cache.departments.filter((item) => departmentBranchIds(item).includes(String(branchId)));
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
  const isUserCreate = form.matches("[data-user-create]");
  const hasBranch = !!String(branch.value || "").trim();
  const currentDepartment = hasBranch ? department.value : "";
  department.innerHTML = workplaceDepartmentOptions(branch.value, currentDepartment);
  department.disabled = !hasBranch;
  if (!hasBranch) department.value = "";
  const hasDepartment = !!String(department.value || "").trim();
  if (role) {
    role.disabled = isUserCreate ? !hasBranch : !hasDepartment;
    if (role.disabled) role.value = "";
  }
  if (workplace) {
    const currentWorkplace = hasDepartment ? workplace.value : "";
    workplace.innerHTML = userWorkplaceOptions(branch.value, department.value, currentWorkplace);
    workplace.disabled = !hasDepartment;
    if (!hasDepartment) workplace.value = "";
  }
  if (submit && !isUserCreate) submit.disabled = !hasDepartment;
}

function section(title, body, hint = "") {
  const hintMarkup = hint
    ? `<span class="title-hint" tabindex="0" aria-label="${escapeHtml(hint)}" data-tooltip="${escapeHtml(hint)}">?</span>`
    : "";
  return `<div class="subpanel"><h3 class="subpanel-title">${escapeHtml(title)}${hintMarkup}</h3>${body}</div>`;
}

function canOpenSettingsTab(ctx, tab) {
  return tab.permissions.some((permission) => ctx.can(permission));
}

function activeSettingsTab(ctx, tabSlug = "") {
  const visibleTabs = SETTINGS_TABS.filter((tab) => canOpenSettingsTab(ctx, tab));
  if (!visibleTabs.length) return SETTINGS_TABS[0]?.slug || "legal";
  const normalized = visibleTabs.find((tab) => tab.slug === tabSlug);
  return normalized?.slug || visibleTabs[0].slug;
}

export async function loadSettingsData(orgId) {
  const [
    organizations,
    branches,
    brands,
    legalEntities,
    categories,
    productItems,
    achievements,
    bonusLevels,
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
    api.organizations().catch(() => []),
    api.branches(orgId).catch(() => []),
    api.brands(orgId).catch(() => []),
    api.legalEntities(orgId).catch(() => []),
    (api.productCategories?.(orgId) || Promise.resolve([])).catch(() => []),
    (api.productItems?.(orgId) || Promise.resolve([])).catch(() => []),
    (api.achievements?.(orgId) || Promise.resolve([])).catch(() => []),
    (api.bonusLevels?.(orgId) || Promise.resolve([])).catch(() => []),
    api.departments(orgId).catch(() => []),
    api.workplaces(orgId).catch(() => []),
    api.modules(orgId).catch(() => []),
    api.users(orgId, 500).catch(() => []),
    api.roles(orgId).catch(() => []),
    api.permissions(orgId).catch(() => []),
    api.memberships(orgId).catch(() => []),
    api.branchMemberships(orgId).catch(() => []),
    api.auditLogs(orgId).catch(() => []),
    api.events(orgId).catch(() => []),
  ]);
  const rolePermissions = Object.fromEntries(await Promise.all(
    roles.map(async (role) => [role.id, await api.rolePermissions(role.id).catch(() => [])]),
  ));
  const missingEventClientIds = [...new Set(events
    .filter((item) => item.entity_type === "client_visit" && !item.payload?.full_name)
    .map((item) => item.client_id || item.payload?.client_id)
    .filter(Boolean)
    .map((id) => String(id)))];
  const eventClients = await Promise.all(missingEventClientIds.map((id) => api.client(id, orgId).catch(() => null)));
  const eventClientNames = new Map(eventClients.filter(Boolean).map((client) => [
    String(client.id),
    client.full_name || [client.last_name, client.first_name, client.middle_name].filter(Boolean).join(" "),
  ]));
  events.forEach((item) => {
    const clientId = item.client_id || item.payload?.client_id;
    const fullName = clientId ? eventClientNames.get(String(clientId)) : "";
    if (fullName && item.entity_type === "client_visit" && !item.payload?.full_name) {
      item.payload = { ...(item.payload || {}), full_name: fullName };
    }
  });
  const userIds = new Set(users.map((user) => String(user.id)));
  const missingActorIds = [...new Set(events
    .map((item) => {
      const actorType = String(item.actor_type || item.payload?.actor_type || "").toLowerCase();
      return actorType && actorType !== "user" ? null : item.actor_id || item.payload?.actor_id;
    })
    .filter(Boolean)
    .map((id) => String(id))
    .filter((id) => !userIds.has(id)))];
  const actorUsers = await Promise.all(missingActorIds.map((id) => api.user(id).catch(() => null)));
  const usersWithActors = [
    ...users,
    ...actorUsers.filter(Boolean).filter((user) => !userIds.has(String(user.id))),
  ];
  return {
    organizations,
    branches,
    brands,
    legalEntities,
    categories,
    productItems,
    achievements,
    bonusLevels,
    departments,
    workplaces,
    modules,
    users,
    usersWithActors,
    roles,
    permissions,
    memberships,
    branchMemberships,
    rolePermissions,
    auditLogs,
    events,
  };
}

export function hydrateSettingsCache(orgId, data) {
  cache = {
    organizationId: orgId,
    ...data,
    users: data.usersWithActors || data.users || [],
  };
}

export function renderCatalogTab(tabSlug = "products", data = cache) {
  const categories = data.categories || [];
  const productItems = data.productItems || [];
  const activeTab = tabSlug === "services" ? "services" : "products";
  const type = activeTab === "services" ? "service" : "product";
  const title = activeTab === "services" ? "Услуги" : "Товары";
  const categoriesTitle = activeTab === "services" ? "Категории услуг" : "Категории товаров";
  const categoriesHint = activeTab === "services"
    ? "Категории услуг доступны только для услуг организации."
    : "Категории товаров доступны только для товаров организации.";
  const itemsHint = activeTab === "services"
    ? "Услуги привязаны к категориям услуг организации."
    : "Товары привязаны к товарным категориям организации.";
  const scopedCategories = categories.filter((category) => category.type === type);
  const selectedCategoryId = activeTab === "services" ? serviceFilterCategoryId : productFilterCategoryId;
  const searchQuery = activeTab === "services" ? serviceSearchQuery : productSearchQuery;
  const scopedItems = productItems
    .filter((item) => categoryTypeById(item.category_id) === type)
    .filter((item) => !selectedCategoryId || String(item.category_id) === String(selectedCategoryId));
  const importCategoryId = selectedCategoryId || scopedCategories[0]?.id || "";
  return `
    <div id="categories" data-permission="settings.categories.view">
      ${section(categoriesTitle, `
        <form class="inline-form compact" data-category-create data-permission="settings.categories.create">
          <input type="hidden" name="type" value="${escapeHtml(type)}">
          <label><span>Название категории</span><input name="name" required></label>
          <button class="primary" disabled>Добавить категорию</button>
          <p data-message></p>
        </form>
        ${entityList(scopedCategories, "Категорий пока нет", "category", (item) => item.name, (item) => categoryTypeLabel(item.type), {
          deleteIcon: true,
          deleteLabel: "Удалить",
        })}
      `, categoriesHint)}
    </div>

    <div id="product-items" data-permission="settings.items.view">
      ${section(title, `
        <div class="catalog-excel-actions">
          <label><span>Категория для загрузки</span><select data-product-excel-category>
            ${scopedCategories.map((category) => `<option value="${escapeHtml(category.id)}" ${String(category.id) === String(importCategoryId) ? "selected" : ""}>${escapeHtml(category.name)}</option>`).join("")}
          </select></label>
          <label class="secondary catalog-excel-upload ${scopedCategories.length ? "" : "is-disabled"}">Загрузить Excel<input type="file" accept=".xls,.xlsx" data-product-excel-file data-item-type="${escapeHtml(type)}" ${scopedCategories.length ? "" : "disabled"}></label>
          <button type="button" class="catalog-excel-export" data-product-excel-export data-item-type="${escapeHtml(type)}">Выгрузить Excel</button>
          <span data-product-excel-message></span>
          <div class="catalog-excel-preview" data-product-excel-preview hidden></div>
        </div>
        ${productItemCreateForm(
          scopedCategories,
          activeTab === "services" ? "услугу" : "товар",
          productItemCategoryFilterOptions(scopedCategories, selectedCategoryId, activeTab === "services" ? "data-service-filter-category" : "data-product-filter-category"),
        )}
        <form class="inline-form compact"><label><span>Поиск ${activeTab === "services" ? "услуги" : "товара"}</span><input type="search" placeholder="Название" value="${escapeHtml(searchQuery)}" data-catalog-item-search data-item-type="${escapeHtml(type)}"></label></form>
        <div data-catalog-item-list>${catalogItemListMarkup(type)}</div>
      `, itemsHint)}
    </div>
  `;
}

export function renderAchievementsPanel(achievementsList = cache.achievements || []) {
  return `
    <div id="achievements" data-permission="settings.achievements.view">
      ${section("Достижения", `
        <form class="inline-form compact" data-achievement-create data-permission="settings.achievements.create">
          <label><span>Название</span><input name="name" required></label>
          <label><span>Клиент должен выполнить</span><select name="logic">
            ${ACHIEVEMENT_LOGIC_OPTIONS.map((item) => `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`).join("")}
          </select></label>
          ${achievementConditionsFields([], false)}
          <button type="button" class="ghost achievement-add-condition" data-add-achievement-condition>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0443\u0441\u043b\u043e\u0432\u0438\u0435</button>
          <button class="primary achievement-create" disabled>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u0434\u043e\u0441\u0442\u0438\u0436\u0435\u043d\u0438\u0435</button>
          <p data-message></p>
        </form>
        ${entityList(achievementsList, "Достижений пока нет", "achievement", (item) => item.name, achievementDetails, {
          deleteIcon: true,
          deleteLabel: "Удалить",
        })}
      `, "Достижения собираются из одного или нескольких параметров клиента.")}
    </div>
  `;
}

function eventEntityCell(item) {
  return escapeHtml(humanizeCode(item.entity_type));
}

function auditEntityCell(item) {
  const entityType = item.entity_type || item.entity;
  return escapeHtml(humanizeCode(entityType));
}

function eventNameCell(item) {
  const label = humanizeCode(item.event_type || item.event_name || item.name);
  if (item.entity_type === "client_review") {
    return `<button type="button" class="ghost" data-open-event-review="${escapeHtml(item.id)}">Отзыв</button>`;
  }
  if (item.entity_type !== "client_visit") return escapeHtml(label);
  return `<button type="button" class="ghost" data-open-event-visit="${escapeHtml(item.id)}">${escapeHtml(label)}</button>`;
}

function eventActionType(item) {
  const value = [item.event_type, item.event_name, item.name, item.action, item.status]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  if (/cancel|cancelled|void|отмен/.test(value)) return "cancel";
  if (/create|created|register|создан/.test(value)) return "create";
  if (/complete|completed|perform|paid|accrual|write_off|соверш|заверш|оплат|начисл/.test(value)) return "complete";
  return "";
}

function eventRowClass(item) {
  if (item.entity_type === "client_review") return "event-row-review";
  const type = eventActionType(item);
  return type ? `event-row-${type}` : "";
}

function eventsFilterPanel() {
  const options = [
    { value: "create", label: "Создание" },
    { value: "complete", label: "Завершение" },
    { value: "cancel", label: "Отмена" },
  ];
  const selected = options.filter((item) => eventTypeFilters.has(item.value)).map((item) => item.label).join(", ") || "\u0412\u0441\u0435 \u0441\u043e\u0431\u044b\u0442\u0438\u044f";
  return `<div class="events-filter-control"><span>\u0424\u0438\u043b\u044c\u0442\u0440 \u043f\u043e \u0442\u0438\u043f\u0443</span><details class="branch-multiselect-dropdown"><summary><span>${escapeHtml(selected)}</span></summary><div class="branch-multiselect-options">${options.map((item) => `<label class="checkbox"><input type="checkbox" data-event-type-filter value="${item.value}" ${eventTypeFilters.has(item.value) ? "checked" : ""}> ${item.label}</label>`).join("")}</div></details></div>`;
}

function eventsContent() {
  const events = cache.events || [];
  const filteredEvents = eventTypeFilters.size
    ? events.filter((item) => eventTypeFilters.has(eventActionType(item)))
    : events;
  const pagedEventsData = paginate(filteredEvents, eventsPage, eventsPageSize);
  eventsPage = pagedEventsData.currentPage;
  return `
    ${eventsFilterPanel()}
    <table class="app-table"><thead><tr><th>\u0421\u043e\u0431\u044b\u0442\u0438\u0435</th><th>\u0414\u0435\u0442\u0430\u043b\u0438</th><th>\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043c\u044f</th></tr></thead><tbody>
      ${rows(pagedEventsData.pageItems, "\u0421\u043e\u0431\u044b\u0442\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442", (item) => `
        <tr class="${eventRowClass(item)}">
          <td>${eventNameCell(item)}</td>
          <td>${eventDetailsHtml(item)}</td>
          <td>${escapeHtml(formatDateTime(item.created_at))}</td>
        </tr>
      `)}
    </tbody></table>
    ${paginationControls(pagedEventsData.currentPage, pagedEventsData.totalPages, filteredEvents.length, {
      pageAttr: "data-events-page",
      pageSizeAttr: "data-events-page-size",
      pageSize: eventsPageSize,
      pageSizeLabel: "\u041e\u0442\u043e\u0431\u0440\u0430\u0436\u0430\u0442\u044c \u0441\u043e\u0431\u044b\u0442\u0438\u0439",
    })}
  `;
}

function refreshEventsContent(root) {
  const content = root.querySelector("[data-events-content]");
  if (content) content.innerHTML = eventsContent();
}

function eventVisitPayload(item) {
  if (item?.payload && typeof item.payload === "object") return item.payload;
  if (item?.new_value && typeof item.new_value === "object") return item.new_value;
  if (item?.old_value && typeof item.old_value === "object") return item.old_value;
  return {};
}

function eventVisitId(item) {
  const payload = eventVisitPayload(item);
  return item?.entity_id || payload.id || payload.visit_id;
}

function visitPublicComment(value) {
  return String(value || "")
    .split(/\r?\n/)
    .filter((line) => !line.trim().startsWith("__"))
    .join("\n")
    .trim();
}

function visitCommentMeta(value) {
  return String(value || "")
    .split(/\r?\n/)
    .filter((line) => line.trim().startsWith("__") && !line.trim().startsWith("__service_cost:") && !line.trim().startsWith("__product_cost:"))
    .join("\n")
    .trim();
}

function visitCommentCost(value, key) {
  const line = String(value || "").split(/\r?\n/).find((item) => item.startsWith(key));
  return Number(line?.slice(key.length).trim() || 0);
}

function visitLegacyItems(comment, type) {
  const prefix = `__${type}:`;
  const line = String(comment || "").split(/\r?\n/).find((value) => value.startsWith(prefix)) || "";
  const value = line.slice(prefix.length).split("__", 1)[0];
  return value.split(",").map((item) => item.trim()).filter(Boolean).map((label) => ({ label }));
}

function visitItemName(id, fallback = "") {
  const item = (cache.productItems || []).find((candidate) => String(candidate.id) === String(id));
  return item?.title || item?.name || fallback || `#${id}`;
}

function visitItemsReadonly(label, items, idField) {
  const value = (items || []).map((item) => {
    const quantity = Number(item.quantity || 1);
    const amount = item.total_amount ?? item.price;
    return [
      visitItemName(item[idField], item.label),
      quantity > 1 ? `\u00d7 ${quantity}` : "",
      amount !== undefined && amount !== null ? `\u2014 ${amount}` : "",
    ].filter(Boolean).join(" ");
  }).join(", ");
  return readonly(label, value);
}

function visitPhotoAlbumField(visit, visitId, stage, label) {
  const photos = Array.isArray(visit?.[`photos_${stage}`]) ? visit[`photos_${stage}`] : [];
  return `<div class="visit-photo-album modal-full" data-visit-photo-album data-visit-photo-stage="${stage}" data-existing-images-count="${photos.length}">
    <div class="service-image-album-head"><strong>${escapeHtml(label)}</strong><small>До 10 изображений</small></div>
    <label class="photo-upload-control"><input name="visit_${stage}_photos" type="file" accept="image/*" multiple hidden><span class="photo-upload-button">Добавить изображения</span></label>
    <div class="service-image-previews" data-visit-photo-previews>${photos.map((photo) => `<figure class="service-image-preview" data-visit-photo-id="${escapeHtml(photo.id)}"><img src="/crm-api/client-history/visits/${escapeHtml(visitId)}/photos/${stage}/${escapeHtml(photo.id)}" alt="${escapeHtml(label)}"><button type="button" class="client-delete-icon-button" data-remove-visit-photo data-photo-id="${escapeHtml(photo.id)}" aria-label="Удалить" title="Удалить"><img src="/fronted/icons/basket.svg" alt=""></button></figure>`).join("")}</div>
  </div>`;
}

function eventVisitModal() {
  if (!selectedEventVisit) return "";
  const visit = eventVisitPayload(selectedEventVisit);
  const visitId = eventVisitId(selectedEventVisit);
  const visitServices = visit.services?.length ? visit.services : visitLegacyItems(visit.comment, "services");
  const visitProducts = visit.products?.length ? visit.products : visitLegacyItems(visit.comment, "products");
  const serviceCost = visitCommentCost(visit.comment, "__service_cost:");
  const productCost = visitCommentCost(visit.comment, "__product_cost:");
  const totalCost = serviceCost + productCost || Number(visit.total_cost || 0);
  return `
    <div class="modal-backdrop" data-event-visit-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>Визит</h3>
          <button type="button" class="modal-close-icon" aria-label="Закрыть" title="Закрыть" data-close-event-visit><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button>
        </div>
        <form class="modal-grid" data-event-visit-edit data-visit-id="${escapeHtml(visitId || "")}">
          <label><span>Дата и время</span><input name="visit_at" type="datetime-local" value="${escapeHtml(dateTimeInput(visit.visit_at, visit.branch_id))}"></label>
          ${selectField("Филиал", "branch_id", cache.branches || [], visit.branch_id, "Выберите филиал")}
          ${selectField(
            "Сотрудник",
            "employee_id",
            (cache.users || []).map((user) => ({ id: user.id, name: userLabelById(user.id) })),
            visit.employee_id,
            "Выберите сотрудника",
          )}
          ${readonly("Клиент", visit.full_name || (selectedEventVisit.client_id ? `#${selectedEventVisit.client_id}` : ""))}
          <label><span>Статус</span><select name="visit_status">
            <option value="completed" ${visit.visit_status === "completed" ? "selected" : ""}>Завершен</option>
            <option value="scheduled" ${visit.visit_status === "scheduled" ? "selected" : ""}>Запланирован</option>
            <option value="cancelled" ${visit.visit_status === "cancelled" ? "selected" : ""}>Отменен</option>
            <option value="no_show" ${visit.visit_status === "no_show" ? "selected" : ""}>Не пришел</option>
          </select></label>
          <label><span>Стоимость услуг</span><input name="service_cost" type="number" step="0.01" min="0" value="${escapeHtml(serviceCost)}"></label>
          <label><span>Стоимость товаров</span><input name="product_cost" type="number" step="0.01" min="0" value="${escapeHtml(productCost)}"></label>
          <label><span>Общая стоимость</span><input name="total_cost" type="number" step="0.01" min="0" value="${escapeHtml(totalCost)}" readonly></label>
          <label><span>Скидка</span><div class="visit-item-picker"><input name="discount_amount" type="number" step="0.01" min="0" value="${escapeHtml(visit.discount_amount ?? "")}"><select name="discount_type"><option value="amount" selected>₽</option><option value="percent">%</option></select></div></label>
          <label><span>Оплачено</span><input name="paid_amount" type="number" step="0.01" min="0" value="${escapeHtml(visit.paid_amount ?? "")}" readonly></label>
          ${readonly("Задолженность", visit.debt_amount)}
          <label><span>Источник</span><input name="source" value="${escapeHtml(visit.source || "")}"></label>
          <label><span>Комментарий</span><input name="comment" value="${escapeHtml(visitPublicComment(visit.comment))}"></label>
          <input name="comment_meta" type="hidden" value="${escapeHtml(visitCommentMeta(visit.comment))}">
          ${visitItemsReadonly("\u0423\u0441\u043b\u0443\u0433\u0438", visitServices, "service_id")}
          ${visitItemsReadonly("\u0422\u043e\u0432\u0430\u0440\u044b", visitProducts, "product_id")}
          ${visitPhotoAlbumField(visit, visitId, "before", "Фото до")}
          ${visitPhotoAlbumField(visit, visitId, "after", "Фото после")}
          ${visitPhotoAlbumField(visit, visitId, "comment", "Фото к комментарию")}
          <p data-message></p>
          <button class="primary">Save</button>
        </form>
      </div>
    </div>
  `;
}

function entityList(items, empty, type, title, subtitle = () => "", actions = {}) {
  if (!items.length) return `<p class="empty">${escapeHtml(empty)}</p>`;
  const deleteType = actions.deleteType || type;
  const deleteId = actions.deleteId || ((item) => item.id);
  const deleteLabel = actions.deleteLabel || "Удалить";
  const deleteIcon = actions.deleteIcon !== false;
  const deleteControl = (itemDeleteId) => (itemDeleteId !== undefined && itemDeleteId !== null && itemDeleteId !== "") ? (deleteIcon
    ? `<button type="button" class="client-delete-icon-button" data-delete-entity="${escapeHtml(deleteType)}" data-id="${escapeHtml(itemDeleteId)}" aria-label="Delete" title="Delete"><img src="/fronted/icons/basket.svg" alt=""></button>`
    : `<button type="button" class="ghost" data-delete-entity="${escapeHtml(deleteType)}" data-id="${escapeHtml(itemDeleteId)}">${escapeHtml(deleteLabel)}</button>`) : "";
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
            ${deleteControl(itemDeleteId)}
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

function userMemberships(user, branchMemberships = []) {
  return branchMemberships.filter((item) => String(item.user_id) === String(user.id));
}

function userDepartmentEditOptions(branchIds = [], selectedDepartmentId = "") {
  const selectedBranches = new Set((branchIds || []).map((id) => String(id)));
  const departments = (cache.departments || []).filter((item) => !selectedBranches.size || departmentBranchIds(item).some((id) => selectedBranches.has(id)));
  return [
    `<option value="">Не выбрано</option>`,
    ...departments.map((item) => `<option value="${escapeHtml(item.id)}" ${String(selectedDepartmentId) === String(item.id) ? "selected" : ""}>${escapeHtml(`${nameById(cache.branches || [], item.branch_id)} - ${item.name}`)}</option>`),
  ].join("");
}

function userWorkplaceEditOptions(branchIds = [], departmentId = "", selectedWorkplaceId = "") {
  const selectedBranches = new Set((branchIds || []).map((id) => String(id)));
  const workplaces = (cache.workplaces || [])
    .filter((item) => !selectedBranches.size || selectedBranches.has(String(item.branch_id)))
    .filter((item) => !departmentId || String(item.department_id) === String(departmentId));
  return [
    `<option value="">Не выбрано</option>`,
    ...workplaces.map((item) => `<option value="${escapeHtml(item.id)}" ${String(selectedWorkplaceId) === String(item.id) ? "selected" : ""}>${escapeHtml(`${nameById(cache.branches || [], item.branch_id)} - ${item.name}`)}</option>`),
  ].join("");
}

function userBranchAccessSummary(branchIds = []) {
  const selected = new Set((branchIds || []).map((id) => String(id)));
  const names = (cache.branches || []).filter((branch) => selected.has(String(branch.id))).map((branch) => branch.name);
  if (!names.length) return "Не выбрано";
  return names.length > 2 ? `Выбрано: ${names.length}` : names.join(", ");
}

function userBranchAccessFields(user) {
  const memberships = userMemberships(user, cache.branchMemberships || []);
  const selectedBranchIds = [...new Set(memberships.map((item) => String(item.branch_id)).filter(Boolean))];
  const selectedDepartmentId = memberships.find((item) => item.department_id)?.department_id || "";
  const selectedWorkplaceId = memberships.find((item) => item.workplace_id)?.workplace_id || "";
  return `
    <div class="branch-multiselect modal-full" data-user-branch-select>
      <span>Филиалы</span>
      <details class="branch-multiselect-dropdown">
        <summary><span data-user-branch-summary>${escapeHtml(userBranchAccessSummary(selectedBranchIds))}</span></summary>
        <div class="branch-multiselect-options">
          ${(cache.branches || []).map((branch) => `
            <label class="checkbox">
              <input type="checkbox" name="user_branch_ids" value="${escapeHtml(branch.id)}" ${selectedBranchIds.includes(String(branch.id)) ? "checked" : ""}>
              ${escapeHtml(branch.name)}
            </label>
          `).join("")}
        </div>
      </details>
    </div>
    <label class="modal-full"><span>Подразделение</span><select name="department_id">${userDepartmentEditOptions(selectedBranchIds, selectedDepartmentId)}</select></label>
    <label class="modal-full"><span>Рабочее место</span><select name="workplace_id">${userWorkplaceEditOptions(selectedBranchIds, selectedDepartmentId, selectedWorkplaceId)}</select></label>
  `;
}

function syncUserBranchEditForm(scope) {
  const form = scope.closest("[data-entity-edit]") || scope;
  const branchIds = new FormData(form).getAll("user_branch_ids");
  const summary = form.querySelector("[data-user-branch-summary]");
  const department = form.querySelector('[name="department_id"]');
  const workplace = form.querySelector('[name="workplace_id"]');
  const currentDepartment = department?.value || "";
  const currentWorkplace = workplace?.value || "";
  if (summary) summary.textContent = userBranchAccessSummary(branchIds);
  if (department) {
    department.innerHTML = userDepartmentEditOptions(branchIds, currentDepartment);
    if (![...department.options].some((option) => option.value === currentDepartment)) department.value = "";
  }
  if (workplace) {
    workplace.innerHTML = userWorkplaceEditOptions(branchIds, department?.value || "", currentWorkplace);
    if (![...workplace.options].some((option) => option.value === currentWorkplace)) workplace.value = "";
  }
}

function userRoleIds(user, memberships = [], branchMemberships = []) {
  return [
    ...memberships.filter((item) => String(item.user_id) === String(user.id)).map((item) => item.role_id),
    ...userMemberships(user, branchMemberships).map((item) => item.role_id),
  ].filter((item) => item !== undefined && item !== null);
}

function userMatchesFilters(user, memberships = [], branchMemberships = []) {
  const branches = userMemberships(user, branchMemberships);
  const roleIds = userRoleIds(user, memberships, branchMemberships).map((item) => String(item));
  const searchQuery = userSearchQuery.trim().toLowerCase();
  const fullName = [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ").toLowerCase();
  if (searchQuery && !fullName.includes(searchQuery)) return false;
  if (userHideInactive && !user.is_active) return false;
  if (userFilterBranchId && !branches.some((item) => String(item.branch_id) === String(userFilterBranchId))) return false;
  if (userFilterRoleId && !roleIds.includes(String(userFilterRoleId))) return false;
  if (userFilterDepartmentId && !branches.some((item) => String(item.department_id) === String(userFilterDepartmentId))) return false;
  if (userFilterWorkplaceId && !branches.some((item) => String(item.workplace_id) === String(userFilterWorkplaceId))) return false;
  return true;
}

function userFilterOptions(branches, roles, departments, workplaces) {
  const filteredDepartments = userFilterBranchId
    ? departments.filter((item) => departmentBranchIds(item).includes(String(userFilterBranchId)))
    : departments;
  const filteredWorkplaces = workplaces
    .filter((item) => !userFilterBranchId || String(item.branch_id) === String(userFilterBranchId))
    .filter((item) => !userFilterDepartmentId || String(item.department_id) === String(userFilterDepartmentId));
  return `
    <form class="inline-form compact">
      <label><span>Поиск сотрудника</span><input type="search" placeholder="Имя или фамилия" value="${escapeHtml(userSearchQuery)}" data-user-search></label>
    </form>
    <form class="inline-form compact">
      <label><span>Филиал</span><select data-user-filter-branch>
        <option value="" ${!userFilterBranchId ? "selected" : ""}>Все филиалы</option>
        ${branches.map((item) => `<option value="${escapeHtml(item.id)}" ${String(userFilterBranchId) === String(item.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
      </select></label>
      <label><span>Роль</span><select data-user-filter-role>
        <option value="" ${!userFilterRoleId ? "selected" : ""}>Все роли</option>
        ${roles.map((item) => `<option value="${escapeHtml(item.id)}" ${String(userFilterRoleId) === String(item.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
      </select></label>
      <label><span>Должность</span><select data-user-filter-department>
        <option value="" ${!userFilterDepartmentId ? "selected" : ""}>Все должности</option>
        ${filteredDepartments.map((item) => `<option value="${escapeHtml(item.id)}" ${String(userFilterDepartmentId) === String(item.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
      </select></label>
      <label><span>Рабочее место</span><select data-user-filter-workplace>
        <option value="" ${!userFilterWorkplaceId ? "selected" : ""}>Все рабочие места</option>
        ${filteredWorkplaces.map((item) => `<option value="${escapeHtml(item.id)}" ${String(userFilterWorkplaceId) === String(item.id) ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}
      </select></label>
      <label class="checkbox"><input type="checkbox" data-user-hide-inactive ${userHideInactive ? "checked" : ""}> Скрыть неактивных</label>
    </form>
  `;
}

function userFilteredListMarkup() {
  const users = cache.users || [];
  const memberships = cache.memberships || [];
  const branchMemberships = cache.branchMemberships || [];
  const branches = cache.branches || [];
  const departments = cache.departments || [];
  const workplaces = cache.workplaces || [];
  const roles = cache.roles || [];
  const filteredUsers = users.filter((user) => userMatchesFilters(user, memberships, branchMemberships));
  const pagedUsersData = paginate(filteredUsers, userPage, USER_PAGE_SIZE);
  userPage = pagedUsersData.currentPage;
  return `
    ${userFilterOptions(branches, roles, departments, workplaces)}
    ${userAccessTable(pagedUsersData.pageItems, users.length ? "Пользователи не найдены" : "Пользователей пока нет", memberships, branchMemberships, branches, departments, workplaces, roles)}
    ${userPaginationControls(pagedUsersData.currentPage, pagedUsersData.totalPages)}
  `;
}

function uniqueNames(values) {
  const names = [...new Set(values.filter((value) => value && value !== no).map((value) => String(value)))];
  return names.length ? names.join(", ") : no;
}

function userAccessTable(users, empty, memberships, branchMemberships, branches, departments, workplaces, roles) {
  if (!users.length) return `<p class="empty">${escapeHtml(empty)}</p>`;
  return `
    <table class="centered-list-table app-table">
      <thead><tr>
        <th>Сотрудник</th>
        <th>Филиал</th>
        <th>Подразделение</th>
        <th>Рабочее место</th>
        <th>Роль</th>
        <th>Статус</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${users.map((user) => {
          const userBranches = userMemberships(user, branchMemberships);
          const orgMemberships = memberships.filter((item) => String(item.user_id) === String(user.id));
          const roleIds = [
            ...orgMemberships.map((item) => item.role_id),
            ...userBranches.map((item) => item.role_id),
          ];
          const title = [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ") || `#${user.id}`;
          const status = user.is_blocked ? "Заблокирован" : user.is_active ? "Активен" : "Неактивен";
          return `
            <tr>
              <td><button type="button" class="ghost" data-edit-entity="user" data-id="${escapeHtml(user.id)}">${escapeHtml(title)}</button></td>
              <td>${escapeHtml(uniqueNames(userBranches.map((item) => nameById(branches, item.branch_id))))}</td>
              <td>${escapeHtml(uniqueNames(userBranches.map((item) => nameById(departments, item.department_id))))}</td>
              <td>${escapeHtml(uniqueNames(userBranches.map((item) => nameById(workplaces, item.workplace_id))))}</td>
              <td>${escapeHtml(uniqueNames(roleIds.map((id) => nameById(roles, id))))}</td>
              <td>${escapeHtml(status)}</td>
              <td><button type="button" class="client-delete-icon-button" data-delete-entity="userAccess" data-id="${escapeHtml(user.id)}" aria-label="Delete" title="Delete"><img src="/fronted/icons/basket.svg" alt=""></button></td>
            </tr>
          `;
        }).join("")}
      </tbody>
    </table>
  `;
}

function paginate(items, page, pageSize) {
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), totalPages);
  return {
    currentPage,
    totalPages,
    pageItems: items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
  };
}

function pageSizeControl(pageSize, attr, label) {
  return `
    <label><span>${escapeHtml(label)}</span><select ${attr}>
      ${LOG_PAGE_SIZE_OPTIONS.map((size) => `<option value="${size}" ${pageSize === size ? "selected" : ""}>${size}</option>`).join("")}
    </select></label>
  `;
}
function userPaginationControls(currentPage, totalPages) {
  if (totalPages <= 1) return "";

  const pages = [];

  for (let page = 1; page <= totalPages; page++) {
    pages.push(`
      <li class="page-item ${page === currentPage ? "active" : ""}">
        <button
          type="button"
          class="page-link"
          data-user-page="${page}"
          ${page === currentPage ? 'aria-current="page"' : ""}
        >
          ${page}
        </button>
      </li>
    `);
  }

  return `
    <ul class="pagination user-pagination">
      <li class="page-item ${currentPage <= 1 ? "disabled" : ""}">
        <button
          type="button"
          class="page-link"
          data-user-page="${currentPage - 1}"
          ${currentPage <= 1 ? "disabled" : ""}
          aria-label="Предыдущая страница"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="icon icon-1"
          >
            <path d="M15 6l-6 6l6 6"></path>
          </svg>
        </button>
      </li>

      ${pages.join("")}

      <li class="page-item ${currentPage >= totalPages ? "disabled" : ""}">
        <button
          type="button"
          class="page-link"
          data-user-page="${currentPage + 1}"
          ${currentPage >= totalPages ? "disabled" : ""}
          aria-label="Следующая страница"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="icon icon-1"
          >
            <path d="M9 6l6 6l-6 6"></path>
          </svg>
        </button>
      </li>
    </ul>
  `;
}
function paginationControls(currentPage, totalPages, totalItems, options = {}) {
  const pageAttr = options.pageAttr || "data-user-page";
  if (totalPages <= 1 && !options.pageSizeAttr) return "";
  return `
    <div class="pagination">
      <span>${escapeHtml(`Страница ${currentPage} из ${totalPages} · ${totalItems}`)}</span>
      <div>
        ${options.pageSizeAttr ? pageSizeControl(options.pageSize, options.pageSizeAttr, options.pageSizeLabel || "Отображать") : ""}
        <button type="button" class="ghost" ${pageAttr}="${escapeHtml(currentPage - 1)}" ${currentPage <= 1 ? "disabled" : ""}>Назад</button>
        <button type="button" class="ghost" ${pageAttr}="${escapeHtml(currentPage + 1)}" ${currentPage >= totalPages ? "disabled" : ""}>Вперёд</button>
      </div>
    </div>
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

function productItemCreateForm(categories, title, categoryFilter = "") {
  return `
    <form class="inline-form compact" data-product-item-create data-permission="settings.items.create">
      ${categoryFilter}
      ${selectField("Категория", "category_id", categories.map((category) => ({ id: category.id, name: category.name })), "", "Выберите категорию")}
      <label><span>Название</span><input name="title" required></label>
      <label><span>Цена</span><input name="price" type="number" step="0.01" min="0"></label>
      <label><span>Активен</span><select name="active">
        <option value="true">Да</option>
        <option value="false">Нет</option>
      </select></label>
      <button class="primary product-create-submit" disabled>Добавить ${escapeHtml(title)}</button>
      <p data-message></p>
    </form>
  `;
}

function renderProductExcelPreview(actions) {
  const preview = actions?.querySelector("[data-product-excel-preview]");
  const state = actions ? productExcelPreviewState.get(actions) : null;
  if (!preview || !state) return;
  const items = state.rows.filter((row) => !state.excludedRows.has(Number(row.row_number)));
  preview.hidden = false;
  preview.innerHTML = '<div class="modal-card catalog-excel-preview-card"><div class="modal-head"><h3>\u041a \u0437\u0430\u0433\u0440\u0443\u0437\u043a\u0435: ' + items.length + '</h3><button type="button" class="modal-close-icon" aria-label="\u0417\u0430\u043a\u0440\u044b\u0442\u044c" title="\u0417\u0430\u043a\u0440\u044b\u0442\u044c" data-product-excel-preview-close><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button></div><div class="catalog-excel-preview-list">' + items.map((row) => '<div><span>' + escapeHtml(row.title || "\u0411\u0435\u0437 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f") + '</span><small>' + escapeHtml(row.sku || row.barcode || "") + '</small><button type="button" class="client-delete-icon-button" data-product-excel-preview-remove="' + Number(row.row_number) + '"><img src="/fronted/icons/basket.svg" alt=""></button></div>').join("") + '</div><div class="catalog-excel-preview-footer"><button type="button" class="primary" data-product-excel-import-confirm>\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c \u0432\u044b\u0431\u0440\u0430\u043d\u043d\u044b\u0435</button></div></div>';
}

async function saveProductExcel(url, suggestedName) {
  if (typeof window.showSaveFilePicker !== "function") {
    const link = document.createElement("a");
    link.href = url;
    link.download = suggestedName;
    document.body.append(link);
    link.click();
    link.remove();
    return false;
  }

  const fileHandle = await window.showSaveFilePicker({
    suggestedName,
    types: [{
      description: "Excel",
      accept: { "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"] },
    }],
  });
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error("Не удалось сформировать Excel-файл");

  const writable = await fileHandle.createWritable();
  await writable.write(await response.blob());
  await writable.close();
  return true;
}

function findEntity(type, id) {
  const source = {
    org: cache.organizations,
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
  if (type === "org") return `
    ${organizationPhotoField(item)}
    <label class="organization-name-field"><span>\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u0438</span><input name="name" value="${escapeHtml(item.name)}" required></label>
  `;
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
    ${productBranchAvailabilityFields(item)}
    <label><span>Активен</span><select name="active">
      <option value="true" ${item.active ? "selected" : ""}>Да</option>
      <option value="false" ${!item.active ? "selected" : ""}>Нет</option>
    </select></label>
  `;
  if (type === "achievement") return `
    ${achievementPhotoField(item)}
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Клиент должен выполнить</span><select name="logic">
      ${ACHIEVEMENT_LOGIC_OPTIONS.map((itemOption) => `<option value="${escapeHtml(itemOption.value)}" ${item.logic === itemOption.value ? "selected" : ""}>${escapeHtml(itemOption.label)}</option>`).join("")}
    </select></label>
    ${achievementConditionsFields(item.conditions || [])}
    <label class="checkbox modal-full"><input type="checkbox" name="notification_enabled" ${item.notification_enabled !== false ? "checked" : ""}> Уведомление при получении</label>
    <label class="modal-full"><span>Канал уведомления</span><select name="notification_channel">
      <option value="application" ${(item.notification_channel || "application") === "application" ? "selected" : ""}>Приложение</option>
      <option value="telegram" disabled>Telegram</option>
      <option value="max" disabled>Max</option>
      <option value="vk" disabled>VK</option>
      <option value="sms" disabled>SMS</option>
    </select></label>
  `;
  if (type === "branch") return `
    ${branchPhotoField(item)}
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Адрес</span><input name="address" value="${escapeHtml(item.address || "")}"></label>
    <label><span>Телефон</span><input name="phone" value="${escapeHtml(item.phone || "")}"></label>
    ${timezoneOptions(item.timezone || DEFAULT_TIMEZONE)}
    ${branchWorkScheduleFields(item.work_schedule)}
    ${selectField("Юридическое лицо", "legal_entity_id", cache.legalEntities, item.legal_entity_id)}
        <label class="checkbox modal-full"><input type="checkbox" name="online_booking_enabled" ${item.online_booking_enabled ? "checked" : ""}> Онлайн-запись</label>
  `;
  if (type === "department") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    ${departmentBranchEditFields(item)}
  `;
  if (type === "workplace") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    ${selectField("Подразделение", "department_id", cache.departments, item.department_id)}
  `;
  if (type === "module") return `
    <label><span>Название модуля</span><input name="module_name" value="${escapeHtml(item.module_name)}" required></label>
  `;
  if (type === "user") return `
    <section class="user-profile-card modal-full">
      <header class="user-profile-card-head">
        ${userPhotoField(item)}
        <div class="user-profile-summary">
          <span>Карточка сотрудника</span>
          <h4>${escapeHtml([item.last_name, item.first_name, item.middle_name].filter(Boolean).join(" ") || item.email || item.phone || "Пользователь")}</h4>
          <p>ID ${escapeHtml(item.id)} · создан ${escapeHtml(item.created_at || no)}</p>
        </div>
      </header>
      <div class="user-profile-section">
        <h5>Личные данные</h5>
        <div class="user-profile-fields">
          <label><span>Имя</span><input name="first_name" value="${escapeHtml(item.first_name || "")}"></label>
          <label><span>Фамилия</span><input name="last_name" value="${escapeHtml(item.last_name || "")}"></label>
          <label><span>Отчество</span><input name="middle_name" value="${escapeHtml(item.middle_name || "")}"></label>
          <label><span>Телефон</span><input name="phone" value="${escapeHtml(item.phone || "")}"></label>
          <label><span>Email</span><input name="email" value="${escapeHtml(item.email || "")}"></label>
          <label><span>Новый пароль</span><input name="password" type="password" autocomplete="new-password"></label>
        </div>
      </div>
      <div class="user-profile-section">
        <h5>Рабочий доступ</h5>
        <div class="user-profile-fields">
          <label><span>Telegram ID</span><input name="telegram_id" value="${escapeHtml(item.telegram_id || "")}" inputmode="numeric"></label>
          <label><span>MAX ID</span><input name="max_id" value="${escapeHtml(item.max_id || "")}" inputmode="numeric"></label>
          <label><span>Активен</span><select name="is_active">
            <option value="true" ${item.is_active ? "selected" : ""}>Да</option>
            <option value="false" ${!item.is_active ? "selected" : ""}>Нет</option>
          </select></label>
          ${selectField("\u0420\u043e\u043b\u044c", "role_id", cache.roles || [], userRoleIds(item, cache.memberships || [], cache.branchMemberships || [])[0], "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0440\u043e\u043b\u044c")}
        </div>
        <div class="user-profile-access">${userBranchAccessFields(item)}</div>
      </div>
      ${userBookingBlocksField(item)}
    </section>
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

async function openEntityModal(type, item) {
  let modalItem = item;
  if (type === "productItem" && productItemCategory(item)?.type === "service") {
    modalItem = { ...item, master_services: await api.masterServices(cache.organizationId, item.id) };
  }
  const titles = {
    org: "\u041e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u044f",
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
  const modalBaseTitle = modalItem.name
    || modalItem.title
    || modalItem.module_name
    || [modalItem.last_name, modalItem.first_name, modalItem.middle_name].filter(Boolean).join(" ")
    || modalItem.email
    || modalItem.phone
    || `${titles[type] || "Сущность"} #${modalItem.id}`;
  const userAccessTitle = type === "user"
    ? userMemberships(item, cache.branchMemberships || [])
      .map((membership) => {
        const branchName = nameById(cache.branches || [], membership.branch_id);
        const departmentName = nameById(cache.departments || [], membership.department_id);
        return [branchName, departmentName].filter(Boolean).join(" / ");
      })
      .filter(Boolean)
      .join("; ")
    : "";
  const modalTitle = userAccessTitle ? `${modalBaseTitle} - ${userAccessTitle}` : modalBaseTitle;
  const modalTitleId = type === "productItem" || type === "branch"
    ? `<span class="modal-title-id">ID ${escapeHtml(item.id)}</span>`
    : "";
  const isServiceProfile = type === "productItem" && productItemCategory(modalItem)?.type === "service";
  const serviceImage = isServiceProfile ? serviceImageEntries(modalItem)[0]?.path || "" : "";
  const serviceCategory = isServiceProfile ? productItemCategory(modalItem)?.name || "Услуга" : "";
  const serviceDurationMinutes = isServiceProfile ? Math.floor(Number(modalItem.seance_length || 0) / 60) : 0;
  const serviceProfileHeader = isServiceProfile ? `
    <header class="service-profile-card-head">
      <div class="service-profile-avatar">${serviceImage ? `<img src="${escapeHtml(serviceImage)}" alt="Изображение услуги">` : "<span>У</span>"}</div>
      <div class="service-profile-summary"><span>${escapeHtml(serviceCategory)}</span><h4>${escapeHtml(modalItem.title || "Услуга")}</h4><p>Цена: ${escapeHtml(modalItem.price ?? "не указана")} · Длительность: ${escapeHtml(serviceDurationMinutes ? `${serviceDurationMinutes} мин` : "не указана")}</p></div>
    </header>
  ` : "";

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-backdrop" data-settings-modal>
      <div class="modal-card${isServiceProfile ? " service-profile-modal" : ""}${type === "org" ? " organization-profile-modal" : ""}">
        <div class="modal-head">
          <h3>${escapeHtml(modalTitle)}${modalTitleId}</h3>
          <button type="button" class="modal-close-icon" aria-label="Закрыть" title="Закрыть" data-close-modal><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button>
        </div>
        ${serviceProfileHeader}
        <form class="modal-grid${type === "user" ? " user-profile-form" : ""}${isServiceProfile ? " service-profile-form" : ""}${type === "org" ? " organization-profile-form" : ""}" data-entity-edit data-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}">
          ${modalFields(type, modalItem)}
          <p data-message></p>
          <button class="primary${type === "achievement" ? " settings-achievement-save" : ""}">Сохранить</button>
        </form>
      </div>
    </div>
  `);
}

async function syncUserBranchAccess(userId, branchIds = [], departmentId = "", workplaceId = "") {
  const selected = new Set((Array.isArray(branchIds) ? branchIds : [branchIds]).map((id) => String(id)).filter(Boolean));
  const existing = userMemberships({ id: userId }, cache.branchMemberships || []);
  const department = (cache.departments || []).find((item) => String(item.id) === String(departmentId));
  const workplace = (cache.workplaces || []).find((item) => String(item.id) === String(workplaceId));
  const fallbackRoleId = existing.find((item) => item.role_id)?.role_id
    || cache.memberships.find((item) => String(item.user_id) === String(userId))?.role_id
    || cache.roles?.[0]?.id;

  await Promise.all(existing
    .filter((membership) => !selected.has(String(membership.branch_id)))
    .map((membership) => api.deleteBranchMembership(membership.id)));

  for (const branchId of selected) {
    const membership = existing.find((item) => String(item.branch_id) === String(branchId));
    const nextDepartmentId = department && departmentBranchIds(department).includes(String(branchId)) ? Number(department.id) : null;
    const nextWorkplaceId = workplace && String(workplace.branch_id) === String(branchId) && (!nextDepartmentId || String(workplace.department_id) === String(nextDepartmentId)) ? Number(workplace.id) : null;
    if (membership) {
      if (String(membership.department_id || "") !== String(nextDepartmentId || "") || String(membership.workplace_id || "") !== String(nextWorkplaceId || "")) {
        await api.updateBranchMembership(membership.id, { department_id: nextDepartmentId, workplace_id: nextWorkplaceId });
      }
    } else {
      if (!fallbackRoleId) throw new Error("Сначала назначьте сотруднику роль.");
      await api.assignUserToBranch({
        organization_id: cache.organizationId,
        user_id: Number(userId),
        branch_id: Number(branchId),
        department_id: nextDepartmentId,
        workplace_id: nextWorkplaceId,
        role_id: Number(fallbackRoleId),
      });
    }
  }
}

async function saveEntity(type, id, data, form = null) {
  if (type === "org") return api.updateOrganization(id, { name: data.name }).then(async (organization) => {
    const photo = form.elements.organization_photo_file?.files?.[0];
    return photo ? api.uploadOrganizationPhoto(id, photo) : organization;
  });
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
    const currentItem = findEntity("productItem", id) || {};
    return api.updateProductItem(id, {
      category_id: Number(data.category_id),
      title: data.title,
      price: numberOrNull(data.price),
      salon_service_id: categoryType === "service" ? numberOrNull(currentItem.salon_service_id) : null,
      price_min: null,
      price_max: null,
      discount: categoryType === "service" ? numberOrNull(data.discount) : null,
      comment: optional(data.comment),
      weight: categoryType === "service" ? numberOrNull(data.weight) : null,
      api_id: categoryType === "service" ? optional(data.api_id) : null,
      good_id: categoryType === "product" ? numberOrNull(currentItem.good_id) : null,
      barcode: categoryType === "product" ? optional(data.barcode) : null,
      receipt_title: categoryType === "product" ? optional(data.receipt_title) : null,
      sku: categoryType === "product" ? optional(data.sku) : null,
      sale_unit: categoryType === "product" ? optional(data.sale_unit) : null,
      writeoff_unit: categoryType === "product" ? optional(data.writeoff_unit) : null,
      writeoff_ratio: categoryType === "product" ? numberOrNull(data.writeoff_ratio) : null,
      net_weight: categoryType === "product" ? numberOrNull(data.net_weight) : null,
      gross_weight: categoryType === "product" ? numberOrNull(data.gross_weight) : null,
      cost: categoryType === "product" ? numberOrNull(data.cost) : null,
      critical_stock: categoryType === "product" ? numberOrNull(data.critical_stock) : null,
      desired_stock: categoryType === "product" ? numberOrNull(data.desired_stock) : null,
      network_editable: categoryType === "product" ? data.network_editable === "true" : true,
      unit_id: categoryType === "product" ? numberOrNull(data.unit_id) : null,
      unit_short_title: categoryType === "product" ? optional(data.unit_short_title) : null,
      service_unit_id: categoryType === "product" ? numberOrNull(data.service_unit_id) : null,
      service_unit_short_title: categoryType === "product" ? optional(data.unit_short_title) : null,
      actual_cost: categoryType === "product" ? numberOrNull(data.actual_cost) : null,
      unit_actual_cost: categoryType === "product" ? numberOrNull(data.unit_actual_cost) : null,
      unit_equals: categoryType === "product" ? numberOrNull(data.unit_equals) : null,
      actual_amounts: categoryType === "product" ? parseActualAmounts(form) : null,
      seance_length: categoryType === "service"
        ? (Number(data.service_duration_hours || 0) * 3600) + (Number(data.service_duration_minutes || 0) * 60)
        : null,
      staff: categoryType === "service" ? serviceStaffPayload(form) : null,
      image_group: categoryType === "service" ? undefined : null,
      active: data.active === "true",
    }).then(async (updated) => {
      if (categoryType === "service") {
        const existing = await api.masterServices(cache.organizationId, id);
        const pairs = masterServicePayload(form);
        const selected = new Set(pairs.map((pair) => pair.master_id));
        await Promise.all(existing.filter((pair) => !selected.has(pair.master_id)).map((pair) => api.deleteMasterService(pair.id)));
        await Promise.all(pairs.map((pair) => pair.pairId
          ? api.updateMasterService(pair.pairId, pair)
          : api.createMasterService({ organization_id: cache.organizationId, service_id: Number(id), ...pair })));
      }
      await syncProductItemBranchAvailability(id, data.product_branch_ids || []);
      const images = form.elements.service_images?.files || [];
      return images.length ? api.uploadProductItemImages(id, images) : updated;
    });
  }
  if (type === "achievement") {
    if (!api.updateAchievement) throw new Error("API достижений не подключен.");
    return api.updateAchievement(id, achievementPayload(data, form)).then(async (achievement) => {
      const photo = form.elements.photo_file?.files?.[0];
      return photo ? api.uploadAchievementPhoto(id, photo) : achievement;
    });
  }
  if (type === "branch") return api.updateBranch(id, {
    name: data.name,
    address: optional(data.address),
    phone: optional(data.phone),
    timezone: optional(data.timezone),
    work_schedule: branchWorkSchedulePayload(data),
    brand_id: numberOrNull(data.brand_id),
    legal_entity_id: numberOrNull(data.legal_entity_id),
    online_booking_enabled: data.online_booking_enabled === "on",
  }).then(async (branch) => {
    const photo = form.elements.branch_photo_file?.files?.[0];
    return photo ? api.uploadBranchPhoto(id, photo) : branch;
  });
  if (type === "department") {
    if (!data.branch_ids?.length) throw new Error("Выберите хотя бы один филиал.");
    for (const branchId of data.branch_ids) {
      if (!(cache.branches || []).some((branch) => String(branch.id) === String(branchId))) throw new Error("Выбранный филиал не найден.");
    }
    return api.updateDepartment(id, { name: data.name, branch_ids: data.branch_ids });
  }
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
    ...(data.password ? { password: data.password } : {}),
    booking_blocks: [
      ...((cache.users.find((item) => String(item.id) === String(id))?.booking_blocks || [])
        .filter((block) => block.organization_id != null && String(block.organization_id) !== String(cache.organizationId))),
      ...(data.booking_blocks || []),
    ],
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
    await syncUserBranchAccess(id, data.user_branch_ids || [], data.department_id, data.workplace_id);
    const photo = form.elements.user_photo_file?.files?.[0];
    return photo ? api.uploadUserPhoto(id, photo) : updated;
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
  if (type === "userAccess") {
    await Promise.all(userMemberships({ id }, cache.branchMemberships || []).map((membership) => api.deleteBranchMembership(membership.id)));
    return api.deleteMembership(cache.organizationId, id).catch((error) => {
      if (error.status !== 404) throw error;
    });
  }
  if (type === "branchMembership") return api.deleteBranchMembership(id);
  throw new Error("Неизвестная сущность");
}

function showOrganizationBotToast(message, kind = "success") {
  const toast = document.createElement("div");
  toast.className = `organization-bot-toast is-${kind}`;
  toast.setAttribute("role", "status");
  toast.textContent = message;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 2200);
}

function organizationBotsSettingsMarkup(ctx, bots) {
  return `
    <section class="panel" data-settings data-settings-section="bots">
      <h2>${escapeHtml(ctx.org.name)}</h2>
      <div id="bots" data-permission="settings.bots.view">
        ${section("Боты организации", `
          <div class="organization-bots-grid">
            ${[
              { platform: "telegram", label: "Telegram" },
              { platform: "max", label: "MAX" },
            ].map(({ platform, label }) => {
              const bot = bots.find((item) => item.platform === platform);
              return `<article class="organization-bot-card">
                <div class="organization-bot-heading">
                  <div><h3>${label}</h3><p>${bot ? escapeHtml(bot.bot_name || "Бот подключён") : "Бот не подключён"}</p></div>
                  <span class="organization-bot-status ${bot?.is_active ? "is-active" : ""}">${bot?.is_active ? "Включён" : "Выключен"}</span>
                </div>
                <form class="organization-bot-actions" data-bot-save data-platform="${platform}">
                  <label class="organization-bot-token"><span>Токен бота</span><input name="token" type="password" autocomplete="off" required placeholder="${bot ? escapeHtml(bot.token_hint) : "Вставьте токен"}"></label>
                  <button class="primary" type="submit">${bot ? "Заменить бота" : "Подключить бота"}</button>
                  <label class="organization-bot-switch" title="${bot?.is_active ? "Выключить бота" : "Включить бота"}">
                    <input type="checkbox" data-bot-toggle data-platform="${platform}" ${bot?.is_active ? "checked" : ""} ${bot ? "" : "disabled"} aria-label="${bot?.is_active ? "Выключить бота" : "Включить бота"}">
                    <span aria-hidden="true"></span>
                  </label>
                  <p class="organization-bot-message" data-message></p>
                </form>
              </article>`;
            }).join("")}
          </div>
        `, "При включении устанавливается вебхук. При выключении вебхук удаляется, и канал пропадает из рассылок.")}
      </div>
    </section>
  `;
}

export async function settings(ctx, tabSlug = "") {
  const currentTab = activeSettingsTab(ctx, tabSlug);
  if (currentTab === "bots") {
    const bots = await api.organizationBots(ctx.org.id).catch(() => []);
    return organizationBotsSettingsMarkup(ctx, bots);
  }
  const settingsData = await loadSettingsData(ctx.org.id);
  const {
    organizations,
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
  } = settingsData;
  const filteredDepartments = departmentFilterBranchId
    ? departments.filter((item) => departmentBranchIds(item).includes(String(departmentFilterBranchId)))
    : departments;
  const filteredWorkplaces = workplaceFilterBranchId
    ? workplaces.filter((item) => String(item.branch_id) === String(workplaceFilterBranchId))
    : workplaces;

  hydrateSettingsCache(ctx.org.id, settingsData);
  const filteredUsers = users.filter((user) => userMatchesFilters(user, memberships, branchMemberships));
  const pagedUsersData = paginate(filteredUsers, userPage, USER_PAGE_SIZE);
  const pagedAuditData = paginate(auditLogs, auditPage, auditPageSize);
  userPage = pagedUsersData.currentPage;
  auditPage = pagedAuditData.currentPage;

  return `
    <section class="panel" data-settings data-settings-section="${escapeHtml(currentTab)}">
      <h2>${escapeHtml(ctx.org.name)}</h2>

      ${currentTab === "legal" ? `
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

      ` : ""}

      ${currentTab === "org" ? `
      <div id="org" data-permission="settings.org.view">
        ${section("\u041e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u0438", `
          ${entityList(organizations, "\u041e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442", "org", (item) => item.name, () => "", {
            deleteId: () => null,
          })}
        `, "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u044e, \u0447\u0442\u043e\u0431\u044b \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0435\u0451 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u0438\u043b\u0438 \u0444\u043e\u0442\u043e\u0433\u0440\u0430\u0444\u0438\u044e.")}
      </div>

      ` : ""}

      ${currentTab === "branches" ? `
      <div id="branches" data-permission="settings.branches.view">
        ${section("Филиалы", `
          <form class="inline-form compact" data-branch-create data-permission="settings.branches.create">
            <label><span>Название</span><input name="name" required></label>
            <label><span>Адрес</span><input name="address"></label>
            <label><span>Телефон</span><input name="phone"></label>
            ${timezoneOptions()}
            ${branchWorkScheduleFields()}
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

      ` : ""}

      ${currentTab === "departments" ? `
      <div id="departments" data-permission="settings.departments.view">
        ${section("Подразделения", `
          <form class="inline-form compact" data-department-create data-permission="settings.departments.create">
            <div class="branch-multiselect" data-department-branch-select>
              <span>\u0424\u0438\u043b\u0438\u0430\u043b\u044b</span>
              <details class="branch-multiselect-dropdown">
                <summary><span data-department-branch-summary>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0438\u043b\u0438\u0430\u043b\u044b</span></summary>
                <div class="branch-multiselect-options">
                  <label class="checkbox"><input type="checkbox" data-department-branches-all> \u0412\u044b\u0431\u0440\u0430\u0442\u044c \u0432\u0441\u0435 \u0444\u0438\u043b\u0438\u0430\u043b\u044b</label>
                  ${branches.map((branch) => `<label class="checkbox"><input type="checkbox" name="branch_ids" value="${escapeHtml(branch.id)}" data-department-branch> ${escapeHtml(branch.name)}</label>`).join("")}
                </div>
              </details>
            </div>
            <label><span>\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435</span><input name="name" required></label>
            <button class="primary" disabled>\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043f\u043e\u0434\u0440\u0430\u0437\u0434\u0435\u043b\u0435\u043d\u0438\u0435</button>
            <p data-message></p>
          </form>
          <form class="inline-form compact">
            ${departmentFilterOptions(branches, departmentFilterBranchId)}
          </form>
          ${entityList(filteredDepartments, "Подразделениеов пока нет", "department", (item) => item.name, (item) => `Филиал: ${departmentBranchIds(item).map((id) => nameById(branches, id)).join(", ")}`, {
            deleteLabel: "Удалить",
          })}
        `, "Подразделения — это отделы внутри филиала, например администрация или мастера.")}
      </div>

      ` : ""}

      ${currentTab === "workplaces" ? `
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

      ` : ""}

      ${currentTab === "roles" ? `
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

      ` : ""}

      ${currentTab === "users" ? `
      <div id="users" data-permission="settings.users.view">
        ${section("Пользователи и доступ", `
          <form class="inline-form compact" data-user-create data-permission="settings.users.create">
            <label><span>Имя</span><input name="first_name" required></label>
            <label><span>Отчество</span><input name="middle_name" data-optional="true"></label>
            <label><span>Фамилия</span><input name="last_name" data-optional="true"></label>
            <label><span>Телефон</span><input name="phone" data-optional="true"></label>
            <label><span>Email</span><input name="email" data-optional="true"></label>
            <label><span>Пароль/хеш</span><input name="password" type="password" required></label>
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал").replace('name="branch_id"', 'name="branch_id" data-optional="true"')}
            <label><span>Подразделение</span><select name="department_id" data-optional="true" disabled>${workplaceDepartmentOptions()}</select></label>
            <label><span>Роль</span><select name="role_id" data-optional="true" disabled>
              <option value="">Не выбрано</option>
              ${roles.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("")}
            </select></label>
            <label><span>Рабочее место</span><select name="workplace_id" data-optional="true" disabled>${userWorkplaceOptions()}</select></label>
            <button class="primary" disabled>Создать пользователя</button>
            <p data-message></p>
          </form>

          <div data-user-filtered-list>${userFilteredListMarkup()}</div>
        `, "Пользователи и доступ — это сотрудники и их роли в организации или филиалах.")}
      </div>

      ` : ""}

      ${currentTab === "logs" ? `
      <div id="events" data-permission="settings.events.view">
        ${section("\u0421\u043e\u0431\u044b\u0442\u0438\u044f", `
          <div data-events-content>${eventsContent()}</div>
        `, "\u0421\u043e\u0431\u044b\u0442\u0438\u044f \u2014 \u044d\u0442\u043e \u0441\u0438\u0441\u0442\u0435\u043c\u043d\u044b\u0435 \u0437\u0430\u043f\u0438\u0441\u0438 \u043e \u043f\u0440\u043e\u0438\u0437\u043e\u0448\u0435\u0434\u0448\u0438\u0445 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f\u0445.")}
      </div>
      ` : ""}

            ${eventVisitModal()}
    </section>
  `;
}

export function bindSettings(root, ctx) {
  syncRequiredPanelForms(root);

  const updateUserList = (focusSearch = false) => {
    const list = root.querySelector("[data-user-filtered-list]");
    if (!list) return;
    list.innerHTML = userFilteredListMarkup();
    if (focusSearch) {
      const searchInput = list.querySelector("[data-user-search]");
      searchInput?.focus();
      searchInput?.setSelectionRange(searchInput.value.length, searchInput.value.length);
    }
  };

  const previewAchievementPhoto = (input) => {
    const file = input.files?.[0];
    const userPhotoPreview = input.closest(".user-photo-field")?.querySelector("[data-user-photo-preview]");
    if (file && userPhotoPreview) {
      userPhotoPreview.innerHTML = `<img src="${escapeHtml(URL.createObjectURL(file))}" alt="Фото пользователя">`;
      const photoButton = input.closest(".photo-upload-control")?.querySelector(".photo-upload-button");
      if (photoButton) photoButton.textContent = "Заменить фото";
      return;
    }
    const preview = input.closest(".achievement-photo-field")?.querySelector(".achievement-photo-preview");
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    if (preview) {
      preview.src = previewUrl;
    } else {
      input.closest(".achievement-photo-field")?.insertAdjacentHTML("beforeend", `<img src="${escapeHtml(previewUrl)}" alt="Фото достижения" class="achievement-photo-preview">`);
    }
    const photoButton = input.closest(".photo-upload-control")?.querySelector(".photo-upload-button");
    if (photoButton) photoButton.textContent = "Заменить фото";
  };

  const previewVisitPhotos = (input) => {
    const album = input.closest("[data-visit-photo-album]");
    const previews = album?.querySelector("[data-visit-photo-previews]");
    const files = [...(input.files || [])];
    const existing = Number(album?.dataset.existingImagesCount || 0);
    if (!album || !previews || !files.length) return;
    if (existing + files.length > 10) { input.value = ""; alert("Можно добавить не более 10 фотографий в альбом."); return; }
    previews.querySelectorAll("[data-visit-photo-pending]").forEach((preview) => preview.remove());
    previews.insertAdjacentHTML("beforeend", files.map((file) => `<figure class="service-image-preview" data-visit-photo-pending><img src="${escapeHtml(URL.createObjectURL(file))}" alt="Предпросмотр фотографии визита"></figure>`).join(""));
  };

  const previewServiceImages = (input) => {
    const album = input.closest("[data-service-image-album]");
    const previews = album?.querySelector("[data-service-image-previews]");
    const files = [...(input.files || [])];
    const existing = Number(album?.dataset.existingImagesCount || 0);
    if (!album || !previews || !files.length) return;
    if (existing + files.length > 10) {
      input.value = "";
      alert("Можно добавить не более 10 изображений услуги.");
      return;
    }
    previews.querySelectorAll("[data-service-image-pending]").forEach((preview) => preview.remove());
    previews.insertAdjacentHTML("beforeend", files.map((file) => `<figure class="service-image-preview" data-service-image-pending><img src="${escapeHtml(URL.createObjectURL(file))}" alt="Предпросмотр изображения услуги"></figure>`).join(""));
  };

  root.addEventListener("input", (event) => {
    if (event.target.matches("[data-user-search]")) {
      userSearchQuery = event.target.value || "";
      userPage = 1;
      updateUserList(true);
      return;
    }
    if (event.target.matches("[data-catalog-item-search]")) {
      if (event.target.dataset.itemType === "service") serviceSearchQuery = event.target.value || "";
      else productSearchQuery = event.target.value || "";
      const list = event.target.closest("[data-permission]")?.querySelector("[data-catalog-item-list]");
      if (list) list.innerHTML = catalogItemListMarkup(event.target.dataset.itemType);
      return;
    }
    if (event.target.closest("[data-settings] form:not([data-entity-edit])")) {
      syncRequiredPanelForms(root);
    }
  });

  root.addEventListener("click", (event) => {
    root.querySelectorAll("[data-department-branch-select] details[open]").forEach((details) => {
      if (!details.contains(event.target)) details.removeAttribute("open");
    });
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches("[data-product-excel-file]")) {
      const file = event.target.files?.[0];
      const actions = event.target.closest(".catalog-excel-actions");
      const categoryId = actions?.querySelector("[data-product-excel-category]")?.value;
      if (!file || !categoryId) return;
      const message = actions.querySelector("[data-product-excel-message]");
      event.target.disabled = true; message.textContent = "\u0413\u043e\u0442\u043e\u0432\u0438\u043c \u043f\u0440\u0435\u0432\u044c\u044e...";
      api.previewProductItems(ctx.org.id, categoryId, file).then((result) => {
        productExcelPreviewState.set(actions, { file, rows: result.rows || [], excludedRows: new Set() });
        renderProductExcelPreview(actions); message.textContent = "";
      }).catch((error) => { message.textContent = error.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043f\u0440\u043e\u0447\u0438\u0442\u0430\u0442\u044c Excel"; }).finally(() => { event.target.disabled = false; event.target.value = ""; });
      return;
    }
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
    if (event.target.matches("[data-user-filter-branch]")) {
      userFilterBranchId = event.target.value || "";
      userFilterDepartmentId = "";
      userFilterWorkplaceId = "";
      userPage = 1;
      updateUserList();
      return;
    }
    if (event.target.matches("[data-user-filter-role]")) {
      userFilterRoleId = event.target.value || "";
      userPage = 1;
      updateUserList();
      return;
    }
    if (event.target.matches("[data-user-filter-department]")) {
      userFilterDepartmentId = event.target.value || "";
      userFilterWorkplaceId = "";
      userPage = 1;
      updateUserList();
      return;
    }
    if (event.target.matches("[data-user-filter-workplace]")) {
      userFilterWorkplaceId = event.target.value || "";
      userPage = 1;
      updateUserList();
      return;
    }
    if (event.target.matches("[data-user-hide-inactive]")) {
      userHideInactive = event.target.checked;
      userPage = 1;
      updateUserList();
      return;
    }
    if (event.target.matches("[data-department-branches-all]")) {
      const form = event.target.closest("[data-department-create]");
      form?.querySelectorAll("[data-department-branch]").forEach((input) => { input.checked = event.target.checked; });
    }
    if (event.target.matches("[data-department-branch]")) {
      const form = event.target.closest("[data-department-create]");
      const branches = [...(form?.querySelectorAll("[data-department-branch]") || [])];
      const all = form?.querySelector("[data-department-branches-all]");
      if (all) all.checked = branches.length > 0 && branches.every((input) => input.checked);
    }
    if (event.target.matches("[data-audit-page-size]")) {
      const value = Number(event.target.value);
      auditPageSize = LOG_PAGE_SIZE_OPTIONS.includes(value) ? value : LOG_PAGE_SIZE_OPTIONS[0];
      auditPage = 1;
      ctx.reload();
      return;
    }
    if (event.target.matches("[data-events-page-size]")) {
      const value = Number(event.target.value);
      eventsPageSize = LOG_PAGE_SIZE_OPTIONS.includes(value) ? value : LOG_PAGE_SIZE_OPTIONS[0];
      eventsPage = 1;
      refreshEventsContent(root);
      return;
    }
    if (event.target.matches("[data-event-type-filter]")) {
      if (event.target.checked) eventTypeFilters.add(event.target.value);
      else eventTypeFilters.delete(event.target.value);
      eventsPage = 1;
      refreshEventsContent(root);
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
    if (form.dataset.submitting === "true") return;
    form.dataset.submitting = "true";
    setMessage(form, "");

    try {
      if (form.matches("[data-event-visit-edit]")) {
        if (!form.dataset.visitId) throw new Error("ID визита не найден.");
        const data = formData(form);
        await api.updateClientVisit(form.dataset.visitId, {
          visit_at: data.visit_at ? branchDateTimeToUtc(data.visit_at, branchTimezone(data.branch_id)) : undefined,
          branch_id: numberOrNull(data.branch_id),
          employee_id: numberOrNull(data.employee_id),
          visit_status: optional(data.visit_status),
          total_cost: Number(data.service_cost || 0) + Number(data.product_cost || 0),
          discount_amount: data.discount_type === "percent" ? (Number(data.service_cost || 0) + Number(data.product_cost || 0)) * Number(data.discount_amount || 0) / 100 : Number(data.discount_amount || 0),
          paid_amount: Math.max(0, Number(data.service_cost || 0) + Number(data.product_cost || 0) - (data.discount_type === "percent" ? (Number(data.service_cost || 0) + Number(data.product_cost || 0)) * Number(data.discount_amount || 0) / 100 : Number(data.discount_amount || 0))),
          source: optional(data.source),
          comment: [data.comment_meta, `__service_cost:${Number(data.service_cost || 0)}`, `__product_cost:${Number(data.product_cost || 0)}`, optional(data.comment)].filter(Boolean).join("\n") || null,
        });
        await Promise.all([
          form.elements.visit_before_photos?.files?.length ? api.uploadVisitPhotos(form.dataset.visitId, "before", form.elements.visit_before_photos.files) : null,
          form.elements.visit_after_photos?.files?.length ? api.uploadVisitPhotos(form.dataset.visitId, "after", form.elements.visit_after_photos.files) : null,
          form.elements.visit_comment_photos?.files?.length ? api.uploadVisitPhotos(form.dataset.visitId, "comment", form.elements.visit_comment_photos.files) : null,
        ].filter(Boolean));
        selectedEventVisit = null;
        form.closest("[data-event-visit-modal]")?.remove();
        ctx.reload();
        return;
      }
      validateRequiredPanelForm(form);
      if (!form.reportValidity()) return;
      const data = formData(form);
      if (form.matches("[data-bot-save]")) {
        await api.saveOrganizationBot(ctx.org.id, form.dataset.platform, { token: data.token });
      } else if (form.matches("[data-brand-create]")) {
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
          work_schedule: branchWorkSchedulePayload(data),
          brand_id: numberOrNull(data.brand_id),
          legal_entity_id: numberOrNull(data.legal_entity_id),
          online_booking_enabled: data.online_booking_enabled === "on",
        });
      } else if (form.matches("[data-department-create]")) {
        const branchIds = new FormData(form).getAll("branch_ids").map(Number).filter(Boolean);
        if (!branchIds.length) throw new Error("\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u0444\u0438\u043b\u0438\u0430\u043b.");
        await api.createDepartments({
          organization_id: ctx.org.id,
          branch_ids: branchIds,
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
        if (!optional(data.phone) && !optional(data.email)) throw new Error("Укажите телефон или email.");
        const created = await api.createUser({
          organization_id: ctx.org.id,
          first_name: data.first_name,
          middle_name: optional(data.middle_name),
          last_name: optional(data.last_name),
          phone: optional(data.phone),
          email: optional(data.email),
          password: data.password,
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
    } finally {
      delete form.dataset.submitting;
    }
  });

  root.addEventListener("click", async (event) => {
    const botToggle = event.target.closest("[data-bot-toggle]");
    if (botToggle) {
      const enabled = botToggle.checked;
      botToggle.disabled = true;
      try {
        await api.toggleOrganizationBot(ctx.org.id, botToggle.dataset.platform, enabled);
        showOrganizationBotToast(enabled ? "Бот включён" : "Бот выключен", enabled ? "success" : "danger");
        ctx.reload();
      } catch (error) {
        botToggle.checked = !enabled;
        showOrganizationBotToast(error.message || "Не удалось изменить статус бота", "danger");
        botToggle.disabled = false;
      }
      return;
    }
    if (handleAchievementConditionClick(event, root)) return;
    if (handleProductAmountClick(event, root)) return;

    const previewCloseButton = event.target.closest("[data-product-excel-preview-close]");
    if (previewCloseButton) { previewCloseButton.closest("[data-product-excel-preview]")?.setAttribute("hidden", ""); return; }
        const previewRemoveButton = event.target.closest("[data-product-excel-preview-remove]");
    if (previewRemoveButton) {
      const actions = previewRemoveButton.closest(".catalog-excel-actions"); const state = productExcelPreviewState.get(actions);
      if (state) { state.excludedRows.add(Number(previewRemoveButton.dataset.productExcelPreviewRemove)); renderProductExcelPreview(actions); }
      return;
    }
    const previewConfirmButton = event.target.closest("[data-product-excel-import-confirm]");
    if (previewConfirmButton) {
      const actions = previewConfirmButton.closest(".catalog-excel-actions"); const state = productExcelPreviewState.get(actions);
      const categoryId = actions?.querySelector("[data-product-excel-category]")?.value; const message = actions?.querySelector("[data-product-excel-message]");
      if (!state || !categoryId || !message) return;
      previewConfirmButton.disabled = true; message.textContent = "\u0417\u0430\u0433\u0440\u0443\u0436\u0430\u0435\u043c \u043f\u043e\u0437\u0438\u0446\u0438\u0438...";
      api.importProductItems(ctx.org.id, categoryId, state.file, [...state.excludedRows]).then((result) => {
        message.textContent = "\u0413\u043e\u0442\u043e\u0432\u043e: " + result.total; ctx.reload();
      }).catch((error) => { message.textContent = error.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0437\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044c Excel"; previewConfirmButton.disabled = false; });
      return;
    }
        const exportButton = event.target.closest("[data-product-excel-export]");
    if (exportButton) {
      const actions = exportButton.closest(".catalog-excel-actions");
      const message = actions?.querySelector("[data-product-excel-message]");
      const isService = exportButton.dataset.itemType === "service";
      event.preventDefault();
      exportButton.disabled = true;
      if (message) message.textContent = "Выберите место для сохранения...";
      saveProductExcel(
        api.exportProductItemsUrl(ctx.org.id, exportButton.dataset.itemType),
        isService ? "Услуги.xlsx" : "Товары.xlsx",
      )
        .then((savedWithDialog) => {
          if (message) message.textContent = savedWithDialog ? "Файл сохранён" : "Файл скачивается...";
        })
        .catch((error) => {
          if (message) message.textContent = error?.name === "AbortError" ? "" : (error.message || "Не удалось выгрузить Excel");
        })
        .finally(() => { exportButton.disabled = false; });
      return;
    }

    const openClientButton = event.target.closest("[data-open-settings-client]");
    if (openClientButton) {
      event.preventDefault();
      event.stopPropagation();
      openClientButton.disabled = true;
      try {
        await openExternalClientCard(ctx, openClientButton.dataset.openSettingsClient, {
          branches: cache.branches,
          departments: cache.departments,
          workplaces: cache.workplaces,
          users: cache.users,
          memberships: cache.memberships,
          branchMemberships: cache.branchMemberships,
          roles: cache.roles,
          segments: cache.segments,
          productCategories: cache.categories,
          productItems: cache.productItems,
        });
        openClientButton.disabled = false;
      } catch (error) {
        openClientButton.disabled = false;
        alert(error.message);
      }
      return;
    }

    const openReviewButton = event.target.closest("[data-open-event-review]");
    if (openReviewButton) {
      const reviewEvent = (cache.events || []).find(
        (item) => String(item.id) === String(openReviewButton.dataset.openEventReview),
      );
      if (reviewEvent) openReviewTextModal(reviewEvent);
      return;
    }

    const openVisitButton = event.target.closest("[data-open-event-visit]");
    if (openVisitButton) {
      const visitRef = String(openVisitButton.dataset.openEventVisit || "");
      selectedEventVisit = visitRef.startsWith("audit:")
        ? (cache.auditLogs || []).find((item) => String(item.id) === visitRef.slice(6)) || null
        : (cache.events || []).find((item) => String(item.id) === visitRef) || null;
      const visitId = eventVisitId(selectedEventVisit);
      const eventPayload = eventVisitPayload(selectedEventVisit);
      const clientId = selectedEventVisit?.client_id || eventPayload.client_id;
      if (visitId && clientId) {
        try {
          await openExternalClientCard(ctx, clientId, {
            branches: cache.branches,
            departments: cache.departments,
            workplaces: cache.workplaces,
            users: cache.users,
            memberships: cache.memberships,
            branchMemberships: cache.branchMemberships,
            roles: cache.roles,
            segments: cache.segments,
            productCategories: cache.categories,
            productItems: cache.productItems,
            selectedVisitId: visitId,
            visitOnly: true,
          });
          selectedEventVisit = null;
          return;
        } catch (error) {
          alert(error.message);
          return;
        }
      }
      root.querySelector("[data-event-visit-modal]")?.remove();
      root.insertAdjacentHTML("beforeend", eventVisitModal());
      return;
    }

    const closeVisitButton = event.target.closest("[data-close-event-visit]");
    if (closeVisitButton) {
      selectedEventVisit = null;
      closeVisitButton.closest("[data-event-visit-modal]")?.remove();
      return;
    }

    const userPageButton = event.target.closest("[data-user-page]");
    if (userPageButton && !userPageButton.disabled) {
      userPage = Number(userPageButton.dataset.userPage) || 1;
      updateUserList();
      return;
    }

    const auditPageButton = event.target.closest("[data-audit-page]");
    if (auditPageButton && !auditPageButton.disabled) {
      auditPage = Number(auditPageButton.getAttribute("data-audit-page")) || 1;
      ctx.reload();
      return;
    }

    const eventsPageButton = event.target.closest("[data-events-page]");
    if (eventsPageButton && !eventsPageButton.disabled) {
      eventsPage = Number(eventsPageButton.getAttribute("data-events-page")) || 1;
      refreshEventsContent(root);
      return;
    }

    const editButton = event.target.closest("[data-edit-entity]");
    if (editButton) {
      const item = findEntity(editButton.dataset.editEntity, editButton.dataset.id);
      if (item) await openEntityModal(editButton.dataset.editEntity, item);
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

  document.addEventListener("click", async (event) => {
    if (handleAchievementConditionClick(event)) return;
    if (handleProductAmountClick(event)) return;

    if (event.target.matches("[data-event-visit-modal]")) {
      selectedEventVisit = null;
      event.target.remove();
      return;
    }

    const addBookingBlock = event.target.closest("[data-add-user-booking-block]");
    if (addBookingBlock) {
      addBookingBlock.closest(".user-profile-section")?.querySelector("[data-user-booking-blocks]")?.insertAdjacentHTML("beforeend", userBookingBlockRow());
      return;
    }
    const removeBookingBlock = event.target.closest("[data-remove-user-booking-block]");
    if (removeBookingBlock) {
      removeBookingBlock.closest("[data-user-booking-block]")?.remove();
      return;
    }

    const removeVisitPhoto = event.target.closest("[data-remove-visit-photo]");
    if (removeVisitPhoto) {
      const album = removeVisitPhoto.closest("[data-visit-photo-album]");
      const form = removeVisitPhoto.closest("form");
      try {
        await api.deleteVisitPhoto(form?.dataset.visitId, album?.dataset.visitPhotoStage, removeVisitPhoto.dataset.photoId);
        removeVisitPhoto.closest(".service-image-preview")?.remove();
        if (album) album.dataset.existingImagesCount = String(Math.max(Number(album.dataset.existingImagesCount || 1) - 1, 0));
      } catch (error) {
        alert(error.message);
      }
      return;
    }

    const removeServiceImage = event.target.closest("[data-remove-service-image]");
    if (removeServiceImage) {
      const album = removeServiceImage.closest("[data-service-image-album]");
      const form = removeServiceImage.closest("form");
      const itemId = Number(form?.dataset.id || form?.querySelector('[name="id"]')?.value || 0);
      try {
        await api.deleteProductItemImage(itemId, removeServiceImage.dataset.imageId);
        removeServiceImage.closest(".service-image-preview")?.remove();
        if (album) album.dataset.existingImagesCount = String(Math.max(Number(album.dataset.existingImagesCount || 1) - 1, 0));
      } catch (error) {
        alert(error.message);
      }
      return;
    }

    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      closeButton.closest("[data-settings-modal]")?.remove();
    }
  });

  document.addEventListener("mousedown", (event) => {
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
    if (!event.target.closest("[data-user-branch-select]")) {
      document.querySelectorAll("[data-user-branch-select] details[open]").forEach((item) => {
        item.removeAttribute("open");
      });
    }
    if (!event.target.closest("[data-department-edit-branch-select]")) {
      document.querySelectorAll("[data-department-edit-branch-select] details[open]").forEach((item) => {
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
        payload.product_branch_ids = new FormData(form).getAll("product_branch_ids");
      }
      if (form.dataset.type === "user") {
        payload.user_branch_ids = new FormData(form).getAll("user_branch_ids");
        payload.booking_blocks = userBookingBlocksPayload(form);
      }
      if (form.dataset.type === "department") {
        payload.branch_ids = new FormData(form).getAll("department_branch_ids").map(Number).filter(Boolean);
      }
      await saveEntity(form.dataset.type, form.dataset.id, payload, form);
      form.closest("[data-settings-modal]")?.remove();
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.matches("[data-master-service-enabled]")) {
      const editor = event.target.closest("[data-service-staff-editor]");
      syncServiceStaffRow(event.target.closest("[data-master-service-row]"));
      syncServiceStaffTable(editor);
      return;
    }
    if (event.target.matches("[data-select-all-service-staff]")) {
      const editor = event.target.closest("[data-service-staff-editor]");
      editor?.querySelectorAll("[data-master-service-enabled]").forEach((input) => {
        input.checked = event.target.checked;
      });
      syncServiceStaffTable(editor);
      return;
    }
    if (event.target.matches("[data-hide-inactive-service-staff]")) {
      syncServiceStaffTable(event.target.closest("[data-service-staff-editor]"));
      return;
    }
    if (event.target.matches('[data-entity-edit][data-type="achievement"] [name="photo_file"]')) {
      previewAchievementPhoto(event.target);
      return;
    }
    if (event.target.matches('[data-entity-edit][data-type="branch"] [name="branch_photo_file"]')) {
      previewAchievementPhoto(event.target);
      return;
    }
    if (event.target.matches('[data-entity-edit][data-type="org"] [name="organization_photo_file"]')) {
      previewAchievementPhoto(event.target);
      return;
    }
    if (event.target.matches('[data-entity-edit][data-type="user"] [name="user_photo_file"]')) {
      previewAchievementPhoto(event.target);
      return;
    }
    if (event.target.matches('[data-entity-edit][data-type="productItem"] [name="service_images"]')) {
      previewServiceImages(event.target);
      return;
    }
    if (event.target.matches('[data-event-visit-edit] [name="visit_before_photos"], [data-event-visit-edit] [name="visit_after_photos"], [data-event-visit-edit] [name="visit_comment_photos"]')) {
      previewVisitPhotos(event.target);
      return;
    }
    if (event.target.matches('[name="user_branch_ids"]')) {
      syncUserBranchEditForm(event.target);
    }
    if (event.target.matches("[data-department-edit-branches-all]")) {
      const form = event.target.closest("[data-entity-edit]");
      form?.querySelectorAll('[name="department_branch_ids"]').forEach((input) => { input.checked = event.target.checked; });
      syncDepartmentBranchEditForm(form);
    }
    if (event.target.matches('[name="department_branch_ids"]')) {
      syncDepartmentBranchEditForm(event.target);
    }
    if (event.target.closest("[data-entity-edit][data-type='user']") && event.target.matches('[name="department_id"]')) {
      syncUserBranchEditForm(event.target);
    }
    if (event.target.matches('[name="vat_enabled"]')) {
      syncVatFields(event.target);
    }
    if (event.target.matches('[name="condition_parameter"]')) {
      syncAchievementConditionValueField(event.target);
    }
    if (event.target.matches('[name="branch_achievement_ids"]')) {
      syncBranchAchievementSummary(event.target);
    }
    if (event.target.matches('[name="branch_service_item_ids"], [name="branch_product_item_ids"]')) {
      syncBranchProductItemSummary(event.target);
    }
    if (event.target.matches('[name="product_branch_all"]')) {
      const root = event.target.closest("[data-product-branch-select]");
      root?.querySelectorAll('[name="product_branch_ids"]').forEach((input) => {
        input.checked = event.target.checked;
      });
      syncProductBranchSummary(event.target);
    }
    if (event.target.matches('[name="product_branch_ids"]')) {
      syncProductBranchSummary(event.target);
    }
  });

}
