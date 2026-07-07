import { api } from "./api.js";
import { ensureCss, escapeHtml, render, root } from "./dom.js";
import { dashboard } from "./modules/dashboard.js";
import { onboarding, bindOnboarding } from "./modules/onboarding.js";
import { clients, bindClients } from "./modules/clients.js";
import { loyalty, bindLoyalty } from "./modules/loyalty.js";
import { settings, bindSettings } from "./modules/settings.js";
import { tasks, bindTasks } from "./modules/tasks.js";

const LAST_ORG_KEY = "loyalty.lastOrganizationId";

ensureCss();

let state = { me: null, orgs: [], org: null, permissionsConfigured: false, allowedPermissions: new Set(), hasOrganizationRole: false };
let ajaxCount = 0;
let drawToken = 0;

const SETTINGS_PERMISSIONS = [
  "settings.legal.view",
  "settings.branches.view",
  "settings.departments.view",
  "settings.workplaces.view",
  "settings.roles.manage",
  "settings.users.view",
  "settings.brands.view",
  "settings.audit.view",
  "settings.events.view",
];

function can(permission) {
  if (state.org?.owner_user_id === state.me?.id) return true;
  return !state.permissionsConfigured || state.allowedPermissions.has(permission);
}

function canAny(permissions) {
  if (state.org?.owner_user_id === state.me?.id) return true;
  return !state.permissionsConfigured || permissions.some((permission) => state.allowedPermissions.has(permission));
}

function authRedirect() {
  const mode = location.pathname === "/register" ? "register" : "login";
  location.href = `/auth.html?mode=${mode}`;
}

function route() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "cabinet.html") return { page: "cabinet" };
  if (parts[0] === "login" || parts[0] === "register") return { page: "auth" };
  if (parts[0] === "onboarding") return { page: "onboarding" };
  if (parts[0] !== "organizations") return { page: "home" };
  return { page: parts[2] || "dashboard", orgId: Number(parts[1]), extra: parts[3] || "" };
}


function cabinetPage() {
  if (!document.querySelector('link[href="/css/cabinet.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/cabinet.css";
    document.head.appendChild(link);
  }

  return `
    <main class="cabinet-shell">
      <aside class="cabinet-sidebar" aria-label="\u041b\u0438\u0447\u043d\u044b\u0439 \u043a\u0430\u0431\u0438\u043d\u0435\u0442">
        <a class="cabinet-nav-link active" href="#my-data" data-cabinet-tab="profile">\u041c\u043e\u0438 \u0434\u0430\u043d\u043d\u044b\u0435</a>
        <button type="button" class="cabinet-logout" data-cabinet-logout>\u0412\u044b\u0445\u043e\u0434</button>
      </aside>
      <section class="cabinet-content">
        <div class="cabinet-panel" data-cabinet-view="profile">
          <div class="cabinet-heading">
            <p>\u041b\u0438\u0447\u043d\u044b\u0439 \u043a\u0430\u0431\u0438\u043d\u0435\u0442</p>
            <h1 data-cabinet-title>\u041c\u043e\u0438 \u0434\u0430\u043d\u043d\u044b\u0435</h1>
          </div>
          <form class="profile-form" data-cabinet-form>
            <label class="field" data-cabinet-field="last_name"><span>\u0424\u0430\u043c\u0438\u043b\u0438\u044f *</span><input name="last_name" type="text" required autocomplete="family-name" /></label>
            <label class="field" data-cabinet-field="first_name"><span>\u0418\u043c\u044f *</span><input name="first_name" type="text" required autocomplete="given-name" /></label>
            <label class="field" data-cabinet-field="middle_name"><span>\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e</span><input name="middle_name" type="text" autocomplete="additional-name" /></label>
            <label class="field" data-cabinet-field="phone"><span>\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430 *</span><input name="phone" type="tel" required autocomplete="tel" /></label>
            <label class="field" data-cabinet-field="gender"><span>\u041f\u043e\u043b *</span><select name="gender" required><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u043e\u043b</option><option value="male">\u041c\u0443\u0436\u0441\u043a\u043e\u0439</option><option value="female">\u0416\u0435\u043d\u0441\u043a\u0438\u0439</option></select></label>
            <label class="field" data-cabinet-field="telegram_id"><span>Telegram ID</span><input name="telegram_id" type="text" inputmode="numeric" /></label>
            <label class="field" data-cabinet-field="max_id"><span>Max ID</span><input name="max_id" type="text" inputmode="numeric" /></label>
            <label class="field" data-cabinet-field="vk_id"><span>VK ID</span><input name="vk_id" type="text" inputmode="numeric" /></label>
            <label class="field wide" data-cabinet-field="email"><span>Email</span><input name="email" type="email" autocomplete="email" /></label>
            <p class="cabinet-message" data-cabinet-message></p>
            <div class="form-actions"><button type="submit" data-cabinet-submit>\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435</button></div>
          </form>
          <section data-cabinet-history-section>
            <h2 class="cabinet-subtitle">\u0418\u0441\u0442\u043e\u0440\u0438\u044f</h2>
            <div class="cabinet-history-list" data-cabinet-history></div>
          </section>
        </div>
      </section>
    </main>
  `;
}

const DEFAULT_CABINET_FIELDS = ["last_name", "first_name", "middle_name", "phone", "gender", "telegram_id", "max_id", "vk_id", "email"];
const DEFAULT_CABINET_CARD_SECTIONS = ["client_name", "bonus_cashback", "client_level", "client_visits", "client_chat"];
let cabinetCardSections = DEFAULT_CABINET_CARD_SECTIONS;
let cabinetClient = null;
let cabinetData = null;
let cabinetSelectedVisit = null;

function cabinetSectionTitle(section) {
  if (section === "client_name") return "\u0424\u0418\u041e";
  if (section === "client_level") return "\u0423\u0440\u043e\u0432\u0435\u043d\u044c";
  if (section === "client_visits") return "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0432\u0438\u0437\u0438\u0442\u043e\u0432";
  if (section === "client_chat") return "\u0427\u0430\u0442";
  if (section.startsWith("bonus_")) return cabinetBonusName(section);
  return section;
}

function cabinetName(client) {
  return client?.full_name || [client?.last_name, client?.first_name, client?.middle_name].filter(Boolean).join(" ") || "\u041a\u043b\u0438\u0435\u043d\u0442";
}

function cabinetMoney(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toLocaleString("ru-RU", { maximumFractionDigits: 2 }) : String(value || 0);
}

function cabinetDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString("ru-RU");
}

function cabinetVisitStatus(status) {
  const labels = {
    completed: "\u0417\u0430\u0432\u0435\u0440\u0448\u0451\u043d",
    scheduled: "\u0417\u0430\u043f\u043b\u0430\u043d\u0438\u0440\u043e\u0432\u0430\u043d",
    cancelled: "\u041e\u0442\u043c\u0435\u043d\u0451\u043d",
    no_show: "\u041d\u0435 \u043f\u0440\u0438\u0448\u0451\u043b",
  };
  return labels[status] || status || "-";
}

function cabinetBonusName(section) {
  const code = section.replace(/^bonus_/, "") || "cashback";
  if (code === "cashback") return "\u041a\u0435\u0448\u0431\u044d\u043a";
  const type = (cabinetData?.bonus_types || []).find((item) => item.code === code);
  return type?.name || code;
}

function cabinetVisitItemName(item, kind) {
  const nested = item.service || item.product || item.good || item.item || {};
  const name = item.title || item.name || item.service_name || item.product_name || item.good_title || nested.title || nested.name;
  if (name) return name;
  const id = item.service_id || item.product_id || item.good_id || item.id;
  return id ? `${kind} #${id}` : "-";
}

function cabinetParseVisitComment(value) {
  const lines = String(value || "").split("\n");
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

function cabinetVisitItems(items, emptyText, kind) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return `<p class="cabinet-history-empty">${escapeHtml(emptyText)}</p>`;
  return `<ul class="cabinet-visit-items">${list.map((item) => `<li>${escapeHtml(cabinetVisitItemName(item, kind))}</li>`).join("")}</ul>`;
}

function cabinetVisitModal() {
  const selected = cabinetSelectedVisit;
  if (!selected) return "";
  const visit = selected.visit || selected;
  const parsed = cabinetParseVisitComment(visit.comment);
  const services = (selected.services || visit.yclients_services || []).length
    ? (selected.services || visit.yclients_services || [])
    : (parsed.serviceNames ? parsed.serviceNames.split(",").map((name) => ({ name: name.trim() })).filter((item) => item.name) : []);
  const products = (selected.products || visit.yclients_goods_transactions || []).length
    ? (selected.products || visit.yclients_goods_transactions || [])
    : (parsed.productNames ? parsed.productNames.split(",").map((name) => ({ name: name.trim() })).filter((item) => item.name) : []);
  return `
    <div class="modal-backdrop" data-cabinet-visit-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>\u0412\u0438\u0437\u0438\u0442</h3>
          <button type="button" class="ghost" data-cabinet-close-visit>\u0417\u0430\u043a\u0440\u044b\u0442\u044c</button>
        </div>
        <div class="modal-grid">
          <div class="readonly-field"><span>\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043c\u044f</span><b>${escapeHtml(cabinetDateTime(visit.visit_at || visit.created_at) || "-")}</b></div>
          <div class="readonly-field"><span>\u0421\u0442\u0430\u0442\u0443\u0441 \u0432\u0438\u0437\u0438\u0442\u0430</span><b>${escapeHtml(cabinetVisitStatus(visit.visit_status || visit.attendance_title))}</b></div>
          <div class="readonly-field"><span>\u0424\u0438\u043b\u0438\u0430\u043b</span><b>${escapeHtml(visit.branch_id || "-")}</b></div>
          <div class="readonly-field"><span>\u041c\u0430\u0441\u0442\u0435\u0440</span><b>${escapeHtml(visit.employee_id || "-")}</b></div>
          <div class="readonly-field"><span>\u0423\u0441\u043b\u0443\u0433\u0438</span>${cabinetVisitItems(services, "\u0423\u0441\u043b\u0443\u0433 \u043d\u0435\u0442", "\u0423\u0441\u043b\u0443\u0433\u0430")}</div>
          <div class="readonly-field"><span>\u0422\u043e\u0432\u0430\u0440\u044b</span>${cabinetVisitItems(products, "\u0422\u043e\u0432\u0430\u0440\u043e\u0432 \u043d\u0435\u0442", "\u0422\u043e\u0432\u0430\u0440")}</div>
          <div class="readonly-field"><span>\u0421\u0442\u043e\u0438\u043c\u043e\u0441\u0442\u044c</span><b>${escapeHtml(cabinetMoney(visit.total_cost))}</b></div>
          <div class="readonly-field"><span>\u0421\u043a\u0438\u0434\u043a\u0430</span><b>${escapeHtml(cabinetMoney(visit.discount_amount))}</b></div>
          <div class="readonly-field"><span>\u041e\u043f\u043b\u0430\u0447\u0435\u043d\u043e</span><b>${escapeHtml(cabinetMoney(visit.paid_amount))}</b></div>
        </div>
      </div>
    </div>
  `;
}

function cabinetSectionBody(section) {
  const client = cabinetData?.client || cabinetClient;
  if (section === "client_name") return `<b>${escapeHtml(cabinetName(client))}</b>`;
  if (section === "client_level") {
    const level = client?.client_level || cabinetData?.metric?.client_level || cabinetData?.metric?.loyalty_level || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d";
    return `<b>${escapeHtml(level)}</b>`;
  }
  if (section === "client_visits") {
    const visits = cabinetData?.visits || [];
    if (!visits.length) return `<p class="cabinet-history-empty">\u0412\u0438\u0437\u0438\u0442\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.</p>`;
    return `
      <div class="cabinet-visit-list">
        ${visits.slice(0, 10).map((item) => {
          const visit = item.visit || item;
          return `<button type="button" class="cabinet-visit-button" data-cabinet-visit="${escapeHtml(visit.id)}"><b>${escapeHtml(cabinetDateTime(visit.visit_at || visit.created_at) || "\u0414\u0430\u0442\u0430 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u0430")}</b><span>${escapeHtml(cabinetVisitStatus(visit.visit_status || visit.source))}</span></button>`;
        }).join("")}
      </div>
    `;
  }
  if (section === "client_chat") return `<p class="cabinet-history-empty">\u0427\u0430\u0442 \u043f\u043e\u043a\u0430 \u043d\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d.</p>`;
  if (section.startsWith("bonus_")) {
    const code = section.replace(/^bonus_/, "") || "cashback";
    const balance = (cabinetData?.bonus_balances || []).find((item) => (item.bonus_type || "cashback") === code);
    return `<b>${escapeHtml(cabinetMoney(balance?.balance || 0))}</b><span>\u0431\u0430\u043b\u043b\u043e\u0432</span>`;
  }
  return "";
}

function renderCabinetHistory(sections) {
  const history = root.querySelector("[data-cabinet-history]");
  if (!history) return;
  const enabled = Array.isArray(sections) ? sections : DEFAULT_CABINET_CARD_SECTIONS;
  cabinetCardSections = enabled;
  if (!enabled.length) {
    history.innerHTML = `<p class="cabinet-history-empty">\u0414\u043b\u044f \u044d\u0442\u043e\u0433\u043e \u043a\u043b\u0438\u0435\u043d\u0442\u0430 \u0440\u0430\u0437\u0434\u0435\u043b\u044b \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438 \u043d\u0435 \u043e\u0442\u043a\u0440\u044b\u0442\u044b.</p>`;
    return;
  }
  history.innerHTML = enabled.map((section) => `
    <article class="cabinet-history-card">
      <span>${escapeHtml(cabinetSectionTitle(section))}</span>
      <div class="cabinet-history-body">${cabinetSectionBody(section)}</div>
    </article>
  `).join("");
  history.insertAdjacentHTML("beforeend", cabinetVisitModal());
}

function setCabinetTab(tab) {
  root.querySelectorAll("[data-cabinet-tab]").forEach((link) => link.classList.toggle("active", link.dataset.cabinetTab === tab));
  root.querySelectorAll("[data-cabinet-view]").forEach((view) => {
    view.hidden = view.dataset.cabinetView !== tab;
  });
}

function setCabinetRegistrationMode(enabled) {
  const title = root.querySelector("[data-cabinet-title]");
  const historySection = root.querySelector("[data-cabinet-history-section]");
  const button = root.querySelector("[data-cabinet-submit]");
  if (title) title.textContent = enabled ? "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u043a\u043b\u0438\u0435\u043d\u0442\u0430" : "\u041c\u043e\u0438 \u0434\u0430\u043d\u043d\u044b\u0435";
  if (historySection) historySection.hidden = enabled;
  if (button) button.textContent = enabled ? "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f" : "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435";
}

function applyCabinetRegistrationFields(form, fields) {
  const enabled = Array.isArray(fields) ? fields : DEFAULT_CABINET_FIELDS;
  const fieldsByName = new Map([...form.querySelectorAll("[data-cabinet-field]")].map((field) => [field.dataset.cabinetField, field]));
  const order = [...enabled, ...DEFAULT_CABINET_FIELDS.filter((name) => !enabled.includes(name))];
  order.forEach((name) => {
    const field = fieldsByName.get(name);
    if (field) form.insertBefore(field, form.querySelector("[data-cabinet-message]"));
  });
  fieldsByName.forEach((field) => {
    const isVisible = enabled.includes(field.dataset.cabinetField);
    field.hidden = !isVisible;
    field.style.display = isVisible ? "" : "none";
    field.querySelectorAll("input, select, textarea").forEach((control) => {
      control.disabled = !isVisible;
      if (!isVisible) control.required = false;
    });
  });
}

function fillCabinetUser(form, user) {
  const values = {
    last_name: user.last_name || "",
    first_name: user.first_name || "",
    middle_name: user.middle_name || "",
    phone: user.phone || user.primary_phone || "",
    gender: user.gender || "",
    telegram_id: user.telegram_id || "",
    max_id: user.max_id || "",
    vk_id: user.vk_id || "",
    email: user.email || "",
  };
  Object.entries(values).forEach(([name, value]) => {
    const control = form.elements[name];
    if (control) control.value = value;
  });
}

async function initCabinetForm() {
  const form = root.querySelector("[data-cabinet-form]");
  if (!form) return;
  const message = form.querySelector("[data-cabinet-message]");
  const button = form.querySelector("button");
  const token = new URLSearchParams(window.location.search).get("token");
  const setMessage = (text, kind = "") => {
    message.textContent = text;
    message.dataset.kind = kind;
  };
  setCabinetTab("profile");
  setCabinetRegistrationMode(false);
  if (!token) {
    try {
      const user = state.me || await api.me();
      cabinetData = await api.cabinet().catch(() => null);
      cabinetClient = cabinetData?.client || null;
      applyCabinetRegistrationFields(form, cabinetData?.registration_fields);
      fillCabinetUser(form, cabinetClient || user);
      renderCabinetHistory(cabinetData?.card_sections ?? DEFAULT_CABINET_CARD_SECTIONS);
      setMessage("", "");
    } catch {
      setMessage("\u0421\u0435\u0441\u0441\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430. \u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0441\u043d\u043e\u0432\u0430.", "error");
    }
    button.disabled = true;
    return;
  }
  applyCabinetRegistrationFields(form, []);
  renderCabinetHistory([]);
  button.disabled = true;
  try {
    const response = await fetch(`/auth/client-auth-links/${encodeURIComponent(token)}/consume`, { method: "POST" });
    if (!response.ok) throw new Error();
    const link = await response.json();
    cabinetData = link;
    cabinetClient = link.client || link.profile || null;
    setCabinetRegistrationMode(!link.client_id);
    applyCabinetRegistrationFields(form, link.registration_fields);
    fillCabinetUser(form, cabinetClient || {});
    renderCabinetHistory(link.card_sections);
    button.disabled = false;
  } catch {
    const text = "\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u0430 \u0438\u043b\u0438 \u0443\u0436\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0430.";
    alert(text);
    setMessage(text, "error");
    root.querySelector(".cabinet-shell")?.setAttribute("hidden", "");
    location.replace("/auth.html");
  }
}

function navLink(href, label) {
  if (href.includes("/settings") && !canAny(SETTINGS_PERMISSIONS)) return "";
  if (href.includes("/settings")) {
    const active = location.pathname === href;
    return `<a class="${active ? "active" : ""}" href="${href}">${escapeHtml(label)}</a>`;
  }
  const permission = href.includes("/clients")
    ? "clients.clients.view"
    : href.includes("/loyalty")
      ? "loyalty.rules.view"
      : href.includes("/tasks")
        ? "loyalty.rules.view"
        : href.includes("/settings")
          ? "settings.roles.manage"
          : "overview.view";
  if (!can(permission)) return "";
  const active = location.pathname === href || (href.includes("/loyalty") && location.pathname.includes("/loyalty"));
  return `<a class="${active ? "active" : ""}" href="${href}">${escapeHtml(label)}</a>`;
}

function shell(content, title) {
  const org = state.org;
  const orgOptions = state.orgs.map((item) => `
    <option value="${item.id}" ${item.id === org.id ? "selected" : ""}>${escapeHtml(item.name)}</option>
  `).join("");

  return `
    <div class="app">
      <div class="ajax-indicator" aria-hidden="true"><span></span></div>
      <aside class="sidebar">
        <strong class="brand">Лояльность</strong>
        <select aria-label="Организация" data-org-switch>${orgOptions}</select>
        <button class="ghost" data-open-onboarding>Создать организацию</button>
        <nav>
          ${navLink(`/organizations/${org.id}`, "Главная")}
          ${navLink(`/organizations/${org.id}/clients`, "Клиенты")}
          ${navLink(`/organizations/${org.id}/loyalty`, "Лояльность")}
          ${navLink(`/organizations/${org.id}/settings`, "Настройки организации")}
          ${navLink(`/organizations/${org.id}/tasks`, "Задачи")}
        </nav>
      </aside>
      <main class="content">
        <header class="topbar">
          <div><span data-org-title>${escapeHtml(org.name)}</span><h1 data-page-title>${escapeHtml(title)}</h1></div>
          <button class="ghost" data-logout>Выйти</button>
        </header>
        <div data-page-content>${content}</div>
      </main>
    </div>
  `;
}

function navigate(path) {
  history.pushState(null, "", path);
  draw();
}

function reload() {
  draw({ live: true });
}

async function ensureSession() {
  try {
    state.me = await api.me();
  } catch {
    authRedirect();
    return false;
  }
  state.orgs = await api.organizations();
  state.hasOrganizationRole = await userHasOrganizationRole();
  return true;
}

async function userHasOrganizationRole() {
  const membershipsByOrg = await Promise.all(
    state.orgs.map((org) => api.memberships(org.id).catch(() => [])),
  );
  return membershipsByOrg.some((memberships) =>
    memberships.some((membership) => membership.user_id === state.me.id),
  );
}

function chooseOrg(routeInfo) {
  if (!state.orgs.length) return null;
  const saved = Number(localStorage.getItem(LAST_ORG_KEY));
  return state.orgs.find((org) => org.id === routeInfo.orgId)
    || state.orgs.find((org) => org.id === saved)
    || state.orgs[0];
}

async function pageContent(routeInfo, ctx) {
  if (routeInfo.page === "clients" && !ctx.can("clients.clients.view")) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "loyalty" && !ctx.can("loyalty.rules.view")) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "tasks" && !ctx.can("loyalty.rules.view")) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "settings" && !canAny(SETTINGS_PERMISSIONS)) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "clients") return ["Клиенты", await clients(ctx)];
  if (routeInfo.page === "loyalty") return ["Лояльность", await loyalty(ctx, routeInfo.extra || "rules")];
  if (routeInfo.page === "tasks") return ["Задачи", await tasks(ctx)];
  if (routeInfo.page === "settings") return ["Настройки организации", await settings(ctx)];
  return ["Главная", await dashboard(ctx)];
}

function applyPermissions() {
  if (state.hasOrganizationRole) {
    root.querySelector("[data-open-onboarding]")?.remove();
  }
  root.querySelectorAll("[data-permission]").forEach((node) => {
    if (!can(node.dataset.permission)) node.remove();
  });
}

function animateUpdate(node) {
  node.classList.remove("live-updated");
  requestAnimationFrame(() => {
    node.classList.add("live-updated");
    window.setTimeout(() => node.classList.remove("live-updated"), 650);
  });
}

async function draw(options = {}) {
  const token = ++drawToken;
  const hadContent = !!root.innerHTML.trim();
  const pageNode = options.live ? root.querySelector("[data-page-content]") : null;
  if (pageNode) {
    pageNode.classList.add("is-live-refreshing");
  } else if (!hadContent) {
    render(root, '<main class="auth-page"><div class="live-splash" aria-hidden="true"></div></main>');
  }
  const routeInfo = route();

  if (routeInfo.page === "auth") {
    authRedirect();
    return;
  }

  if (routeInfo.page === "cabinet") {
    render(root, cabinetPage());
    initCabinetForm();
    return;
  }

  if (!(await ensureSession())) return;

  if (routeInfo.page === "onboarding") {
    if (state.hasOrganizationRole && state.orgs.length) {
      const org = chooseOrg(routeInfo);
      history.replaceState(null, "", `/organizations/${org.id}`);
      draw({ live: true });
      return;
    }
    render(root, onboarding());
    return;
  }

  if (!state.orgs.length) {
    history.replaceState(null, "", "/onboarding");
    render(root, onboarding());
    return;
  }

  state.org = chooseOrg(routeInfo);
  localStorage.setItem(LAST_ORG_KEY, String(state.org.id));
  const access = await api.allowedPermissions(state.org.id).catch(() => ({ is_configured: false, codes: [] }));
  state.permissionsConfigured = !!access.is_configured;
  state.allowedPermissions = new Set(access.codes || []);

  if (routeInfo.page === "home" || !routeInfo.orgId) {
    history.replaceState(null, "", `/organizations/${state.org.id}`);
  }

  const ctx = { me: state.me, orgs: state.orgs, org: state.org, navigate, reload, can };
  const [title, content] = await pageContent(routeInfo, ctx);
  if (token !== drawToken) return;
  if (pageNode && root.querySelector("[data-page-title]")) {
    root.querySelector("[data-org-title]").textContent = state.org.name;
    root.querySelector("[data-page-title]").textContent = title;
    pageNode.innerHTML = content;
    pageNode.classList.remove("is-live-refreshing");
    animateUpdate(pageNode);
    applyPermissions();
    return;
  }
  render(root, shell(content, title));
  animateUpdate(root.querySelector("[data-page-content]") || root);
  applyPermissions();
}


root.addEventListener("submit", async (event) => {
  const form = event.target.closest("[data-cabinet-form]");
  if (!form) return;
  event.preventDefault();
  const message = form.querySelector("[data-cabinet-message]");
  const button = form.querySelector("button");
  const token = new URLSearchParams(window.location.search).get("token");
  const setMessage = (text, kind = "") => {
    message.textContent = text;
    message.dataset.kind = kind;
  };
  const optionalNumber = (value) => {
    const trimmed = String(value || "").trim();
    return trimmed ? Number(trimmed) : null;
  };
  if (!token) {
    setMessage("\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0435\u043a\u043e\u0440\u0440\u0435\u043a\u0442\u043d\u0430 \u0438\u043b\u0438 \u0443\u0441\u0442\u0430\u0440\u0435\u043b\u0430.", "error");
    return;
  }
  const data = Object.fromEntries(new FormData(form).entries());
  const textValue = (name) => String(data[name] || "").trim();
  button.disabled = true;
  setMessage("\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u0434\u0430\u043d\u043d\u044b\u0435...");
  try {
    const response = await fetch(`/public-api/client-auth-links/${encodeURIComponent(token)}/submit`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        last_name: textValue("last_name") || null,
        first_name: textValue("first_name") || null,
        middle_name: textValue("middle_name") || null,
        phone: textValue("phone") || null,
        gender: textValue("gender") || null,
        telegram_id: optionalNumber(data.telegram_id),
        max_id: optionalNumber(data.max_id),
        vk_id: optionalNumber(data.vk_id),
        email: textValue("email") || null,
      }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.detail || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u0441\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435");
    }
    const result = await response.json();
    if (result.redirect_url) {
      location.href = result.redirect_url;
      return;
    }
    cabinetClient = result.client || null;
    renderCabinetHistory(cabinetCardSections);
    setMessage("\u0414\u0430\u043d\u043d\u044b\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b.", "success");
  } catch (error) {
    setMessage(error.message, "error");
    button.disabled = false;
  }
});

root.addEventListener("click", async (event) => {
  const link = event.target.closest("a[href^='/']");
  if (link) {
    event.preventDefault();
    navigate(link.getAttribute("href"));
    return;
  }

  const cabinetTab = event.target.closest("[data-cabinet-tab]");
  if (cabinetTab) {
    event.preventDefault();
    setCabinetTab(cabinetTab.dataset.cabinetTab);
    return;
  }

  const cabinetVisit = event.target.closest("[data-cabinet-visit]");
  if (cabinetVisit) {
    cabinetSelectedVisit = (cabinetData?.visits || []).find((item) => String((item.visit || item).id) === String(cabinetVisit.dataset.cabinetVisit)) || null;
    renderCabinetHistory(cabinetCardSections);
    return;
  }

  if (event.target.closest("[data-cabinet-close-visit]") || event.target.matches("[data-cabinet-visit-modal]")) {
    cabinetSelectedVisit = null;
    renderCabinetHistory(cabinetCardSections);
    return;
  }

  if (event.target.closest("[data-cabinet-logout]")) {
    await api.logout().catch(() => null);
    location.href = "/auth.html?mode=login";
    return;
  }

  if (event.target.closest("[data-open-onboarding]")) {
    if (state.hasOrganizationRole) return;
    navigate("/onboarding");
    return;
  }

  if (event.target.closest("[data-logout]")) {
    await api.logout();
    location.href = "/auth.html";
  }
});

root.addEventListener("change", (event) => {
  const select = event.target.closest("[data-org-switch]");
  if (!select) return;
  localStorage.setItem(LAST_ORG_KEY, select.value);
  navigate(`/organizations/${select.value}`);
});

window.addEventListener("popstate", draw);
window.addEventListener("ajax:start", () => {
  ajaxCount += 1;
  document.body.classList.add("ajax-active");
});
window.addEventListener("ajax:end", () => {
  ajaxCount = Math.max(ajaxCount - 1, 0);
  if (!ajaxCount) document.body.classList.remove("ajax-active");
});

bindOnboarding(root, { navigate });
bindClients(root, { get org() { return state.org; }, navigate, reload });
bindLoyalty(root, { get org() { return state.org; }, navigate, reload });
bindSettings(root, { get org() { return state.org; }, navigate, reload });
bindTasks(root, { get org() { return state.org; }, reload });

draw();
