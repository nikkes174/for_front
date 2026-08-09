import { api } from "./api.js";
import { ensureCss, escapeHtml, formData, normalizePhone, render, root, setMessage } from "./dom.js";

const params = new URLSearchParams(location.search);
let mode = params.get("mode") === "register" || location.pathname === "/register" ? "register" : "login";
let twoFactor = null;
let loginDraft = "";
let twoFactorTarget = "/";
let resetPasswordOpen = false;
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
          <button type="button" class="ghost btn-ghost-secondary" data-2fa-cancel>\u0417\u0430\u043a\u0440\u044b\u0442\u044c</button>
        </div>
        <form class="modal-grid" data-2fa-form>
          <p class="modal-full">${statusText}</p>
          ${twoFactor.waiting_for_bot_start && twoFactor.link ? `<a class="primary modal-full auth-2fa-link" href="${twoFactor.link}" target="_blank" rel="noreferrer">\u0417\u0430\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0431\u043e\u0442\u0430 ${label}</a>` : ""}
          <label class="modal-full"><span>\u041a\u043e\u0434</span><input name="code" inputmode="numeric" autocomplete="one-time-code" required autofocus></label>
          <button class="primary modal-full auth-primary-btn">\u041f\u043e\u0434\u0442\u0432\u0435\u0440\u0434\u0438\u0442\u044c \u0432\u0445\u043e\u0434</button>
          <p class="modal-full" data-message></p>
        </form>
      </div>
    </div>
  `;
}

function resetPasswordHtml() {
  if (!resetPasswordOpen) return "";
  return `
    <div class="modal-backdrop" data-reset-password-modal>
      <div class="modal-card auth-2fa-card">
        <div class="modal-head">
          <h3>Сброс пароля</h3>
          <button type="button" class="ghost btn-ghost-secondary" data-reset-password-cancel>Закрыть</button>
        </div>
        <form class="modal-grid" data-reset-password-form>
          <label class="modal-full"><span>ID организации</span><input name="organization_id" inputmode="numeric" required autofocus></label>
          <label class="modal-full"><span>Новый пароль</span><input name="password" type="password" required minlength="8"></label>
          <button class="primary modal-full auth-primary-btn">Сбросить и назначить</button>
          <p class="modal-full" data-message></p>
        </form>
      </div>
    </div>`;
}

function codeMethodPopoverHtml() {
  if (!codeMethodPopoverOpen) return "";
  return `<div class="auth-code-popover" data-auth-code-popover role="dialog" aria-label="Выбор организации">
      <strong>Выберите организацию</strong>
      <label><span>Организация</span>
        <select name="code_organization_id" required>
          ${clientCodeOrganizations.map((organization) => {
            const channelAvailable = (organization.channels || []).includes(clientCodeChannel);
            const unavailableLabel = clientCodeChannel === "max" ? "MAX не подключён" : "Telegram не подключён";
            return '<option value="' + organization.id + '" ' + (String(organization.id) === String(clientCodeOrganizationId) ? "selected" : "") + (channelAvailable ? "" : " disabled") + '>' + escapeHtml(organization.name + (channelAvailable ? "" : ` — ${unavailableLabel}`)) + '</option>';
          }).join("")}
        </select>
      </label>
      <button type="button" class="primary auth-primary-btn" data-code-organization-continue>Продолжить</button>
    </div>`;
}

function loginChannelsHtml() {
  return `
      <button type="button" class="btn btn-4 w-100 auth-primary-btn" data-auth-channel="max">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
             viewBox="0 0 720 720"
             class="icon icon-2">
          <path fill="#000" d="M350.4,9.6C141.8,20.5,4.1,184.1,12.8,390.4c3.8,90.3,40.1,168,48.7,253.7,2.2,22.2-4.2,49.6,21.4,59.3,31.5,11.9,79.8-8.1,106.2-26.4,9-6.1,17.6-13.2,24.2-22,27.3,18.1,53.2,35.6,85.7,43.4,143.1,34.3,299.9-44.2,369.6-170.3C799.6,291.2,622.5-4.6,350.4,9.6h0ZM269.4,504c-11.3,8.8-22.2,20.8-34.7,27.7-18.1,9.7-23.7-.4-30.5-16.4-21.4-50.9-24-137.6-11.5-190.9,16.8-72.5,72.9-136.3,150-143.1,78-6.9,150.4,32.7,183.1,104.2,72.4,159.1-112.9,316.2-256.4,218.6h0Z"/>
        </svg>
        <span>\u0412\u043e\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 MAX</span>
      </button>
      <button type="button" class="btn btn-4 w-100 auth-primary-btn" data-auth-channel="telegram">
        <svg xmlns="http://www.w3.org/2000/svg"
             width="24"
             height="24"
             aria-label="Telegram"
             role="img"
             viewBox="0 0 512 512"
             class="icon icon-2">
          <rect width="512" height="512" rx="15%" fill="#37aee2"/>
          <path fill="#c8daea" d="M199 404c-11 0-10-4-13-14l-32-105 245-144"/>
          <path fill="#a9c9dd" d="M199 404c7 0 11-4 16-8l45-43-56-34"/>
          <path fill="#f6fbfe" d="M204 319l135 99c14 9 26 4 30-14l55-258c5-22-9-32-24-25L79 245c-21 8-21 21-4 26l83 26 190-121c9-5 17-3 11 4"/>
        </svg>
        <span>\u0412\u043e\u0439\u0442\u0438 \u0447\u0435\u0440\u0435\u0437 Telegram</span>
      </button>`;
}

function authHtml() {
  const isRegister = mode === "register";
  const isClientLogin = !isRegister && loginContext.is_client_domain;
  return `
    <main class="auth-page">
      <form class="auth-card ${isRegister ? "wide" : ""}" data-auth-form>
        <h1>${isRegister ? "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f" : "\u0412\u0445\u043e\u0434"}</h1>
        ${isRegister ? `<div class="auth-tabs">
          <button type="button" class="ghost btn-ghost-secondary" data-mode="login">\u0412\u043e\u0439\u0442\u0438</button>
          <button type="button" class="primary" data-mode="register">\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442</button>
        </div>` : ""}
        ${isRegister ? '<label><span>\u0418\u043c\u044f</span><input name="name" required></label>' : ""}
        <label><span>${isRegister ? "Email" : "Email \u0438\u043b\u0438 \u0442\u0435\u043b\u0435\u0444\u043e\u043d"}</span><input name="${isRegister ? "email" : "login"}" ${isRegister ? 'type="email" autocomplete="email"' : `type="text" autocomplete="username" placeholder="введите ваши данные" data-login-phone-input value="${escapeHtml(loginDraft)}"`} required></label>
        ${isRegister ? '<label><span>\u0422\u0435\u043b\u0435\u0444\u043e\u043d</span><input name="phone" type="tel" inputmode="tel" autocomplete="tel" data-phone-input></label>' : ""}
        ${!isClientLogin ? '<label><span>\u041f\u0430\u0440\u043e\u043b\u044c</span><input name="password" type="password" required></label>' : ""}
        ${isRegister ? '<label><span>\u041f\u043e\u0432\u0442\u043e\u0440 \u043f\u0430\u0440\u043e\u043b\u044f</span><input name="confirm" type="password" required></label>' : ""}
        <p data-message></p>
        ${isRegister
          ? '<button class="primary auth-primary-btn">\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442</button>'
          : isClientLogin ? `<div class="auth-login-actions">
              ${loginChannelsHtml()}
              <button type="button" class="btn btn-4 w-100 auth-primary-btn" data-mode="register">\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442</button>
            </div>` : `<div class="auth-login-actions">
              <button class="primary auth-primary-btn">Войти</button>
              <button type="button" class="btn btn-4 w-100 auth-primary-btn" data-mode="register">Создать аккаунт</button>
              <button type="button" class="ghost btn-ghost-secondary" data-reset-password-open>Сбросить пароль</button>
            </div>`}
        ${isClientLogin ? `<div class="auth-code-popover-wrap">${codeMethodPopoverHtml()}</div>` : ""}
      </form>
      ${twoFactorHtml()}
      ${resetPasswordHtml()}
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

  if (event.target.closest("[data-reset-password-cancel]")) {
    resetPasswordOpen = false;
    root.querySelector("[data-reset-password-modal]")?.remove();
    return;
  }

  if (event.target.closest("[data-reset-password-open]")) {
    resetPasswordOpen = true;
    draw();
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
      clientCodeOrganizations = result.organizations || [];
      const availableOrganizations = clientCodeOrganizations.filter((organization) => (organization.channels || []).includes(channel));
      if (!availableOrganizations.length) {
        throw new Error(channel === "max" ? "Нет организаций с доступным входом через MAX" : "Нет организаций с доступным входом через Telegram");
      }
      clientCodeOrganizationId = String(availableOrganizations[0].id);
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

  const resetPasswordForm = event.target.closest("[data-reset-password-form]");
  if (resetPasswordForm) {
    event.preventDefault();
    setMessage(resetPasswordForm, "");
    const data = formData(resetPasswordForm);
    try {
      const result = await api.testResetPassword({
        organization_id: Number(data.organization_id),
        password: data.password,
      });
      setMessage(resetPasswordForm, `Пароль сброшен. Логин: ${result.login || `user #${result.user_id}`}`);
    } catch (error) {
      setMessage(resetPasswordForm, error.message);
    }
    return;
  }

  const form = event.target.closest("[data-auth-form]");
  if (!form) return;
  event.preventDefault();
  setMessage(form, "");
  const data = formData(form);
  try {
    if (mode === "register") {
      if (data.password !== data.confirm) throw new Error("Пароли не совпадают");
      saveSession(await api.register({
        name: data.name,
        email: data.email || undefined,
        phone: normalizePhone(data.phone) || undefined,
        password: data.password,
      }));
    } else if (!loginContext.is_client_domain) {
      const login = String(data.login || "").includes("@") ? String(data.login).trim() : normalizePhone(data.login);
      saveSession(await api.login({ login, password: data.password }));
    } else {
      return;
    }
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
