import { api } from "./api.js";
import { ensureCss, formData, render, root, setMessage } from "./dom.js";

const params = new URLSearchParams(location.search);
let mode = params.get("mode") === "register" || location.pathname === "/register" ? "register" : "login";

ensureCss();

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
    </main>
  `;
}

function draw() {
  render(root, authHtml());
}

root.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mode]");
  if (!button) return;
  mode = button.dataset.mode;
  history.replaceState(null, "", `/auth.html?mode=${mode}`);
  draw();
});

root.addEventListener("submit", async (event) => {
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
      await api.login({ login: data.login, password: data.password });
    }
    location.href = "/";
  } catch (error) {
    setMessage(form, error.message);
  }
});

draw();
