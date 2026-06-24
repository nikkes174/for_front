import { api } from "./api.js";
import { ensureCss, formData, render, root, setMessage } from "./dom.js";

const params = new URLSearchParams(location.search);
let mode = params.get("mode") === "register" || location.pathname === "/register" ? "register" : "login";
let twoFactor = null;
let loginDraft = "";
let checkedIdentifier = "";
let authCheckTimer = null;

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
    ? `Код отправлен в ${label}.`
    : twoFactor.waiting_for_bot_start
      ? `Откройте бота ${label}, чтобы получить код.`
      : `Код не удалось отправить в ${label}. Попробуйте запросить его ещё раз.`;
  return `
    <div class="modal-backdrop" data-2fa-modal>
      <div class="modal-card auth-2fa-card">
        <div class="modal-head">
          <h3>Код входа через ${label}</h3>
          <button type="button" class="ghost" data-2fa-cancel>Закрыть</button>
        </div>
        <form class="modal-grid" data-2fa-form>
          <p class="modal-full">${statusText}</p>
          ${twoFactor.waiting_for_bot_start && twoFactor.link ? `<a class="primary modal-full auth-2fa-link" href="${twoFactor.link}" target="_blank" rel="noreferrer">Получить код через ${label}</a>` : ""}
          <label class="modal-full"><span>Код</span><input name="code" inputmode="numeric" autocomplete="one-time-code" required autofocus></label>
          <button class="primary modal-full">Подтвердить вход</button>
          <p class="modal-full" data-message></p>
        </form>
      </div>
    </div>
  `;
}

function authHtml() {
  const isRegister = mode === "register";
  return `
    <main class="auth-page">
      <form class="auth-card ${isRegister ? "wide" : ""}" data-auth-form>
        <h1>${isRegister ? "Регистрация" : "Вход"}</h1>
        <div class="auth-tabs">
          <button type="button" class="${!isRegister ? "primary" : "ghost"}" data-mode="login">Войти</button>
          <button type="button" class="${isRegister ? "primary" : "ghost"}" data-mode="register">Создать аккаунт</button>
        </div>
        ${isRegister ? '<label><span>Имя</span><input name="name" required></label>' : ""}
        <label><span>${isRegister ? "Email" : "Email или телефон"}</span><input name="${isRegister ? "email" : "login"}" required></label>
        ${isRegister ? '<label><span>Телефон</span><input name="phone"></label>' : ""}
        <label><span>Пароль</span><input name="password" type="password" required></label>
        ${isRegister ? '<label><span>Повтор пароля</span><input name="confirm" type="password" required></label>' : ""}
        <p data-message></p>
        <button class="primary">${isRegister ? "Создать аккаунт" : "Войти"}</button>
      </form>
      ${twoFactorHtml()}
    </main>
  `;
}

function draw() {
  render(root, authHtml());
}

function showTwoFactorModal() {
  root.querySelector("[data-2fa-modal]")?.remove();
  root.querySelector(".auth-page")?.insertAdjacentHTML("beforeend", twoFactorHtml());
  root.querySelector('[data-2fa-form] [name="code"]')?.focus();
}

async function checkLoginTwoFactor(identifier) {
  const clean = String(identifier || "").trim();
  if (mode !== "login" || clean.length < 5 || clean === checkedIdentifier) return;
  checkedIdentifier = clean;
  try {
    const result = await api.start2fa({ identifier: clean });
    if (result?.two_factor_required && clean === loginDraft.trim()) {
      twoFactor = result;
      showTwoFactorModal();
    }
  } catch {
    // Early 2FA probing should not break the regular password flow.
  }
}

root.addEventListener("input", (event) => {
  if (!event.target.matches('[name="login"]')) return;
  loginDraft = event.target.value;
  twoFactor = null;
  root.querySelector("[data-2fa-modal]")?.remove();
  clearTimeout(authCheckTimer);
  authCheckTimer = setTimeout(() => checkLoginTwoFactor(loginDraft), 500);
});

root.addEventListener("change", (event) => {
  if (!event.target.matches('[name="login"]')) return;
  loginDraft = event.target.value;
  checkLoginTwoFactor(loginDraft);
});

root.addEventListener("click", (event) => {
  if (event.target.closest("[data-2fa-cancel]")) {
    twoFactor = null;
    checkedIdentifier = "";
    root.querySelector("[data-2fa-modal]")?.remove();
    return;
  }

  const button = event.target.closest("[data-mode]");
  if (!button) return;
  mode = button.dataset.mode;
  twoFactor = null;
  checkedIdentifier = "";
  clearTimeout(authCheckTimer);
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
      await api.verify2fa({ ticket: twoFactor.ticket, code: data.code });
      location.href = "/";
    } catch (error) {
      setMessage(twoFactorForm, error.message);
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
      await api.register({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        password: data.password,
      });
    } else {
      const result = await api.login({ login: data.login, password: data.password });
      if (result?.two_factor_required) {
        twoFactor = result;
        showTwoFactorModal();
        return;
      }
    }
    location.href = "/";
  } catch (error) {
    setMessage(form, error.message);
  }
});

draw();
