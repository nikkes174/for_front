import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

const MAX_MESSAGE_LENGTH = 120;

export async function notifications(ctx) {
  const status = await api.pushStatus(ctx.org.id).catch(() => ({ active_count: 0, configured: false }));
  return `
    <section class="panel" data-notifications>
      <div class="subpanel">
        <h3 class="subpanel-title">Новая рассылка</h3>
        <form class="inline-form compact" data-notification-form>
          <label class="wide notification-message-field">
            <textarea name="message" maxlength="${MAX_MESSAGE_LENGTH}" rows="4" placeholder="Введите текст сообщения ..."></textarea>
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
  root.addEventListener("keydown", (event) => {
    const textarea = event.target.closest("[data-notification-form] textarea");
    if (!textarea || event.key !== "Enter") return;
    event.stopPropagation();
  });

  root.addEventListener("input", (event) => {
    const textarea = event.target.closest("[data-notification-form] textarea");
    if (!textarea) return;
    const form = textarea.closest("[data-notification-form]");
    const text = textarea.value.slice(0, MAX_MESSAGE_LENGTH);
    if (textarea.value !== text) textarea.value = text;
    form.querySelector("[data-notification-counter]").textContent = `${text.length} / ${MAX_MESSAGE_LENGTH}`;
    form.querySelector("button").disabled = !text.trim();
  });

  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-notification-form]");
    if (!form) return;
    event.preventDefault();
    const orgId = location.pathname.split("/").filter(Boolean)[1];
    const message = String(new FormData(form).get("message") || "").trim().slice(0, MAX_MESSAGE_LENGTH);
    if (!message) return;
    try {
      const result = await api.sendPushNotification({ organization_id: Number(orgId), message });
      form.querySelector("[data-message]").textContent = `Отправлено: ${result.sent} из ${result.recipients}.`;
      form.reset();
      form.querySelector("[data-notification-counter]").textContent = `0 / ${MAX_MESSAGE_LENGTH}`;
      form.querySelector("button").disabled = true;
    } catch (error) {
      form.querySelector("[data-message]").textContent = error.message;
    }
  });
}
