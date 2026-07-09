import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

const MAX_MESSAGE_LENGTH = 120;
const MAX_TITLE_LENGTH = 120;

export async function notifications(ctx) {
  const status = await api.pushStatus(ctx.org.id).catch(() => ({ active_count: 0, configured: false }));
  return `
    <section class="panel" data-notifications>
      <div class="subpanel">
        <h3 class="subpanel-title">Новая рассылка</h3>
        <form class="inline-form compact" data-notification-form>
          <label class="wide notification-title-field">
            <input name="title" maxlength="${MAX_TITLE_LENGTH}" required placeholder="Тема рассылки" />
          </label>
          <label class="wide notification-message-field">
            <textarea name="message" maxlength="${MAX_MESSAGE_LENGTH}" rows="4" required placeholder="Введите текст сообщения ..."></textarea>
          </label>
          <p data-notification-counter>0 / ${MAX_MESSAGE_LENGTH}</p>
          <button class="primary" disabled>Отправить</button>
          <p data-message></p>
        </form>
      </div>
      <div class="subpanel">
        <h3 class="subpanel-title">Получатели</h3>
        <table>
          <tbody>
            <tr><td>${escapeHtml(`Доступных клиентов: ${status.active_count || 0}`)}</td></tr>
            ${status.configured ? "" : `<tr><td>${escapeHtml("Push-ключи VAPID не настроены, доставка пока недоступна.")}</td></tr>`}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

export function bindNotifications(root) {
  function updateNotificationForm(form) {
    const title = String(form.elements.title?.value || "").trim().slice(0, MAX_TITLE_LENGTH);
    const message = String(form.elements.message?.value || "").slice(0, MAX_MESSAGE_LENGTH);
    if (form.elements.title.value !== title) form.elements.title.value = title;
    if (form.elements.message.value !== message) form.elements.message.value = message;
    form.querySelector("[data-notification-counter]").textContent = `${message.length} / ${MAX_MESSAGE_LENGTH}`;
    form.querySelector("button").disabled = !title || !message.trim();
  }

  root.addEventListener("keydown", (event) => {
    const textarea = event.target.closest("[data-notification-form] textarea");
    if (!textarea || event.key !== "Enter") return;
    event.stopPropagation();
  });

  root.addEventListener("input", (event) => {
    const control = event.target.closest("[data-notification-form] input, [data-notification-form] textarea");
    if (!control) return;
    updateNotificationForm(control.closest("[data-notification-form]"));
  });

  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-notification-form]");
    if (!form) return;
    event.preventDefault();
    const orgId = location.pathname.split("/").filter(Boolean)[1];
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim().slice(0, MAX_TITLE_LENGTH);
    const message = String(data.get("message") || "").trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!title || !message) return;
    try {
      const result = await api.sendPushNotification({ organization_id: Number(orgId), title, message });
      form.querySelector("[data-message]").textContent = `Отправлено: ${result.sent} из ${result.recipients}.`;
      form.reset();
      form.querySelector("[data-notification-counter]").textContent = `0 / ${MAX_MESSAGE_LENGTH}`;
      form.querySelector("button").disabled = true;
    } catch (error) {
      form.querySelector("[data-message]").textContent = error.message;
    }
  });
}
