import { api } from "../api.js";
import { escapeHtml, formData, numberOrNull, optional, rows, selectField, setMessage } from "../dom.js";

let state = {
  clients: [],
  branches: [],
  users: [],
  memberships: [],
  branchMemberships: [],
  roles: [],
  segments: [],
  selectedClient: null,
  selectedVisit: null,
  visitDraft: {},
  selectedVisitDraft: {},
};

const no = "Не указано";

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

function readonly(label, value) {
  return `<div class="readonly-field"><span>${escapeHtml(label)}</span><b>${escapeHtml(String(value ?? "").trim() || no)}</b></div>`;
}

function field(label, name, value = "", attrs = "") {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" value="${escapeHtml(value ?? "")}" ${attrs}></label>`;
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
    employee_id: "",
    visit_status: "completed",
    total_cost: "0",
    discount_amount: "0",
    paid_amount: "0",
    service_names: "",
    product_names: "",
    comment: "",
  };
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
    paid_amount: String(source.paid_amount ?? 0),
    service_names: parsed.serviceNames || "",
    product_names: parsed.productNames || "",
    comment: parsed.comment || "",
  };
}

function masterOptions() {
  const masterRoleIds = new Set(
    state.roles
      .filter((item) => {
        const name = String(item.name || "").trim().toLowerCase();
        return name === "мастер" || name === "master";
      })
      .map((item) => String(item.id)),
  );
  const userIds = new Set([
    ...state.users
      .filter((user) => {
        const membership = state.memberships.find((item) => String(item.user_id) === String(user.id));
        return membership && masterRoleIds.has(String(membership.role_id));
      })
      .map((item) => String(item.id)),
  ]);

  return state.users
    .filter((item) => item.is_active && !item.is_blocked && userIds.has(String(item.id)))
    .map((item) => ({ id: item.id, name: displayUser(item) }));
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
  const [profile, metric, visits, accounts, categories, additionalFields, clientBranches] = await Promise.all([
    api.clientProfile(client.id, orgId).catch(() => null),
    api.clientProfileMetric(client.id).catch(() => null),
    api.clientHistoryVisits(client.id).catch(() => []),
    api.clientAccounts(client.id).catch(() => null),
    api.clientCategories(client.id).catch(() => []),
    api.clientAdditionalFieldValues(client.id).catch(() => []),
    api.clientBranches(client.id).catch(() => []),
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
  };
}

function modal(client) {
  if (!client) return "";
  const metric = client.metric;
  const accounts = client.accounts;
  const branches = state.branches;
  const visitDraft = { ...visitDraftDefaults(), ...state.visitDraft };
  const masters = masterOptions();
  const card = client.card;

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
          ${field("Фото", "photo_file_id", card.photo_file_id)}
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
            ${selectField("Мастер", "employee_id", masters, visitDraft.employee_id, "Выберите мастера")}
            <label><span>Статус</span><select name="visit_status">
              <option value="completed" ${visitDraft.visit_status === "completed" ? "selected" : ""}>Завершен</option>
              <option value="scheduled" ${visitDraft.visit_status === "scheduled" ? "selected" : ""}>Запланирован</option>
              <option value="cancelled" ${visitDraft.visit_status === "cancelled" ? "selected" : ""}>Отменен</option>
              <option value="no_show" ${visitDraft.visit_status === "no_show" ? "selected" : ""}>Не пришел</option>
            </select></label>
            <label><span>Стоимость</span><input name="total_cost" type="number" value="${escapeHtml(visitDraft.total_cost)}"></label>
            <label><span>Скидка</span><input name="discount_amount" type="number" value="${escapeHtml(visitDraft.discount_amount)}"></label>
            <label><span>Оплачено</span><input name="paid_amount" type="number" value="${escapeHtml(visitDraft.paid_amount)}" readonly></label>
            <label><span>Услуги</span><input name="service_names" value="${escapeHtml(visitDraft.service_names)}" placeholder="Можно несколько через запятую"></label>
            <label><span>Товары</span><input name="product_names" value="${escapeHtml(visitDraft.product_names)}" placeholder="Можно несколько через запятую"></label>
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
      <div class="modal-card" onclick="event.stopPropagation()">
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
      <div class="modal-card" onclick="event.stopPropagation()">
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
          <label><span>Скидка</span><input name="discount_amount" type="number" value="${escapeHtml(draft.discount_amount)}"></label>
          <label><span>Оплачено</span><input name="paid_amount" type="number" value="${escapeHtml(draft.paid_amount)}" readonly></label>
          <label><span>Услуги</span><input name="service_names" value="${escapeHtml(draft.service_names)}" placeholder="Можно несколько через запятую"></label>
          <label><span>Товары</span><input name="product_names" value="${escapeHtml(draft.product_names)}" placeholder="Можно несколько через запятую"></label>
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
  const [items, branches, users, memberships, branchMemberships, roles, segments] = await Promise.all([
    api.clients(ctx.org.id, search).catch(() => []),
    api.branches(ctx.org.id).catch(() => []),
    api.users(ctx.org.id).catch(() => []),
    api.memberships(ctx.org.id).catch(() => []),
    api.branchMemberships(ctx.org.id).catch(() => []),
    api.roles(ctx.org.id).catch(() => []),
    api.clientSegments(ctx.org.id).catch(() => segmentExamples().map((name) => ({ name }))),
  ]);

  state = { ...state, clients: items, branches, users, memberships, branchMemberships, roles, segments };

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
      <form data-client-search>
        <input class="search" name="q" value="${escapeHtml(search)}" placeholder="Поиск по имени, телефону или email">
      </form>
      <div class="entity-list">
          ${rows(items, "Клиентов пока нет.", clientRow)}
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
  root.addEventListener("input", (event) => {
    const form = event.target.closest("[data-visit-create], [data-visit-edit]");
    if (form) {
      if (form.matches("[data-visit-create]")) {
        state.visitDraft = { ...state.visitDraft, ...formData(form) };
      } else {
        state.selectedVisitDraft = { ...state.selectedVisitDraft, ...formData(form) };
      }
      if (event.target.name === "branch_id" && form.matches("[data-visit-create]")) {
        state.visitDraft.employee_id = "";
        ctx.reload();
        return;
      }
    }
    if (!form || !["total_cost", "discount_amount"].includes(event.target.name)) return;
    const total = Number(form.elements.total_cost.value || 0);
    const discount = Number(form.elements.discount_amount.value || 0);
    form.elements.paid_amount.value = String(Math.max(total - discount, 0));
    if (form.matches("[data-visit-create]")) {
      state.visitDraft.paid_amount = form.elements.paid_amount.value;
    } else {
      state.selectedVisitDraft.paid_amount = form.elements.paid_amount.value;
    }
  });

  root.addEventListener("change", (event) => {
    const form = event.target.closest("[data-visit-create], [data-visit-edit]");
    if (!form) return;
    if (form.matches("[data-visit-create]")) {
      state.visitDraft = { ...state.visitDraft, ...formData(form) };
    } else {
      state.selectedVisitDraft = { ...state.selectedVisitDraft, ...formData(form) };
    }
    if (event.target.name === "branch_id" && form.matches("[data-visit-create]")) {
      state.visitDraft.employee_id = "";
      ctx.reload();
    }
  });

  root.addEventListener("submit", async (event) => {
    const search = event.target.closest("[data-client-search]");
    if (search) {
      event.preventDefault();
      const data = formData(search);
      ctx.navigate(`/organizations/${ctx.org.id}/clients${data.q ? `?q=${encodeURIComponent(data.q)}` : ""}`);
      return;
    }

    const form = event.target.closest("form");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");
    const data = formData(form);

    try {
      if (form.matches("[data-client-create]")) {
        await api.createClient(clean({
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
      } else if (form.matches("[data-client-edit]") && state.selectedClient) {
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
          photo_file_id: optional(data.photo_file_id),
          comment: optional(data.comment),
          note: optional(data.note),
          importance_class: Number(data.importance_class || 0),
          online_booking_enabled: data.online_booking_enabled === "on",
          status: optional(data.status),
        }));
        state.selectedClient = await loadClientDetails(updated, ctx.org.id);
      } else if (form.matches("[data-visit-create]") && state.selectedClient) {
        await api.createClientVisit(clean({
          organization_id: ctx.org.id,
          client_id: state.selectedClient.id,
          visit_at: new Date(data.visit_at).toISOString(),
          branch_id: numberOrNull(data.branch_id),
          employee_id: numberOrNull(data.employee_id),
          visit_status: data.visit_status,
          total_cost: Number(data.total_cost || 0),
          discount_amount: Number(data.discount_amount || 0),
          paid_amount: Number(data.paid_amount || 0),
          comment: optional(buildVisitComment(data)),
        }));
        state.selectedClient = await loadClientDetails(state.selectedClient, ctx.org.id);
        state.visitDraft = {};
      } else if (form.matches("[data-visit-edit]") && state.selectedClient && state.selectedVisit) {
        const currentVisit = state.selectedVisit.visit || state.selectedVisit;
        await api.updateClientVisit(currentVisit.id, clean({
          visit_at: data.visit_at ? new Date(data.visit_at).toISOString() : undefined,
          branch_id: numberOrNull(data.branch_id),
          employee_id: numberOrNull(data.employee_id),
          visit_status: optional(data.visit_status),
          total_cost: Number(data.total_cost || 0),
          discount_amount: Number(data.discount_amount || 0),
          paid_amount: Number(data.paid_amount || 0),
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
    if (event.target.closest("[data-close-visit]") || event.target.matches("[data-visit-modal]")) {
      state.selectedVisit = null;
      state.selectedVisitDraft = {};
      ctx.reload();
      return;
    }

    const deleteClientButton = event.target.closest("[data-delete-client]");
    if (deleteClientButton) {
      if (!confirm("Удалить клиента?")) return;
      await api.deleteClient(deleteClientButton.dataset.deleteClient);
      if (state.selectedClient && String(state.selectedClient.id) === String(deleteClientButton.dataset.deleteClient)) {
        state.selectedClient = null;
        state.selectedVisit = null;
        state.visitDraft = {};
        state.selectedVisitDraft = {};
      }
      ctx.reload();
      return;
    }

    const clientButton = event.target.closest("[data-open-client]");
    if (clientButton) {
      const client = state.clients.find((item) => String(item.id) === String(clientButton.dataset.openClient));
      if (client) {
        state.selectedVisit = null;
        state.selectedVisitDraft = {};
        state.visitDraft = {};
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

    if (event.target.closest("[data-close-client]") || event.target.matches("[data-client-modal]")) {
      state.selectedClient = null;
      state.selectedVisit = null;
      state.visitDraft = {};
      state.selectedVisitDraft = {};
      ctx.reload();
      return;
    }

    if (event.target.closest("[data-visit-modal] .modal-card")) return;
    if (event.target.closest("[data-client-modal] .modal-card")) return;
  });
}
