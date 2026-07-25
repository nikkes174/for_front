import { api } from "./api.js";
import { ensureCss, escapeHtml, render, root } from "./dom.js";
import { dashboard } from "./modules/dashboard.js";
import { onboarding, bindOnboarding } from "./modules/onboarding.js";
import { clients, bindClients } from "./modules/clients.js";
import { catalog, bindCatalog } from "./modules/catalog.js";
import { loyalty, bindLoyalty } from "./modules/loyalty.js";
import { bindNotifications } from "./modules/notifications.js";
import { settings, bindSettings } from "./modules/settings.js";
import { tasks, bindTasks } from "./modules/tasks.js";
import { booking, bindBooking } from "./modules/booking.js";

const LAST_ORG_KEY = "loyalty.lastOrganizationId";
const SESSION_TOKEN_KEY = "loyalty.sessionToken";

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
const LOYALTY_PERMISSIONS = [
  "loyalty.rules.view",
  "loyalty.levels.view",
  "loyalty.transactions.view",
  "loyalty.promotions.view",
  "loyalty.certificates.view",
  "loyalty.subscriptions.view",
  "loyalty.referrals.view",
  "notifications.notifications.view",
  "settings.achievements.view",
];
const TASK_PERMISSIONS = [
  "loyalty.rules.view",
  "notifications.notifications.view",
];
const SETTINGS_MENU_SECTIONS = [
  { slug: "legal", label: "Юр лица", permissions: ["settings.legal.view", "settings.legal.create"] },
  { slug: "branches", label: "Филиалы", permissions: ["settings.branches.view", "settings.branches.create"] },
  { slug: "departments", label: "Подразделения", permissions: ["settings.departments.view", "settings.departments.create"] },
  { slug: "workplaces", label: "Рабочие места", permissions: ["settings.workplaces.view", "settings.workplaces.create"] },
  { slug: "roles", label: "Роли и права", permissions: ["settings.roles.manage"] },
  { slug: "users", label: "Пользователи", permissions: ["settings.users.view", "settings.users.create", "settings.users.assign_roles"] },
  { slug: "logs", label: "События", permissions: ["settings.audit.view", "settings.events.view"] },
];
const CATALOG_MENU_SECTIONS = [
  { slug: "products", label: "Товары", permissions: ["settings.categories.view", "settings.items.view"] },
  { slug: "services", label: "Услуги", permissions: ["settings.categories.view", "settings.items.view"] },
];

const LOYALTY_MENU_SECTIONS = [
  { slug: "", label: "Система лояльности", permissions: LOYALTY_PERMISSIONS },
  { slug: "cards", label: "Карточки", permissions: ["loyalty.transactions.view"] },
  { slug: "achievements", label: "Достижения", permissions: ["settings.achievements.view"] },
  { slug: "notifications", label: "Рассылки", permissions: ["notifications.notifications.view"] },
];
const SIDEBAR_COMPACT_BREAKPOINT = 1180;
let sidebarOpen = window.innerWidth > SIDEBAR_COMPACT_BREAKPOINT;

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

async function redirectClientDomainFromAdminPath() {
  if (!location.pathname.startsWith("/organizations/")) return false;
  const context = await api.loginContext().catch(() => null);
  if (!context?.is_client_domain) return false;
  location.replace("/auth.html?mode=login");
  return true;
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
  document.querySelector('meta[name="viewport"]')?.setAttribute("content", "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no");
  if (!document.querySelector('meta[name="theme-color"]')) {
    const theme = document.createElement("meta");
    theme.name = "theme-color";
    theme.content = "#111827";
    document.head.appendChild(theme);
  }
  [
    ["mobile-web-app-capable", "yes"],
    ["apple-mobile-web-app-capable", "yes"],
    ["apple-mobile-web-app-status-bar-style", "black-translucent"],
    ["apple-mobile-web-app-title", "Личный кабинет"],
  ].forEach(([name, content]) => {
    if (document.querySelector(`meta[name="${name}"]`)) return;
    const meta = document.createElement("meta");
    meta.name = name;
    meta.content = content;
    document.head.appendChild(meta);
  });
  if (!document.querySelector('link[rel="manifest"]')) {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/manifest.webmanifest";
    document.head.appendChild(manifest);
  }
  if (!document.querySelector('link[rel="apple-touch-icon"]')) {
    const icon = document.createElement("link");
    icon.rel = "apple-touch-icon";
    icon.href = "/apple-touch-icon.png";
    document.head.appendChild(icon);
  }
  if (!document.querySelector('link[href="/css/cabinet.css"]')) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "/css/cabinet.css";
    document.head.appendChild(link);
  }

  return `
    <main class="cabinet-shell">
      <section class="cabinet-content">
        <div class="cabinet-topbar">
          <button type="button" class="cabinet-menu-button" data-cabinet-menu-open aria-label="\u041c\u0435\u043d\u044e">
            <span></span><span></span><span></span>
          </button>
          <button type="button" class="cabinet-notifications-button" data-cabinet-notifications-open aria-label="\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f">
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
          </button>
        </div>
        <div class="cabinet-panel" data-cabinet-view="profile">
          <div class="cabinet-heading">
            <p>\u041b\u0438\u0447\u043d\u044b\u0439 \u043a\u0430\u0431\u0438\u043d\u0435\u0442</p>
            <div class="cabinet-title-row"><h1 data-cabinet-title>\u041c\u043e\u0438 \u0434\u0430\u043d\u043d\u044b\u0435</h1><button type="button" class="cabinet-edit-button" data-cabinet-edit aria-label="\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435" title="\u0418\u0437\u043c\u0435\u043d\u0438\u0442\u044c">&#9998;</button></div>
          </div>
          <form class="profile-form" data-cabinet-form>
            <label class="field" data-cabinet-field="last_name"><span>\u0424\u0430\u043c\u0438\u043b\u0438\u044f *</span><input name="last_name" type="text" required autocomplete="family-name" disabled /></label>
            <label class="field" data-cabinet-field="first_name"><span>\u0418\u043c\u044f *</span><input name="first_name" type="text" required autocomplete="given-name" disabled /></label>
            <label class="field" data-cabinet-field="middle_name"><span>\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e</span><input name="middle_name" type="text" autocomplete="additional-name" disabled /></label>
            <label class="field" data-cabinet-field="phone"><span>\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430 *</span><input name="phone" type="tel" required autocomplete="tel" disabled /></label>
            <label class="field" data-cabinet-field="gender"><span>\u041f\u043e\u043b *</span><select name="gender" required disabled><option value="">\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043f\u043e\u043b</option><option value="male">\u041c\u0443\u0436\u0441\u043a\u043e\u0439</option><option value="female">\u0416\u0435\u043d\u0441\u043a\u0438\u0439</option></select></label>
            <label class="field" data-cabinet-field="telegram_id" hidden><span>Telegram ID</span><input name="telegram_id" type="text" inputmode="numeric" disabled /></label>
            <label class="field" data-cabinet-field="max_id" hidden><span>Max ID</span><input name="max_id" type="text" inputmode="numeric" disabled /></label>
            <label class="field" data-cabinet-field="vk_id" hidden><span>VK ID</span><input name="vk_id" type="text" inputmode="numeric" disabled /></label>
            <label class="field wide" data-cabinet-field="email"><span>Email</span><input name="email" type="email" autocomplete="email" disabled /></label>
            <p class="cabinet-message" data-cabinet-message></p>
            <div class="form-actions" data-cabinet-actions hidden><button type="submit" data-cabinet-submit>\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435</button></div>
          </form>
          <section data-cabinet-history-section>
            <h2 class="cabinet-subtitle">\u0418\u0441\u0442\u043e\u0440\u0438\u044f</h2>
            <div class="cabinet-history-list" data-cabinet-history></div>
          </section>
        </div>
      </section>
      <div class="modal-backdrop cabinet-menu-backdrop" data-cabinet-menu hidden>
        <aside class="cabinet-drawer" aria-label="\u041c\u0435\u043d\u044e \u043b\u0438\u0447\u043d\u043e\u0433\u043e \u043a\u0430\u0431\u0438\u043d\u0435\u0442\u0430">
          <div class="cabinet-drawer-head">
            <strong>\u041a\u0430\u0431\u0438\u043d\u0435\u0442</strong>
            <button type="button" class="cabinet-drawer-close" data-cabinet-menu-close aria-label="\u0417\u0430\u043a\u0440\u044b\u0442\u044c">\u00d7</button>
          </div>
          <nav class="cabinet-drawer-nav">
            <a class="cabinet-nav-link active" href="#my-data" data-cabinet-tab="profile">\u041c\u043e\u0438 \u0434\u0430\u043d\u043d\u044b\u0435</a>
            <button type="button" class="cabinet-logout" data-cabinet-logout>\u0412\u044b\u0445\u043e\u0434</button>
          </nav>
        </aside>
      </div>
      <div class="modal-backdrop" data-cabinet-notifications-modal hidden>
        <div class="modal-card cabinet-notifications-modal">
          <div class="modal-head">
            <h3>\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f</h3>
            <button type="button" class="ghost" data-cabinet-notifications-close>\u0417\u0430\u043a\u0440\u044b\u0442\u044c</button>
          </div>
          <label class="cabinet-notifications-toggle">
            <span class="cabinet-notifications-toggle-text">\u041f\u043e\u043b\u0443\u0447\u0430\u0442\u044c \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f</span>
            <span class="cabinet-switch">
              <input type="checkbox" data-cabinet-push-toggle />
              <span class="cabinet-switch-track" aria-hidden="true"></span>
            </span>
          </label>
          <p class="cabinet-message" data-cabinet-push-status></p>
          <div class="cabinet-notifications-empty" data-cabinet-notifications-list>\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.</div>
        </div>
      </div>
    </main>
  `;
}

const DEFAULT_CABINET_FIELDS = ["last_name", "first_name", "middle_name", "phone", "gender", "email"];
const DEFAULT_CABINET_CARD_SECTIONS = ["client_name", "client_level", "client_visits", "client_personal_link", "client_chat"];
let cabinetCardSections = DEFAULT_CABINET_CARD_SECTIONS;
let cabinetClient = null;
let cabinetData = null;
let cabinetSelectedVisit = null;
const CABINET_NOTIFICATIONS_SEEN_KEY = "cabinetNotificationsSeenAt";

if ("serviceWorker" in navigator && location.pathname.endsWith("/cabinet.html")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").catch(() => null);
  });
}

function cabinetSectionTitle(section) {
  if (section === "client_name") return "\u0424\u0418\u041e";
  if (section === "client_level") return "\u0423\u0440\u043e\u0432\u0435\u043d\u044c";
  if (section === "client_visits") return "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0432\u0438\u0437\u0438\u0442\u043e\u0432";
  if (section === "client_personal_link") return "\u0420\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430";
  if (section === "client_chat") return "\u0427\u0430\u0442";
  if (section.startsWith("bonus_")) return "\u0411\u043e\u043d\u0443\u0441\u044b";
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
  const code = cabinetBonusBalance(section)?.bonus_type || section.replace(/^bonus_/, "") || "cashback";
  const type = (cabinetData?.bonus_types || []).find((item) => item.code === code);
  return type?.name || (code === "cashback" ? "\u041a\u0435\u0448\u0431\u044d\u043a" : code);
}

function cabinetBonusBalance(section) {
  const code = section.replace(/^bonus_/, "") || "cashback";
  const balances = cabinetData?.bonus_balances || [];
  const exact = balances.find((item) => (item.bonus_type || "cashback") === code);
  if (code !== "cashback") return exact;
  return balances
    .filter((item) => item.bonus_type && item.bonus_type !== "cashback")
    .sort((left, right) => Number(right.balance || 0) - Number(left.balance || 0))[0] || exact;
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
    const level = cabinetData?.client_level || client?.client_level || cabinetData?.metric?.client_level || cabinetData?.metric?.loyalty_level || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d";
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
  if (section === "client_personal_link") {
    const referralLink = cabinetData?.referral_link || "";
    const invitesCount = Number(cabinetData?.referral_invites_count || 0);
    return `
      ${referralLink
        ? `<div class="inline-form compact"><a href="${escapeHtml(referralLink)}" target="_blank" rel="noopener noreferrer">${escapeHtml(referralLink)}</a><button type="button" class="ghost" data-cabinet-copy-referral>\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c</button></div>`
        : `<p class="cabinet-history-empty">\u0420\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u0430\u044f \u0441\u0441\u044b\u043b\u043a\u0430 \u043f\u043e\u043a\u0430 \u043d\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u0430.</p>`}
      <p>\u041f\u0440\u0438\u0433\u043b\u0430\u0448\u0451\u043d\u043d\u044b\u0445: <b>${escapeHtml(Number.isFinite(invitesCount) ? invitesCount : 0)}</b></p>
    `;
  }
  if (section === "client_chat") return `<p class="cabinet-history-empty">\u0427\u0430\u0442 \u043f\u043e\u043a\u0430 \u043d\u0435 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d.</p>`;
  if (section.startsWith("bonus_")) {
    const balance = cabinetBonusBalance(section);
    return `<b>${escapeHtml(cabinetMoney(balance?.balance || 0))}</b><span>${escapeHtml(cabinetBonusName(section))}</span>`;
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

function openCabinetMenu() {
  const menu = root.querySelector("[data-cabinet-menu]");
  if (!menu) return;
  menu.removeAttribute("hidden");
  requestAnimationFrame(() => menu.classList.add("is-open"));
}

function closeCabinetMenu() {
  const menu = root.querySelector("[data-cabinet-menu]");
  if (!menu || menu.hasAttribute("hidden")) return;
  menu.classList.remove("is-open");
  window.setTimeout(() => menu.setAttribute("hidden", ""), 230);
}

function setCabinetRegistrationMode(enabled) {
  const title = root.querySelector("[data-cabinet-title]");
  const historySection = root.querySelector("[data-cabinet-history-section]");
  const button = root.querySelector("[data-cabinet-submit]");
  const form = root.querySelector("[data-cabinet-form]");
  if (title) title.textContent = enabled ? "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f \u043a\u043b\u0438\u0435\u043d\u0442\u0430" : "\u041c\u043e\u0438 \u0434\u0430\u043d\u043d\u044b\u0435";
  if (historySection) historySection.hidden = enabled;
  if (button) button.textContent = enabled ? "\u0417\u0430\u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0438\u0440\u043e\u0432\u0430\u0442\u044c\u0441\u044f" : "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0434\u0430\u043d\u043d\u044b\u0435";
  if (form) form.dataset.cabinetRegistration = enabled ? "true" : "false";
  setCabinetEditMode(enabled);
}

function setCabinetEditMode(enabled) {
  const form = root.querySelector("[data-cabinet-form]");
  if (!form) return;
  const registration = form.dataset.cabinetRegistration === "true";
  const editing = registration || enabled;
  const lockedFields = new Set(["telegram_id", "max_id", "vk_id"]);
  form.querySelectorAll("[data-cabinet-field]").forEach((field) => {
    field.querySelectorAll("input, select, textarea").forEach((control) => {
      control.disabled = field.hidden || lockedFields.has(field.dataset.cabinetField) || !editing;
    });
  });
  const actions = root.querySelector("[data-cabinet-actions]");
  const editButton = root.querySelector("[data-cabinet-edit]");
  if (actions) actions.hidden = !editing;
  if (editButton) editButton.hidden = registration || editing;
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
  setCabinetEditMode(form.dataset.cabinetRegistration === "true");
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

function cabinetSubmitPayload(form) {
  const data = Object.fromEntries(new FormData(form).entries());
  const toNumber = (value) => {
    const trimmed = String(value || "").trim();
    return trimmed ? Number(trimmed) : null;
  };
  return {
    last_name: String(data.last_name || "").trim() || null,
    first_name: String(data.first_name || "").trim() || null,
    middle_name: String(data.middle_name || "").trim() || null,
    primary_phone: String(data.phone || "").trim() || null,
    gender: String(data.gender || "").trim() || null,
    telegram_id: toNumber(data.telegram_id),
    max_id: toNumber(data.max_id),
    vk_id: toNumber(data.vk_id),
    email: String(data.email || "").trim() || null,
  };
}

function cabinetPushContext() {
  const client = cabinetData?.client || cabinetClient || {};
  return { organizationId: cabinetData?.organization_id || client.organization_id, clientId: client.id || cabinetData?.client_id };
}

function base64ToUint8Array(value) {
  const padding = "=".repeat((4 - value.length % 4) % 4);
  const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
}

async function refreshCabinetPushState() {
  const toggle = root.querySelector("[data-cabinet-push-toggle]");
  const status = root.querySelector("[data-cabinet-push-status]");
  if (!toggle || !status) return null;
  const { organizationId, clientId } = cabinetPushContext();
  if (!organizationId || !clientId) {
    toggle.disabled = true;
    status.textContent = "\u041a\u043b\u0438\u0435\u043d\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.";
    return null;
  }
  const registration = "serviceWorker" in navigator ? await navigator.serviceWorker.register("/service-worker.js").catch(() => null) : null;
  const subscription = await registration?.pushManager?.getSubscription?.();
  const state = await api.pushStatus(organizationId, clientId, subscription?.endpoint || "");
  toggle.checked = !!state.enabled;
  toggle.disabled = !state.configured;
  status.textContent = state.configured ? "" : "Push-\u043a\u043b\u044e\u0447\u0438 VAPID \u043d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u044b \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.";
  return state;
}

function formatCabinetNotificationDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleString("ru-RU");
}

function cabinetNotificationStamp(item) {
  return String(item?.sent_at || item?.created_at || item?.id || "");
}

function linkifyCabinetText(value) {
  const text = String(value ?? "");
  const pattern = /https?:\/\/[^\s<>"']+/g;
  let html = "";
  let lastIndex = 0;
  let match;
  while ((match = pattern.exec(text))) {
    const url = match[0];
    html += escapeHtml(text.slice(lastIndex, match.index));
    html += `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(url)}</a>`;
    lastIndex = match.index + url.length;
  }
  return html + escapeHtml(text.slice(lastIndex));
}

function cabinetNotificationTitle(item) {
  return String(item?.message_title || item?.message_text || "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0435").trim().slice(0, 120) || "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0435";
}

function cabinetNotificationsSeenKey(clientId) {
  return `${CABINET_NOTIFICATIONS_SEEN_KEY}:${clientId || "unknown"}`;
}

function setCabinetNotificationBadge(hasUnread) {
  const button = root.querySelector("[data-cabinet-notifications-open]");
  if (!button) return;
  button.classList.toggle("has-unread", !!hasUnread);
}

async function refreshCabinetNotificationsList({ markSeen = false } = {}) {
  const list = root.querySelector("[data-cabinet-notifications-list]");
  if (!list) return;
  const { clientId } = cabinetPushContext();
  if (!clientId) return;
  const messages = await api.clientPushMessages(clientId);
  if (!messages.length) {
    list.textContent = "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.";
    setCabinetNotificationBadge(false);
    return;
  }
  const latestStamp = cabinetNotificationStamp(messages[0]);
  const seenKey = cabinetNotificationsSeenKey(clientId);
  const seenStamp = localStorage.getItem(seenKey) || "";
  setCabinetNotificationBadge(Boolean(latestStamp && latestStamp !== seenStamp));
  list.innerHTML = messages.map((item) => `
    <details class="cabinet-notification-item">
      <summary>${escapeHtml(cabinetNotificationTitle(item))}</summary>
      <div>${linkifyCabinetText(item.message_text || "")}</div>
      <small>${escapeHtml(formatCabinetNotificationDate(item.sent_at || item.created_at))}</small>
    </details>
  `).join("");
  if (markSeen) {
    localStorage.setItem(seenKey, latestStamp);
    setCabinetNotificationBadge(false);
  }
}

async function enableCabinetPushNotifications() {
  const { organizationId, clientId } = cabinetPushContext();
  await api.pushPreference({ organization_id: organizationId, client_id: clientId, enabled: true });
  if (!("Notification" in window) || !("serviceWorker" in navigator) || !("PushManager" in window)) {
    root.querySelector("[data-cabinet-push-status]").textContent = "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u044b.";
    const toggle = root.querySelector("[data-cabinet-push-toggle]");
    if (toggle) toggle.checked = true;
    return;
  }
  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    root.querySelector("[data-cabinet-push-status]").textContent = `\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u0438\u0435 \u043d\u0430 \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u043d\u0435 \u0432\u044b\u0434\u0430\u043d\u043e: ${permission}.`;
    return;
  }
  try {
    const state = await api.pushStatus(organizationId, clientId);
    if (!state?.public_key) throw new Error("Push-\u043a\u043b\u044e\u0447\u0438 VAPID \u043d\u0435 \u043d\u0430\u0441\u0442\u0440\u043e\u0435\u043d\u044b \u043d\u0430 \u0441\u0435\u0440\u0432\u0435\u0440\u0435.");
    const registration = await navigator.serviceWorker.register("/service-worker.js");
    const subscription = await registration.pushManager.getSubscription() || await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64ToUint8Array(state.public_key),
    });
    await api.pushSubscribe({
      organization_id: organizationId,
      client_id: clientId,
      endpoint: subscription.endpoint,
      keys: subscription.toJSON().keys,
      platform: navigator.platform || "",
      user_agent: navigator.userAgent || "",
    });
    root.querySelector("[data-cabinet-push-status]").textContent = "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u0432\u043a\u043b\u044e\u0447\u0435\u043d\u044b.";
  } catch (error) {
    root.querySelector("[data-cabinet-push-status]").textContent = error.message || "\u0421\u043e\u0441\u0442\u043e\u044f\u043d\u0438\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u043e, push-\u043f\u043e\u0434\u043f\u0438\u0441\u043a\u0430 \u043d\u0435 \u0441\u043e\u0437\u0434\u0430\u043d\u0430.";
  }
  const toggle = root.querySelector("[data-cabinet-push-toggle]");
  if (toggle) toggle.checked = true;
}

async function disableCabinetPushNotifications() {
  const { organizationId, clientId } = cabinetPushContext();
  await api.pushPreference({ organization_id: organizationId, client_id: clientId, enabled: false });
  const registration = await navigator.serviceWorker.ready.catch(() => null);
  const subscription = await registration?.pushManager.getSubscription();
  if (subscription) {
    await api.pushUnsubscribe(subscription.endpoint).catch(() => null);
    await subscription.unsubscribe().catch(() => null);
  }
  const toggle = root.querySelector("[data-cabinet-push-toggle]");
  if (toggle) toggle.checked = false;
  root.querySelector("[data-cabinet-push-status]").textContent = "\u0423\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f \u0432\u044b\u043a\u043b\u044e\u0447\u0435\u043d\u044b.";
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
      const user = state.me || await currentUser();
      if (!user) throw new Error();
      cabinetData = await api.cabinet().catch(() => null);
      cabinetClient = cabinetData?.client || null;
      applyCabinetRegistrationFields(form, cabinetData?.registration_fields);
      fillCabinetUser(form, cabinetClient || user);
      renderCabinetHistory(cabinetData?.card_sections ?? DEFAULT_CABINET_CARD_SECTIONS);
      await refreshCabinetPushState().catch(() => null);
      await refreshCabinetNotificationsList().catch(() => null);
      setMessage("", "");
      button.disabled = false;
    } catch {
      setMessage("\u0421\u0435\u0441\u0441\u0438\u044f \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d\u0430. \u0412\u043e\u0439\u0434\u0438\u0442\u0435 \u0441\u043d\u043e\u0432\u0430.", "error");
      button.disabled = true;
    }
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
    await refreshCabinetPushState().catch(() => null);
    await refreshCabinetNotificationsList().catch(() => null);
    button.disabled = false;
  } catch {
    const text = "\u0421\u0441\u044b\u043b\u043a\u0430 \u043d\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043b\u044c\u043d\u0430 \u0438\u043b\u0438 \u0443\u0436\u0435 \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u043d\u0430.";
    alert(text);
    setMessage(text, "error");
    root.querySelector(".cabinet-shell")?.setAttribute("hidden", "");
    location.replace("/auth.html");
  }
}

function sidebarIcon(icon) {
  return icon ? `<img class="sidebar-nav-icon" src="/fronted/icons/${icon}" alt="" aria-hidden="true" />` : "";
}

function navLink(href, label, icon = "") {
  if (href.includes("/settings") && !canAny(SETTINGS_PERMISSIONS)) return "";
  if (href.includes("/catalog") && !canAny(["settings.categories.view", "settings.items.view"])) return "";
  if (href.includes("/settings")) {
    const active = location.pathname === href;
    return `<a class="${active ? "active" : ""}" href="${href}">${sidebarIcon(icon)}<span>${escapeHtml(label)}</span></a>`;
  }
  if (href.includes("/catalog")) {
    const active = location.pathname === href;
    return `<a class="${active ? "active" : ""}" href="${href}">${sidebarIcon(icon)}<span>${escapeHtml(label)}</span></a>`;
  }
  const permission = href.includes("/clients")
    ? "clients.clients.view"
    : href.includes("/loyalty")
      ? ""
      : href.includes("/tasks")
        ? ""
        : href.includes("/settings")
            ? "settings.roles.manage"
            : "overview.view";
  if (href.includes("/loyalty") && !canAny(LOYALTY_PERMISSIONS)) return "";
  if (href.includes("/tasks") && !canAny(TASK_PERMISSIONS)) return "";
  if (permission && !can(permission)) return "";
  const active = location.pathname === href || (href.includes("/loyalty") && location.pathname.includes("/loyalty"));
  return `<a class="${active ? "active" : ""}" href="${href}">${sidebarIcon(icon)}<span>${escapeHtml(label)}</span></a>`;
}

function activeSettingsSectionSlug() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] !== "organizations" || parts[2] !== "settings") return "";
  const slug = parts[3] || SETTINGS_MENU_SECTIONS[0]?.slug || "";
  return SETTINGS_MENU_SECTIONS.some((section) => section.slug === slug) ? slug : (SETTINGS_MENU_SECTIONS[0]?.slug || "");
}

function activeCatalogSectionSlug() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] !== "organizations" || parts[2] !== "catalog") return "";
  const slug = parts[3] || CATALOG_MENU_SECTIONS[0]?.slug || "";
  return CATALOG_MENU_SECTIONS.some((section) => section.slug === slug) ? slug : (CATALOG_MENU_SECTIONS[0]?.slug || "");
}

function activeLoyaltySectionSlug() {
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] !== "organizations" || parts[2] !== "loyalty") return "";
  const slug = parts[3] || "";
  return LOYALTY_MENU_SECTIONS.some((section) => section.slug === slug) ? slug : "";
}

function loyaltySidebarMenu(orgId) {
  const visibleSections = LOYALTY_MENU_SECTIONS.filter((section) => canAny(section.permissions));
  if (!visibleSections.length) return "";
  const isLoyaltyPage = location.pathname.includes(`/organizations/${orgId}/loyalty`);
  const activeSlug = activeLoyaltySectionSlug();
  return `
    <div class="sidebar-group ${isLoyaltyPage ? "active" : ""}">
      <button
        type="button"
        class="sidebar-group-toggle ${isLoyaltyPage ? "active" : ""}"
        data-loyalty-menu-toggle
        aria-expanded="${isLoyaltyPage ? "true" : "false"}"
        aria-controls="loyalty-submenu"
      >
        <span class="sidebar-group-label">${sidebarIcon("loylty.svg")}<span>Лояльность</span></span>
        <span class="sidebar-group-chevron" aria-hidden="true"></span>
      </button>
      <div
        id="loyalty-submenu"
        class="sidebar-submenu ${isLoyaltyPage ? "is-open" : ""}"
        ${isLoyaltyPage ? "" : "hidden"}
      >
        ${visibleSections.map((section) => `
          <a
            class="${activeSlug === section.slug ? "active" : ""}"
            href="/organizations/${orgId}/loyalty${section.slug ? `/${section.slug}` : ""}"
          >${escapeHtml(section.label)}</a>
        `).join("")}
      </div>
    </div>
  `;
}

function catalogSidebarMenu(orgId) {
  if (!canAny(["settings.categories.view", "settings.items.view"])) return "";
  const visibleSections = CATALOG_MENU_SECTIONS.filter((section) => canAny(section.permissions));
  if (!visibleSections.length) return "";
  const isCatalogPage = location.pathname.includes(`/organizations/${orgId}/catalog`);
  const routeSlug = activeCatalogSectionSlug();
  const activeSlug = visibleSections.some((section) => section.slug === routeSlug) ? routeSlug : visibleSections[0].slug;
  return `
    <div class="sidebar-group ${isCatalogPage ? "active" : ""}">
      <button
        type="button"
        class="sidebar-group-toggle ${isCatalogPage ? "active" : ""}"
        data-catalog-menu-toggle
        aria-expanded="${isCatalogPage ? "true" : "false"}"
        aria-controls="catalog-submenu"
      >
        <span class="sidebar-group-label">${sidebarIcon("services_main.svg")}<span>Товары и услуги</span></span>
        <span class="sidebar-group-chevron" aria-hidden="true"></span>
      </button>
      <div
        id="catalog-submenu"
        class="sidebar-submenu"
        data-catalog-submenu
        ${isCatalogPage ? "" : "hidden"}
      >
        ${visibleSections.map((section) => `
          <a
            class="${activeSlug === section.slug ? "active" : ""}"
            href="/organizations/${orgId}/catalog/${section.slug}"
          >${escapeHtml(section.label)}</a>
        `).join("")}
      </div>
    </div>
  `;
}

function settingsSidebarMenu(orgId) {
  if (!canAny(SETTINGS_PERMISSIONS)) return "";
  const visibleSections = SETTINGS_MENU_SECTIONS.filter((section) => canAny(section.permissions));
  if (!visibleSections.length) return "";
  const isSettingsPage = location.pathname.includes(`/organizations/${orgId}/settings`);
  const routeSlug = activeSettingsSectionSlug();
  const activeSlug = visibleSections.some((section) => section.slug === routeSlug) ? routeSlug : visibleSections[0].slug;
  return `
    <div class="sidebar-group ${isSettingsPage ? "active" : ""}">
      <button
        type="button"
        class="sidebar-group-toggle ${isSettingsPage ? "active" : ""}"
        data-settings-menu-toggle
        aria-expanded="${isSettingsPage ? "true" : "false"}"
        aria-controls="settings-submenu"
      >
        <span class="sidebar-group-label">${sidebarIcon("settings_org.svg")}<span>Настройки организации</span></span>
        <span class="sidebar-group-chevron" aria-hidden="true"></span>
      </button>
      <div
        id="settings-submenu"
        class="sidebar-submenu ${isSettingsPage ? "is-open" : ""}"
        ${isSettingsPage ? "" : "hidden"}
      >
        ${visibleSections.map((section) => `
          <a
            class="${activeSlug === section.slug ? "active" : ""}"
            href="/organizations/${orgId}/settings/${section.slug}"
          >${escapeHtml(section.label)}</a>
        `).join("")}
      </div>
    </div>
  `;
}

function shell(content, title) {
  const org = state.org;
  const orgOptions = state.orgs.map((item) => `
    <option value="${item.id}" ${item.id === org.id ? "selected" : ""}>${escapeHtml(item.name)}</option>
  `).join("");

  return `
    <div class="app ${sidebarOpen ? "sidebar-open" : ""}">
      <div class="ajax-indicator" aria-hidden="true"><span></span></div>
      <aside class="sidebar ${sidebarOpen ? "is-open" : ""}" data-sidebar aria-label="Основное меню" aria-hidden="${sidebarOpen ? "false" : "true"}">
        <div class="sidebar-head">
        <strong class="brand">Лояльность</strong>
          <button type="button" class="sidebar-close" data-sidebar-close aria-label="Закрыть меню">×</button>
        </div>
        <select aria-label="Организация" data-org-switch>${orgOptions}</select>
        <button class="ghost" data-open-onboarding>Создать организацию</button>
        <nav>
          ${navLink(`/organizations/${org.id}`, "Главная", "main.svg")}
          ${navLink(`/organizations/${org.id}/clients`, "Клиенты", "clients.svg")}
          ${loyaltySidebarMenu(org.id)}
          ${catalogSidebarMenu(org.id)}
          ${settingsSidebarMenu(org.id)}
          ${navLink(`/organizations/${org.id}/tasks`, "Задачи", "tasks.svg")}
          ${navLink(`/organizations/${org.id}/booking`, "Записи", "recorsd.svg")}
        </nav>
      </aside>
      <main class="content">
        <header class="topbar">
          <div class="topbar-title">
            <button
              type="button"
              class="sidebar-toggle"
              data-sidebar-toggle
              aria-label="${sidebarOpen ? "Меню открыто" : "Открыть меню"}"
              aria-expanded="${sidebarOpen ? "true" : "false"}"
            >
              <span class="sidebar-toggle-box" aria-hidden="true">
                <span></span><span></span><span></span>
              </span>
            </button>
            <div><span data-org-title>${escapeHtml(org.name)}</span><h1 data-page-title>${escapeHtml(title)}</h1></div>
          </div>
          <button class="ghost" data-logout>Выйти</button>
        </header>
        <div data-page-content>${content}</div>
      </main>
    </div>
  `;
}

function syncSidebarState() {
  const app = root.querySelector(".app");
  const sidebar = root.querySelector("[data-sidebar]");
  const toggle = root.querySelector("[data-sidebar-toggle]");

  app?.classList.toggle("sidebar-open", sidebarOpen);
  sidebar?.classList.toggle("is-open", sidebarOpen);
  sidebar?.setAttribute("aria-hidden", sidebarOpen ? "false" : "true");

  toggle?.setAttribute("aria-expanded", sidebarOpen ? "true" : "false");
  toggle?.setAttribute(
    "aria-label",
    sidebarOpen ? "Меню открыто" : "Открыть меню",
  );
}

function openSidebar() {
  sidebarOpen = true;
  syncSidebarState();
}

function closeSidebar({ restoreFocus = false } = {}) {
  sidebarOpen = false;
  syncSidebarState();

  if (restoreFocus) {
    root.querySelector("[data-sidebar-toggle]")?.focus();
  }
}

window.addEventListener("resize", () => {
  if (window.innerWidth <= SIDEBAR_COMPACT_BREAKPOINT && sidebarOpen) closeSidebar();
});

function toggleSettingsSidebarMenu() {
  const toggle = root.querySelector("[data-settings-menu-toggle]");
  const submenu = root.querySelector("#settings-submenu");
  if (!toggle || !submenu) return;
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
  submenu.hidden = isOpen;
  submenu.classList.toggle("is-open", !isOpen);
}

function toggleCatalogSidebarMenu() {
  const toggle = root.querySelector("[data-catalog-menu-toggle]");
  const submenu = root.querySelector("#catalog-submenu");
  if (!toggle || !submenu) return;
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
  submenu.hidden = isOpen;
  submenu.classList.toggle("is-open", !isOpen);
}

function toggleLoyaltySidebarMenu() {
  const toggle = root.querySelector("[data-loyalty-menu-toggle]");
  const submenu = root.querySelector("#loyalty-submenu");
  if (!toggle || !submenu) return;
  const isOpen = toggle.getAttribute("aria-expanded") === "true";
  toggle.setAttribute("aria-expanded", isOpen ? "false" : "true");
  submenu.hidden = isOpen;
  submenu.classList.toggle("is-open", !isOpen);
}

function navigate(path) {
  history.pushState(null, "", path);
  draw();
}

function reload() {
  draw({ live: true });
}

async function restoreStoredSession() {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) return null;
  try {
    const result = await api.restoreSession({ token });
    if (result?.session_token) localStorage.setItem(SESSION_TOKEN_KEY, result.session_token);
    return result?.user || null;
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    return null;
  }
}

async function currentUser() {
  try {
    return await api.me();
  } catch {
    return await restoreStoredSession();
  }
}

async function ensureSession() {
  state.me = await currentUser();
  if (!state.me) {
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
  if (routeInfo.page === "loyalty" && !canAny(LOYALTY_PERMISSIONS)) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "tasks" && !canAny(TASK_PERMISSIONS)) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "settings" && !canAny(SETTINGS_PERMISSIONS)) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "catalog" && !canAny(["settings.categories.view", "settings.items.view"])) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "clients") return ["Клиенты", await clients(ctx)];
  if (routeInfo.page === "catalog") return ["Товары и услуги", await catalog(ctx, routeInfo.extra || "products")];
  if (routeInfo.page === "loyalty") return ["Лояльность", await loyalty(ctx, routeInfo.extra || "rules")];
  if (routeInfo.page === "notifications") return ["Лояльность", await loyalty(ctx, "notifications")];
  if (routeInfo.page === "tasks") return ["Задачи", await tasks(ctx)];
  if (routeInfo.page === "booking") return ["Записи", await booking(ctx)];
  if (routeInfo.page === "settings") return ["Настройки организации", await settings(ctx, routeInfo.extra || "")];
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
  syncSidebarState();
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
  button.disabled = true;
  setMessage("\u0421\u043e\u0445\u0440\u0430\u043d\u044f\u0435\u043c \u0434\u0430\u043d\u043d\u044b\u0435...");
  try {
    const profile = cabinetSubmitPayload(form);
    const endpoint = token
      ? `/public-api/client-auth-links/${encodeURIComponent(token)}/submit`
      : cabinetClient?.id
        ? `/crm-api/clients-core/clients/${encodeURIComponent(cabinetClient.id)}`
        : "";
    if (!endpoint) throw new Error("\u041a\u043b\u0438\u0435\u043d\u0442 \u043d\u0435 \u043d\u0430\u0439\u0434\u0435\u043d.");
    const body = token ? {
      last_name: profile.last_name,
      first_name: profile.first_name,
      middle_name: profile.middle_name,
      phone: profile.primary_phone,
      gender: profile.gender,
      telegram_id: profile.telegram_id,
      max_id: profile.max_id,
      vk_id: profile.vk_id,
      email: profile.email,
      referral_code: new URLSearchParams(window.location.search).get("referral_code") || null,
    } : profile;
    const response = await fetch(endpoint, {
      method: token ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
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
    cabinetClient = result.client || result || null;
    renderCabinetHistory(cabinetCardSections);
    setMessage("\u0414\u0430\u043d\u043d\u044b\u0435 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b.", "success");
    if (!token) setCabinetEditMode(false);
    button.disabled = false;
  } catch (error) {
    setMessage(error.message, "error");
    button.disabled = false;
  }
});

root.addEventListener("click", async (event) => {
  if (event.target.closest("[data-cabinet-edit]")) {
    setCabinetEditMode(true);
    return;
  }
  if (event.target.closest("[data-sidebar-toggle]")) {
    openSidebar();
    return;
  }

  if (event.target.closest("[data-sidebar-close]")) {
    closeSidebar({ restoreFocus: true });
    return;
  }

  if (event.target.closest("[data-loyalty-menu-toggle]")) {
    toggleLoyaltySidebarMenu();
    return;
  }

  if (event.target.closest("[data-settings-menu-toggle]")) {
    toggleSettingsSidebarMenu();
    return;
  }

  if (event.target.closest("[data-catalog-menu-toggle]")) {
    toggleCatalogSidebarMenu();
    return;
  }

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
    closeCabinetMenu();
    history.replaceState(null, "", "#my-data");
    return;
  }

  if (event.target.closest("[data-cabinet-menu-open]")) {
    openCabinetMenu();
    return;
  }

  if (event.target.closest("[data-cabinet-menu-close]") || event.target.matches("[data-cabinet-menu]")) {
    closeCabinetMenu();
    return;
  }

  const cabinetNotificationsOpen = event.target.closest("[data-cabinet-notifications-open]");
  if (cabinetNotificationsOpen) {
    root.querySelector("[data-cabinet-notifications-modal]")?.removeAttribute("hidden");
    await refreshCabinetPushState().catch(() => null);
    await refreshCabinetNotificationsList({ markSeen: true }).catch(() => null);
    return;
  }

  if (event.target.closest("[data-cabinet-notifications-close]") || event.target.matches("[data-cabinet-notifications-modal]")) {
    root.querySelector("[data-cabinet-notifications-modal]")?.setAttribute("hidden", "");
    return;
  }

  const cabinetPushToggle = event.target.closest(".cabinet-notifications-toggle");
  if (cabinetPushToggle) {
    event.preventDefault();
    const pushToggle = root.querySelector("[data-cabinet-push-toggle]");
    if (!pushToggle || pushToggle.disabled) return;
    const enable = !pushToggle.checked;
    pushToggle.checked = enable;
    pushToggle.disabled = true;
    try {
      if (enable) await enableCabinetPushNotifications();
      else await disableCabinetPushNotifications();
    } catch (error) {
      pushToggle.checked = !enable;
      const status = root.querySelector("[data-cabinet-push-status]");
      if (status) status.textContent = error.message || "\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0431\u043d\u043e\u0432\u0438\u0442\u044c \u0443\u0432\u0435\u0434\u043e\u043c\u043b\u0435\u043d\u0438\u044f.";
    } finally {
      pushToggle.disabled = false;
    }
    return;
  }

  const referralCopy = event.target.closest("[data-cabinet-copy-referral]");
  if (referralCopy) {
    const referralLink = cabinetData?.referral_link || "";
    if (referralLink) {
      await navigator.clipboard.writeText(referralLink);
      referralCopy.textContent = "\u0421\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u043e";
    }
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
    localStorage.removeItem(SESSION_TOKEN_KEY);
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
    localStorage.removeItem(SESSION_TOKEN_KEY);
    location.href = "/auth.html";
  }
});

root.addEventListener("change", (event) => {
  const pushToggle = event.target.closest("[data-cabinet-push-toggle]");
  if (pushToggle) return;

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
bindCatalog(root, { get org() { return state.org; }, navigate, reload });
bindLoyalty(root, { get org() { return state.org; }, navigate, reload });
bindNotifications(root, { get org() { return state.org; }, navigate, reload });
bindSettings(root, { get org() { return state.org; }, navigate, reload });
bindTasks(root, { get org() { return state.org; }, reload });
bindBooking(root, { get org() { return state.org; }, reload });

redirectClientDomainFromAdminPath().then((redirected) => {
  if (!redirected) draw();
});
