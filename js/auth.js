import { api } from "./api.js";
import { ensureCss, escapeHtml, formData, normalizePhone, render, root, setMessage } from "./dom.js";

const params = new URLSearchParams(location.search);
let mode = params.get("mode") === "register" || location.pathname === "/register" ? "register" : "login";
let twoFactor = null;
let loginDraft = "";
let twoFactorTarget = "/";
let codeMethodPopoverOpen = false;
let clientCodeChannel = "";
let clientCodeOrganizations = [];
let clientCodeOrganizationId = "";
let loginContext = { is_client_domain: false };
const SESSION_TOKEN_KEY = "loyalty.sessionToken";

ensureCss();

function channelLabel(channel) {
  if (channel === "telegram") return "Telegram";
  if (channel === "max") return "MAX";
  return channel || "";
}

function twoFactorHtml() {
  if (!twoFactor) return "";
  const label = channelLabel(twoFactor.channel);
  const statusText = twoFactor.sent
    ? `\u041a\u043e\u0434 \u043e\u0442\u043f\u0440\u0430\u0432\u043b\u0435\u043d \u0432 ${label}.`
    : twoFactor.waiting_for_bot_start
      ? `\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u0435 \u0431\u043e\u0442\u0430 ${label}, \u043f\u043e\u0441\u043b\u0435 \u044d\u0442\u043e\u0433\u043e \u043a\u043e\u0434 \u043f\u0440\u0438\u0434\u0435\u0442 \u0430\u0432\u0442\u043e\u043c\u0430\u0442\u0438\u0447\u0435\u0441\u043a\u0438.`
      : `\u041a\u043e\u0434 \u043d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043f\u0440\u0430\u0432\u0438\u0442\u044c \u0432 ${label}.`;
  return `
    <div class="modal-backdrop" data-2fa-modal>
      <div class="modal-card auth-2fa-card auth-code-card">
        <div class="modal-head">
          <h3>\u041a\u043e\u0434 \u0432\u0445\u043e\u0434\u0430 \u0447\u0435\u0440\u0435\u0437 ${label}</h3>
          <button type="button" class="ghost" data-2fa-cancel>\u0417\u0430\u043a\u0440\u044b\u0442\u044c</button>
        </div>
        <form class="modal-grid" data-2fa-form>
          <p class="modal-full">${statusText}</p>
          ${twoFactor.waiting_for_bot_start && twoFactor.link ? `<a class="primary modal-full auth-2fa-link" href="${twoFactor.link}" target="_blank" rel="noreferrer">\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0431\u043e\u0442\u0430 ${label}</a>` : ""}
          <label class="modal-full"><span>\u041a\u043e\u0434</span><input name="code" inputmode="numeric" autocomplete="one-time-code" required autofocus></label>
          <button class="primary modal-full">\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0432\u0445\u043e\u0434</button>
          <p class="modal-full" data-message></p>
        </form>
      </div>
    </div>
  `;
}

function codeMethodPopoverHtml() {
  if (!codeMethodPopoverOpen) return "";
  return `<div class="auth-code-popover" data-auth-code-popover role="dialog" aria-label="Выбор организации">
      <strong>Выберите организацию</strong>
      <label><span>Организация</span>
        <select name="code_organization_id" required>
          ${clientCodeOrganizations.map((organization) => '<option value="' + organization.id + '" ' + (String(organization.id) === String(clientCodeOrganizationId) ? "selected" : "") + '>' + escapeHtml(organization.name) + '</option>').join("")}
        </select>
      </label>
      <button type="button" class="primary" data-code-organization-continue>Продолжить</button>
    </div>`;
}

function loginChannelsHtml() {
  return `<div class="row">
    <div class="col">
      <button type="button" class="btn btn-4 w-100" data-auth-channel="max">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round"
             class="icon text-github icon-2">
          <path d="M9 19c-4.3 1.4 -4.3 -2.5 -6 -3m12 5v-3.5c0 -1 .1 -1.4 -.5 -2.6c2.8 -.3 5.5 -1.4 5.5 -6a4.6 4.6 0 0 0 -1.3 -3.2a4.2 4.2 0 0 0 -.1 -3.2s-1.1 -.3 -3.5 1.3a12.3 12.3 0 0 0 -6.2 0c-2.4 -1.6 -3.5 -1.3 -3.5 -1.3a4.2 4.2 0 0 0 -.1 3.2a4.6 4.6 0 0 0 -1.3 3.2c0 4.6 2.7 5.7 5.5 6c-.6 -.6 -.6 1.2 -.5 2v3.5"></path>
        </svg>
        Войти через MAX
      </button>
    </div>
    <div class="col">
      <button type="button" class="btn btn-4 w-100" data-auth-channel="telegram">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
             viewBox="0 0 24 24"
             fill="none"
             stroke="currentColor"
             stroke-width="2"
             stroke-linecap="round"
             stroke-linejoin="round"
             class="icon text-x icon-2">
          <path d="M4 4l11.733 16h4.267l-11.733 -16z"></path>
          <path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path>
        </svg>
        Войти через Telegram
      </button>
    </div>
  </div>`;
}

function authHtml() {
  const isRegister = mode === "register";
  return `
    <main class="auth-page">
      <form class="auth-card ${isRegister ? "wide" : ""}" data-auth-form>
        <h1>${isRegister ? "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f" : "\u0412\u0445\u043e\u0434"}</h1>
        <div class="auth-tabs">
          <button type="button" class="${!isRegister ? "primary" : "ghost"}" data-mode="login">\u0412\u043e\u0439\u0442\u0438</button>
          <button type="button" class="${isRegister ? "primary" : "ghost"}" data-mode="register">\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442</button>
        </div>
        ${isRegister ? '<label><span>\u0418\u043c\u044f</span><input name="name" required></label>' : ""}
        <label><span>${isRegister ? "Email" : "Email \u0438\u043b\u0438 \u0442\u0435\u043b\u0435\u0444\u043e\u043d"}</span><input name="${isRegister ? "email" : "login"}" ${isRegister ? 'type="email" autocomplete="email"' : `type="text" autocomplete="username" placeholder="введите ваши данные" data-login-phone-input value="${escapeHtml(loginDraft)}"`} required></label>
        ${isRegister ? '<label><span>\u0422\u0435\u043b\u0435\u0444\u043e\u043d</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" data-phone-input></label>' : ""}
        ${isRegister ? '<label><span>\u041f\u0430\u0440\u043e\u043b\u044c</span><input name="password" type="password" required></label>' : ""}
        ${isRegister ? '<label><span>\u041f\u043e\u0432\u0442\u043e\u0440 \u043f\u0430\u0440\u043e\u043b\u044f</span><input name="confirm" type="password" required></label>' : ""}
        <p data-message></p>
        ${isRegister ? '<button class="primary">\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442</button>' : loginChannelsHtml()}
        ${isRegister ? "" : `<div class="auth-code-popover-wrap">${codeMethodPopoverHtml()}</div>`}
      </form>
      ${twoFactorHtml()}
    </main>
  `;
}

function draw() {
  render(root, authHtml());
}

function saveSession(result) {
  if (result?.session_token) localStorage.setItem(SESSION_TOKEN_KEY, result.session_token);
}

async function restoreAndRedirect() {
  const token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) return false;
  try {
    const result = await api.restoreSession({ token });
    saveSession(result);
    location.replace(loginContext.is_client_domain ? "/cabinet.html" : "/");
    return true;
  } catch {
    localStorage.removeItem(SESSION_TOKEN_KEY);
    return false;
  }
}

function sameHostUrl(url) {
  if (!url) return "";
  try {
    const target = new URL(url, window.location.origin);
    return target.host === window.location.host ? target.toString() : "";
  } catch {
    return "";
  }
}

root.addEventListener("input", (event) => {
  if (!event.target.matches('[name="login"]')) return;
  loginDraft = event.target.value;
});

root.addEventListener("click", async (event) => {
  if (event.target.closest("[data-2fa-cancel]")) {
    twoFactor = null;
    root.querySelector("[data-2fa-modal]")?.remove();
    return;
  }

  const channelButton = event.target.closest("[data-auth-channel]");
  if (channelButton) {
    const form = channelButton.closest("[data-auth-form]");
    const data = formData(form);
    const phone = normalizePhone(data.login || loginDraft);
    const channel = channelButton.dataset.authChannel;
    setMessage(form, "");
    try {
      if (!phone) throw new Error("Укажите телефон");
      clientCodeChannel = channel;
      const result = await api.clientCodeOrganizations({ phone });
      clientCodeOrganizations = (result.organizations || []).filter((organization) => (organization.channels || []).includes(channel));
      if (!clientCodeOrganizations.length) {
        throw new Error(channel === "max" ? "Нет организаций с доступным входом через MAX" : "Нет организаций с доступным входом через Telegram");
      }
      clientCodeOrganizationId = String(clientCodeOrganizations[0].id);
      codeMethodPopoverOpen = true;
      draw();
    } catch (error) {
      clientCodeOrganizations = [];
      clientCodeOrganizationId = "";
      codeMethodPopoverOpen = false;
      setMessage(form, error.message);
    }
    return;
  }

  const organizationContinue = event.target.closest("[data-code-organization-continue]");
  if (organizationContinue) {
    const form = organizationContinue.closest("[data-auth-form]");
    const organizationId = Number(form.querySelector('[name="code_organization_id"]')?.value || 0);
    if (!organizationId) {
      setMessage(form, "Выберите организацию");
      return;
    }
    clientCodeOrganizationId = String(organizationId);
    const data = formData(form);
    const phone = normalizePhone(data.login || loginDraft);
    setMessage(form, "");
    try {
      if (!phone) throw new Error("Укажите телефон");
      if (!clientCodeChannel) throw new Error("Выберите канал входа");
      twoFactor = await api.startClientCodeAuth({ phone, channel: clientCodeChannel, organization_id: organizationId });
      twoFactorTarget = sameHostUrl(twoFactor.redirect_url) || "/";
      codeMethodPopoverOpen = false;
      draw();
    } catch (error) {
      setMessage(form, error.message);
    }
    return;
  }

  const button = event.target.closest("[data-mode]");
  if (!button) return;
  mode = button.dataset.mode;
  twoFactor = null;
  codeMethodPopoverOpen = false;
  clientCodeChannel = "";
  clientCodeOrganizations = [];
  clientCodeOrganizationId = "";
  twoFactorTarget = "/";
  history.replaceState(null, "", `/auth.html?mode=${mode}`);
  draw();
});

root.addEventListener("submit", async (event) => {
  const twoFactorForm = event.target.closest("[data-2fa-form]");
  if (twoFactorForm) {
    event.preventDefault();
    setMessage(twoFactorForm, "");
    const data = formData(twoFactorForm);
    try {
      saveSession(await api.verify2fa({ ticket: twoFactor.ticket, code: data.code }));
      location.href = twoFactorTarget;
    } catch (error) {
      setMessage(twoFactorForm, error.message);
    }
    return;
  }

  const form = event.target.closest("[data-auth-form]");
  if (!form) return;
  event.preventDefault();
  setMessage(form, "");
  if (mode !== "register") return;

  const data = formData(form);
  try {
    if (data.password !== data.confirm) throw new Error("Пароли не совпадают");
    saveSession(await api.register({
      name: data.name,
      email: data.email || undefined,
      phone: normalizePhone(data.phone) || undefined,
      password: data.password,
    }));
    location.href = "/";
  } catch (error) {
    setMessage(form, error.message);
  }
});

api.loginContext()
  .then((context) => {
    loginContext = context || loginContext;
  })
  .catch(() => null)
  .then(restoreAndRedirect)
  .then((redirected) => {
    if (!redirected) draw();
  });
