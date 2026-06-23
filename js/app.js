import { api } from "./api.js";
import { ensureCss, escapeHtml, render, root } from "./dom.js";
import { dashboard } from "./modules/dashboard.js";
import { onboarding, bindOnboarding } from "./modules/onboarding.js";
import { clients, bindClients } from "./modules/clients.js";
import { loyalty, bindLoyalty } from "./modules/loyalty.js";
import { settings, bindSettings } from "./modules/settings.js";

const LAST_ORG_KEY = "loyalty.lastOrganizationId";

ensureCss();

let state = { me: null, orgs: [], org: null, permissionsConfigured: false, allowedPermissions: new Set(), hasOrganizationRole: false };

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
  if (parts[0] === "login" || parts[0] === "register") return { page: "auth" };
  if (parts[0] === "onboarding") return { page: "onboarding" };
  if (parts[0] !== "organizations") return { page: "home" };
  return { page: parts[2] || "dashboard", orgId: Number(parts[1]), extra: parts[3] || "" };
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
      <aside class="sidebar">
        <strong class="brand">Лояльность</strong>
        <select aria-label="Организация" data-org-switch>${orgOptions}</select>
        <button class="ghost" data-open-onboarding>Создать организацию</button>
        <nav>
          ${navLink(`/organizations/${org.id}`, "Обзор")}
          ${navLink(`/organizations/${org.id}/clients`, "Клиенты")}
          ${navLink(`/organizations/${org.id}/loyalty`, "Лояльность")}
          ${navLink(`/organizations/${org.id}/settings`, "Настройки организации")}
        </nav>
      </aside>
      <main class="content">
        <header class="topbar">
          <div><span>${escapeHtml(org.name)}</span><h1>${escapeHtml(title)}</h1></div>
          <button class="ghost" data-logout>Выйти</button>
        </header>
        ${content}
      </main>
    </div>
  `;
}

function navigate(path) {
  history.pushState(null, "", path);
  draw();
}

function reload() {
  draw();
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
  if (routeInfo.page === "settings" && !canAny(SETTINGS_PERMISSIONS)) return ["Access denied", '<section class="panel"><p>Access denied</p></section>'];
  if (routeInfo.page === "clients") return ["Клиенты", await clients(ctx)];
  if (routeInfo.page === "loyalty") return ["Лояльность", await loyalty(ctx, routeInfo.extra || "rules")];
  if (routeInfo.page === "settings") return ["Настройки организации", await settings(ctx)];
  return ["Обзор", await dashboard(ctx)];
}

async function draw() {
  render(root, '<main class="auth-page"><p>Загружаем...</p></main>');
  const routeInfo = route();

  if (routeInfo.page === "auth") {
    authRedirect();
    return;
  }

  if (!(await ensureSession())) return;

  if (routeInfo.page === "onboarding") {
    if (state.hasOrganizationRole && state.orgs.length) {
      const org = chooseOrg(routeInfo);
      history.replaceState(null, "", `/organizations/${org.id}`);
      draw();
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
  render(root, shell(content, title));
  if (state.hasOrganizationRole) {
    root.querySelector("[data-open-onboarding]")?.remove();
  }
  root.querySelectorAll("[data-permission]").forEach((node) => {
    if (!can(node.dataset.permission)) node.remove();
  });
}

root.addEventListener("click", async (event) => {
  const link = event.target.closest("a[href^='/']");
  if (link) {
    event.preventDefault();
    navigate(link.getAttribute("href"));
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

bindOnboarding(root);
bindClients(root, { get org() { return state.org; }, navigate, reload });
bindLoyalty(root, { get org() { return state.org; }, reload });
bindSettings(root, { get org() { return state.org; }, reload });

draw();
