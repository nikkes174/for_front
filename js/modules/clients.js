import { api } from "../api.js";
import { escapeHtml, formData, numberOrNull, optional, rows, selectField, setMessage } from "../dom.js";

let state = {
  clients: [],
  branches: [],
  users: [],
  memberships: [],
  roles: [],
  segments: [],
  selectedClient: null,
  selectedVisit: null,
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
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" type="checkbox" ${checked ? "checked" : ""}></label>`;
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
    metric: metric || profile?.metrics || null,
    visits,
    accounts,
    categories,
    additionalFields,
    clientBranches,
  };
}

function modal(client) {
  if (!client) return "";
  const metric = client.metric;
  const accounts = client.accounts;
  const branches = state.branches;
  const organizationUserIds = new Set(state.memberships.map((item) => item.user_id));
  const masterRoleIds = new Set(state.roles.filter((item) => item.name?.toLowerCase().includes("мастер")).map((item) => item.id));
  const masterUserIds = new Set(state.memberships.filter((item) => masterRoleIds.has(item.role_id)).map((item) => item.user_id));
  const masters = state.users.filter((item) => organizationUserIds.has(item.id) && masterUserIds.has(item.id));
  const card = client.card;

  return `
    <div class="modal-backdrop" data-client-modal>
      <div class="modal-card" onclick="event.stopPropagation()">
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
          ${field("Примечание", "note", card.note)}
          ${field("Класс важности", "importance_class", card.importance_class, 'type="number"')}
          ${readonly("Категории", client.categories?.map((item) => item.name || item.category_id || item.id).join(", ") ?? "")}
          ${checkbox("Возможность онлайн-записи", "online_booking_enabled", card.online_booking_enabled)}
          ${readonly("Дополнительные поля", client.additionalFields?.map((item) => item.value_text ?? JSON.stringify(item.value_json ?? {})).join(", ") ?? "")}
          ${readonly("ID клиента", client.id)}
          ${readonly("Дата создания", dateTime(client.created_at))}
          ${readonly("Источник создания", client.creation_source)}
          ${readonly("Кто создал", client.created_by)}
          ${readonly("Дата последнего изменения", dateTime(client.updated_at))}
          <label><span>Статус</span><select name="status">
            <option value="active" ${card.status === "active" ? "selected" : ""}>Активен</option>
            <option value="archived" ${card.status === "archived" ? "selected" : ""}>В архиве</option>
          </select></label>
          ${readonly("Филиалы, в которых был клиент", client.clientBranches?.map((item) => `ID ${item.branch_id}`).join(", ") ?? "")}
          ${field("Айди рефовода", "referrer_client_id", card.referrer_client_id)}
          ${field("Свободный столбец 1", "api_field_1", card.api_field_1)}
          ${field("Свободный столбец 2", "api_field_2", card.api_field_2)}
          ${field("Свободный столбец 3", "api_field_3", card.api_field_3)}
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
            <label><span>Дата и время</span><input name="visit_at" type="datetime-local" value="${new Date().toISOString().slice(0, 16)}"></label>
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал")}
            ${selectField("Мастер", "employee_id", masters.map((item) => ({ id: item.id, name: displayUser(item) })), "", "Выберите мастера")}
            <label><span>Статус</span><select name="visit_status">
              <option value="completed">Завершен</option>
              <option value="scheduled">Запланирован</option>
              <option value="cancelled">Отменен</option>
              <option value="no_show">Не пришел</option>
            </select></label>
            <label><span>Стоимость</span><input name="total_cost" type="number" value="0"></label>
            <label><span>Скидка</span><input name="discount_amount" type="number" value="0"></label>
            <label><span>Оплачено</span><input name="paid_amount" type="number" value="0" readonly></label>
            <label><span>Услуги</span><input name="service_names" placeholder="Можно несколько через запятую"></label>
            <label><span>Товары</span><input name="product_names" placeholder="Можно несколько через запятую"></label>
            <label><span>Комментарий</span><input name="comment"></label>
            <button class="primary">Добавить визит</button>
            <p data-message></p>
          </form>
          <table><tbody>
            ${rows(client.visits || [], "Истории визитов пока нет.", (item) => {
              const visit = item.visit || item;
              return `<tr>
                <td><button type="button" class="ghost" data-open-visit="${escapeHtml(visit.id)}"><b>${escapeHtml(dateTime(visit.visit_at) || "Дата не указана")}</b><small>${escapeHtml(visitStatusLabel(visit.visit_status))}</small></button></td>
                <td>${escapeHtml(visitStatusLabel(visit.visit_status))}</td>
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
    ${visitModal(client)}
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

export async function clients(ctx) {
  const params = new URLSearchParams(location.search);
  const search = params.get("q") || "";
  const [items, branches, users, memberships, roles, segments] = await Promise.all([
    api.clients(ctx.org.id, search).catch(() => []),
    api.branches(ctx.org.id).catch(() => []),
    api.users(ctx.org.id).catch(() => []),
    api.memberships(ctx.org.id).catch(() => []),
    api.roles(ctx.org.id).catch(() => []),
    api.clientSegments(ctx.org.id).catch(() => segmentExamples().map((name) => ({ name }))),
  ]);

  state = { ...state, clients: items, branches, users, memberships, roles, segments };

  return `
    <section class="panel" data-clients>
      <h2>Клиенты</h2>
      <form class="inline-form" data-client-create data-permission="clients.clients.create">
        ${field("Имя", "first_name")}
        ${field("Фамилия", "last_name")}
        ${field("Отчество", "middle_name")}
        ${field("Основной телефон", "primary_phone")}
        ${field("Доп. телефон", "secondary_phone")}
        <label><span>Пол</span><select name="gender"><option value="">Не указан</option><option value="male">Мужской</option><option value="female">Женский</option></select></label>
        ${field("Email", "email")}
        ${field("Telegram ID", "telegram_id")}
        <button class="primary">Добавить клиента</button>
        <p data-message></p>
      </form>
      <form data-client-search>
        <input class="search" name="q" value="${escapeHtml(search)}" placeholder="Поиск по имени, телефону или email">
      </form>
      <table>
        <tbody>
          ${rows(items, "Клиентов пока нет.", (item) => `
            <tr>
              <td><button type="button" class="ghost" data-open-client="${escapeHtml(item.id)}"><b>${escapeHtml(name(item))}</b><small>${escapeHtml(statusLabel(item.status))}</small></button></td>
              <td>${escapeHtml(item.primary_phone || no)}</td>
              <td>${escapeHtml(item.email || no)}</td>
              <td><small>LTV: Нет данных · Ср. чек: Нет данных</small></td>
              <td>${escapeHtml(date(item.created_at))}</td>
            </tr>
          `)}
        </tbody>
      </table>
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
    const form = event.target.closest("[data-visit-create]");
    if (!form || !["total_cost", "discount_amount"].includes(event.target.name)) return;
    const total = Number(form.elements.total_cost.value || 0);
    const discount = Number(form.elements.discount_amount.value || 0);
    form.elements.paid_amount.value = String(Math.max(total - discount, 0));
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
          referrer_client_id: numberOrNull(data.referrer_client_id),
          api_field_1: optional(data.api_field_1),
          api_field_2: optional(data.api_field_2),
          api_field_3: optional(data.api_field_3),
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
      }
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });

  root.addEventListener("click", async (event) => {
    if (event.target.closest("[data-close-client]") || event.target.matches("[data-client-modal]")) {
      state.selectedClient = null;
      state.selectedVisit = null;
      ctx.reload();
      return;
    }
    if (event.target.closest("[data-close-visit]") || event.target.matches("[data-visit-modal]")) {
      state.selectedVisit = null;
      ctx.reload();
      return;
    }

    const clientButton = event.target.closest("[data-open-client]");
    if (clientButton) {
      const client = state.clients.find((item) => String(item.id) === String(clientButton.dataset.openClient));
      if (client) {
        state.selectedVisit = null;
        state.selectedClient = await loadClientDetails(client, ctx.org.id);
        ctx.reload();
      }
      return;
    }

    const visitButton = event.target.closest("[data-open-visit]");
    if (visitButton && state.selectedClient) {
      state.selectedVisit = (state.selectedClient.visits || []).find((item) => String((item.visit || item).id) === String(visitButton.dataset.openVisit));
      ctx.reload();
    }
  });
}
