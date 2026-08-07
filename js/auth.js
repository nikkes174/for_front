import { api } from "./api.js";
import { ensureCss, escapeHtml, formData, normalizePhone, render, root, setMessage } from "./dom.js";

const params = new URLSearchParams(location.search);
let mode = params.get("mode") === "register" || location.pathname === "/register" ? "register" : "login";
let twoFactor = null;
let loginDraft = "";
let twoFactorTarget = "/";
let resetPasswordOpen = false;
let codeMethodPopoverOpen = false;
let codeChannelStepOpen = false;
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

function resetPasswordHtml() {
  if (!resetPasswordOpen) return "";
  return `
    <div class="modal-backdrop" data-reset-password-modal>
      <div class="modal-card auth-2fa-card">
        <div class="modal-head">
          <h3>\u0421\u0431\u0440\u043e\u0441 \u043f\u0430\u0440\u043e\u043b\u044f</h3>
          <button type="button" class="ghost" data-reset-password-cancel>\u0417\u0430\u043a\u0440\u044b\u0442\u044c</button>
        </div>
        <form class="modal-grid" data-reset-password-form>
          <label class="modal-full"><span>ID \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u0438</span><input name="organization_id" inputmode="numeric" required autofocus></label>
          <label class="modal-full"><span>\u041d\u043e\u0432\u044b\u0439 \u043f\u0430\u0440\u043e\u043b\u044c</span><input name="password" type="password" required minlength="8"></label>
          <button class="primary modal-full">\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u0438 \u043d\u0430\u0437\u043d\u0430\u0447\u0438\u0442\u044c</button>
          <p class="modal-full" data-message></p>
        </form>
      </div>
    </div>
  `;
}

function codeMethodPopoverHtml() {
  if (!codeMethodPopoverOpen) return "";
  if (!codeChannelStepOpen) {
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
  const selectedOrganization = clientCodeOrganizations.find((organization) => String(organization.id) === String(clientCodeOrganizationId));
  const availableChannels = selectedOrganization?.channels || [];
  const defaultChannel = availableChannels.includes("max") ? "max" : availableChannels[0] || "";
  return `<div class="auth-code-popover" data-auth-code-popover role="dialog" aria-label="Способ получения кода">
    <strong>Получить код</strong>
    <p>${availableChannels.length ? "Выберите один способ" : "У организации нет подключённых ботов"}</p>
    ${availableChannels.includes("max") ? `<label class="auth-code-method"><input type="radio" name="code_channel" value="max" ${defaultChannel === "max" ? "checked" : ""}><span>Через MAX</span></label>` : ""}
    ${availableChannels.includes("telegram") ? `<label class="auth-code-method"><input type="radio" name="code_channel" value="telegram" ${defaultChannel === "telegram" ? "checked" : ""}><span>Через Telegram</span></label>` : ""}
    <label class="auth-code-method disabled"><input type="radio" name="code_channel" value="sms" disabled><span>По СМС</span><small>Скоро</small></label>
    <button type="button" class="primary" data-client-code-request ${availableChannels.length ? "" : "disabled"}>Продолжить</button>
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
        <label><span>\u041f\u0430\u0440\u043e\u043b\u044c</span><input name="password" type="password" ${isRegister ? "required" : ""}></label>
        ${isRegister ? '<label><span>\u041f\u043e\u0432\u0442\u043e\u0440 \u043f\u0430\u0440\u043e\u043b\u044f</span><input name="confirm" type="password" required></label>' : ""}
        <p data-message></p>
        <button class="primary">${isRegister ? "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u043a\u043a\u0430\u0443\u043d\u0442" : "\u0412\u043e\u0439\u0442\u0438"}</button>
        ${!isRegister && loginContext.is_client_domain ? `<div class="auth-code-popover-wrap"><button type="button" class="ghost" data-code-method-open aria-expanded="${codeMethodPopoverOpen}">Получить код</button>${codeMethodPopoverHtml()}</div>` : ""}
        ${!isRegister ? '<button type="button" class="ghost" data-reset-password-open>\u0421\u0431\u0440\u043e\u0441\u0438\u0442\u044c \u043f\u0430\u0440\u043e\u043b\u044c</button>' : ""}
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

  if (event.target.closest("[data-code-method-open]")) {
    if (codeMethodPopoverOpen) {
      codeMethodPopoverOpen = false;
      codeChannelStepOpen = false;
      draw();
      return;
    }
    const form = event.target.closest("[data-auth-form]");
    const data = formData(form);
    const phone = normalizePhone(data.login || loginDraft);
    setMessage(form, "");
    try {
      if (!phone) throw new Error("Укажите телефон");
      const result = await api.clientCodeOrganizations({ phone });
      clientCodeOrganizations = result.organizations || [];
      if (!clientCodeOrganizations.length) {
        throw new Error("Для клиента не найдены организации");
      }
      clientCodeOrganizationId = String(clientCodeOrganizations[0].id);
      codeChannelStepOpen = false;
      codeMethodPopoverOpen = true;
      draw();
    } catch (error) {
      clientCodeOrganizations = [];
      clientCodeOrganizationId = "";
      setMessage(form, error.message);
    }
    return;
  }

  const organizationContinue = event.target.closest("[data-code-organization-continue]");
  if (organizationContinue) {
    const form = organizationContinue.closest("[data-auth-form]");
    const organizationId = form.querySelector('[name="code_organization_id"]')?.value;
    if (!organizationId) {
      setMessage(form, "Выберите организацию");
      return;
    }
    clientCodeOrganizationId = String(organizationId);
    codeChannelStepOpen = true;
    draw();
    return;
  }

  const codeRequest = event.target.closest("[data-client-code-request]");
  if (codeRequest) {
    if (!loginContext.is_client_domain) return;
    const form = codeRequest.closest("[data-auth-form]");
    const data = formData(form);
    const phone = normalizePhone(data.login || loginDraft);
    const channel = form.querySelector('[name="code_channel"]:checked')?.value || "max";
    const organizationId = Number(clientCodeOrganizationId || 0);
    setMessage(form, "");
    try {
      if (!phone) throw new Error("\u0423\u043a\u0430\u0436\u0438\u0442\u0435 \u0442\u0435\u043b\u0435\u0444\u043e\u043d");
      if (!organizationId) throw new Error("Выберите организацию");
      twoFactor = await api.startClientCodeAuth({ phone, channel, organization_id: organizationId });
      twoFactorTarget = sameHostUrl(twoFactor.redirect_url) || "/";
      codeMethodPopoverOpen = false;
      codeChannelStepOpen = false;
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
  codeChannelStepOpen = false;
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
      setMessage(resetPasswordForm, `\u041f\u0430\u0440\u043e\u043b\u044c \u0441\u0431\u0440\u043e\u0448\u0435\u043d. \u041b\u043e\u0433\u0438\u043d: ${result.login || `user #${result.user_id}`}`);
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
      if (data.password !== data.confirm) throw new Error("\u041f\u0430\u0440\u043e\u043b\u0438 \u043d\u0435 \u0441\u043e\u0432\u043f\u0430\u0434\u0430\u044e\u0442");
      saveSession(await api.register({
        name: data.name,
        email: data.email || undefined,
        phone: normalizePhone(data.phone) || undefined,
        password: data.password,
      }));
    } else {
      const login = String(data.login || "").includes("@") ? String(data.login).trim() : normalizePhone(data.login);
      saveSession(await api.login({ login, password: data.password }));
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



