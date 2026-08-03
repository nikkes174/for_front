import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

const MAX_MESSAGE_LENGTH = 2000;
const MAX_TITLE_LENGTH = 120;
const MAX_NOTIFICATION_IMAGES = 10;
const notificationFiles = new WeakMap();

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
          <div class="notification-image-previews" data-notification-image-previews hidden></div>
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
            <input type="file" accept="image/*" multiple data-notification-images hidden>
            <button type="button" class="notification-attach" data-notification-images-open aria-label="Прикрепить изображения" title="Прикрепить до 10 изображений">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <g clip-path="url(#clip0_403_3418)">
                  <path d="M12 0C9.62662 0 7.30654 0.703788 5.33315 2.02236C3.35976 3.34094 1.82169 5.21509 0.913443 7.4078C0.0051918 9.60051 -0.232448 12.0133 0.230574 14.3411C0.693597 16.6689 1.83649 18.8071 3.51472 20.4853C5.19295 22.1635 7.33114 23.3064 9.65891 23.7694C11.9867 24.2324 14.3995 23.9948 16.5922 23.0866C18.7849 22.1783 20.6591 20.6402 21.9776 18.6668C23.2962 16.6935 24 14.3734 24 12C23.9966 8.81846 22.7312 5.76821 20.4815 3.51852C18.2318 1.26883 15.1815 0.00344108 12 0V0ZM12 22C10.0222 22 8.08879 21.4135 6.4443 20.3147C4.7998 19.2159 3.51808 17.6541 2.7612 15.8268C2.00433 13.9996 1.80629 11.9889 2.19215 10.0491C2.578 8.10929 3.5304 6.32746 4.92893 4.92893C6.32746 3.53041 8.10929 2.578 10.0491 2.19215C11.9889 1.8063 13.9996 2.00433 15.8268 2.7612C17.6541 3.51808 19.2159 4.79981 20.3147 6.4443C21.4135 8.08879 22 10.0222 22 12C21.9971 14.6513 20.9426 17.1931 19.0679 19.0679C17.1931 20.9426 14.6513 21.9971 12 22ZM13 11H17V13H13V17H11V13H7V11H11V7H13V11Z" fill="#374957"/>
                </g>
                <defs>
                  <clipPath id="clip0_403_3418">
                    <rect width="24" height="24" fill="white"/>
                  </clipPath>
                </defs>              </svg>
            </button>
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
  function renderNotificationImages(form) {
    const preview = form.querySelector("[data-notification-image-previews]");
    const files = notificationFiles.get(form) || [];
    preview.querySelectorAll("[data-object-url]").forEach((image) => URL.revokeObjectURL(image.dataset.objectUrl));
    preview.hidden = !files.length;
    preview.innerHTML = files.map((file, index) => {
      const url = URL.createObjectURL(file);
      return `<figure><img src="${url}" data-object-url="${url}" alt="${escapeHtml(file.name)}"><button type="button" data-remove-notification-image="${index}" aria-label="Убрать изображение">&times;</button></figure>`;
    }).join("");
  }

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
    const openImages = event.target.closest("[data-notification-images-open]");
    if (openImages) {
      openImages.closest("[data-notification-form]")?.querySelector("[data-notification-images]")?.click();
      return;
    }
    const removeImage = event.target.closest("[data-remove-notification-image]");
    if (removeImage) {
      const form = removeImage.closest("[data-notification-form]");
      const files = notificationFiles.get(form) || [];
      files.splice(Number(removeImage.dataset.removeNotificationImage), 1);
      notificationFiles.set(form, files);
      renderNotificationImages(form);
      return;
    }
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

  root.addEventListener("change", (event) => {
    const input = event.target.closest("[data-notification-images]");
    if (!input) return;
    const form = input.closest("[data-notification-form]");
    const previous = notificationFiles.get(form) || [];
    const selected = [...input.files].filter((file) => file.type.startsWith("image/"));
    const files = [...previous, ...selected].filter((file, index, list) => list.findIndex((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified) === index).slice(0, MAX_NOTIFICATION_IMAGES);
    notificationFiles.set(form, files);
    input.value = "";
    renderNotificationImages(form);
    form.querySelector("[data-message]").textContent = previous.length + selected.length > MAX_NOTIFICATION_IMAGES ? "Можно прикрепить не более 10 изображений." : "";
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
    const files = notificationFiles.get(form) || [];
    if (!title || !message || !channels.length) return;
    try {
      const uploaded = files.length ? await api.uploadPushNotificationImages(files) : { image_urls: [] };
      await api.startPushNotificationJob({ organization_id: Number(orgId), title, message, channels, image_urls: uploaded.image_urls || [] });
      form.querySelector("[data-message]").textContent = "Рассылка поставлена в очередь. Прогресс отображается во вкладке «Задачи».";
      form.reset();
      notificationFiles.set(form, []);
      renderNotificationImages(form);
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
