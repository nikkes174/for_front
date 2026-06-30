import { api } from "../api.js";
import { escapeHtml, formData, numberOrNull, optional, rows, selectField, setMessage } from "../dom.js";

const CLIENTS_PAGE_SIZE = 10;

let state = {
  clients: [],
  branches: [],
  departments: [],
  workplaces: [],
  users: [],
  memberships: [],
  branchMemberships: [],
  roles: [],
  segments: [],
  productCategories: [],
  productItems: [],
  selectedClient: null,
  selectedVisit: null,
  visitDraft: {},
  visitErrors: {},
  bonusTransactionType: "accrual",
  selectedVisitDraft: {},
  photoPreviewUrl: "",
  photoFile: null,
};

const no = "Без фото";
const bonusTransactionTypes = {
  accrual: "Начисление",
  write_off: "Списание",
  expiration: "Сгорание",
};

function clean(value) {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== "" && item !== undefined && item !== null));
}

function name(client) {
  return client.full_name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "Без имени";
}

function displayUser(user) {
  return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || user.phone || `User ${user.id}`;
}

function statusLabel(status) {
  if (status === "active") return "Активен";
  if (status === "archived") return "В архиве";
  return "Статус не указан";
}

function clientRow(item) {
  return `
    <div style="display:flex; gap:8px; align-items:stretch;">
      <button type="button" class="entity-card" data-open-client="${escapeHtml(item.id)}" style="flex:1; min-width:0;">
        <b>${escapeHtml(name(item))}</b>
        <span>${escapeHtml(statusLabel(item.status))} В· ${escapeHtml(date(item.created_at))}</span>
      </button>
      <button type="button" class="ghost" data-delete-client="${escapeHtml(item.id)}">Удалить</button>
    </div>
  `;
}

function visitStatusLabel(status) {
  if (status === "completed") return "Завершен";
  if (status === "scheduled") return "Запланирован";
  if (status === "cancelled") return "Отменен";
  if (status === "no_show") return "Не пришел";
  return "Статус не указан";
}

function dateTime(value) {
  return value ? new Date(value).toLocaleString("ru-RU") : "";
}

function date(value) {
  return value ? new Date(value).toLocaleDateString("ru-RU") : "";
}

function dateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const offset = date.getTimezoneOffset();
  return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16);
}

function money(value) {
  return Number(value ?? 0).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
}

function bonusTypeOptions(items, selected = "") {
  const options = (items || []).map((item) => ({
    value: item.code,
    label: item.name,
  }));
  if (selected && !options.some((item) => String(item.value) === String(selected))) {
    options.push({ value: selected, label: selected === "cashback" ? "Кэшбэк" : selected });
  }
  return options;
}

function bonusTypeName(items, code) {
  const item = (items || []).find((bonusType) => String(bonusType.code) === String(code));
  return item?.name || code || "";
}

function currentLoyaltyLevel(history) {
  return (history || []).find((item) => item.client_level)?.client_level || "";
}

function lastLoyaltyAction(history) {
  const item = (history || [])[0];
  if (!item) return "";
  return [dateTime(item.created_at), item.reason || item.transaction_type].filter(Boolean).join(" · ");
}

function readonly(label, value) {
  return `<div class="readonly-field"><span>${escapeHtml(label)}</span><b>${escapeHtml(String(value ?? "").trim() || no)}</b></div>`;
}

function clientPhotoUrl(client) {
  if (!client?.id || !client?.photo_file_id) return "";
  const version = client.updated_at ? encodeURIComponent(client.updated_at) : encodeURIComponent(client.photo_file_id);
  return `/crm-api/clients-core/clients/${client.id}/photo?v=${version}`;
}

function photoField(client, previewUrl = "") {
  const currentUrl = previewUrl || clientPhotoUrl(client);
  return `
    <div class="readonly-field modal-full photo-upload-field">
      <span>Фото</span>
      <label class="photo-upload-control">
        <input name="photo_file" type="file" accept="image/*" hidden>
        <span class="photo-upload-button">${currentUrl ? "Заменить фото" : "Выбрать фото"}</span>
      </label>
      ${currentUrl
        ? `<img src="${escapeHtml(currentUrl)}" alt="Фото клиента" class="client-photo-preview">`
        : `<b>Файл пока не выбран</b>`}
    </div>
  `;
}

function clearPhotoPreview() {
  if (state.photoPreviewUrl?.startsWith("blob:")) {
    URL.revokeObjectURL(state.photoPreviewUrl);
  }
  state.photoPreviewUrl = "";
  state.photoFile = null;
}

function upsertClient(client) {
  const next = [...state.clients];
  const index = next.findIndex((item) => String(item.id) === String(client.id));
  if (index >= 0) next[index] = { ...next[index], ...client };
  else next.unshift(client);
  state.clients = next;
}

function removeClient(clientId) {
  state.clients = state.clients.filter((item) => String(item.id) !== String(clientId));
}

function field(label, name, value = "", attrs = "") {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" value="${escapeHtml(value ?? "")}" ${attrs}></label>`;
}

function visitField(label, control, error = "") {
  return `<label><span>${escapeHtml(label)}</span>${control}${error ? `<small class="field-error">${escapeHtml(error)}</small>` : ""}</label>`;
}

function visitInputField(label, name, value = "", attrs = "", error = "") {
  return visitField(label, `<input name="${escapeHtml(name)}" value="${escapeHtml(value ?? "")}" ${attrs}>`, error);
}

function visitSelectField(label, name, items, selected = "", placeholder = "Не выбрано", error = "", attrs = "") {
  const options = [
    `<option value="">${escapeHtml(placeholder)}</option>`,
    ...items.map((item) => {
      const value = String(item.id ?? item.value);
      return `<option value="${escapeHtml(value)}" ${String(selected) === value ? "selected" : ""}>${escapeHtml(item.name ?? item.label)}</option>`;
    }),
  ];
  return visitField(label, `<select name="${escapeHtml(name)}" ${attrs}>${options.join("")}</select>`, error);
}

function checkbox(label, name, checked) {
  return `<label class="checkbox modal-full"><input name="${escapeHtml(name)}" type="checkbox" ${checked ? "checked" : ""}> ${escapeHtml(label)}</label>`;
}

function parseVisitComment(value) {
  const lines = String(value ?? "").split("\n");
  const meta = { serviceNames: "", productNames: "", comment: "" };
  const commentLines = [];
  for (const line of lines) {
    if (line.startsWith("__services:")) meta.serviceNames = line.slice("__services:".length).trim();
    else if (line.startsWith("__products:")) meta.productNames = line.slice("__products:".length).trim();
    else commentLines.push(line);
  }
  meta.comment = commentLines.join("\n").trim();
  return meta;
}

function buildVisitComment(data) {
  return [
    data.service_names?.trim() ? `__services:${data.service_names.trim()}` : "",
    data.product_names?.trim() ? `__products:${data.product_names.trim()}` : "",
    data.comment?.trim() || "",
  ].filter(Boolean).join("\n");
}

function visitData(item) {
  return item?.visit || item || {};
}

function visitAmount(visit, field) {
  return Number(visitData(visit)[field] || 0);
}

function completedVisits(visits) {
  return (visits || []).map(visitData).filter((visit) => visit.visit_status === "completed");
}

function buildMetricsFromVisits(visits) {
  const completed = completedVisits(visits);
  if (!completed.length) return null;

  const ltv = completed.reduce((sum, visit) => sum + visitAmount(visit, "total_cost"), 0);
  const paid = completed.reduce((sum, visit) => sum + visitAmount(visit, "paid_amount"), 0);
  const lastVisitAt = completed
    .map((visit) => new Date(visit.visit_at))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((left, right) => right - left)[0];

  return {
    ltv,
    average_check: ltv / completed.length,
    visit_frequency: completed.length,
    days_since_last_visit: lastVisitAt ? Math.max(Math.floor((Date.now() - lastVisitAt.getTime()) / 86400000), 0) : null,
    churn_probability: 0,
    profit_amount: paid,
    acquisition_cost: 0,
  };
}

function mergeMetrics(metric, fallback) {
  if (!metric) return fallback;
  if (!fallback) return metric;

  return Object.fromEntries(
    Object.keys({ ...metric, ...fallback }).map((key) => {
      const value = metric[key];
      return [key, value === null || value === undefined || value === "" ? fallback[key] : value];
    }),
  );
}

function branchesFromVisits(visits) {
  const branchIds = [...new Set((visits || []).map((item) => visitData(item).branch_id).filter(Boolean))];
  return branchIds.map((branch_id) => ({ branch_id }));
}

function branchNames(branchLinks, branches) {
  return (branchLinks || [])
    .map((item) => branches.find((branch) => String(branch.id) === String(item.branch_id))?.name || `ID ${item.branch_id}`)
    .join(", ");
}

function visitDraftDefaults() {
  return {
    visit_at: new Date().toISOString().slice(0, 16),
    branch_id: "",
    department_id: "",
    workplace_id: "",
    employee_id: "",
    visit_status: "completed",
    total_cost: "0",
    discount_amount: "0",
    discount_type: "amount",
    paid_amount: "0",
    service_names: "",
    product_names: "",
    source: "",
    comment: "",
  };
}

function departmentOptions(branchId = "") {
  return state.departments.filter((item) => String(item.branch_id) === String(branchId));
}

function workplaceOptions(branchId = "", departmentId = "") {
  return state.workplaces.filter((item) =>
    String(item.branch_id) === String(branchId) && String(item.department_id) === String(departmentId));
}

function productCategoryType(categoryId) {
  return state.productCategories.find((item) => String(item.id) === String(categoryId))?.type;
}

function branchProductItems(branchId = "", type = "") {
  const branch = state.branches.find((item) => String(item.id) === String(branchId));
  const availableIds = new Set((branch?.product_item_ids || []).map((id) => String(id)));
  if (!branch || !availableIds.size) return [];
  return state.productItems.filter((item) =>
    availableIds.has(String(item.id)) && (!type || productCategoryType(item.category_id) === type));
}

function visitProductInputField(label, name, branchId, type, value = "", error = "", listKey = "") {
  const options = branchProductItems(branchId, type);
  const listId = `${listKey || name}-${type}-options`;
  return visitField(label, `
    <input name="${escapeHtml(name)}" value="${escapeHtml(value ?? "")}" list="${escapeHtml(listId)}" placeholder="${escapeHtml(branchId ? "Начните вводить название" : "Сначала выберите филиал")}">
    <datalist id="${escapeHtml(listId)}">
      ${options.map((item) => `<option value="${escapeHtml(item.title)}"></option>`).join("")}
    </datalist>
  `, error);
}

function visitEditDraftDefaults(visit) {
  const source = visitData(visit);
  const parsed = parseVisitComment(source.comment);
  return {
    visit_at: dateTimeInput(source.visit_at),
    branch_id: source.branch_id ? String(source.branch_id) : "",
    employee_id: source.employee_id ? String(source.employee_id) : "",
    visit_status: source.visit_status || "completed",
    total_cost: String(source.total_cost ?? 0),
    discount_amount: String(source.discount_amount ?? 0),
    discount_type: "amount",
    paid_amount: String(source.paid_amount ?? 0),
    service_names: parsed.serviceNames || "",
    product_names: parsed.productNames || "",
    source: source.source || "",
    comment: parsed.comment || "",
  };
}

function resolveDiscountAmount(totalCost, discountAmount, discountType = "amount") {
  const total = Number(totalCost || 0);
  const discount = Number(discountAmount || 0);
  if (discountType === "percent") {
    const percent = Math.min(Math.max(discount, 0), 100);
    return (total * percent) / 100;
  }
  return Math.max(discount, 0);
}

function calculatePaidAmount(totalCost, discountAmount, discountType = "amount") {
  const total = Number(totalCost || 0);
  const resolvedDiscount = resolveDiscountAmount(total, discountAmount, discountType);
  return String(Math.max(total - resolvedDiscount, 0));
}

function masterOptions(branchId = "", workplaceId = "") {
  const workplace = state.workplaces.find((item) => String(item.id) === String(workplaceId));
  const departmentId = workplace?.department_id ? String(workplace.department_id) : "";
  const masterRoleIds = new Set(
    state.roles
      .filter((item) => {
        const name = String(item.name || "").trim().toLowerCase();
        return name === "мастер" || name === "master";
      })
      .map((item) => String(item.id)),
  );
  const orgMasterUserIds = new Set(
    state.memberships
      .filter((item) => masterRoleIds.has(String(item.role_id)))
      .map((item) => String(item.user_id)),
  );
  const branchUserIds = new Set(
    state.branchMemberships
      .filter((item) => !branchId || String(item.branch_id) === String(branchId))
      .filter((item) => !departmentId || !item.department_id || String(item.department_id) === departmentId)
      .filter((item) => !masterRoleIds.size || masterRoleIds.has(String(item.role_id)))
      .map((item) => String(item.user_id)),
  );

  return state.users
    .filter((item) => item.is_active && !item.is_blocked)
    .filter((item) => branchId ? branchUserIds.has(String(item.id)) : orgMasterUserIds.has(String(item.id)))
    .map((item) => ({ id: item.id, name: displayUser(item) }));
}

function validateVisitData(data) {
  const errors = {};
  if (!String(data.visit_at || "").trim()) errors.visit_at = "Заполните дату и время.";
  if (!String(data.branch_id || "").trim()) errors.branch_id = "Выберите филиал.";
  if (!String(data.department_id || "").trim()) errors.department_id = "Выберите подразделение.";
  if (!String(data.workplace_id || "").trim()) errors.workplace_id = "Выберите рабочее место.";
  if (!String(data.employee_id || "").trim()) errors.employee_id = "Выберите сотрудника.";
  if (!String(data.visit_status || "").trim()) errors.visit_status = "Выберите статус.";
  if (!String(data.total_cost || "").trim()) errors.total_cost = "Укажите стоимость.";
  if (!String(data.discount_amount || "").trim()) errors.discount_amount = "Укажите скидку.";
  if (!String(data.paid_amount || "").trim()) errors.paid_amount = "Укажите сумму оплаты.";
  if (!String(data.service_names || "").trim() && !String(data.product_names || "").trim()) {
    errors.service_names = "Укажите услугу или товар.";
    errors.product_names = "Укажите услугу или товар.";
  }
  return errors;
}

function clientCreateRequiredControls(form) {
  return [...form.querySelectorAll("input, select, textarea")].filter((control) => {
    const type = String(control.type || "").toLowerCase();
    const name = String(control.name || "");
    if (control.disabled || control.readOnly) return false;
    if (["button", "submit", "reset", "hidden", "checkbox", "radio"].includes(type)) return false;
    return !["secondary_phone", "email"].includes(name);
  });
}

function syncClientCreateForm(root) {
  const form = root.querySelector("[data-client-create]");
  if (!form) return;
  const controls = clientCreateRequiredControls(form);
  controls.forEach((control) => {
    control.required = true;
  });
  const submit = form.querySelector('button[type="submit"], button.primary');
  if (submit) {
    submit.disabled = controls.some((control) => !String(control.value || "").trim());
  }
}

function visitCreateFormMarkup() {
  const visitDraft = { ...visitDraftDefaults(), ...state.visitDraft };
  const branches = state.branches;
  const departments = departmentOptions(visitDraft.branch_id);
  const workplaces = workplaceOptions(visitDraft.branch_id, visitDraft.department_id);
  const masters = masterOptions(visitDraft.branch_id, visitDraft.workplace_id);
  const errors = state.visitErrors || {};

  return `
    ${visitInputField("Дата и время", "visit_at", visitDraft.visit_at, 'type="datetime-local"', errors.visit_at)}
    ${visitSelectField("Филиал", "branch_id", branches, visitDraft.branch_id, "Выберите филиал", errors.branch_id)}
    ${visitSelectField("Подразделение", "department_id", departments, visitDraft.department_id, "Выберите подразделение", errors.department_id, visitDraft.branch_id ? "" : "disabled")}
    ${visitSelectField("Рабочее место", "workplace_id", workplaces, visitDraft.workplace_id, "Выберите рабочее место", errors.workplace_id, visitDraft.department_id ? "" : "disabled")}
    ${visitSelectField("Сотрудник", "employee_id", masters, visitDraft.employee_id, "Выберите сотрудника", errors.employee_id, visitDraft.workplace_id ? "" : "disabled")}
    ${visitField("Статус", `<select name="visit_status">
      <option value="completed" ${visitDraft.visit_status === "completed" ? "selected" : ""}>Завершен</option>
      <option value="scheduled" ${visitDraft.visit_status === "scheduled" ? "selected" : ""}>Запланирован</option>
      <option value="cancelled" ${visitDraft.visit_status === "cancelled" ? "selected" : ""}>Отменен</option>
      <option value="no_show" ${visitDraft.visit_status === "no_show" ? "selected" : ""}>Не пришел</option>
    </select>`, errors.visit_status)}
    ${visitInputField("Стоимость", "total_cost", visitDraft.total_cost, 'type="number"', errors.total_cost)}
    ${visitField("Скидка", `<div style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px;"><input name="discount_amount" type="number" value="${escapeHtml(visitDraft.discount_amount)}"><select name="discount_type"><option value="amount" ${visitDraft.discount_type === "amount" ? "selected" : ""}>₽</option><option value="percent" ${visitDraft.discount_type === "percent" ? "selected" : ""}>%</option></select></div>`, errors.discount_amount)}
    ${visitInputField("Оплачено", "paid_amount", visitDraft.paid_amount, 'type="number" readonly', errors.paid_amount)}
    ${visitProductInputField("Услуги", "service_names", visitDraft.branch_id, "service", visitDraft.service_names, errors.service_names, "visit-create-services")}
    ${visitProductInputField("Товары", "product_names", visitDraft.branch_id, "product", visitDraft.product_names, errors.product_names, "visit-create-products")}
    ${visitInputField("Источник", "source", visitDraft.source)}
    ${visitInputField("Комментарий", "comment", visitDraft.comment)}
    <button class="primary">Добавить визит</button>
    <p data-message></p>
  `;
}

function syncVisitCreateForm(root) {
  const form = root.querySelector("[data-visit-create]");
  if (!form) return;
  form.innerHTML = visitCreateFormMarkup();
}

function segmentExamples() {
  return [
    "Новые клиенты",
    "Не были более 60 дней",
    "Часто отменяют записи",
    "Покупают конкретную услугу",
    "Средний чек выше 10 000 ₽",
    "Пришли из Telegram",
    "Имеют неиспользованный сертификат",
    "Скоро день рождения",
    "Были у уволившегося сотрудника",
  ];
}

function simpleList(items, empty, map) {
  const rows = items?.length ? items.map(map) : [];
  if (!rows.length) return `<p class="empty">${escapeHtml(empty)}</p>`;
  return `<div class="simple-list">${rows.map((row) => `<div>${escapeHtml(row)}</div>`).join("")}</div>`;
}

function clientCardData(client) {
  return {
    first_name: client.first_name ?? "",
    last_name: client.last_name ?? "",
    middle_name: client.middle_name ?? "",
    telegram_id: client.telegram_id ? String(client.telegram_id) : "",
    max_id: client.max_id ? String(client.max_id) : "",
    primary_phone: client.primary_phone ?? "",
    secondary_phone: client.secondary_phone ?? "",
    email: client.email ?? "",
    vk_id: client.vk_id ? String(client.vk_id) : "",
    birth_date: client.birth_date ?? "",
    gender: client.gender ?? "",
    photo_file_id: client.photo_file_id ?? "",
    comment: client.comment ?? "",
    note: client.note ?? "",
    importance_class: String(client.importance_class ?? 0),
    online_booking_enabled: !!client.online_booking_enabled,
    referrer_client_id: client.referrer_client_id ? String(client.referrer_client_id) : "",
    api_field_1: client.api_field_1 ?? "",
    api_field_2: client.api_field_2 ?? "",
    api_field_3: client.api_field_3 ?? "",
    status: client.status ?? "active",
  };
}

async function loadClientDetails(client, orgId) {
  const [profile, metric, visits, accounts, categories, additionalFields, clientBranches, bonusTypes, bonusBalance, bonusHistory] = await Promise.all([
    api.clientProfile(client.id, orgId).catch(() => null),
    api.clientProfileMetric(client.id).catch(() => null),
    api.clientHistoryVisits(client.id).catch(() => []),
    api.clientAccounts(client.id).catch(() => null),
    api.clientCategories(client.id).catch(() => []),
    api.clientAdditionalFieldValues(client.id).catch(() => []),
    api.clientBranches(client.id).catch(() => []),
    api.bonusTypes(orgId).catch(() => []),
    api.bonusBalance(client.id).catch(() => null),
    api.bonusHistory(client.id).catch(() => []),
  ]);

  return {
    ...client,
    card: clientCardData(client),
    profile,
    metric: mergeMetrics(metric || profile?.metrics, buildMetricsFromVisits(visits)),
    visits,
    accounts,
    categories,
    additionalFields,
    clientBranches: clientBranches?.length ? clientBranches : branchesFromVisits(visits),
    bonusTypes,
    bonusBalance,
    bonusHistory,
  };
}

function modal(client) {
  if (!client) return "";
  const metric = client.metric;
  const accounts = client.accounts;
  const branches = state.branches;
  const visitDraft = { ...visitDraftDefaults(), ...state.visitDraft };
  const departments = departmentOptions(visitDraft.branch_id);
  const workplaces = workplaceOptions(visitDraft.branch_id, visitDraft.department_id);
  const masters = masterOptions(visitDraft.branch_id, visitDraft.workplace_id);
  const errors = state.visitErrors || {};
  const card = client.card;
  const loyaltyLevel = currentLoyaltyLevel(client.bonusHistory);
  const loyaltyBonusType = client.bonusBalance?.bonus_type || client.bonusTypes?.[0]?.code || "";

  return `
    <div class="modal-backdrop" data-client-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>${escapeHtml(name(client))}</h3>
          <button type="button" class="ghost" data-close-client>Закрыть</button>
        </div>
      <form class="modal-grid" data-client-edit data-permission="clients.clients.edit">
          ${field("Имя", "first_name", card.first_name)}
          ${field("Фамилия", "last_name", card.last_name)}
          ${field("Отчество", "middle_name", card.middle_name)}
          ${field("Telegram ID", "telegram_id", card.telegram_id)}
          ${field("MAX ID", "max_id", card.max_id)}
          ${field("Телефон", "primary_phone", card.primary_phone)}
          ${field("VK ID", "vk_id", card.vk_id)}
          ${field("Основной телефон", "primary_phone_copy", card.primary_phone)}
          ${field("Дополнительный телефон", "secondary_phone", card.secondary_phone)}
          ${field("Email", "email", card.email)}
          ${field("Дата рождения", "birth_date", card.birth_date, 'type="date"')}
          <label><span>Пол</span><select name="gender">
            <option value="" ${!card.gender ? "selected" : ""}>Не указан</option>
            <option value="male" ${card.gender === "male" ? "selected" : ""}>Мужской</option>
            <option value="female" ${card.gender === "female" ? "selected" : ""}>Женский</option>
          </select></label>
          ${photoField(client, state.photoPreviewUrl)}
          ${field("Комментарий", "comment", card.comment)}
          ${field("Класс важности", "importance_class", card.importance_class, 'type="number"')}
          <label><span>Статус</span><select name="status">
            <option value="active" ${card.status === "active" ? "selected" : ""}>Активен</option>
            <option value="archived" ${card.status === "archived" ? "selected" : ""}>В архиве</option>
          </select></label>
          ${checkbox("Возможность онлайн-записи", "online_booking_enabled", card.online_booking_enabled)}
          ${readonly("Дата создания", dateTime(client.created_at))}
          ${readonly("Дата последнего изменения", dateTime(client.updated_at))}
          
          ${readonly("Филиалы, в которых был клиент", branchNames(client.clientBranches, branches))}
          ${readonly("LTV", metric ? money(metric.ltv) : "")}
          ${readonly("Частота посещений", metric?.visit_frequency)}
          ${readonly("Средний чек", metric ? money(metric.average_check) : "")}
          ${readonly("Срок с последнего визита", metric?.days_since_last_visit !== null && metric?.days_since_last_visit !== undefined ? `${metric.days_since_last_visit} дней` : "")}
          ${readonly("Вероятность ухода", metric?.churn_probability !== null && metric?.churn_probability !== undefined ? `${Math.round(metric.churn_probability * 100)}%` : "")}
          ${readonly("Прибыль от клиента", metric ? money(metric.profit_amount) : "")}
          ${readonly("Стоимость привлечения", metric ? money(metric.acquisition_cost) : "")}
          <p data-message></p>
          <button class="primary">Сохранить</button>
        </form>
        <div class="subpanel">
          <h3>Сервис истории</h3>
          <form class="inline-form compact visit-form" data-visit-create data-permission="clients.visits.create">
            <label><span>Дата и время</span><input name="visit_at" type="datetime-local" value="${escapeHtml(visitDraft.visit_at)}"></label>
            ${selectField("Филиал", "branch_id", branches, visitDraft.branch_id, "Выберите филиал")}
            ${selectField("Сотрудник", "employee_id", masters, visitDraft.employee_id, "Выберите мастера")}
            <label><span>Статус</span><select name="visit_status">
              <option value="completed" ${visitDraft.visit_status === "completed" ? "selected" : ""}>Завершен</option>
              <option value="scheduled" ${visitDraft.visit_status === "scheduled" ? "selected" : ""}>Запланирован</option>
              <option value="cancelled" ${visitDraft.visit_status === "cancelled" ? "selected" : ""}>Отменен</option>
              <option value="no_show" ${visitDraft.visit_status === "no_show" ? "selected" : ""}>Не пришел</option>
            </select></label>
            <label><span>Стоимость</span><input name="total_cost" type="number" value="${escapeHtml(visitDraft.total_cost)}"></label>
            <label><span>Скидка</span><div style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px;"><input name="discount_amount" type="number" value="${escapeHtml(visitDraft.discount_amount)}"><select name="discount_type"><option value="amount" ${visitDraft.discount_type === "amount" ? "selected" : ""}>₽</option><option value="percent" ${visitDraft.discount_type === "percent" ? "selected" : ""}>%</option></select></div></label>
            <label><span>Оплачено</span><input name="paid_amount" type="number" value="${escapeHtml(visitDraft.paid_amount)}" readonly></label>
            ${visitProductInputField("Услуги", "service_names", visitDraft.branch_id, "service", visitDraft.service_names, "", "visit-panel-services")}
            ${visitProductInputField("Товары", "product_names", visitDraft.branch_id, "product", visitDraft.product_names, "", "visit-panel-products")}
            <label><span>Источник</span><input name="source" value="${escapeHtml(visitDraft.source)}"></label>
            <label><span>Комментарий</span><input name="comment" value="${escapeHtml(visitDraft.comment)}"></label>
            <button class="primary">Добавить визит</button>
            <p data-message></p>
          </form>
          <table><tbody>
            ${rows(client.visits || [], "Истории визитов пока нет.", (item) => {
              const visit = item.visit || item;
              return `<tr>
                <td><button type="button" class="ghost" data-open-visit="${escapeHtml(visit.id)}"><b>${escapeHtml(dateTime(visit.visit_at) || "Дата не указана")}</b><small>${escapeHtml(visitStatusLabel(visit.visit_status))}</small></button></td>
                <td>${escapeHtml(visitStatusLabel(visit.visit_status))}</td>
                <td><button type="button" class="ghost" data-delete-visit="${escapeHtml(visit.id)}">Удалить</button></td>
              </tr>`;
            })}
          </tbody></table>
        </div>
        <div class="subpanel">
          <h3>Счета клиента</h3>
          <div class="modal-grid">
            ${readonly("Депозит", accounts ? money(accounts.totals?.deposit_balance) : "")}
            ${readonly("Сертификаты", accounts ? money(accounts.totals?.certificate_balance) : "")}
            ${readonly("Визитов по абонементам", accounts?.totals?.subscription_visits_left)}
            ${readonly("Бонусы", accounts ? money(accounts.totals?.bonus_balance) : "")}
          </div>
        </div>
        <div class="subpanel">
          <h3>Бонусные операции</h3>
          <div class="modal-grid">
            ${readonly("Баланс бонусов", client.bonusBalance ? money(client.bonusBalance.balance) : "")}
          </div>
          <div class="modal-grid">
            ${readonly("Уровень клиента", loyaltyLevel)}
            ${readonly("Тип бонусов", bonusTypeName(client.bonusTypes, loyaltyBonusType))}
            ${readonly("Последнее действие", lastLoyaltyAction(client.bonusHistory))}
          </div>
          <form class="inline-form compact" data-client-bonus-op data-permission="loyalty.transactions.create">
            ${selectField("Операция", "transaction_type", Object.entries(bonusTransactionTypes).map(([value, label]) => ({ value, label })), state.bonusTransactionType)}
            ${selectField("Тип бонусов", "bonus_type", bonusTypeOptions(client.bonusTypes), "")}
            <label><span>Сумма</span><input name="amount" type="number" min="1" value="1"></label>
            <label><span>Причина</span><input name="reason"></label>
            <button class="primary">Выполнить</button>
            <p data-message></p>
          </form>
          <table><tbody>
            ${rows(client.bonusHistory || [], "История бонусов пока пуста.", (item) => `<tr>
              <td>${escapeHtml(item.reason || `${item.bonus_type || "bonus"} #${item.id}`)}</td>
              <td>${escapeHtml(item.transaction_type || item.operation || "")}</td>
              <td>${escapeHtml(money(item.amount))}</td>
            </tr>`)}
          </tbody></table>
        </div>
        <div class="subpanel">
          <h3>Сегменты клиента</h3>
          ${simpleList(state.segments, "Сегменты пока не рассчитаны.", (item) => `${item.name}${item.is_dynamic ? " · динамический" : ""}`)}
        </div>
      </div>
    </div>
    ${editableVisitModal(client)}
  `;
}

function visitModal(client) {
  const selected = state.selectedVisit;
  if (!selected) return "";
  const visit = selected.visit || selected;
  const parsed = parseVisitComment(visit.comment);
  return `
    <div class="modal-backdrop" data-visit-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>Визит</h3>
          <button type="button" class="ghost" data-close-visit>Закрыть</button>
        </div>
        <div class="modal-grid">
          ${readonly("Дата и время", dateTime(visit.visit_at))}
          ${readonly("Филиал", visit.branch_id)}
          ${readonly("Айди сотрудника", visit.employee_id)}
          ${readonly("Услуги", parsed.serviceNames || selected.service_ids?.join(", "))}
          ${readonly("Товары", parsed.productNames || selected.product_ids?.join(", "))}
          ${readonly("Статус визита", visitStatusLabel(visit.visit_status))}
          ${readonly("Стоимость", money(visit.total_cost))}
          ${readonly("Скидка", money(visit.discount_amount))}
          ${readonly("Оплачено", money(visit.paid_amount))}
          ${readonly("Задолженность", money(visit.debt_amount))}
          ${readonly("Источник", visit.source)}
          ${readonly("Комментарий", parsed.comment)}
        </div>
      </div>
    </div>
  `;
}

function editableVisitModal(client) {
  const selected = state.selectedVisit;
  if (!selected) return "";
  const visit = selected.visit || selected;
  const branches = state.branches;
  const masters = masterOptions();
  const draft = { ...visitEditDraftDefaults(selected), ...state.selectedVisitDraft };
  return `
    <div class="modal-backdrop" data-visit-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>Визит</h3>
          <button type="button" class="ghost" data-close-visit>Закрыть</button>
        </div>
        <form class="modal-grid" data-visit-edit data-permission="clients.visits.create">
          <label><span>Дата и время</span><input name="visit_at" type="datetime-local" value="${escapeHtml(draft.visit_at)}"></label>
          ${selectField("Филиал", "branch_id", branches, draft.branch_id, "Выберите филиал")}
          ${selectField("Мастер", "employee_id", masters, draft.employee_id, "Выберите мастера")}
          <label><span>Статус</span><select name="visit_status">
            <option value="completed" ${draft.visit_status === "completed" ? "selected" : ""}>Завершен</option>
            <option value="scheduled" ${draft.visit_status === "scheduled" ? "selected" : ""}>Запланирован</option>
            <option value="cancelled" ${draft.visit_status === "cancelled" ? "selected" : ""}>Отменен</option>
            <option value="no_show" ${draft.visit_status === "no_show" ? "selected" : ""}>Не пришел</option>
          </select></label>
          <label><span>Стоимость</span><input name="total_cost" type="number" value="${escapeHtml(draft.total_cost)}"></label>
          <label><span>Скидка</span><div style="display:grid; grid-template-columns:minmax(0,1fr) auto; gap:8px;"><input name="discount_amount" type="number" value="${escapeHtml(draft.discount_amount)}"><select name="discount_type"><option value="amount" ${draft.discount_type === "amount" ? "selected" : ""}>₽</option><option value="percent" ${draft.discount_type === "percent" ? "selected" : ""}>%</option></select></div></label>
          <label><span>Оплачено</span><input name="paid_amount" type="number" value="${escapeHtml(draft.paid_amount)}" readonly></label>
          ${visitProductInputField("Услуги", "service_names", draft.branch_id, "service", draft.service_names, "", "visit-edit-services")}
          ${visitProductInputField("Товары", "product_names", draft.branch_id, "product", draft.product_names, "", "visit-edit-products")}
          <label><span>Источник</span><input name="source" value="${escapeHtml(draft.source)}"></label>
          <label><span>Комментарий</span><input name="comment" value="${escapeHtml(draft.comment)}"></label>
          ${readonly("Задолженность", money(visit.debt_amount))}
          <p data-message></p>
          <button class="primary">Сохранить визит</button>
        </form>
      </div>
    </div>
  `;
}

export async function clients(ctx) {
  const params = new URLSearchParams(location.search);
  const search = params.get("q") || "";
  const requestedPage = Number(params.get("page") || 1);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const offset = (page - 1) * CLIENTS_PAGE_SIZE;
  const [items, branches, departments, workplaces, users, memberships, branchMemberships, roles, segments, productCategories, productItems] = await Promise.all([
    api.clients(ctx.org.id, { query: search, offset, limit: CLIENTS_PAGE_SIZE + 1 }).catch(() => []),
    api.branches(ctx.org.id).catch(() => []),
    api.departments(ctx.org.id).catch(() => []),
    api.workplaces(ctx.org.id).catch(() => []),
    api.users(ctx.org.id).catch(() => []),
    api.memberships(ctx.org.id).catch(() => []),
    api.branchMemberships(ctx.org.id).catch(() => []),
    api.roles(ctx.org.id).catch(() => []),
    api.clientSegments(ctx.org.id).catch(() => segmentExamples().map((name) => ({ name }))),
    (api.productCategories?.(ctx.org.id) || Promise.resolve([])).catch(() => []),
    (api.productItems?.(ctx.org.id) || Promise.resolve([])).catch(() => []),
  ]);

  const pageItems = items.slice(0, CLIENTS_PAGE_SIZE);
  const hasNextPage = items.length > CLIENTS_PAGE_SIZE;
  const pageUrl = (nextPage) => {
    const nextParams = new URLSearchParams();
    if (search) nextParams.set("q", search);
    if (nextPage > 1) nextParams.set("page", nextPage);
    const qs = nextParams.toString();
    return `/organizations/${ctx.org.id}/clients${qs ? `?${qs}` : ""}`;
  };

  state = { ...state, clients: pageItems, branches, departments, workplaces, users, memberships, branchMemberships, roles, segments, productCategories, productItems };

  return `
    <section class="panel" data-clients>
      <form class="inline-form" data-client-create data-permission="clients.clients.create">
        ${field("Имя", "first_name")}
        ${field("Фамилия", "last_name")}
        ${field("Отчество", "middle_name")}
        ${field("Основной телефон", "primary_phone")}
        ${field("Доп. телефон", "secondary_phone")}
        <label><span>Пол</span><select name="gender"><option value="">Не указан</option><option value="male">Мужской</option><option value="female">Женский</option></select></label>
        ${field("Email", "email")}
       
        <button class="primary">Добавить клиента</button>
        <p data-message></p>
      </form>
      <form class="client-search" data-client-search>
        <label><span>Поиск</span><input name="q" value="${escapeHtml(search)}" placeholder="Фамилия, телефон или email"></label>
        <button class="primary">Найти</button>
        ${search ? `<a class="ghost pagination-link" href="/organizations/${ctx.org.id}/clients">Сбросить</a>` : ""}
      </form>
      <div class="entity-list">
          ${rows(pageItems, "Клиентов пока нет.", clientRow)}
      </div>
      <div class="pagination">
        <span>Страница ${escapeHtml(page)}</span>
        <div>
          ${page > 1 ? `<a class="ghost pagination-link" href="${pageUrl(page - 1)}">Назад</a>` : `<button class="ghost" disabled>Назад</button>`}
          ${hasNextPage ? `<a class="ghost pagination-link" href="${pageUrl(page + 1)}">Вперед</a>` : `<button class="ghost" disabled>Вперед</button>`}
        </div>
      </div>
      <div class="subpanel">
        <h3>Сервис сегментации</h3>
        ${simpleList(segments, "Сегменты пока не настроены.", (item) => `${item.name}${item.is_dynamic ? " · динамический" : ""}`)}
      </div>
      ${modal(state.selectedClient)}
    </section>
  `;
}

export function bindClients(root, ctx) {
  const syncClientForms = () => syncClientCreateForm(root);
  syncClientForms();
  const clientFormsObserver = new MutationObserver(() => {
    syncClientForms();
  });
  clientFormsObserver.observe(root, { childList: true, subtree: true });

  syncVisitCreateForm(root);

  root.addEventListener("input", (event) => {
    if (event.target.matches('[name="photo_file"]')) {
      clearPhotoPreview();
      const file = event.target.files?.[0];
      if (file) {
        state.photoFile = file;
        state.photoPreviewUrl = URL.createObjectURL(file);
      }
      ctx.reload();
      return;
    }

    if (event.target.closest("[data-client-create]")) {
      syncClientCreateForm(root);
    }

    if (event.target.closest("[data-client-bonus-op]")) {
      state.bonusTransactionType = event.target.form?.elements.transaction_type?.value || "accrual";
    }

    const form = event.target.closest("[data-visit-create], [data-visit-edit]");
    if (form) {
      if (form.matches("[data-visit-create]")) {
        state.visitDraft = { ...state.visitDraft, ...formData(form) };
        if (event.target.name) state.visitErrors = { ...state.visitErrors, [event.target.name]: "" };
      } else {
        state.selectedVisitDraft = { ...state.selectedVisitDraft, ...formData(form) };
      }
      if (event.target.name === "branch_id" && form.matches("[data-visit-create]")) {
        state.visitDraft.department_id = "";
        state.visitDraft.workplace_id = "";
        state.visitDraft.employee_id = "";
        state.visitDraft.service_names = "";
        state.visitDraft.product_names = "";
        state.visitErrors = { ...state.visitErrors, department_id: "", workplace_id: "", employee_id: "" };
        syncVisitCreateForm(root);
        return;
      }
      if (event.target.name === "branch_id" && form.matches("[data-visit-edit]")) {
        state.selectedVisitDraft.service_names = "";
        state.selectedVisitDraft.product_names = "";
        ctx.reload();
        return;
      }
      if (event.target.name === "department_id" && form.matches("[data-visit-create]")) {
        state.visitDraft.workplace_id = "";
        state.visitDraft.employee_id = "";
        state.visitErrors = { ...state.visitErrors, workplace_id: "", employee_id: "" };
        syncVisitCreateForm(root);
        return;
      }
      if (event.target.name === "workplace_id" && form.matches("[data-visit-create]")) {
        state.visitDraft.employee_id = "";
        state.visitErrors = { ...state.visitErrors, employee_id: "" };
        syncVisitCreateForm(root);
        return;
      }
    }
    if (!form || !["total_cost", "discount_amount", "discount_type"].includes(event.target.name)) return;
    form.elements.paid_amount.value = calculatePaidAmount(
      form.elements.total_cost.value,
      form.elements.discount_amount.value,
      form.elements.discount_type?.value,
    );
    if (form.matches("[data-visit-create]")) {
      state.visitDraft.paid_amount = form.elements.paid_amount.value;
    } else {
      state.selectedVisitDraft.paid_amount = form.elements.paid_amount.value;
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.closest("[data-client-create]")) {
      syncClientCreateForm(root);
    }
    if (event.target.closest("[data-client-bonus-op]")) {
      state.bonusTransactionType = event.target.form?.elements.transaction_type?.value || "accrual";
    }

    const form = event.target.closest("[data-visit-create], [data-visit-edit]");
    if (!form) return;
    if (form.matches("[data-visit-create]")) {
      state.visitDraft = { ...state.visitDraft, ...formData(form) };
      if (event.target.name) state.visitErrors = { ...state.visitErrors, [event.target.name]: "" };
    } else {
      state.selectedVisitDraft = { ...state.selectedVisitDraft, ...formData(form) };
    }
    if (["total_cost", "discount_amount", "discount_type"].includes(event.target.name)) {
      form.elements.paid_amount.value = calculatePaidAmount(
        form.elements.total_cost.value,
        form.elements.discount_amount.value,
        form.elements.discount_type?.value,
      );
      if (form.matches("[data-visit-create]")) {
        state.visitDraft.paid_amount = form.elements.paid_amount.value;
      } else {
        state.selectedVisitDraft.paid_amount = form.elements.paid_amount.value;
      }
    }
    if (event.target.name === "branch_id" && form.matches("[data-visit-create]")) {
      state.visitDraft.department_id = "";
      state.visitDraft.workplace_id = "";
      state.visitDraft.employee_id = "";
      state.visitDraft.service_names = "";
      state.visitDraft.product_names = "";
      syncVisitCreateForm(root);
    } else if (event.target.name === "branch_id" && form.matches("[data-visit-edit]")) {
      state.selectedVisitDraft.service_names = "";
      state.selectedVisitDraft.product_names = "";
      ctx.reload();
    } else if (event.target.name === "department_id" && form.matches("[data-visit-create]")) {
      state.visitDraft.workplace_id = "";
      state.visitDraft.employee_id = "";
      syncVisitCreateForm(root);
    } else if (event.target.name === "workplace_id" && form.matches("[data-visit-create]")) {
      state.visitDraft.employee_id = "";
      syncVisitCreateForm(root);
    }
  });

  root.addEventListener("submit", async (event) => {
    const search = event.target.closest("[data-client-search]");
    if (search) {
      event.preventDefault();
      const data = formData(search);
      const params = new URLSearchParams();
      if (data.q) params.set("q", data.q);
      const qs = params.toString();
      ctx.navigate(`/organizations/${ctx.org.id}/clients${qs ? `?${qs}` : ""}`);
      return;
    }

    const form = event.target.closest("form");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");
    const data = formData(form);

    try {
      if (form.matches("[data-client-create]")) {
        const created = await api.createClient(clean({
          organization_id: ctx.org.id,
          status: "active",
          first_name: optional(data.first_name),
          last_name: optional(data.last_name),
          middle_name: optional(data.middle_name),
          primary_phone: optional(data.primary_phone),
          secondary_phone: optional(data.secondary_phone),
          email: optional(data.email),
          telegram_id: numberOrNull(data.telegram_id),
          gender: optional(data.gender),
          online_booking_enabled: true,
        }));
        upsertClient(created);
      } else if (form.matches("[data-client-edit]") && state.selectedClient) {
        const photoFile = state.photoFile || form.elements.photo_file?.files?.[0];
        let photoFileId = state.selectedClient.photo_file_id;
        if (photoFile) {
          const photoUpdated = await api.uploadClientPhoto(state.selectedClient.id, photoFile);
          photoFileId = photoUpdated.photo_file_id;
        }

        const updated = await api.updateClient(state.selectedClient.id, clean({
          first_name: optional(data.first_name),
          last_name: optional(data.last_name),
          middle_name: optional(data.middle_name),
          primary_phone: optional(data.primary_phone_copy || data.primary_phone),
          secondary_phone: optional(data.secondary_phone),
          email: optional(data.email),
          telegram_id: numberOrNull(data.telegram_id),
          max_id: numberOrNull(data.max_id),
          vk_id: numberOrNull(data.vk_id),
          birth_date: optional(data.birth_date),
          gender: optional(data.gender),
          photo_file_id: optional(photoFileId),
          comment: optional(data.comment),
          note: optional(data.note),
          importance_class: Number(data.importance_class || 0),
          online_booking_enabled: data.online_booking_enabled === "on",
          status: optional(data.status),
        }));
        upsertClient(updated);
        state.selectedClient = await loadClientDetails(updated, ctx.org.id);
        clearPhotoPreview();
      } else if (form.matches("[data-client-bonus-op]") && state.selectedClient) {
        state.bonusTransactionType = data.transaction_type || "accrual";
        const body = {
          client_id: state.selectedClient.id,
          organization_id: ctx.org.id,
          bonus_type: data.bonus_type,
          amount: Number(data.amount || 0),
          reason: data.reason,
        };
        if (data.transaction_type === "write_off") await api.writeOffBonus(body);
        else if (data.transaction_type === "expiration") await api.expireBonus(body);
        else await api.accrueBonus(body);
        state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id);
      } else if (form.matches("[data-visit-create]") && state.selectedClient) {
        const errors = validateVisitData(data);
        if (Object.keys(errors).length) {
          state.visitErrors = errors;
          syncVisitCreateForm(root);
          return;
        }
        await api.createClientVisit(clean({
          organization_id: ctx.org.id,
          client_id: state.selectedClient.id,
          visit_at: new Date(data.visit_at).toISOString(),
          branch_id: numberOrNull(data.branch_id),
          employee_id: numberOrNull(data.employee_id),
          visit_status: data.visit_status,
          total_cost: Number(data.total_cost || 0),
          discount_amount: resolveDiscountAmount(data.total_cost, data.discount_amount, data.discount_type),
          paid_amount: Number(data.paid_amount || 0),
          source: optional(data.source),
          comment: optional(buildVisitComment(data)),
        }));
        state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id);
        state.visitDraft = {};
        state.visitErrors = {};
      } else if (form.matches("[data-visit-edit]") && state.selectedClient && state.selectedVisit) {
        const currentVisit = state.selectedVisit.visit || state.selectedVisit;
        await api.updateClientVisit(currentVisit.id, clean({
          visit_at: data.visit_at ? new Date(data.visit_at).toISOString() : undefined,
          branch_id: numberOrNull(data.branch_id),
          employee_id: numberOrNull(data.employee_id),
          visit_status: optional(data.visit_status),
          total_cost: Number(data.total_cost || 0),
          discount_amount: resolveDiscountAmount(data.total_cost, data.discount_amount, data.discount_type),
          paid_amount: Number(data.paid_amount || 0),
          source: optional(data.source),
          comment: optional(buildVisitComment(data)),
        }));
        state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id);
        state.selectedVisit = (state.selectedClient.visits || []).find((item) => String((item.visit || item).id) === String(currentVisit.id)) || null;
        state.selectedVisitDraft = {};
      }
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });

  root.addEventListener("click", async (event) => {
    if (event.target.closest("[data-close-visit]")) {
      state.selectedVisit = null;
      state.selectedVisitDraft = {};
      event.target.closest("[data-visit-modal]")?.remove();
      return;
    }

    const deleteClientButton = event.target.closest("[data-delete-client]");
    if (deleteClientButton) {
      if (!confirm("Удалить клиента?")) return;
      await api.deleteClient(deleteClientButton.dataset.deleteClient);
      removeClient(deleteClientButton.dataset.deleteClient);
      if (state.selectedClient && String(state.selectedClient.id) === String(deleteClientButton.dataset.deleteClient)) {
        clearPhotoPreview();
        state.selectedClient = null;
        state.selectedVisit = null;
        state.visitDraft = {};
        state.visitErrors = {};
        state.selectedVisitDraft = {};
      }
      ctx.reload();
      return;
    }

    const clientButton = event.target.closest("[data-open-client]");
    if (clientButton) {
      const client = state.clients.find((item) => String(item.id) === String(clientButton.dataset.openClient));
      if (client) {
        clearPhotoPreview();
        state.selectedVisit = null;
        state.selectedVisitDraft = {};
        state.visitDraft = {};
        state.visitErrors = {};
        state.selectedClient = await loadClientDetails(client, ctx.org.id);
        ctx.reload();
      }
      return;
    }

    const visitButton = event.target.closest("[data-open-visit]");
    if (visitButton && state.selectedClient) {
      state.selectedVisit = (state.selectedClient.visits || []).find((item) => String((item.visit || item).id) === String(visitButton.dataset.openVisit));
      state.selectedVisitDraft = {};
      ctx.reload();
      return;
    }

    const deleteVisitButton = event.target.closest("[data-delete-visit]");
    if (deleteVisitButton && state.selectedClient) {
      const visitId = deleteVisitButton.dataset.deleteVisit;
      await api.deleteClientVisit(visitId);
      state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id);
      if (state.selectedVisit && String((state.selectedVisit.visit || state.selectedVisit).id) === String(visitId)) {
        state.selectedVisit = null;
        state.selectedVisitDraft = {};
      }
      ctx.reload();
      return;
    }

    if (event.target.closest("[data-close-client]")) {
      clearPhotoPreview();
      state.selectedClient = null;
      state.selectedVisit = null;
      state.visitDraft = {};
      state.visitErrors = {};
      state.selectedVisitDraft = {};
      event.target.closest("[data-client-modal]")?.remove();
      return;
    }

    if (event.target.closest("[data-visit-modal] .modal-card")) return;
    if (event.target.closest("[data-client-modal] .modal-card")) return;
  });

  root.addEventListener("mousedown", (event) => {
    if (event.target.matches("[data-visit-modal]")) {
      state.selectedVisit = null;
      state.selectedVisitDraft = {};
      event.target.remove();
      return;
    }

    if (event.target.matches("[data-client-modal]")) {
      clearPhotoPreview();
      state.selectedClient = null;
      state.selectedVisit = null;
      state.visitDraft = {};
      state.visitErrors = {};
      state.selectedVisitDraft = {};
      event.target.remove();
    }
  });
}
