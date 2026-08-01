import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TITLE_LENGTH = 120;

export async function notifications(ctx, { embedded = false } = {}) {
  const status = await api.pushStatus(ctx.org.id).catch(() => ({ active_count: 0, max_count: 0, telegram_count: 0, configured: false }));
  const body = `
    <div class="subpanel">
      <h3 class="subpanel-title">Новая рассылка</h3>
      <form class="inline-form compact" data-notification-form>
        <label class="wide notification-title-field" data-notification-title-field>
          <input name="title" maxlength="${MAX_TITLE_LENGTH}" required placeholder="Тема рассылки" />
        </label>
        <div class="wide notification-message-field" data-notification-composer>
          <textarea name="message" maxlength="${MAX_MESSAGE_LENGTH}" rows="4" wrap="soft" required placeholder="Введите текст сообщения ..."></textarea>
          <div class="notification-composer-toolbar">
            <div class="notification-channels-field">
              <div class="notification-channels-select" data-notification-channels-select>
                <button type="button" class="notification-channels-trigger" data-notification-channels-trigger aria-expanded="false">
                  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M41.5766 49.8919L48.7613 82.2233C49.1688 84.0571 51.6067 84.4527 52.5732 82.8419L85.4218 28.0943C86.2531 26.7087 85.2551 24.9459 83.6392 24.9459H18.0926C16.1626 24.9459 15.2743 27.3471 16.7397 28.6031L41.5766 49.8919ZM41.5766 49.8919L83.1531 27.0248" stroke="currentColor" stroke-width="8.31532"/>
                  </svg>
                  <span>Разослать через</span>
                </button>
                <div class="notification-channels-options">
                  <label><input type="checkbox" name="channels" value="max"><span>MAX</span></label>
                  <label><input type="checkbox" name="channels" value="telegram"><span>Telegram</span></label>
                  <label><input type="checkbox" name="channels" value="application" checked><span>Приложение</span></label>
                </div>
              </div>
            </div>
            <p class="notification-counter" data-notification-counter>0 / ${MAX_MESSAGE_LENGTH}</p>
            <button type="submit" class="primary notification-submit" data-notification-submit disabled aria-label="Разослать" title="Разослать">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M12 19V5M6.5 10.5L12 5L17.5 10.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
        <p class="notification-recipient-count" data-notification-recipient-count data-application-count="${Number(status.active_count || 0)}" data-max-count="${Number(status.max_count || 0)}" data-telegram-count="${Number(status.telegram_count || 0)}">${escapeHtml(`Доступных получателей: ${status.active_count || 0} (Приложение: ${status.active_count || 0})`)}</p>
        <p data-message></p>
        ${status.configured ? "" : `<p class="notification-config-warning">${escapeHtml("Push-ключи VAPID не настроены, доставка пока недоступна.")}</p>`}
      </form>
    </div>
  `;
  if (embedded) return body;
  return `
    <section class="panel" data-notifications>
      ${body}
    </section>
  `;
}

export function bindNotifications(root, ctx = {}) {
  function syncNotificationTitle(input) {
    const field = input.closest("[data-notification-title-field]");
    if (!field) return;
    field.classList.toggle("is-expanded", field.contains(document.activeElement) || Boolean(input.value.trim()));
  }

  function syncNotificationComposer(textarea) {
    const composer = textarea.closest("[data-notification-composer]");
    if (!composer) return;
    const expanded = composer.contains(document.activeElement) || Boolean(textarea.value.trim());
    composer.classList.toggle("is-expanded", expanded);
    if (!expanded) {
      textarea.style.height = "48px";
      return;
    }
    textarea.style.height = "0px";
    textarea.style.height = `${Math.min(400, Math.max(232, textarea.scrollHeight))}px`;
  }

  root.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-notification-channels-trigger]");
    if (trigger) {
      const select = trigger.closest("[data-notification-channels-select]");
      const isOpen = select.classList.toggle("is-open");
      trigger.setAttribute("aria-expanded", String(isOpen));
      return;
    }
    root.querySelectorAll("[data-notification-channels-select].is-open").forEach((select) => {
      if (!select.contains(event.target)) {
        select.classList.remove("is-open");
        select.querySelector("[data-notification-channels-trigger]")?.setAttribute("aria-expanded", "false");
      }
    });
  });

  function updateNotificationForm(form) {
    const title = String(form.elements.title?.value || "").slice(0, MAX_TITLE_LENGTH);
    const message = String(form.elements.message?.value || "").slice(0, MAX_MESSAGE_LENGTH);
    if (form.elements.title.value !== title) form.elements.title.value = title;
    if (form.elements.message.value !== message) form.elements.message.value = message;
    const channels = [...form.querySelectorAll('[name="channels"]:checked')];
    const channelNames = { max: "MAX", telegram: "Telegram", application: "Приложение" };
    const recipientCounter = root.querySelector("[data-notification-recipient-count]");
    if (recipientCounter) {
      const counts = {
        max: Number(recipientCounter.dataset.maxCount || 0),
        telegram: Number(recipientCounter.dataset.telegramCount || 0),
        application: Number(recipientCounter.dataset.applicationCount || 0),
      };
      const selected = channels.map((item) => item.value);
      const total = selected.reduce((sum, channel) => sum + counts[channel], 0);
      const details = selected.map((channel) => `${channelNames[channel]}: ${counts[channel]}`).join(", ");
      recipientCounter.textContent = `Доступных получателей: ${total}${details ? ` (${details})` : ""}`;
    }
    form.querySelector("[data-notification-counter]").textContent = `${message.length} / ${MAX_MESSAGE_LENGTH}`;
    form.querySelector("[data-notification-submit]").disabled = !title.trim() || !message.trim() || !channels.length;
  }

  root.addEventListener("keydown", (event) => {
    const textarea = event.target.closest("[data-notification-form] textarea");
    if (!textarea) return;
    if (event.key === "Escape" && !textarea.value.trim()) {
      textarea.blur();
      syncNotificationComposer(textarea);
      return;
    }
    if (event.key === "Enter") event.stopImmediatePropagation();
  });

  root.addEventListener("focusin", (event) => {
    const title = event.target.closest("[data-notification-title-field] input");
    if (title) syncNotificationTitle(title);
    const textarea = event.target.closest("[data-notification-composer] textarea");
    if (textarea) syncNotificationComposer(textarea);
  });

  root.addEventListener("focusout", (event) => {
    const title = event.target.closest("[data-notification-title-field] input");
    if (title) window.setTimeout(() => syncNotificationTitle(title), 0);
    const textarea = event.target.closest("[data-notification-composer] textarea");
    if (!textarea) return;
    window.setTimeout(() => syncNotificationComposer(textarea), 0);
  });

  root.addEventListener("input", (event) => {
    const control = event.target.closest("[data-notification-form] input, [data-notification-form] textarea");
    if (!control) return;
    const form = control.closest("[data-notification-form]");
    if (control.matches('[name="title"]')) syncNotificationTitle(control);
    if (control.matches("textarea")) syncNotificationComposer(control);
    updateNotificationForm(form);
  });

  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-notification-form]");
    if (!form) return;
    event.preventDefault();
    const orgId = location.pathname.split("/").filter(Boolean)[1];
    const data = new FormData(form);
    const title = String(data.get("title") || "").trim().slice(0, MAX_TITLE_LENGTH);
    const message = String(data.get("message") || "").trim().slice(0, MAX_MESSAGE_LENGTH);
    const channels = data.getAll("channels").map(String);
    if (!title || !message || !channels.length) return;
    try {
      await api.startPushNotificationJob({ organization_id: Number(orgId), title, message, channels });
      form.querySelector("[data-message]").textContent = "Рассылка поставлена в очередь. Прогресс отображается во вкладке «Задачи».";
      form.reset();
      form.querySelector("[data-notification-counter]").textContent = `0 / ${MAX_MESSAGE_LENGTH}`;
      syncNotificationTitle(form.elements.title);
      syncNotificationComposer(form.elements.message);
      updateNotificationForm(form);
      ctx.navigate?.(`/organizations/${orgId}/tasks`);
    } catch (error) {
      form.querySelector("[data-message]").textContent = error.message;
    }
  });
}
