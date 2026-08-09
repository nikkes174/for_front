import { api } from "../api.js";
import { escapeHtml, formData, normalizePhone, numberOrNull, optional, rows, selectField, setMessage } from "../dom.js";
import { branchDateTimeToUtc, dateTimeInputInTimezone, formatDateTimeInTimezone } from "../timezone.js";

const CLIENTS_PAGE_SIZE_OPTIONS = [10, 20, 50];
const DEFAULT_CLIENTS_PAGE_SIZE = 10;
const CLIENT_FILTER_STORAGE_PREFIX = "loyalty.clients.filters.";
const REGISTRATION_FIELDS_STORAGE_PREFIX = "loyalty.registrationFields.";
const CLIENT_DETAILS_CACHE_TTL_MS = 15_000;
const CLIENT_DETAILS_SHARED_CACHE_TTL_MS = 60_000;
const clientDetailsCache = new Map();
const clientDetailsRequests = new Map();
const clientDetailsSharedCache = new Map();
const REGISTRATION_FIELD_NAMES = [
  "last_name",
  "first_name",
  "middle_name",
  "phone",
  "gender",
  "telegram_id",
  "max_id",
  "vk_id",
  "email",
];

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
  visitPage: 1,
  visitDraft: {},
  visitErrors: {},
  bonusTransactionType: "accrual",
  selectedVisitDraft: {},
  photoPreviewUrl: "",
  photoFile: null,
  authLink: null,
  registrationLink: null,
  clientAuthLink: null,
  authLinks: [],
};

function showClientToast(message) {
  document.querySelector("[data-client-toast]")?.remove();
  const toast = document.createElement("div");
  toast.className = "booking-toast";
  toast.dataset.clientToast = "";
  toast.setAttribute("role", "status");
  toast.innerHTML = '<span aria-hidden="true">\u2713</span><b>' + escapeHtml(message) + "</b>";
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 200);
  }, 2600);
}

function showClientConfirm(message) {
  return new Promise((resolve) => {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop client-confirm-backdrop";
    backdrop.innerHTML = `<div class="modal-card client-confirm-card" role="dialog" aria-modal="true" aria-labelledby="client-confirm-title"><h3 id="client-confirm-title">Подтверждение</h3><p>${escapeHtml(message)}</p><div class="client-confirm-actions"><button type="button" class="client-confirm-cancel" data-client-confirm-cancel>Отмена</button><button type="button" class="client-delete-button" data-client-confirm-ok>Удалить</button></div></div>`;
    const finish = (result) => { backdrop.remove(); resolve(result); };
    backdrop.addEventListener("click", (event) => {
      if (event.target === backdrop || event.target.closest("[data-client-confirm-cancel]")) finish(false);
      if (event.target.closest("[data-client-confirm-ok]")) finish(true);
    });
    document.body.append(backdrop);
  });
}

const no = "Не указано";
const notSpecified = "Не указано";
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

function clientFullName(client) {
  return [client.last_name, client.first_name].filter(Boolean).join(" ") || name(client);
}

function clientLastVisitAt(client) {
  return client.last_visit_at
    || client.last_visit
    || client.last_visit_date
    || client.metric?.last_visit_at
    || client.profile?.metrics?.last_visit_at
    || "";
}

function parseDateValue(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function birthdayDistance(value) {
  const parsed = parseDateValue(value);
  if (!parsed) return Number.POSITIVE_INFINITY;
  const today = new Date();
  const currentYear = today.getFullYear();
  const birthday = new Date(currentYear, parsed.getMonth(), parsed.getDate());
  if (birthday < new Date(currentYear, today.getMonth(), today.getDate())) {
    birthday.setFullYear(currentYear + 1);
  }
  return Math.abs(birthday.getTime() - today.getTime());
}

function dateDistance(value) {
  const parsed = parseDateValue(value);
  return parsed ? Math.abs(parsed.getTime() - Date.now()) : Number.POSITIVE_INFINITY;
}

function clientSortValue(client, sort) {
  if (sort === "name") return String(client.last_name || client.full_name || name(client)).toLocaleLowerCase("ru-RU");
  if (sort === "birth_date") return birthdayDistance(client.birth_date);
  if (sort === "status") return statusLabel(client.status);
  if (sort === "last_visit") return dateDistance(clientLastVisitAt(client));
  return 0;
}

function sortClients(items, sort, direction) {
  const multiplier = direction === "desc" ? -1 : 1;
  return [...items].sort((left, right) => {
    const leftValue = clientSortValue(left, sort);
    const rightValue = clientSortValue(right, sort);
    if (typeof leftValue === "number" && typeof rightValue === "number") {
      return (leftValue - rightValue) * multiplier;
    }
    return String(leftValue).localeCompare(String(rightValue), "ru-RU") * multiplier;
  });
}

function clientFilterStorageKey(orgId) {
  return `${CLIENT_FILTER_STORAGE_PREFIX}${orgId || "default"}`;
}

function loadClientListFilters(orgId) {
  try {
    const saved = JSON.parse(localStorage.getItem(clientFilterStorageKey(orgId)) || "null");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

function saveClientListFilters(orgId, filters) {
  localStorage.setItem(clientFilterStorageKey(orgId), JSON.stringify(clean(filters)));
}

function filterClientsBySearch(items, search) {
  const query = String(search || "").trim().toLowerCase();
  if (!query) return items;
  const messengerMatch = query.match(/^(tg(?:_id)?|telegram(?:_id)?|max(?:_id)?)\s*[:=#]?\s*(\d+)$/i);
  const messengerField = messengerMatch?.[1].startsWith("max") ? "max" : "telegram";
  const messengerId = messengerMatch?.[2] || "";
  const phoneQuery = normalizePhone(query);
  return items.filter((client) => [
    client.full_name,
    client.last_name,
    client.first_name,
    client.middle_name,
    client.primary_phone,
    client.secondary_phone,
    client.phone,
    client.email,
    client.telegram_id,
    client.tg_id,
    client.max_id,
    client.vk_id,
  ].some((value) => String(value || "").toLowerCase().includes(query)) || (
    phoneQuery.length === 11 && [client.primary_phone, client.secondary_phone, client.phone]
      .some((value) => normalizePhone(value) === phoneQuery)
  ) || (messengerId && (
    messengerField === "max"
      ? String(client.max_id || "") === messengerId
      : [client.telegram_id, client.tg_id].some((value) => String(value || "") === messengerId)
  )));
}

function clientListUrl(ctx, filters = {}) {
  const params = new URLSearchParams();
  if (filters.search) params.set("q", filters.search);
  if (filters.sort) params.set("sort", filters.sort);
  if (filters.direction && filters.direction !== "asc") params.set("dir", filters.direction);
  if (filters.pageSize && filters.pageSize !== DEFAULT_CLIENTS_PAGE_SIZE) params.set("page_size", filters.pageSize);
  if (filters.page && filters.page > 1) params.set("page", filters.page);
  const qs = params.toString();
  return `/organizations/${ctx.org.id}/clients${qs ? `?${qs}` : ""}`;
}

function clientSortUrl(ctx, search, pageSize, sort, currentSort, currentDirection) {
  return clientListUrl(ctx, {
    search,
    pageSize,
    sort,
    direction: currentSort === sort && currentDirection === "asc" ? "desc" : "asc",
    page: state.clientList?.currentPage || 1,
  });
}

function clientTableHeader(ctx, search, pageSize, sort, direction, key, label) {
  const marker = sort === key ? (direction === "asc" ? "↑" : "↓") : "";
  const nextDirection = sort === key && direction === "asc" ? "desc" : "asc";
  return `<button type="button" class="table-sort" style="display: grid; grid-template-columns: 1fr auto 1fr; align-items: center; width: 100%;" data-client-sort-link data-client-sort="${escapeHtml(key)}" data-client-direction="${nextDirection}" aria-label="Сортировать по: ${escapeHtml(label)}"><span class="table-sort-label" style="grid-column: 2;">${escapeHtml(label)}${marker ? `<span class="table-sort-marker" style="margin-left: 6px;" aria-hidden="true">${marker}</span>` : ""}</span></button>`;
}

function clientTable(items, ctx, search, pageSize, sort, direction) {
  return `
    <table class="centered-list-table app-table">
      <thead><tr>
        <th>${clientTableHeader(ctx, search, pageSize, sort, direction, "name", "Фамилия Имя")}</th>
        <th>Телефон</th>
        <th>${clientTableHeader(ctx, search, pageSize, sort, direction, "birth_date", "Дата рождения")}</th>
        <th>${clientTableHeader(ctx, search, pageSize, sort, direction, "status", "Статус")}</th>
        <th>${clientTableHeader(ctx, search, pageSize, sort, direction, "last_visit", "Дата последнего визита")}</th>
        <th></th>
      </tr></thead>
      <tbody>
        ${rows(items, "Клиентов пока нет.", (item) => `
          <tr>
            <td><button type="button" class="ghost btn-ghost-secondary" data-open-client="${escapeHtml(item.id)}">${escapeHtml(clientFullName(item))}</button></td>
            <td>${escapeHtml(item.primary_phone || no)}</td>
            <td>${escapeHtml(date(item.birth_date) || notSpecified)}</td>
            <td>${escapeHtml(statusLabel(item.status))}</td>
            <td>${escapeHtml(date(clientLastVisitAt(item)) || no)}</td>
            <td><button type="button" class="client-delete-icon-button" data-delete-client="${escapeHtml(item.id)}" aria-label="Удалить клиента" title="Удалить клиента"><img src="/fronted/icons/basket.svg" alt=""></button></td>
          </tr>
        `)}
      </tbody>
    </table>
  `;
}

function clientPageSizeControl(pageSize) {
  return `
    <label><span>Отображать клиентов</span><select data-client-page-size>
      ${CLIENTS_PAGE_SIZE_OPTIONS.map((size) => `<option value="${size}" ${pageSize === size ? "selected" : ""}>${size}</option>`).join("")}
    </select></label>
  `;
}

function clientListMarkup(ctx, filters) {
  const search = filters.search || "";
  const pageSize = filters.pageSize || DEFAULT_CLIENTS_PAGE_SIZE;
  const sort = filters.sort || "name";
  const direction = filters.direction === "desc" ? "desc" : "asc";
  const filteredItems = filterClientsBySearch(state.clients || [], search);
  const sortedItems = sortClients(filteredItems, sort, direction);
  const pageCount = Math.max(1, Math.ceil(sortedItems.length / pageSize));
  const currentPage = Math.min(Math.max(1, Number(filters.page || 1)), pageCount);
  const offset = (currentPage - 1) * pageSize;
  const pageItems = sortedItems.slice(offset, offset + pageSize);
  const hasNextPage = currentPage < pageCount;
  state.clientList = { search, pageSize, sort, direction, currentPage };
  saveClientListFilters(ctx.org.id, state.clientList);
  return `
    ${clientTable(pageItems, ctx, search, pageSize, sort, direction)}
    <div class="pagination">
      <span>Страница ${escapeHtml(currentPage)} из ${escapeHtml(pageCount)}</span>
      <div>
        ${clientPageSizeControl(pageSize)}
        ${currentPage > 1 ? `<button type="button" class="ghost pagination-link btn-ghost-secondary" data-client-page-link data-client-page="${currentPage - 1}">Назад</button>` : `<button class="ghost btn-ghost-secondary" disabled>Назад</button>`}
        ${hasNextPage ? `<button type="button" class="ghost pagination-link btn-ghost-secondary" data-client-page-link data-client-page="${currentPage + 1}">Вперед</button>` : `<button class="ghost btn-ghost-secondary" disabled>Вперед</button>`}
      </div>
    </div>
  `;
}

function clientFiltersFromUrl(orgId) {
  const saved = loadClientListFilters(orgId);
  const params = new URLSearchParams(location.search);
  const requestedPageSize = Number(params.get("page_size") || saved.pageSize || DEFAULT_CLIENTS_PAGE_SIZE);
  const requestedPage = Number(params.get("page") || saved.currentPage || saved.page || 1);
  return {
    search: params.has("q") ? params.get("q") || "" : saved.search || "",
    sort: params.get("sort") || saved.sort || "name",
    direction: params.has("dir") ? (params.get("dir") === "desc" ? "desc" : "asc") : saved.direction === "desc" ? "desc" : "asc",
    pageSize: CLIENTS_PAGE_SIZE_OPTIONS.includes(requestedPageSize) ? requestedPageSize : DEFAULT_CLIENTS_PAGE_SIZE,
    page: Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1,
  };
}

function returnToSettingsUrl(ctx) {
  const returnTo = new URLSearchParams(location.search).get("return_to") || "";
  return returnTo.startsWith(`/organizations/${ctx.org.id}/settings`) ? returnTo : "";
}

function clientAuthLinkForm(items) {
  const options = items.map((client) => `<option value="${escapeHtml(client.id)}">${escapeHtml(clientFullName(client))}</option>`).join("");
  const authPath = state.authLink?.url || state.authLink?.path || "";
  const link = authPath ? new URL(authPath, window.location.origin).toString() : "";
  return `
    <form class="inline-form compact" data-client-auth-link-create>
      <label><span>Клиент</span><select name="client_id"><option value="">Без клиента</option>${options}</select></label>
      <button class="primary">Сгенерировать ссылку</button>
      ${link ? `
        <label><span>Ссылка в личный кабинет</span><input value="${escapeHtml(link)}" readonly data-generated-auth-link></label>
        <button type="button" class="ghost copy-icon-button" data-copy-auth-link="${escapeHtml(link)}" title="Копировать ссылку" aria-label="Копировать ссылку"><img src="/fronted/icons/copy.svg" alt=""></button>
      ` : ""}
      <p data-message></p>
    </form>
  `;
}

function clientRegistrationLinkBlock() {
  const authPath = state.registrationLink?.url || state.registrationLink?.path || "";
  const link = authPath ? new URL(authPath, window.location.origin).toString() : "";
  return `
    <div class="subpanel">
      <h3>\u0421\u0441\u044b\u043b\u043a\u0430 \u0434\u043b\u044f \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432</h3>
      ${link ? `
        <div class="inline-form compact">
          <label><span>\u041e\u0431\u0449\u0430\u044f \u0441\u0441\u044b\u043b\u043a\u0430</span><input value="${escapeHtml(link)}" readonly data-generated-auth-link></label>
          <button type="button" class="ghost copy-icon-button" data-copy-auth-link="${escapeHtml(link)}" title="Копировать ссылку" aria-label="Копировать ссылку"><img src="/fronted/icons/copy.svg" alt=""></button>
        </div>
      ` : `<p class="empty">\u0421\u0441\u044b\u043b\u043a\u0430 \u0435\u0449\u0451 \u043d\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u0430.</p>`}
    </div>
  `;
}

function selectedClientAuthLinkForm() {
  const authPath = state.clientAuthLink?.url || state.clientAuthLink?.path || "";
  const link = authPath ? new URL(authPath, window.location.origin).toString() : "";
  return `
    <form class="inline-form compact" data-client-one-time-auth-link-create>
      <button class="primary">\u0421\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443</button>
      ${link ? `
        <label><span>\u0421\u0441\u044b\u043b\u043a\u0430 \u0432 \u043b\u0438\u0447\u043d\u044b\u0439 \u043a\u0430\u0431\u0438\u043d\u0435\u0442, \u0430\u043a\u0442\u0438\u0432\u043d\u0430 5 \u043c\u0438\u043d\u0443\u0442</span><input value="${escapeHtml(link)}" readonly data-generated-auth-link></label>
        <button type="button" class="ghost copy-icon-button" data-copy-auth-link="${escapeHtml(link)}" title="Копировать ссылку" aria-label="Копировать ссылку"><img src="/fronted/icons/copy.svg" alt=""></button>
      ` : ""}
      <p data-message></p>
    </form>
  `;
}

function selectedClientReferralLinkBlock(source) {
  const registrationToken = state.registrationLink?.token || "";
  const registrationAddress = state.registrationLink?.url || state.registrationLink?.path || window.location.origin;
  if (!source?.referral_code || !registrationToken) return "";
  const registrationOrigin = new URL(registrationAddress, window.location.origin).origin;
  const url = new URL(
    `/auth/client-auth-links/${encodeURIComponent(registrationToken)}/open`,
    registrationOrigin,
  );
  url.searchParams.set("referral_code", source.referral_code);
  const referralLink = url.toString();
  return `<div class="client-referral-link-block"><h4>\u0420\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u0430\u044f \u0441\u0441\u044b\u043b\u043a\u0430</h4><div class="inline-form compact"><label><span>\u0421\u0441\u044b\u043b\u043a\u0430</span><input value="${escapeHtml(referralLink)}" readonly></label><button type="button" class="ghost copy-icon-button" data-copy-auth-link="${escapeHtml(referralLink)}" title="Копировать ссылку" aria-label="Копировать ссылку"><img src="/fronted/icons/copy.svg" alt=""></button><label class="checkbox"><input type="checkbox" data-client-referral-active="${escapeHtml(source.id)}" ${source.is_active ? "checked" : ""}> \u0410\u043a\u0442\u0438\u0432\u043d\u0430</label><label class="checkbox"><input type="checkbox" data-client-referral-one-time="${escapeHtml(source.id)}" ${source.one_time_accrual !== false ? "checked" : ""}> \u0420\u0430\u0437\u043e\u0432\u043e\u0435 \u043d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u0435</label></div></div>`;
}

function enabledRegistrationFields(orgId) {
  try {
    const saved = JSON.parse(localStorage.getItem(`${REGISTRATION_FIELDS_STORAGE_PREFIX}${orgId || "default"}`) || "null");
    if (Array.isArray(saved)) {
      return REGISTRATION_FIELD_NAMES.filter((name) => saved.includes(name));
    }
  } catch {
    // Use defaults if local settings are not readable.
  }
  return [...REGISTRATION_FIELD_NAMES];
}


function authLinkStatusLabel(link) {
  if (link.completed_at) return "\u0417\u0430\u043f\u043e\u043b\u043d\u0435\u043d\u0430";
  if (link.used_at) return "\u041e\u0442\u043a\u0440\u044b\u0442\u0430";
  if (link.expires_at && new Date(link.expires_at).getTime() <= Date.now()) return "\u0418\u0441\u0442\u0435\u043a\u043b\u0430";
  return "\u041d\u043e\u0432\u0430\u044f";
}

function authLinkClientLabel(item, clients) {
  if (!item.client_id) return "\u0411\u0435\u0437 \u043a\u043b\u0438\u0435\u043d\u0442\u0430";
  const client = clients.find((candidate) => String(candidate.id) === String(item.client_id));
  if (!client) return "\u041a\u043b\u0438\u0435\u043d\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d";
  return `<button type="button" class="ghost btn-ghost-secondary" data-open-client="${escapeHtml(client.id)}">${escapeHtml(clientFullName(client))}</button>`;
}

function clientAuthLinksList(items, clients) {
  return `
    <div class="subpanel">
      <h3>\u0421\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u0441\u0441\u044b\u043b\u043a\u0438</h3>
      ${rows(items, "\u0421\u0441\u044b\u043b\u043e\u043a \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.", (item) => `
        <div class="readonly-field auth-link-row">
          <div>${authLinkClientLabel(item, clients)}</div>
          <b>${escapeHtml(authLinkStatusLabel(item))}</b>
          <span>${escapeHtml(dateTime(item.created_at) || "")}</span>
          <div class="auth-link-actions">
            <button type="button" class="ghost btn-ghost-secondary" data-delete-auth-link="${escapeHtml(item.id)}">\u0423\u0434\u0430\u043b\u0438\u0442\u044c</button>
          </div>
        </div>
      `)}
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

function branchTimezone(branchId) {
  return state.branches.find((branch) => String(branch.id) === String(branchId))?.timezone || "Europe/Moscow";
}

function dateTime(value, branchId = null) {
  return branchId ? formatDateTimeInTimezone(value, branchTimezone(branchId)) : (value ? new Date(value).toLocaleString("ru-RU") : "");
}

function date(value) {
  return value ? new Date(value).toLocaleDateString("ru-RU") : "";
}

function dateTimeInput(value, branchId) {
  return dateTimeInputInTimezone(value, branchTimezone(branchId));
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

function currentLoyaltyLevel(history, levels) {
  const state = currentLoyaltyLevelState(history);
  const levelName = state ? state.client_level || "" : (history || []).find((item) => item.client_level)?.client_level || "";
  return (levels || []).some((level) => level.name === levelName) ? levelName : "";
}

function currentLoyaltyLevelState(history) {
  return (history || []).find((item) => ["level_assignment", "level_transition"].includes(item.target_type));
}

function lastLoyaltyAction(history) {
  const item = (history || [])[0];
  if (!item) return "";
  return [dateTime(item.created_at), item.reason || item.transaction_type].filter(Boolean).join(" · ");
}

function bonusOperationDetails(item, visits) {
  const reason = item.reason || `${item.bonus_type || "bonus"} #${item.id}`;
  const manualOperation = item.usage_restrictions?.manual_operation;
  if (manualOperation?.actor_id != null) {
    const actor = state.users.find((user) => String(user.id) === String(manualOperation.actor_id));
    const eventNames = {
      accrual: "\u041d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u0435 \u0431\u0430\u043b\u043b\u043e\u0432",
      write_off: "\u0421\u043f\u0438\u0441\u0430\u043d\u0438\u0435 \u0431\u0430\u043b\u043b\u043e\u0432",
      expiration: "\u0421\u0433\u043e\u0440\u0430\u043d\u0438\u0435 \u0431\u0430\u043b\u043b\u043e\u0432",
    };
    return [
      `\u0421\u043e\u0431\u044b\u0442\u0438\u0435: ${eventNames[item.transaction_type] || item.transaction_type || ""}`,
      `\u041f\u0440\u0438\u0447\u0438\u043d\u0430: ${reason}`,
      `\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c: ${manualOperation.actor_name || (actor ? displayUser(actor) : "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}`,
    ].join(" \u00b7 ");
  }
  const accrualDetails = item.usage_restrictions?.accrual_details;
  const details = accrualDetails ? [
    accrualDetails.level || item.client_level ? `\u0423\u0440\u043e\u0432\u0435\u043d\u044c: ${accrualDetails.level || item.client_level}` : "",
    Array.isArray(accrualDetails.rules) && accrualDetails.rules.length ? `\u041f\u0440\u0430\u0432\u0438\u043b\u0430: ${accrualDetails.rules.join(", ")}` : "",
    `\u0422\u043e\u0432\u0430\u0440\u044b: ${money(accrualDetails.product_bonus || 0)}`,
    `\u0423\u0441\u043b\u0443\u0433\u0438: ${money(accrualDetails.service_bonus || 0)}`,
  ].filter(Boolean) : [];
  const levelDetails = ["level_assignment", "level_transition"].includes(item.target_type) && item.client_level
    ? [`\u0423\u0440\u043e\u0432\u0435\u043d\u044c: ${item.client_level}`]
    : [];
  if (item.target_type !== "client_history_visit") return [reason, ...levelDetails, ...details].join(" \u00b7 ");
  const visit = (visits || []).map((entry) => entry.visit || entry)
    .find((entry) => String(entry.id) === String(item.target_id));
  if (!visit) return [reason, `\u0412\u0438\u0437\u0438\u0442 #${item.target_id}`, ...details].join(" \u00b7 ");
  const master = state.users.find((user) => String(user.id) === String(visit.employee_id));
  return [reason, dateTime(visit.visit_at, visit.branch_id), master ? `\u041c\u0430\u0441\u0442\u0435\u0440: ${displayUser(master)}` : `\u041c\u0430\u0441\u0442\u0435\u0440 #${visit.employee_id || "-"}`, ...details]
    .filter(Boolean)
    .join(" \u00b7 ");
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

function readonlyCheckbox(label, checked) {
  return `<label class="checkbox modal-full"><input type="checkbox" ${checked ? "checked" : ""} disabled> ${escapeHtml(label)}</label>`;
}

function parseVisitComment(value) {
  const lines = String(value ?? "").split("\n");
  const meta = { serviceNames: "", productNames: "", serviceCost: "", productCost: "", comment: "" };
  const commentLines = [];
  for (const line of lines) {
    if (line.startsWith("__services:")) meta.serviceNames = line.slice("__services:".length).trim();
    else if (line.startsWith("__products:")) meta.productNames = line.slice("__products:".length).trim();
    else if (line.startsWith("__service_cost:")) meta.serviceCost = line.slice("__service_cost:".length).trim();
    else if (line.startsWith("__product_cost:")) meta.productCost = line.slice("__product_cost:".length).trim();
    else commentLines.push(line);
  }
  meta.comment = commentLines.join("\n").trim();
  return meta;
}

function buildVisitComment(data) {
  return [
    data.service_names?.trim() ? `__services:${data.service_names.trim()}` : "",
    data.product_names?.trim() ? `__products:${data.product_names.trim()}` : "",
    data.service_cost !== undefined ? `__service_cost:${Number(data.service_cost || 0)}` : "",
    data.product_cost !== undefined ? `__product_cost:${Number(data.product_cost || 0)}` : "",
    data.comment?.trim() || "",
  ].filter(Boolean).join("\n");
}

function visitData(item) {
  return item?.visit || item || {};
}

function visitStatus(item) {
  const source = visitData(item);
  const value = String(
    source.visit_status || source.status || item?.visit_status || item?.status || "",
  ).trim().toLowerCase();
  return ["scheduled", "completed", "cancelled", "no_show"].includes(value)
    ? value
    : "scheduled";
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
    service_cost: "0",
    product_cost: "0",
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
  if (!branchId) return [];
  return state.productItems.filter((item) => !type || productCategoryType(item.category_id) === type);
}

function visitProductInputField(label, name, branchId, type, value = "", error = "", listKey = "") {
  const options = branchProductItems(branchId, type);
  const listId = `${listKey || name}-${type}-options`;
  const searchName = `${name}_search`;
  return `<label style="grid-column: 1 / -1;"><span>${escapeHtml(label)}</span>
    <div class="visit-item-picker">
      <input name="${escapeHtml(searchName)}" data-visit-item-search data-visit-item-name="${escapeHtml(name)}" list="${escapeHtml(listId)}" placeholder="${escapeHtml(branchId ? "\u041d\u0430\u0447\u043d\u0438\u0442\u0435 \u0432\u0432\u043e\u0434\u0438\u0442\u044c \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u0435" : "\u0421\u043d\u0430\u0447\u0430\u043b\u0430 \u0432\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0438\u043b\u0438\u0430\u043b")}" ${branchId ? "" : "disabled"}>
    </div>
    <datalist id="${escapeHtml(listId)}">
      ${options.map((item) => `<option value="${escapeHtml(item.title)}"></option>`).join("")}
    </datalist>
    <input type="hidden" name="${escapeHtml(name)}" value="${escapeHtml(value ?? "")}">
    <div data-visit-selected-items="${escapeHtml(name)}">${visitSelectedItemsMarkup(name, branchId, type, value)}</div>
    ${error ? `<small class="field-error">${escapeHtml(error)}</small>` : ""}
  </label>`;
}

function visitSelectedItems(value = "") {
  return String(value || "").split(/[,;\n]/).map((value) => {
    const match = value.trim().match(/^(.*?)(?:\s*×\s*(\d+))?$/);
    return { name: match?.[1]?.trim() || "", quantity: Math.max(Number(match?.[2] || 1), 1) };
  }).filter((item) => item.name);
}

function productStock(branchId, item) {
  const warehouseId = state.branches.find((branch) => String(branch.id) === String(branchId))?.warehouse_id;
  const amounts = Array.isArray(item?.actual_amounts) ? item.actual_amounts : [];
  if (!amounts.length) return null;
  return amounts
    .filter((entry) => !warehouseId || String(entry.storage_id) === String(warehouseId))
    .reduce((total, entry) => total + Number(entry.amount || 0), 0);
}

function visitSelectedItemsMarkup(name, branchId, type, value = "") {
  const items = branchProductItems(branchId, type);
  return visitSelectedItems(value).map((selected) => {
    const item = items.find((candidate) => String(candidate.title || "").trim().toLowerCase() === selected.name.toLowerCase());
    const stock = type === "product" ? productStock(branchId, item) : null;
    return `<div class="visit-selected-item"><span>${escapeHtml(selected.name)}</span>${type === "product" ? `<input type="number" min="1" value="${escapeHtml(selected.quantity)}" data-visit-item-quantity data-visit-item-name="${escapeHtml(name)}" data-visit-item-title="${escapeHtml(selected.name)}" aria-label="Количество">` : ""}<button type="button" class="client-delete-icon-button" data-visit-remove-item data-visit-item-name="${escapeHtml(name)}" data-visit-item-title="${escapeHtml(selected.name)}" aria-label="Удалить товар или услугу" title="Удалить товар или услугу"><img src="/fronted/icons/basket.svg" alt=""></button></div>`;
  }).join("");
}

function visitItemPrice(item) {
  return Number(item?.price ?? item?.sale_price ?? item?.unit_price ?? item?.cost ?? item?.price_min ?? item?.price_max ?? 0);
}

function visitSelectedItemsTotal(branchId, type, value = "") {
  const selected = visitSelectedItems(value);
  if (!selected.length) return 0;
  const items = branchProductItems(branchId, type);
  let total = 0;
  for (const { name, quantity } of selected) {
    const item = items.find((candidate) => String(candidate.title || "").trim().toLowerCase() === name.toLowerCase());
    if (!item) return null;
    total += visitItemPrice(item) * quantity;
  }
  return total;
}

function visitEditDraftDefaults(visit) {
  const source = visitData(visit);
  const parsed = parseVisitComment(source.comment);
  const splitCosts = visitSplitCosts(visit);
  return {
    visit_at: dateTimeInput(source.visit_at, source.branch_id),
    branch_id: source.branch_id ? String(source.branch_id) : "",
    employee_id: source.employee_id ? String(source.employee_id) : "",
    visit_status: visitStatus(visit),
    service_cost: String(splitCosts.serviceCost),
    product_cost: String(splitCosts.productCost),
    total_cost: String(splitCosts.totalCost),
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

function visitLineTotal(item) {
  const explicitTotal = Number(item?.total_amount);
  if (!Number.isNaN(explicitTotal)) return explicitTotal;
  const price = Number(item?.price || 0);
  const quantity = Number(item?.quantity || 1);
  const discount = Number(item?.discount_amount || 0);
  return Math.max(price * quantity - discount, 0);
}

function visitItemsTotal(visit, key) {
  const items = visit?.[key] || visitData(visit)[key] || [];
  return items.reduce((sum, item) => sum + visitLineTotal(item), 0);
}

function visitSplitCosts(visit) {
  const source = visitData(visit);
  const parsed = parseVisitComment(source.comment);
  const serviceItemsCost = visitItemsTotal(visit, "services");
  const productItemsCost = visitItemsTotal(visit, "products");
  const hasItemsCost = serviceItemsCost > 0 || productItemsCost > 0;
  const hasMetaCost = String(parsed.serviceCost || parsed.productCost).trim() !== "";
  const serviceCost = hasItemsCost ? serviceItemsCost : (hasMetaCost ? Number(parsed.serviceCost || 0) : Number(source.total_cost || 0));
  const productCost = hasItemsCost ? productItemsCost : Number(parsed.productCost || 0);
  return {
    serviceCost,
    productCost,
    totalCost: serviceCost + productCost,
  };
}

function visitFormData(form) {
  const data = formData(form);
  delete data.service_names_search;
  delete data.product_names_search;
  return data;
}

function calculateVisitTotalCost(data) {
  return Number(data.service_cost || 0) + Number(data.product_cost || 0);
}

function syncVisitAmounts(form) {
  const totalCost = calculateVisitTotalCost(visitFormData(form));
  form.elements.total_cost.value = String(totalCost);
  form.elements.paid_amount.value = calculatePaidAmount(
    totalCost,
    form.elements.discount_amount.value,
    form.elements.discount_type?.value,
  );
}

function syncVisitSubmitButton(form) {
  const submit = form.querySelector('button[type="submit"], button.primary');
  if (submit) submit.disabled = !(String(form.elements.service_names?.value || "").trim() || String(form.elements.product_names?.value || "").trim());
}

function syncVisitItemCost(form, name) {
  const config = {
    service_names: { type: "service", costName: "service_cost" },
    product_names: { type: "product", costName: "product_cost" },
  }[name];
  if (!config) return false;
  const total = visitSelectedItemsTotal(form.elements.branch_id?.value, config.type, visitFormData(form)[name]);
  if (total === null || !form.elements[config.costName]) return false;
  form.elements[config.costName].value = String(total);
  syncVisitAmounts(form);
  return true;
}

function addVisitSelectedItem(form, name) {
  const config = {
    service_names: { type: "service", searchName: "service_names_search" },
    product_names: { type: "product", searchName: "product_names_search" },
  }[name];
  const search = config ? form.elements[config.searchName] : null;
  const selected = form.elements[name];
  if (!search || !selected) return false;
  const value = String(search.value || "").trim();
  const item = branchProductItems(form.elements.branch_id?.value, config.type)
    .find((candidate) => String(candidate.title || "").trim().toLowerCase() === value.toLowerCase());
  if (!value || !item) return false;
  const quantity = 1;
  const selectedItems = visitSelectedItems(selected.value);
  search.setCustomValidity("");
  const names = selectedItems.filter((entry) => entry.name);
  const existing = names.find((entry) => entry.name.toLowerCase() === value.toLowerCase());
  if (existing) existing.quantity += quantity;
  else names.push({ name: value, quantity });
  selected.value = names.map((entry) => config.type === "product" ? `${entry.name} × ${entry.quantity}` : entry.name).join(", ");
  search.value = "";
  form.querySelector(`[data-visit-selected-items="${name}"]`).innerHTML = visitSelectedItemsMarkup(name, form.elements.branch_id?.value, config.type, selected.value);
  syncVisitItemCost(form, name);
  syncVisitSubmitButton(form);
  return true;
}

function masterOptions(branchId = "", departmentId = "", workplaceId = "", activeOnly = false) {
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
      .filter((item) => !departmentId || String(item.department_id) === String(departmentId))
      .filter((item) => !workplaceId || String(item.workplace_id) === String(workplaceId))
      .map((item) => String(item.user_id)),
  );

  return state.users
    .filter((item) => branchId ? branchUserIds.has(String(item.id)) : orgMasterUserIds.has(String(item.id)))
    .filter((item) => !activeOnly || item.is_active !== false)
    .map((item) => ({ id: item.id, name: displayUser(item) }));
}

function validateVisitData(data) {
  const errors = {};
  if (!String(data.visit_at || "").trim()) errors.visit_at = "Заполните дату и время.";
  if (!String(data.branch_id || "").trim()) errors.branch_id = "Выберите филиал.";
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
  const masters = masterOptions(visitDraft.branch_id, visitDraft.department_id, visitDraft.workplace_id, true);
  const errors = state.visitErrors || {};
  const hasVisitItems = Boolean(String(visitDraft.service_names || "").trim() || String(visitDraft.product_names || "").trim());

  return `
    ${visitInputField("Дата и время", "visit_at", visitDraft.visit_at, 'type="datetime-local"', errors.visit_at)}
    ${visitSelectField("Филиал", "branch_id", branches, visitDraft.branch_id, "Выберите филиал", errors.branch_id)}
    ${visitSelectField("Подразделение", "department_id", departments, visitDraft.department_id, "Выберите подразделение", errors.department_id, visitDraft.branch_id ? "" : "disabled")}
    ${visitSelectField("Рабочее место", "workplace_id", workplaces, visitDraft.workplace_id, "Выберите рабочее место", errors.workplace_id, visitDraft.department_id ? "" : "disabled")}
    ${visitSelectField("Сотрудник", "employee_id", masters, visitDraft.employee_id, "Выберите сотрудника", errors.employee_id, visitDraft.branch_id ? "" : "disabled")}
    ${visitField("Статус", `<select name="visit_status">
      <option value="completed" ${visitDraft.visit_status === "completed" ? "selected" : ""}>Завершен</option>
      <option value="scheduled" ${visitDraft.visit_status === "scheduled" ? "selected" : ""}>Запланирован</option>
      <option value="cancelled" ${visitDraft.visit_status === "cancelled" ? "selected" : ""}>Отменен</option>
      <option value="no_show" ${visitDraft.visit_status === "no_show" ? "selected" : ""}>Не пришел</option>
    </select>`, errors.visit_status)}
    ${visitInputField("\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0443\u0441\u043b\u0443\u0433", "service_cost", visitDraft.service_cost, 'type="number" min="0" step="0.01"', errors.service_cost)}
    ${visitInputField("\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0442\u043e\u0432\u0430\u0440\u043e\u0432", "product_cost", visitDraft.product_cost, 'type="number" min="0" step="0.01"', errors.product_cost)}
    ${visitInputField("\u041e\u0431\u0449\u0430\u044f \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c", "total_cost", visitDraft.total_cost, 'type="number" readonly', errors.total_cost)}
    ${visitField("Скидка", `<div class="visit-item-picker"><input name="discount_amount" type="number" value="${escapeHtml(visitDraft.discount_amount)}"><select name="discount_type"><option value="amount" ${visitDraft.discount_type === "amount" ? "selected" : ""}>₽</option><option value="percent" ${visitDraft.discount_type === "percent" ? "selected" : ""}>%</option></select></div>`, errors.discount_amount)}
    ${visitInputField("Оплачено", "paid_amount", visitDraft.paid_amount, 'type="number" readonly', errors.paid_amount)}
    ${visitProductInputField("Услуги", "service_names", visitDraft.branch_id, "service", visitDraft.service_names, errors.service_names, "visit-create-services")}
    ${visitProductInputField("Товары", "product_names", visitDraft.branch_id, "product", visitDraft.product_names, errors.product_names, "visit-create-products")}
    ${visitInputField("Источник", "source", visitDraft.source)}
    ${visitInputField("Комментарий", "comment", visitDraft.comment)}
    <button class="primary visit-create-submit" ${hasVisitItems ? "" : "disabled"}>Добавить визит</button>
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
    push_notifications_enabled: !!client.push_notifications_enabled,
    referrer_client_id: client.referrer_client_id ? String(client.referrer_client_id) : "",
    api_field_1: client.api_field_1 ?? "",
    api_field_2: client.api_field_2 ?? "",
    api_field_3: client.api_field_3 ?? "",
    status: client.status ?? "active",
  };
}

async function clientDetailsSharedResources(orgId) {
  const key = String(orgId);
  const cached = clientDetailsSharedCache.get(key);
  if (cached?.expiresAt > Date.now()) return cached.value;
  if (cached?.request) return cached.request;

  const request = Promise.all([
    api.bonusTypes(orgId).catch(() => []),
    api.bonusLevels(orgId).catch(() => []),
    api.referralSources().catch(() => []),
  ]).then(([bonusTypes, bonusLevels, referralSources]) => {
    const value = { bonusTypes, bonusLevels, referralSources };
    clientDetailsSharedCache.set(key, {
      value,
      expiresAt: Date.now() + CLIENT_DETAILS_SHARED_CACHE_TTL_MS,
    });
    return value;
  });
  clientDetailsSharedCache.set(key, { request, expiresAt: 0 });
  return request;
}

async function loadClientDetails(client, orgId, { force = false } = {}) {
  const cacheKey = String(orgId) + ":" + String(client.id);
  const cached = clientDetailsCache.get(cacheKey);
  if (!force && cached?.expiresAt > Date.now()) return cached.value;
  if (!force && clientDetailsRequests.has(cacheKey)) return clientDetailsRequests.get(cacheKey);

  const request = (async () => {
    const [profile, visits, accounts, categories, achievements, additionalFields, clientBranches, shared, bonusHistory, pushStatus, referralStats] = await Promise.all([
      api.clientProfile(client.id, orgId).catch(() => null),
      api.clientHistoryVisits(client.id).catch(() => []),
      api.clientAccounts(client.id).catch(() => null),
      api.clientCategories(client.id).catch(() => []),
      api.clientAchievements(client.id).catch(() => []),
      api.clientAdditionalFieldValues(client.id).catch(() => []),
      api.clientBranches(client.id).catch(() => []),
      clientDetailsSharedResources(orgId),
      api.bonusHistory(client.id).catch(() => []),
      api.pushStatus(orgId, client.id).catch(() => ({ enabled: false })),
      api.referralStats(client.id).catch(() => ({ invites_count: 0 })),
    ]);
    const { bonusTypes, bonusLevels, referralSources } = shared;
    const referralProgram = (referralSources || []).find((item) => !item.referrer_client_id && item.is_active) || null;
    let personalReferralSource = (referralSources || []).find((item) => String(item.referrer_client_id) === String(client.id)) || null;
    if (!personalReferralSource && referralProgram) {
      personalReferralSource = await api.createReferralSource({
        referrer_client_id: client.id,
        program_source_id: referralProgram.id,
        program_name: referralProgram.program_name,
        is_active: true,
      }).catch(() => null);
      if (personalReferralSource) referralSources.push(personalReferralSource);
    } else if (personalReferralSource && referralProgram && String(personalReferralSource.program_source_id || "") !== String(referralProgram.id)) {
      const previousSource = personalReferralSource;
      personalReferralSource = await api.updateReferralSource(personalReferralSource.id, {
        program_source_id: referralProgram.id,
        program_name: referralProgram.program_name,
      }).catch(() => previousSource);
      const sourceIndex = referralSources.findIndex((item) => String(item.id) === String(personalReferralSource.id));
      if (sourceIndex >= 0) referralSources[sourceIndex] = personalReferralSource;
    }

    const manualActorIds = [...new Set((bonusHistory || [])
      .map((item) => item.usage_restrictions?.manual_operation?.actor_id)
      .filter((actorId) => actorId != null && String(actorId) !== String(client.id) && !state.users.some((user) => String(user.id) === String(actorId))))];
    if (manualActorIds.length) {
      const missingActors = await Promise.all(manualActorIds.map((actorId) => api.user(actorId).catch(() => null)));
      state.users = [...state.users, ...missingActors.filter(Boolean)];
    }

    const bonusTypeCodes = [...new Set((bonusTypes || []).map((item) => item.code).filter(Boolean))];
    const balancesByType = await Promise.all(
      (bonusTypeCodes.length ? bonusTypeCodes : [""]).map((bonusType) => (
        api.bonusBalance(client.id, bonusType).catch(() => null)
      )),
    );
    const selectedBonusBalance = balancesByType
      .filter(Boolean)
      .sort((left, right) => Number(right.balance || 0) - Number(left.balance || 0))[0] || null;
    const clientWithPushState = {
      ...client,
      push_notifications_enabled: !!pushStatus?.enabled,
    };
    const value = {
      ...clientWithPushState,
      card: clientCardData(clientWithPushState),
      profile,
      metric: mergeMetrics(profile?.metrics, buildMetricsFromVisits(visits)),
      visits,
      accounts,
      categories,
      achievements,
      additionalFields,
      clientBranches: clientBranches?.length ? clientBranches : branchesFromVisits(visits),
      bonusTypes,
      bonusLevels,
      bonusBalance: selectedBonusBalance,
      bonusHistory,
      personalReferralSource,
      referralStats,
    };
    clientDetailsCache.set(cacheKey, {
      value,
      expiresAt: Date.now() + CLIENT_DETAILS_CACHE_TTL_MS,
    });
    return value;
  })();

  clientDetailsRequests.set(cacheKey, request);
  try {
    return await request;
  } finally {
    if (clientDetailsRequests.get(cacheKey) === request) clientDetailsRequests.delete(cacheKey);
  }
}

async function prepareExternalClientCard(clientId, orgId, resources = {}) {
  const client = await api.client(clientId, orgId);
  state = {
    ...state,
    clients: [client],
    branches: resources.branches || [],
    departments: resources.departments || [],
    workplaces: resources.workplaces || [],
    users: resources.users || [],
    memberships: resources.memberships || [],
    branchMemberships: resources.branchMemberships || [],
    roles: resources.roles || [],
    segments: resources.segments || [],
    productCategories: resources.productCategories || [],
    productItems: resources.productItems || [],
    registrationLink: resources.registrationLink || null,
  };
  clearPhotoPreview();
  state.selectedVisit = null;
  state.visitPage = 1;
  state.selectedVisitDraft = {};
  state.visitDraft = {};
  state.visitErrors = {};
  state.clientAuthLink = null;
  state.selectedClient = await loadClientDetails(client, orgId);
}

export async function openExternalClientCard(ctx, clientId, resources = {}) {
  await prepareExternalClientCard(clientId, ctx.org.id, resources);
  if (resources.selectedVisitId) {
    state.selectedVisit = (state.selectedClient?.visits || []).find(
      (item) => String((item.visit || item).id) === String(resources.selectedVisitId),
    ) || await api.clientVisitDetails(resources.selectedVisitId).catch(() => null);
    state.selectedVisitDraft = {};
  }
  const host = document.createElement("div");
  host.dataset.externalClientCardHost = "";
  if (resources.visitOnly && state.selectedVisit) host.dataset.externalVisitOnly = "";
  host.innerHTML = resources.visitOnly && state.selectedVisit
    ? editableVisitModal(state.selectedClient)
    : modal(state.selectedClient);
  document.body.append(host);
  host.querySelectorAll("[data-permission]").forEach((node) => {
    if (typeof ctx.can === "function" && !ctx.can(node.dataset.permission)) node.remove();
  });
  bindClients(host, ctx);
  const observer = new MutationObserver(() => {
    const modalSelector = resources.visitOnly ? "[data-visit-modal]" : "[data-client-modal]";
    if (host.querySelector(modalSelector)) return;
    observer.disconnect();
    host.remove();
  });
  observer.observe(host, { childList: true, subtree: true });
}

function refreshSelectedClientModal(root, ctx) {
  const pageContent = root.querySelector("[data-page-content]") || root;
  pageContent.querySelector("[data-client-modal]")?.remove();
  document.querySelectorAll("[data-visit-modal]").forEach((node) => node.remove());
  pageContent.insertAdjacentHTML("beforeend", modal(state.selectedClient));
  pageContent.querySelectorAll("[data-client-modal] [data-permission]").forEach((node) => {
    if (typeof ctx.can === "function" && !ctx.can(node.dataset.permission)) node.remove();
  });
}

function modal(client) {
  if (!client) return "";
  const metric = client.metric;
  const accounts = client.accounts;
  const branches = state.branches;
  const card = client.card;
  const loyaltyLevelState = currentLoyaltyLevelState(client.bonusHistory);
  const loyaltyLevel = currentLoyaltyLevel(client.bonusHistory, client.bonusLevels);
  const autoLevelTransitionDisabled = [true, "true"].includes(loyaltyLevelState?.usage_restrictions?.auto_level_transition_disabled);
  const loyaltyBonusType = client.bonusBalance?.bonus_type || client.bonusTypes?.[0]?.code || "";
  const profilePhoto = state.photoPreviewUrl || clientPhotoUrl(client);
  const initials = [client.first_name, client.last_name].filter(Boolean).map((part) => String(part).trim().charAt(0)).join("").slice(0, 2).toUpperCase() || "К";

  return `
    <div class="modal-backdrop" data-client-modal>
      <div class="modal-card client-profile-modal">
        <div class="modal-head">
          <h3>${escapeHtml(name(client))}</h3>
          <button type="button" class="modal-close-icon" aria-label="Закрыть" title="Закрыть" data-close-client><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button>
        </div>
        <header class="client-profile-card-head">
          <div class="client-profile-avatar">${profilePhoto ? `<img src="${escapeHtml(profilePhoto)}" alt="Фото клиента">` : `<span>${escapeHtml(initials)}</span>`}</div>
          <div class="client-profile-summary"><span>Карточка клиента</span><h4>${escapeHtml(name(client))}</h4><p>ID ${escapeHtml(client.id)} · ${escapeHtml(statusLabel(card.status))}</p></div>
        </header>
      <form class="modal-grid client-profile-form" data-client-edit data-permission="clients.clients.edit">
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
          ${readonlyCheckbox("Уведомления", card.push_notifications_enabled)}
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
          <button class="primary client-profile-save">Сохранить</button>
        </form>
        <div class="subpanel">
          <h3>\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u0441\u0441\u044b\u043b\u043a\u0438</h3>
          ${selectedClientAuthLinkForm()}
        </div>
        <div class="subpanel">
          <h3>Сервис истории</h3>
          <form class="inline-form compact visit-form" data-visit-create data-permission="clients.visits.create">
            ${visitCreateFormMarkup()}
          </form>
          ${(() => {
            const visits = client.visits || [];
            const pages = Math.max(Math.ceil(visits.length / 5), 1);
            const page = Math.min(state.visitPage, pages);
            const pageVisits = visits.slice((page - 1) * 5, page * 5);
            return `<table class="app-table"><tbody>
            ${rows(pageVisits, "Истории визитов пока нет.", (item) => {
              const visit = item.visit || item;
              const visitStatusClass = visit.visit_status === "completed" ? "is-completed" : ["cancelled", "no_show"].includes(visit.visit_status) ? "is-cancelled" : "";
              return `<tr>
                <td><button type="button" class="ghost" data-open-visit="${escapeHtml(visit.id)}"><b>${escapeHtml(dateTime(visit.visit_at, visit.branch_id) || "Дата не указана")}</b><small>${escapeHtml(visitStatusLabel(visit.visit_status))}</small></button></td>
                <td class="visit-history-status ${visitStatusClass}">${escapeHtml(visitStatusLabel(visit.visit_status))}</td>
                <td><button type="button" class="client-delete-icon-button" data-delete-visit="${escapeHtml(visit.id)}" aria-label="Удалить визит" title="Удалить визит"><img src="/fronted/icons/basket.svg" alt=""></button></td>
              </tr>`;
            })}
          </tbody></table>
          <p>Всего визитов: <b>${visits.length}</b></p>
          ${visits.length > 5 ? `<div class="visit-pagination"><button type="button" class="ghost" data-client-visits-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>←</button><span>${page} / ${pages}</span><button type="button" class="ghost" data-client-visits-page="${page + 1}" ${page >= pages ? "disabled" : ""}>→</button></div>` : ""}`;
          })()}
        </div>
        <div class="subpanel">
          <h3>Счета клиента</h3>
          <div class="modal-grid">
            ${readonly("Депозит", accounts ? money(accounts.totals?.deposit_balance) : "")}
            ${readonly("Сертификаты", accounts ? money(accounts.totals?.certificate_balance) : "")}
            ${readonly("Визитов по абонементам", accounts?.totals?.subscription_visits_left)}
            ${readonly("Бонусы", accounts ? money(accounts.totals?.bonus_balance) : "")}
            ${readonly("Приглашённых клиентов", client.referralStats?.invites_count ?? 0)}
          </div>
        </div>
        <div class="subpanel">
          <h3>Бонусные операции</h3>
          <div class="modal-grid">
            <div class="client-level-field"><div class="client-level-label"><span>Уровень клиента</span><label class="checkbox"><input type="checkbox" data-client-auto-level-transition-disabled ${autoLevelTransitionDisabled ? "checked" : ""}> Запрет автоперевода</label></div><select data-client-level-select>${[{ value: "", label: "Без уровня" }, ...(client.bonusLevels || []).map((level) => ({ value: level.name, label: level.name }))].map((option) => `<option value="${escapeHtml(option.value)}" ${option.value === loyaltyLevel ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}</select></div>
            ${readonly("Тип бонусов", bonusTypeName(client.bonusTypes, loyaltyBonusType))}
            ${readonly("Последнее действие", lastLoyaltyAction(client.bonusHistory))}
            ${readonly("Достижения", (client.achievements || []).map((item) => item.name).join(", "))}
          </div>
          ${selectedClientReferralLinkBlock(state.selectedClient.personalReferralSource)}
          <div class="client-level-save-field"><button type="button" class="primary standard-save-button" data-client-level-save disabled>Сохранить</button></div>
          <form class="inline-form compact" data-client-bonus-op data-permission="loyalty.transactions.create">
            ${selectField("Операция", "transaction_type", Object.entries(bonusTransactionTypes).map(([value, label]) => ({ value, label })), state.bonusTransactionType)}
            ${selectField("Тип бонусов", "bonus_type", bonusTypeOptions(client.bonusTypes, loyaltyBonusType), loyaltyBonusType)}
            <label><span>Сумма</span><input name="amount" type="number" min="1" value="1"></label>
            <label><span>Причина</span><input name="reason"></label>
            <button class="primary">Выполнить</button>
            <p data-message></p>
          </form>
          <table class="app-table"><tbody>
            ${rows(client.bonusHistory || [], "История бонусов пока пуста.", (item) => `<tr>
              <td>${escapeHtml(bonusOperationDetails(item, client.visits))}</td>
              <td>${escapeHtml(bonusTransactionTypes[item.transaction_type || item.operation] || item.transaction_type || item.operation || "")}</td>
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
  const splitCosts = visitSplitCosts(selected);
  return `
    <div class="modal-backdrop" data-visit-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>Визит</h3>
          <button type="button" class="modal-close-icon" aria-label="Закрыть" title="Закрыть" data-close-visit><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button>
        </div>
        <div class="modal-grid">
          ${readonly("Дата и время", dateTime(visit.visit_at, visit.branch_id))}
          ${readonly("Филиал", visit.branch_id)}
          ${readonly("Айди сотрудника", visit.employee_id)}
          ${readonly("Услуги", parsed.serviceNames || selected.service_ids?.join(", "))}
          ${readonly("Товары", parsed.productNames || selected.product_ids?.join(", "))}
          ${readonly("Статус визита", visitStatusLabel(visit.visit_status))}
          ${readonly("\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0443\u0441\u043b\u0443\u0433", money(splitCosts.serviceCost))}
          ${readonly("\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0442\u043e\u0432\u0430\u0440\u043e\u0432", money(splitCosts.productCost))}
          ${readonly("\u041e\u0431\u0449\u0430\u044f \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c", money(splitCosts.totalCost))}
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
  const draft = { ...visitEditDraftDefaults(selected), ...state.selectedVisitDraft };
  const masters = masterOptions(draft.branch_id, draft.department_id, draft.workplace_id);
  const visitPhotoAlbum = (stage, label) => {
    const photos = Array.isArray(visit[`photos_${stage}`]) ? visit[`photos_${stage}`] : [];
    return `<div class="visit-photo-album modal-full" data-client-visit-photo-album data-visit-photo-stage="${stage}" data-existing-images-count="${photos.length}">
      <div class="service-image-album-head"><strong>${escapeHtml(label)}</strong><small>До 10 изображений</small></div>
      <label class="photo-upload-control"><input name="visit_${stage}_photos" type="file" accept="image/*" multiple hidden><span class="photo-upload-button">Добавить изображения</span></label>
      <div class="service-image-previews" data-visit-photo-previews>${photos.map((photo) => `<figure class="service-image-preview"><img src="/crm-api/client-history/visits/${escapeHtml(visit.id)}/photos/${stage}/${escapeHtml(photo.id)}" alt="${escapeHtml(label)}"><button type="button" class="ghost" data-remove-client-visit-photo data-photo-id="${escapeHtml(photo.id)}">Удалить</button></figure>`).join("")}</div>
    </div>`;
  };
  return `
    <div class="modal-backdrop" data-visit-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>Визит</h3>
          <button type="button" class="modal-close-icon" aria-label="Закрыть" title="Закрыть" data-close-visit><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button>
        </div>
        <p>ID визита: ${escapeHtml(String(visit.id ?? "-"))}</p>
        <form class="modal-grid" data-visit-edit data-permission="clients.visits.create">
          <label><span>Дата и время</span><input name="visit_at" type="datetime-local" value="${escapeHtml(draft.visit_at)}"></label>
          ${selectField("Филиал", "branch_id", branches, draft.branch_id, "Выберите филиал")}
          ${selectField("Мастер", "employee_id", masters, draft.employee_id, "Выберите мастера")}
          ${readonly("Клиент", [client.last_name, client.first_name, client.middle_name].filter(Boolean).join(" ") || `#${client.id}`)}
          <label><span>Статус</span><select name="visit_status">
            <option value="completed" ${draft.visit_status === "completed" ? "selected" : ""}>Завершен</option>
            <option value="scheduled" ${draft.visit_status === "scheduled" ? "selected" : ""}>Запланирован</option>
            <option value="cancelled" ${draft.visit_status === "cancelled" ? "selected" : ""}>Отменен</option>
            <option value="no_show" ${draft.visit_status === "no_show" ? "selected" : ""}>Не пришел</option>
          </select></label>
          <label><span>\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0443\u0441\u043b\u0443\u0433</span><input name="service_cost" type="number" min="0" step="0.01" value="${escapeHtml(draft.service_cost)}"></label>
          <label><span>\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c \u0442\u043e\u0432\u0430\u0440\u043e\u0432</span><input name="product_cost" type="number" min="0" step="0.01" value="${escapeHtml(draft.product_cost)}"></label>
          <label><span>\u041e\u0431\u0449\u0430\u044f \u0441\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c</span><input name="total_cost" type="number" value="${escapeHtml(draft.total_cost)}" readonly></label>
          <label><span>Скидка</span><div class="visit-item-picker"><input name="discount_amount" type="number" value="${escapeHtml(draft.discount_amount)}"><select name="discount_type"><option value="amount" ${draft.discount_type === "amount" ? "selected" : ""}>₽</option><option value="percent" ${draft.discount_type === "percent" ? "selected" : ""}>%</option></select></div></label>
          <label><span>Оплачено</span><input name="paid_amount" type="number" value="${escapeHtml(draft.paid_amount)}" readonly></label>
          ${visitProductInputField("Услуги", "service_names", draft.branch_id, "service", draft.service_names, "", "visit-edit-services")}
          ${visitProductInputField("Товары", "product_names", draft.branch_id, "product", draft.product_names, "", "visit-edit-products")}
          <label><span>Источник</span><input name="source" value="${escapeHtml(draft.source)}"></label>
          <label><span>Комментарий</span><input name="comment" value="${escapeHtml(draft.comment)}"></label>
          ${readonly("Задолженность", money(visit.debt_amount))}
          ${visitPhotoAlbum("before", "Фото до")}
          ${visitPhotoAlbum("after", "Фото после")}
          ${visitPhotoAlbum("comment", "Фото к комментарию")}
          <p data-message></p>
          <button class="primary">Сохранить визит</button>
        </form>
      </div>
    </div>
  `;
}

export async function clients(ctx) {
  const filters = clientFiltersFromUrl(ctx.org.id);
  const params = new URLSearchParams(location.search);
  const search = filters.search;
  const selectedClientId = params.get("client_id") || "";
  const [items, branches, departments, workplaces, users, memberships, branchMemberships, roles, segments, productCategories, productItems, registrationLink] = await Promise.all([
    api.clients(ctx.org.id, { offset: 0, limit: 10000 }).catch(() => []),
    api.branches(ctx.org.id).catch(() => []),
    api.departments(ctx.org.id).catch(() => []),
    api.workplaces(ctx.org.id).catch(() => []),
    api.users(ctx.org.id, 500).catch(() => []),
    api.memberships(ctx.org.id).catch(() => []),
    api.branchMemberships(ctx.org.id).catch(() => []),
    api.roles(ctx.org.id).catch(() => []),
    api.clientSegments(ctx.org.id).catch(() => segmentExamples().map((name) => ({ name }))),
    (api.productCategories?.(ctx.org.id) || Promise.resolve([])).catch(() => []),
    (api.productItems?.(ctx.org.id) || Promise.resolve([])).catch(() => []),
    api.clientRegistrationLink(ctx.org.id).catch(() => null),
  ]);

  state = { ...state, clients: items, branches, departments, workplaces, users, memberships, branchMemberships, roles, segments, productCategories, productItems, registrationLink };
  if (selectedClientId && String(state.selectedClient?.id || "") !== String(selectedClientId)) {
    const selectedClient = items.find((item) => String(item.id) === String(selectedClientId))
      || await api.client(selectedClientId, ctx.org.id).catch(() => null);
    if (selectedClient) {
      clearPhotoPreview();
      state.selectedVisit = null;
      state.selectedVisitDraft = {};
      state.visitDraft = {};
      state.visitErrors = {};
      state.clientAuthLink = null;
      state.selectedClient = await loadClientDetails(selectedClient, ctx.org.id);
    }
  }

return `
  <section class="panel" data-clients>
    <form
      class="inline-form"
      data-client-create
      data-permission="clients.clients.create"
    >
      ${field("Имя", "first_name")}
      ${field("Фамилия", "last_name")}
      ${field("Отчество", "middle_name")}
      ${field("Основной телефон", "primary_phone")}
      ${field("Доп. телефон", "secondary_phone")}

      <label>
        <span>Пол</span>
        <select name="gender">
          <option value="">Не указан</option>
          <option value="male">Мужской</option>
          <option value="female">Женский</option>
        </select>
      </label>

      ${field("Email", "email")}

      <button class="primary">Добавить клиента</button>
      <p data-message></p>
    </form>

    <form class="client-search" data-client-search>
      <label>
        <span>Поиск</span>
        <input
          name="q"
          value="${escapeHtml(search)}"
          placeholder="Фамилия, телефон, email, tg_id, max_id"
        >
      </label>

      <button class="primary client-search-submit">Найти</button>

      ${search
        ? `
          <button
            type="button"
            class="ghost pagination-link"
            data-client-search-reset
          >
            Сбросить
          </button>
        `
        : ""}
    </form>

    <div data-client-list>
      ${clientListMarkup(ctx, filters)}
    </div>

    ${clientRegistrationLinkBlock()}

    ${modal(state.selectedClient)}
  </section>
`;
}

export function bindClients(root, ctx) {
  const syncClientForms = () => syncClientCreateForm(root);
  const updateClientList = (nextFilters = {}) => {
    const list = root.querySelector("[data-client-list]");
    if (!list) return;
    const filters = {
      ...(state.clientList || clientFiltersFromUrl(ctx.org.id)),
      ...nextFilters,
    };
    list.innerHTML = clientListMarkup(ctx, filters);
    const searchInput = root.querySelector("[data-client-search] input[name='q']");
    if (searchInput) searchInput.value = state.clientList.search || "";
    const resetButton = root.querySelector("[data-client-search-reset]");
    const searchForm = root.querySelector("[data-client-search]");
    if (searchForm && !state.clientList.search && resetButton) resetButton.remove();
    if (searchForm && state.clientList.search && !resetButton) {
      searchForm.insertAdjacentHTML("beforeend", '<button type="button" class="ghost pagination-link" data-client-search-reset>Сбросить</button>');
    }
    history.replaceState(null, "", clientListUrl(ctx, state.clientList));
  };
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
        state.visitDraft = { ...state.visitDraft, ...visitFormData(form) };
        if (event.target.name) state.visitErrors = { ...state.visitErrors, [event.target.name]: "" };
      } else {
        state.selectedVisitDraft = { ...state.selectedVisitDraft, ...visitFormData(form) };
      }
      if (event.target.name === "service_names_search") addVisitSelectedItem(form, "service_names");
      if (event.target.name === "product_names_search") addVisitSelectedItem(form, "product_names");
      if (syncVisitItemCost(form, event.target.name)) {
        const data = visitFormData(form);
        if (form.matches("[data-visit-create]")) state.visitDraft = { ...state.visitDraft, ...data };
        else state.selectedVisitDraft = { ...state.selectedVisitDraft, ...data };
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
        state.visitErrors = { ...state.visitErrors, workplace_id: "" };
        syncVisitCreateForm(root);
        return;
      }
      if (event.target.name === "workplace_id" && form.matches("[data-visit-create]")) {
        state.visitDraft.employee_id = "";
        syncVisitCreateForm(root);
        return;
      }
    }
    if (!form || !["service_cost", "product_cost", "discount_amount", "discount_type"].includes(event.target.name)) return;
    syncVisitAmounts(form);
    if (form.matches("[data-visit-create]")) {
      state.visitDraft.total_cost = form.elements.total_cost.value;
      state.visitDraft.paid_amount = form.elements.paid_amount.value;
    } else {
      state.selectedVisitDraft.total_cost = form.elements.total_cost.value;
      state.selectedVisitDraft.paid_amount = form.elements.paid_amount.value;
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches('[name^="visit_"][name$="_photos"]')) {
      const album = event.target.closest("[data-client-visit-photo-album]");
      const previews = album?.querySelector("[data-visit-photo-previews]");
      const files = [...(event.target.files || [])];
      const existing = Number(album?.dataset.existingImagesCount || 0);
      if (!album || !previews || !files.length) return;
      if (existing + files.length > 10) { event.target.value = ""; alert("Можно добавить не более 10 фотографий в альбом."); return; }
      previews.querySelectorAll("[data-visit-photo-pending]").forEach((preview) => preview.remove());
      previews.insertAdjacentHTML("beforeend", files.map((file) => `<figure class="service-image-preview" data-visit-photo-pending><img src="${escapeHtml(URL.createObjectURL(file))}" alt="Предпросмотр фотографии визита"></figure>`).join(""));
      return;
    }
    if (event.target.matches("[data-visit-item-search]")) {
      const form = event.target.closest("[data-visit-create], [data-visit-edit]");
      if (form && addVisitSelectedItem(form, event.target.dataset.visitItemName)) {
        const data = visitFormData(form);
        if (form.matches("[data-visit-create]")) state.visitDraft = { ...state.visitDraft, ...data };
        else state.selectedVisitDraft = { ...state.selectedVisitDraft, ...data };
      }
      return;
    }
    if (event.target.matches("[data-visit-item-quantity]")) {
      const input = event.target;
      const form = input.closest("[data-visit-create], [data-visit-edit]");
      const name = input.dataset.visitItemName;
      const hidden = form?.elements[name];
      if (!form || !hidden) return;
      const selected = visitSelectedItems(hidden.value);
      const quantity = Math.max(1, Number(input.value || 1));
      const entry = selected.find((candidate) => candidate.name.toLowerCase() === String(input.dataset.visitItemTitle || "").trim().toLowerCase());
      if (!entry) return;
      entry.quantity = quantity;
      hidden.value = selected.map((candidate) => `${candidate.name} \u00d7 ${candidate.quantity}`).join(", ");
      input.value = String(quantity);
      form.querySelector(`[data-visit-selected-items="${name}"]`).innerHTML = visitSelectedItemsMarkup(name, form.elements.branch_id?.value, "product", hidden.value);
      syncVisitItemCost(form, name);
      const data = visitFormData(form);
      if (form.matches("[data-visit-create]")) state.visitDraft = { ...state.visitDraft, ...data };
      else state.selectedVisitDraft = { ...state.selectedVisitDraft, ...data };
      return;
    }
    if (event.target.matches("[data-client-level-select], [data-client-auto-level-transition-disabled]") && state.selectedClient) {
      const saveButton = root.querySelector("[data-client-level-save]");
      saveButton.disabled = false;
      saveButton.dataset.levelDirty = "true";
      return;
    }
    if (event.target.matches("[data-client-referral-active], [data-client-referral-one-time]") && state.selectedClient) {
      const saveButton = root.querySelector("[data-client-level-save]");
      saveButton.disabled = false;
      saveButton.dataset.referralDirty = "true";
      return;
    }
    if (event.target.matches("[data-client-page-size]")) {
      updateClientList({
        pageSize: Number(event.target.value),
        page: state.clientList?.currentPage || 1,
      });
      return;
    }
    if (event.target.closest("[data-client-create]")) {
      syncClientCreateForm(root);
    }
    if (event.target.closest("[data-client-bonus-op]")) {
      state.bonusTransactionType = event.target.form?.elements.transaction_type?.value || "accrual";
    }

    const form = event.target.closest("[data-visit-create], [data-visit-edit]");
    if (!form) return;
    if (form.matches("[data-visit-create]")) {
      state.visitDraft = { ...state.visitDraft, ...visitFormData(form) };
      if (event.target.name) state.visitErrors = { ...state.visitErrors, [event.target.name]: "" };
    } else {
      state.selectedVisitDraft = { ...state.selectedVisitDraft, ...visitFormData(form) };
    }
    if (syncVisitItemCost(form, event.target.name)) {
      const data = visitFormData(form);
      if (form.matches("[data-visit-create]")) state.visitDraft = { ...state.visitDraft, ...data };
      else state.selectedVisitDraft = { ...state.selectedVisitDraft, ...data };
    }
    if (["service_cost", "product_cost", "discount_amount", "discount_type"].includes(event.target.name)) {
      syncVisitAmounts(form);
      if (form.matches("[data-visit-create]")) {
        state.visitDraft.total_cost = form.elements.total_cost.value;
        state.visitDraft.paid_amount = form.elements.paid_amount.value;
      } else {
        state.selectedVisitDraft.total_cost = form.elements.total_cost.value;
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
      const query = String(data.q || "").trim();
      updateClientList({
        search: query,
        page: state.clientList?.currentPage || 1,
      });
      return;
    }

    const form = event.target.closest("form");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");
    const data = form.matches("[data-visit-create], [data-visit-edit]") ? visitFormData(form) : formData(form);
    let successToastMessage = "";

    try {
      if (form.matches("[data-client-one-time-auth-link-create]") && state.selectedClient) {
        const registrationSettings = await api.clientRegistrationFields(ctx.org.id).catch(() => null);
        state.clientAuthLink = await api.createClientAuthLink(clean({
          organization_id: ctx.org.id,
          client_id: state.selectedClient.id,
          expires_in_seconds: 300,
          one_time: false,
          registration_fields: Array.isArray(registrationSettings?.fields) ? registrationSettings.fields : enabledRegistrationFields(ctx.org.id),
        }));
        form.outerHTML = selectedClientAuthLinkForm();
        showClientToast("\u0421\u0441\u044b\u043b\u043a\u0430 \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u0430");
        return;
      } else if (form.matches("[data-client-create]")) {
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
        state.selectedClient = await loadClientDetails(updated, ctx.org.id, { force: true });
        clearPhotoPreview();
        successToastMessage = "\u0414\u0430\u043d\u043d\u044b\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b";
      } else if (form.matches("[data-client-bonus-op]") && state.selectedClient) {
        state.bonusTransactionType = data.transaction_type || "accrual";
        const body = {
          client_id: state.selectedClient.id,
          organization_id: ctx.org.id,
          bonus_type: data.bonus_type || state.selectedClient.bonusBalance?.bonus_type || state.selectedClient.bonusTypes?.[0]?.code || "",
          amount: Number(data.amount || 0),
          reason: data.reason,
        };
        if (data.transaction_type === "write_off") await api.writeOffBonus(body);
        else if (data.transaction_type === "expiration") await api.expireBonus(body);
        else await api.accrueBonus(body);
        state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id, { force: true });
        successToastMessage = "\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u044f \u0432\u044b\u043f\u043e\u043b\u043d\u0435\u043d\u0430";
      } else if (form.matches("[data-visit-create]") && state.selectedClient) {
        data.total_cost = String(calculateVisitTotalCost(data));
        data.paid_amount = calculatePaidAmount(data.total_cost, data.discount_amount, data.discount_type);
        const errors = validateVisitData(data);
        if (Object.keys(errors).length) {
          state.visitErrors = errors;
          syncVisitCreateForm(root);
          return;
        }
        await api.createClientVisit(clean({
          organization_id: ctx.org.id,
          client_id: state.selectedClient.id,
          visit_at: branchDateTimeToUtc(data.visit_at, branchTimezone(data.branch_id)),
          branch_id: numberOrNull(data.branch_id),
          employee_id: numberOrNull(data.employee_id),
          visit_status: data.visit_status,
          total_cost: Number(data.total_cost || 0),
          discount_amount: resolveDiscountAmount(data.total_cost, data.discount_amount, data.discount_type),
          paid_amount: Number(data.paid_amount || 0),
          source: optional(data.source),
          comment: optional(buildVisitComment(data)),
        }));
        showClientToast("\u0412\u0438\u0437\u0438\u0442 \u0441\u043e\u0437\u0434\u0430\u043d");
        state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id, { force: true })
          .catch(() => state.selectedClient);
        state.visitDraft = {};
        state.visitErrors = {};
      } else if (form.matches("[data-visit-edit]") && state.selectedClient && state.selectedVisit) {
        data.total_cost = String(calculateVisitTotalCost(data));
        data.paid_amount = calculatePaidAmount(data.total_cost, data.discount_amount, data.discount_type);
        const currentVisit = state.selectedVisit.visit || state.selectedVisit;
        await api.updateClientVisit(currentVisit.id, clean({
          visit_at: data.visit_at ? branchDateTimeToUtc(data.visit_at, branchTimezone(data.branch_id)) : undefined,
          branch_id: numberOrNull(data.branch_id),
          employee_id: numberOrNull(data.employee_id),
          visit_status: optional(data.visit_status),
          total_cost: Number(data.total_cost || 0),
          discount_amount: resolveDiscountAmount(data.total_cost, data.discount_amount, data.discount_type),
          paid_amount: Number(data.paid_amount || 0),
          source: optional(data.source),
          comment: optional(buildVisitComment(data)),
        }));

        await Promise.all([
          form.elements.visit_before_photos?.files?.length ? api.uploadVisitPhotos(currentVisit.id, "before", form.elements.visit_before_photos.files) : null,
          form.elements.visit_after_photos?.files?.length ? api.uploadVisitPhotos(currentVisit.id, "after", form.elements.visit_after_photos.files) : null,
          form.elements.visit_comment_photos?.files?.length ? api.uploadVisitPhotos(currentVisit.id, "comment", form.elements.visit_comment_photos.files) : null,
        ].filter(Boolean));
        state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id, { force: true });
        state.selectedVisit = (state.selectedClient.visits || []).find((item) => String((item.visit || item).id) === String(currentVisit.id)) || null;
        state.selectedVisitDraft = {};
      }
      if (successToastMessage) showClientToast(successToastMessage);
      const externalVisitHost = form.closest("[data-external-visit-only]");
      if (externalVisitHost) {
        externalVisitHost.innerHTML = editableVisitModal(state.selectedClient);
        externalVisitHost.querySelectorAll("[data-permission]").forEach((node) => {
          if (typeof ctx.can === "function" && !ctx.can(node.dataset.permission)) node.remove();
        });
        return;
      }
      if (form.closest("[data-client-modal]") || (form.matches("[data-visit-edit]") && root.querySelector("[data-client-modal]"))) {
        refreshSelectedClientModal(root, ctx);
        return;
      }
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });

  root.addEventListener("click", async (event) => {
    const removeVisitPhoto = event.target.closest("[data-remove-client-visit-photo]");
    if (removeVisitPhoto) {
      const form = removeVisitPhoto.closest("[data-visit-edit]");
      const album = removeVisitPhoto.closest("[data-client-visit-photo-album]");
      try {
        await api.deleteVisitPhoto(form && state.selectedVisit ? (state.selectedVisit.visit || state.selectedVisit).id : null, album?.dataset.visitPhotoStage, removeVisitPhoto.dataset.photoId);
        removeVisitPhoto.closest(".service-image-preview")?.remove();
        if (album) album.dataset.existingImagesCount = String(Math.max(Number(album.dataset.existingImagesCount || 1) - 1, 0));
      } catch (error) {
        alert(error.message);
      }
      return;
    }
    const visitPageButton = event.target.closest("[data-client-visits-page]");
    if (visitPageButton) {
      state.visitPage = Number(visitPageButton.dataset.clientVisitsPage) || 1;
      ctx.reload();
      return;
    }
    const saveLevelButton = event.target.closest("[data-client-level-save]");
    if (saveLevelButton && state.selectedClient) {
      const select = root.querySelector("[data-client-level-select]");
      const autoTransitionCheckbox = root.querySelector("[data-client-auto-level-transition-disabled]");
      const referralActive = root.querySelector("[data-client-referral-active]");
      const referralOneTime = root.querySelector("[data-client-referral-one-time]");
      const requests = [];
      if (saveLevelButton.dataset.levelDirty === "true") {
        requests.push(api.setClientLevel(state.selectedClient.id, ctx.org.id, select.value, autoTransitionCheckbox.checked));
      }
      if (saveLevelButton.dataset.referralDirty === "true" && state.selectedClient.personalReferralSource && referralActive && referralOneTime) {
        requests.push(api.updateReferralSource(state.selectedClient.personalReferralSource.id, {
          is_active: referralActive.checked,
          one_time_accrual: referralOneTime.checked,
        }).then((source) => {
          state.selectedClient.personalReferralSource = source;
        }));
      }
      if (!requests.length) return;
      saveLevelButton.disabled = true;
      try {
        await Promise.all(requests);
        delete saveLevelButton.dataset.levelDirty;
        delete saveLevelButton.dataset.referralDirty;
        saveLevelButton.textContent = "\u0421\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e";
        showClientToast("\u0414\u0430\u043d\u043d\u044b\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b");
      } catch {
        saveLevelButton.disabled = false;
      }
      return;
    }
    const removeVisitItemButton = event.target.closest("[data-visit-remove-item]");
    if (removeVisitItemButton) {
      event.preventDefault();
      const form = removeVisitItemButton.closest("[data-visit-create], [data-visit-edit]");
      const name = removeVisitItemButton.dataset.visitItemName;
      const selected = form?.elements[name];
      if (!form || !selected) return;
      const title = String(removeVisitItemButton.dataset.visitItemTitle || "").trim().toLowerCase();
      const type = name === "product_names" ? "product" : "service";
      selected.value = visitSelectedItems(selected.value)
        .filter((item) => item.name.toLowerCase() !== title)
        .map((item) => type === "product" ? `${item.name} × ${item.quantity}` : item.name)
        .join(", ");
      form.querySelector(`[data-visit-selected-items="${name}"]`).innerHTML = visitSelectedItemsMarkup(name, form.elements.branch_id?.value, type, selected.value);
      syncVisitItemCost(form, name);
      syncVisitSubmitButton(form);
      const data = visitFormData(form);
      if (form.matches("[data-visit-create]")) state.visitDraft = { ...state.visitDraft, ...data };
      else state.selectedVisitDraft = { ...state.selectedVisitDraft, ...data };
      return;
    }
    const addVisitItemButton = event.target.closest("[data-visit-add-item]");
    if (addVisitItemButton) {
      event.preventDefault();
      const form = addVisitItemButton.closest("[data-visit-create], [data-visit-edit]");
      if (form && addVisitSelectedItem(form, addVisitItemButton.dataset.visitAddItem)) {
        const data = visitFormData(form);
        if (form.matches("[data-visit-create]")) state.visitDraft = { ...state.visitDraft, ...data };
        else state.selectedVisitDraft = { ...state.selectedVisitDraft, ...data };
      }
      return;
    }

    const resetSearchButton = event.target.closest("[data-client-search-reset]");
    if (resetSearchButton) {
      event.preventDefault();
      updateClientList({ search: "", page: state.clientList?.currentPage || 1 });
      return;
    }

    const listLink = event.target.closest("[data-client-page-link], [data-client-sort-link]");
    if (listLink) {
      event.preventDefault();
      updateClientList({
        sort: listLink.dataset.clientSort || state.clientList?.sort || "name",
        direction: listLink.dataset.clientDirection || state.clientList?.direction || "asc",
        page: Number(listLink.dataset.clientPage || state.clientList?.currentPage || 1),
      });
      return;
    }

    const copyAuthLinkButton = event.target.closest("[data-copy-auth-link]");
    if (copyAuthLinkButton) {
      const link = copyAuthLinkButton.dataset.copyAuthLink;
      if (link) {
        await navigator.clipboard.writeText(link);
        showClientToast("Ссылка скопирована");
      }
      return;
    }

    if (event.target.closest("[data-close-visit]")) {
      state.selectedVisit = null;
      state.selectedVisitDraft = {};
      event.target.closest("[data-visit-modal]")?.remove();
      return;
    }

    const deleteAuthLinkButton = event.target.closest("[data-delete-auth-link]");
    if (deleteAuthLinkButton) {
      await api.deleteClientAuthLink(deleteAuthLinkButton.dataset.deleteAuthLink);
      state.authLinks = state.authLinks.filter((item) => String(item.id) !== String(deleteAuthLinkButton.dataset.deleteAuthLink));
      ctx.reload();
      return;
    }

    const deleteClientButton = event.target.closest("[data-delete-client]");
    if (deleteClientButton) {
      if (!await showClientConfirm("Удалить клиента?")) return;
      await api.deleteClient(deleteClientButton.dataset.deleteClient);
      removeClient(deleteClientButton.dataset.deleteClient);
      if (state.selectedClient && String(state.selectedClient.id) === String(deleteClientButton.dataset.deleteClient)) {
        clearPhotoPreview();
        state.selectedClient = null;
        state.selectedVisit = null;
        state.visitPage = 1;
        state.visitDraft = {};
        state.visitErrors = {};
        state.selectedVisitDraft = {};
        state.clientAuthLink = null;
      }
      showClientToast("Клиент удалён");
      ctx.reload();
      return;
    }

    const clientButton = event.target.closest("[data-open-client]");
    if (clientButton) {
      const client = state.clients.find((item) => String(item.id) === String(clientButton.dataset.openClient));
      if (client) {
        clearPhotoPreview();
        state.selectedVisit = null;
        state.visitPage = 1;
        state.selectedVisitDraft = {};
        state.visitDraft = {};
        state.visitErrors = {};
        state.clientAuthLink = null;
        state.selectedClient = await loadClientDetails(client, ctx.org.id);
        refreshSelectedClientModal(root, ctx);
      }
      return;
    }

    const visitButton = event.target.closest("[data-open-visit]");
    if (visitButton && state.selectedClient) {
      state.selectedVisit = (state.selectedClient.visits || []).find((item) => String((item.visit || item).id) === String(visitButton.dataset.openVisit));
      state.selectedVisitDraft = {};
      document.querySelectorAll("[data-visit-modal]").forEach((node) => node.remove());
      root.insertAdjacentHTML("beforeend", editableVisitModal(state.selectedClient));
      root.querySelectorAll("[data-visit-modal] [data-permission]").forEach((node) => {
        if (typeof ctx.can === "function" && !ctx.can(node.dataset.permission)) node.remove();
      });
      return;
    }

    const deleteVisitButton = event.target.closest("[data-delete-visit]");
    if (deleteVisitButton && state.selectedClient) {
      const visitId = deleteVisitButton.dataset.deleteVisit;
      await api.deleteClientVisit(visitId);
      state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id, { force: true });
      if (state.selectedVisit && String((state.selectedVisit.visit || state.selectedVisit).id) === String(visitId)) {
        state.selectedVisit = null;
        state.selectedVisitDraft = {};
      }
      ctx.reload();
      return;
    }

    if (event.target.closest("[data-close-client]")) {
      const returnUrl = returnToSettingsUrl(ctx);
      clearPhotoPreview();
      state.selectedClient = null;
      state.selectedVisit = null;
      state.visitDraft = {};
      state.visitErrors = {};
      state.selectedVisitDraft = {};
      state.clientAuthLink = null;
      if (returnUrl) {
        ctx.navigate(returnUrl);
        return;
      }
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
      const returnUrl = returnToSettingsUrl(ctx);
      clearPhotoPreview();
      state.selectedClient = null;
      state.selectedVisit = null;
      state.visitDraft = {};
      state.visitErrors = {};
      state.selectedVisitDraft = {};
      state.clientAuthLink = null;
      if (returnUrl) {
        ctx.navigate(returnUrl);
        return;
      }
      event.target.remove();
    }
  });
}
