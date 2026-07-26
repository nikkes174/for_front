import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

const DAY_NAMES = ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const MONTH_NAMES = ["янв", "фев", "мар", "апр", "май", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];
const STATUS_OPTIONS = [
  ["scheduled", "Запланирован"],
  ["completed", "Завершен"],
  ["cancelled", "Отменен"],
  ["no_show", "Не пришел"],
];
const bookingState = {
  weekStart: null,
  viewBy: "masters",
  period: "week",
  calendarData: null,
  dateFrom: "",
  dateTo: "",
  draftDateFrom: "",
  draftDateTo: "",
  pickerMonth: null,
  branchId: "",
  employeeId: "",
  publicBookingUrl: "",
  publicBookingOrganizationId: null,
};
let bookingHoverCloseTimer = null;

function showBookingToast(message) {
  document.querySelector("[data-booking-toast]")?.remove();
  const toast = document.createElement("div");
  toast.className = "booking-toast";
  toast.dataset.bookingToast = "";
  toast.setAttribute("role", "status");
  toast.innerHTML = `<span aria-hidden="true">\u2713</span><b>${escapeHtml(message)}</b>`;
  document.body.append(toast);
  requestAnimationFrame(() => toast.classList.add("is-visible"));
  window.setTimeout(() => {
    toast.classList.remove("is-visible");
    window.setTimeout(() => toast.remove(), 220);
  }, 1800);
}

function localIsoDate(value) {
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function weekStart(value = new Date()) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return date;
}

function addDays(value, days) {
  const date = new Date(value);
  date.setDate(date.getDate() + days);
  return date;
}

function minutesOfDay(value) {
  const date = new Date(value);
  return date.getHours() * 60 + date.getMinutes();
}

function clock(value) {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function dateTimeInput(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const part = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${part(date.getMonth() + 1)}-${part(date.getDate())}T${part(date.getHours())}:${part(date.getMinutes())}`;
}

function calendarMinuteHeight() {
  if (window.innerWidth <= 640) return .95;
  if (window.innerWidth <= 900) return 1.05;
  return 1.15;
}

function monthRange(value) {
  const start = new Date(value.getFullYear(), value.getMonth(), 1);
  const end = new Date(value.getFullYear(), value.getMonth() + 1, 0);
  return { start, end };
}

function datePickerMarkup(rangeStart = new Date(), rangeEnd = rangeStart) {
  const month = bookingState.pickerMonth || new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1);
  const lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  const leadingDays = (firstDay.getDay() + 6) % 7;
  const selectedFrom = bookingState.draftDateFrom;
  const selectedTo = bookingState.draftDateTo;
  const today = localIsoDate(new Date());
  const dayButtons = Array.from({ length: leadingDays + lastDay.getDate() }, (_, index) => {
    if (index < leadingDays) return '<span class="booking-picker-empty"></span>';
    const day = index - leadingDays + 1;
    const value = localIsoDate(new Date(month.getFullYear(), month.getMonth(), day));
    const selected = value === selectedFrom || value === selectedTo;
    const insideRange = selectedFrom && selectedTo && value > selectedFrom && value < selectedTo;
    return `<button type="button" class="booking-picker-day${selected ? " is-selected" : ""}${insideRange ? " is-in-range" : ""}${value === today ? " is-today" : ""}" data-booking-picker-date="${value}">${day}</button>`;
  }).join("");
  return `<div class="booking-date-picker" data-booking-date-picker hidden>
    <div class="booking-picker-head">
      <button type="button" class="ghost" data-booking-picker-month="-1">‹</button>
      <strong>${MONTH_NAMES[month.getMonth()]} ${month.getFullYear()}</strong>
      <button type="button" class="ghost" data-booking-picker-month="1">›</button>
    </div>
    <div class="booking-picker-weekdays"><span>Пн</span><span>Вт</span><span>Ср</span><span>Чт</span><span>Пт</span><span>Сб</span><span>Вс</span></div>
    <div class="booking-picker-days">${dayButtons}</div>
    <div class="booking-picker-actions"><span>${selectedFrom ? (selectedTo ? `${selectedFrom} — ${selectedTo}` : `С: ${selectedFrom} — выберите дату окончания`) : "Выберите дату начала"}</span><button type="button" class="primary" data-booking-date-apply ${selectedFrom && selectedTo ? "" : "disabled"}>Показать</button></div>
  </div>`;
}

function renderDatePicker(root) {
  const picker = root.querySelector("[data-booking-date-picker]");
  if (!picker) return;
  const wasHidden = picker.hidden;
  picker.outerHTML = datePickerMarkup();
  root.querySelector("[data-booking-date-picker]").hidden = wasHidden;
}

function cachedDays(data) {
  const start = new Date(`${data.date_from}T00:00:00`);
  const end = new Date(`${data.date_to}T00:00:00`);
  const days = [];
  while (start <= end) {
    days.push(new Date(start));
    start.setDate(start.getDate() + 1);
  }
  return days;
}

function visibleCalendarDays(data) {
  const allDays = cachedDays(data);
  if (bookingState.period === "all" || bookingState.period === "month") return allDays;
  const start = bookingState.period === "week"
    ? weekStart(bookingState.weekStart)
    : new Date(bookingState.weekStart);
  const count = bookingState.period === "week" ? 7 : 1;
  const visibleKeys = new Set(Array.from({ length: count }, (_, index) => localIsoDate(addDays(start, index))));
  return allDays.filter((day) => visibleKeys.has(localIsoDate(day)));
}

function calendarMarkup(data) {
  const minHour = 8;
  const maxHour = 24;
  const minuteHeight = calendarMinuteHeight();
  const days = visibleCalendarDays(data);
  const dayCount = Math.max(days.length, 1);
  const calendarWidth = 58 + dayCount * 135;
  return `<div class="booking-calendar-viewport" data-booking-calendar aria-label="Календарь записей">
    <div class="booking-calendar" style="--booking-half-hour-height:${30 * minuteHeight}px;--booking-hour-height:${60 * minuteHeight}px;grid-template-columns:58px repeat(${dayCount}, minmax(135px, 1fr));width:max(100%, ${calendarWidth}px)">
      ${timeScale(minHour, maxHour, minuteHeight)}
      ${days.map((day) => dayColumn(day, data, minHour, maxHour, minuteHeight)).join("")}
    </div>
  </div>`;
}

function renderCalendar(root) {
  const calendar = root.querySelector("[data-booking-calendar]");
  if (calendar && bookingState.calendarData) calendar.outerHTML = calendarMarkup(bookingState.calendarData);
}

function statusSelect(event) {
  return `<select class="booking-status booking-status-${escapeHtml(event.visit_status)}" data-booking-status data-visit-id="${escapeHtml(event.id)}">
    ${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}" ${event.visit_status === value ? "selected" : ""}>${label}</option>`).join("")}
  </select>`;
}

function durationLabel(seconds) {
  const totalMinutes = Math.max(Math.round(Number(seconds || 0) / 60), 0);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return [hours ? `${hours} ч` : "", minutes ? `${minutes} мин` : ""].filter(Boolean).join(" ") || "0 мин";
}

function paymentLabels(event) {
  const labels = (event.payment_methods || []).map((payment) => {
    const raw = typeof payment === "string" ? payment : JSON.stringify(payment || {});
    const value = raw.toLowerCase();
    if (value.includes("qr") || value.includes("сбп")) return "QR-код";
    if (value.includes("cert") || value.includes("сертифик")) return "Сертификат";
    if (value.includes("card") || value.includes("cashless") || value.includes("карт")) return "Карта";
    if (value.includes("cash") || value.includes("налич")) return "Наличные";
    const type = typeof payment === "object" ? Number(payment.type ?? payment.payment_type) : 0;
    return ({ 1: "Наличные", 2: "Карта", 3: "Сертификат", 4: "QR-код" })[type] || "";
  }).filter(Boolean);
  return [...new Set(labels)].join(", ") || "Не указано";
}

function paymentOption(event, label) {
  return paymentLabels(event).split(", ").includes(label) ? "checked" : "";
}

function bookingHoverCard(event) {
  const items = [
    ...(event.service_names || []).map((name) => `Услуга: ${name}`),
    ...(event.product_names || []).map((name) => `Товар: ${name}`),
  ];
  return `<aside class="booking-visit-hover-card" data-booking-hover-card data-hover-visit-id="${escapeHtml(event.id)}">
    <strong class="booking-hover-client">${escapeHtml(event.client_name || "Клиент")}</strong>
    <div class="booking-hover-phone"><span>${escapeHtml(event.client_phone || "Телефон не указан")}</span>${event.client_phone ? `<button type="button" data-copy-booking-phone="${escapeHtml(event.client_phone)}" title="Копировать телефон"><img src="/fronted/icons/copy.svg" alt=""></button>` : ""}</div>
    <div><b>Товары и услуги</b>${items.length ? `<ul>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : `<p>Не указаны</p>`}</div>
    <div><b>Общая стоимость</b><p>${new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 }).format(Number(event.total_cost || 0))}</p></div>
    <fieldset class="booking-hover-payments"><legend>Оплата</legend>
      ${["Наличные", "Карта", "Сертификат", "QR-код"].map((label) => `<label><input type="checkbox" name="booking_payment_method" value="${label}" ${paymentOption(event, label)}><span>${label}</span></label>`).join("")}
    </fieldset>
    <div><b>Детали</b><p>${clock(event.start)}–${clock(event.end)}</p><p>${durationLabel(event.duration_seconds)}</p></div>
    <label><span>Статус</span>${statusSelect(event)}</label>
    <button type="button" class="primary booking-hover-save" data-save-booking-hover>Сохранить</button>
  </aside>`;
}

function showBookingHoverCard(root, event, trigger) {
  clearTimeout(bookingHoverCloseTimer);
  root.querySelector("[data-booking-hover-card]")?.remove();
  root.insertAdjacentHTML("beforeend", bookingHoverCard(event));
  const card = root.querySelector("[data-booking-hover-card]");
  const rect = trigger.getBoundingClientRect();
  const width = 320;
  const left = rect.right + 10 + width <= window.innerWidth - 12 ? rect.right + 10 : Math.max(12, rect.left - width - 10);
  card.style.left = `${left}px`;
  card.style.top = `${Math.min(Math.max(12, rect.top), window.innerHeight - card.offsetHeight - 12)}px`;
}

function scheduleBookingHoverClose(root) {
  clearTimeout(bookingHoverCloseTimer);
  bookingHoverCloseTimer = setTimeout(() => root.querySelector("[data-booking-hover-card]")?.remove(), 120);
}

function eventCard(event, minHour, minuteHeight) {
  const startMinute = minutesOfDay(event.start);
  const endMinute = minutesOfDay(event.end);
  const top = Math.max(startMinute - minHour * 60, 0) * minuteHeight;
  const height = Math.max((endMinute - startMinute) * minuteHeight, 1);
  const breakMinutes = Math.round(Number(event.technical_break_seconds || 0) / 60);
  return `<article class="booking-event booking-event-${escapeHtml(event.visit_status)}" data-booking-visit-id="${escapeHtml(event.id)}" role="button" tabindex="0" style="top:${top}px;height:${height}px">
    <button type="button" class="booking-event-point" data-booking-hover-trigger data-hover-visit-id="${escapeHtml(event.id)}" aria-label="Детали визита"><img src="/fronted/icons/point.svg" alt=""></button>
    <div class="booking-event-time">${clock(event.start)}–${clock(event.end)}</div>
    <strong>${escapeHtml(event.service_names?.join(", ") || "Визит")}</strong>
    <span>${escapeHtml(event.client_name)}</span>
    ${event.client_phone ? `<small>${escapeHtml(event.client_phone)}</small>` : ""}
  </article>`;
}

function bookingVisitModal(visit) {
  const branches = bookingState.calendarData?.branches || [];
  const masters = bookingState.calendarData?.masters || [];
  const branchOptions = branches.map((branch) => `<option value="${escapeHtml(branch.id)}" ${String(branch.id) === String(visit.branch_id) ? "selected" : ""}>${escapeHtml(branch.name)}</option>`).join("");
  const masterOptions = masters.map((master) => `<option value="${escapeHtml(master.id)}" ${String(master.id) === String(visit.employee_id) ? "selected" : ""}>${escapeHtml(master.name)}</option>`).join("");
  return `<div class="modal-backdrop" data-booking-visit-modal>
    <div class="modal-card">
      <div class="modal-head"><h3>Редактирование визита</h3><button type="button" class="ghost" data-close-booking-visit>Закрыть</button></div>
      <form class="modal-grid" data-booking-visit-form data-visit-id="${escapeHtml(visit.id)}">
        <label><span>Дата и время</span><input name="visit_at" type="datetime-local" value="${escapeHtml(dateTimeInput(visit.visit_at))}" required></label>
        <label><span>Филиал</span><select name="branch_id"><option value="">Выберите филиал</option>${branchOptions}</select></label>
        <label><span>Сотрудник</span><select name="employee_id"><option value="">Выберите сотрудника</option>${masterOptions}</select></label>
        <label><span>Клиент</span><input value="${escapeHtml(visit.full_name || visit.client_name || "")}" readonly></label>
        <label><span>Статус</span><select name="visit_status">${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}" ${visit.visit_status === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label><span>Стоимость</span><input name="total_cost" type="number" min="0" step="0.01" value="${escapeHtml(visit.total_cost ?? "")}"></label>
        <label><span>Скидка</span><input name="discount_amount" type="number" min="0" step="0.01" value="${escapeHtml(visit.discount_amount ?? "")}"></label>
        <label><span>Оплачено</span><input name="paid_amount" type="number" min="0" step="0.01" value="${escapeHtml(visit.paid_amount ?? "")}"></label>
        <label><span>Источник</span><input name="source" value="${escapeHtml(visit.source || "")}"></label>
        <label><span>Комментарий</span><input name="comment" value="${escapeHtml(visit.comment || "")}"></label>
        <p data-message></p><button class="primary">Сохранить визит</button>
      </form>
    </div>
  </div>`;
}

function dayColumn(day, data, minHour, maxHour, minuteHeight) {
  const dateKey = localIsoDate(day);
  const events = data.events.filter((event) => event.start.slice(0, 10) === dateKey);
  const intervals = data.working_intervals.filter((item) => item.date === dateKey);
  return `<section class="booking-day">
    <header><span>${DAY_NAMES[day.getDay()]}</span><strong>${day.getDate()} ${MONTH_NAMES[day.getMonth()]}</strong></header>
    <div class="booking-day-hours">${intervals.length ? [...new Set(intervals.map((item) => `${item.from}–${item.to}`))].join(", ") : "Нет рабочего времени"}</div>
    <div class="booking-day-body" style="height:${(maxHour - minHour) * 60 * minuteHeight}px">
      ${events.map((event) => eventCard(event, minHour, minuteHeight)).join("")}
    </div>
  </section>`;
}

function timeScale(minHour, maxHour, minuteHeight) {
  const halfHourSlots = (maxHour - minHour) * 2 + 1;
  return `<div class="booking-time-scale">
    <div class="booking-time-spacer"></div>
    <div class="booking-time-body" style="height:${(maxHour - minHour) * 60 * minuteHeight}px">
      ${Array.from({ length: halfHourSlots }, (_, index) => {
        const isHalfHour = index % 2 === 1;
        const hour = (minHour + index / 2) % 24;
        const label = isHalfHour
          ? "30"
          : `${String(hour).padStart(2, "0")}<sup>00</sup>`;
        return `<span class="${isHalfHour ? "booking-time-half" : "booking-time-hour"}" style="top:${index * 30 * minuteHeight}px">${label}</span>`;
      }).join("")}
    </div>
  </div>`;
}

function filterOptions(data) {
  if (bookingState.viewBy === "branches") {
    return `<label><span>Филиал</span><select data-booking-branch>
      <option value="">Все филиалы</option>
      ${data.branches.map((branch) => `<option value="${branch.id}" ${String(bookingState.branchId) === String(branch.id) ? "selected" : ""}>${escapeHtml(branch.name)}</option>`).join("")}
    </select></label>`;
  }
  return `<label><span>Мастер</span><select data-booking-master>
    <option value="">Все мастера</option>
    ${data.masters.map((master) => `<option value="${master.id}" ${String(bookingState.employeeId) === String(master.id) ? "selected" : ""}>${escapeHtml(master.name)}</option>`).join("")}
  </select></label>`;
}

export async function booking(ctx) {
  bookingState.weekStart ||= weekStart();
  const start = bookingState.weekStart;
  const defaultRange = bookingState.period === "day"
    ? { start, end: start }
    : bookingState.period === "week"
      ? { start, end: addDays(start, 6) }
      : monthRange(start);
  const rangeStart = bookingState.dateFrom ? new Date(`${bookingState.dateFrom}T00:00:00`) : defaultRange.start;
  const rangeEnd = bookingState.dateTo ? new Date(`${bookingState.dateTo}T00:00:00`) : defaultRange.end;
  bookingState.pickerMonth ||= new Date(rangeStart.getFullYear(), rangeStart.getMonth(), 1);
  const data = await api.bookingCalendar(
    ctx.org.id,
    localIsoDate(rangeStart),
    localIsoDate(rangeEnd),
    bookingState.viewBy,
    bookingState.branchId,
    bookingState.employeeId,
  );
  bookingState.calendarData = data;
  if (bookingState.publicBookingOrganizationId !== ctx.org.id || !bookingState.publicBookingUrl) {
    const response = await fetch(`/public-api/online-booking-url/${encodeURIComponent(ctx.org.id)}`, {
      credentials: "include",
    });
    if (!response.ok) throw new Error("Не удалось получить ссылку для онлайн-записи");
    bookingState.publicBookingUrl = (await response.json()).url;
    bookingState.publicBookingOrganizationId = ctx.org.id;
  }
  const publicBookingUrl = bookingState.publicBookingUrl;
  return `<section class="booking-page" data-booking-page>
    <div class="booking-toolbar">
      <div class="booking-nav-group">
        <div class="booking-online-link">
          <span>Онлайн-запись:</span>
          <a href="${escapeHtml(publicBookingUrl)}" target="_blank" rel="noopener">${escapeHtml(publicBookingUrl)}</a>
          <button type="button" class="ghost booking-online-copy" data-copy-online-booking-link="${escapeHtml(publicBookingUrl)}" aria-label="Скопировать ссылку для онлайн-записи" title="Скопировать ссылку">
            <img src="/fronted/icons/copy.svg" alt="">
          </button>
        </div>
        <div class="booking-nav">
        <button type="button" class="ghost" data-booking-week="-7">‹</button>
        <button type="button" class="ghost" data-booking-calendar-toggle>Календарь</button>
        <button type="button" class="ghost" data-booking-week="7">›</button>
        <strong>${rangeStart.getDate()} ${MONTH_NAMES[rangeStart.getMonth()]} — ${rangeEnd.getDate()} ${MONTH_NAMES[rangeEnd.getMonth()]}</strong>
        ${datePickerMarkup(rangeStart, rangeEnd)}
      </div>
      </div>
      <div class="booking-filters">
        <label><span>Показывать по</span><select data-booking-view>
          <option value="masters" ${bookingState.viewBy === "masters" ? "selected" : ""}>Мастерам</option>
          <option value="branches" ${bookingState.viewBy === "branches" ? "selected" : ""}>Филиалам</option>
        </select></label>
        <label><span>Период</span><select data-booking-period>
          <option value="all" ${bookingState.period === "all" ? "selected" : ""}>За всё время</option>
          <option value="day" ${bookingState.period === "day" ? "selected" : ""}>За день</option>
          <option value="week" ${bookingState.period === "week" ? "selected" : ""}>За неделю</option>
          <option value="month" ${bookingState.period === "month" ? "selected" : ""}>За месяц</option>
        </select></label>
        ${filterOptions(data)}
      </div>
    </div>
    ${calendarMarkup(data)}
  </section>`;
}

export function bindBooking(root, ctx) {
  root.addEventListener("click", async (event) => {
    const copyPhoneButton = event.target.closest("[data-copy-booking-phone]");
    if (copyPhoneButton) {
      await navigator.clipboard.writeText(copyPhoneButton.dataset.copyBookingPhone);
      return;
    }
    const copyOnlineBookingLink = event.target.closest("[data-copy-online-booking-link]");
    if (copyOnlineBookingLink) {
      await navigator.clipboard.writeText(copyOnlineBookingLink.dataset.copyOnlineBookingLink);
      return;
    }
    const saveHoverButton = event.target.closest("[data-save-booking-hover]");
    if (saveHoverButton) {
      const card = saveHoverButton.closest("[data-booking-hover-card]");
      const visitId = card?.dataset.hoverVisitId;
      const methods = [...card.querySelectorAll('[name="booking_payment_method"]:checked')].map((input) => input.value);
      const status = card.querySelector("[data-booking-status]")?.value;
      saveHoverButton.disabled = true;
      try {
        await api.updateClientVisit(visitId, {
          visit_status: status,
          yclients_payments: methods.map((title) => ({ title })),
        });
        card.remove();
        showBookingToast("\u0418\u0437\u043c\u0435\u043d\u0435\u043d\u0438\u044f \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b");
        ctx.reload();
      } catch (error) {
        saveHoverButton.disabled = false;
        alert(error.message);
      }
      return;
    }
    if (event.target.closest("[data-booking-hover-trigger], [data-booking-hover-card]")) return;
    if (event.target.closest("[data-close-booking-visit]")) {
      root.querySelector("[data-booking-visit-modal]")?.remove();
      return;
    }
    if (!event.target.closest("[data-booking-status]")) {
      const visitCard = event.target.closest("[data-booking-visit-id]");
      if (visitCard) {
        try {
          const visit = await api.clientVisit(visitCard.dataset.bookingVisitId);
          root.insertAdjacentHTML("beforeend", bookingVisitModal(visit));
        } catch (error) {
          alert(error.message);
        }
        return;
      }
    }
    const weekButton = event.target.closest("[data-booking-week]");
    if (weekButton) {
      bookingState.weekStart = addDays(bookingState.weekStart || weekStart(), Number(weekButton.dataset.bookingWeek));
      bookingState.dateFrom = "";
      bookingState.dateTo = "";
      ctx.reload();
      return;
    }
    if (event.target.closest("[data-booking-calendar-toggle]")) {
      const picker = root.querySelector("[data-booking-date-picker]");
      if (picker) {
        if (picker.hidden) {
          bookingState.draftDateFrom = "";
          bookingState.draftDateTo = "";
          bookingState.pickerMonth = new Date(`${bookingState.dateFrom || localIsoDate(bookingState.weekStart || new Date())}T00:00:00`);
          renderDatePicker(root);
          root.querySelector("[data-booking-date-picker]").hidden = false;
        } else {
          picker.hidden = true;
        }
      }
      return;
    }
    const monthButton = event.target.closest("[data-booking-picker-month]");
    if (monthButton) {
      bookingState.pickerMonth = new Date(bookingState.pickerMonth.getFullYear(), bookingState.pickerMonth.getMonth() + Number(monthButton.dataset.bookingPickerMonth), 1);
      renderDatePicker(root);
      root.querySelector("[data-booking-date-picker]").hidden = false;
      return;
    }
    const dayButton = event.target.closest("[data-booking-picker-date]");
    if (dayButton) {
      const value = dayButton.dataset.bookingPickerDate;
      if (!bookingState.draftDateFrom || bookingState.draftDateTo) {
        bookingState.draftDateFrom = value;
        bookingState.draftDateTo = "";
      } else if (value < bookingState.draftDateFrom) {
        bookingState.draftDateTo = bookingState.draftDateFrom;
        bookingState.draftDateFrom = value;
      } else {
        bookingState.draftDateTo = value;
      }
      renderDatePicker(root);
      root.querySelector("[data-booking-date-picker]").hidden = false;
      return;
    }
    if (event.target.closest("[data-booking-date-apply]")) {
      const dateFrom = bookingState.draftDateFrom;
      const dateTo = bookingState.draftDateTo;
      if (!dateFrom || !dateTo || dateFrom > dateTo) {
        alert("Укажите корректный период");
        return;
      }
      const days = Math.round((new Date(`${dateTo}T00:00:00`) - new Date(`${dateFrom}T00:00:00`)) / 86400000);
      if (days > 366) {
        alert("Период календаря не может быть больше года");
        return;
      }
      bookingState.dateFrom = dateFrom;
      bookingState.dateTo = dateTo;
      bookingState.weekStart = weekStart(new Date(`${dateFrom}T00:00:00`));
      bookingState.period = "all";
      bookingState.pickerMonth = new Date(`${dateFrom}T00:00:00`);
      ctx.reload();
    }
  });

  root.addEventListener("pointerover", (event) => {
    if (event.target.closest("[data-booking-hover-card]")) {
      clearTimeout(bookingHoverCloseTimer);
      return;
    }
    const trigger = event.target.closest("[data-booking-hover-trigger]");
    if (!trigger) return;
    const visit = bookingState.calendarData?.events?.find((item) => String(item.id) === String(trigger.dataset.hoverVisitId));
    if (visit) showBookingHoverCard(root, visit, trigger);
  });

  root.addEventListener("pointerout", (event) => {
    const trigger = event.target.closest("[data-booking-hover-trigger]");
    const card = event.target.closest("[data-booking-hover-card]");
    const statusSelect = card?.querySelector("[data-booking-status]");
    if (card && (event.target.closest("[data-booking-status]") || document.activeElement === statusSelect)) return;
    if (trigger && !trigger.contains(event.relatedTarget)) scheduleBookingHoverClose(root);
    if (card && !card.contains(event.relatedTarget)) scheduleBookingHoverClose(root);
  });

  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-booking-visit-form]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const message = form.querySelector("[data-message]");
    try {
      await api.updateClientVisit(form.dataset.visitId, {
        visit_at: new Date(data.get("visit_at")).toISOString(),
        branch_id: data.get("branch_id") ? Number(data.get("branch_id")) : null,
        employee_id: data.get("employee_id") ? Number(data.get("employee_id")) : null,
        visit_status: data.get("visit_status"),
        total_cost: Number(data.get("total_cost") || 0),
        discount_amount: Number(data.get("discount_amount") || 0),
        paid_amount: Number(data.get("paid_amount") || 0),
        source: String(data.get("source") || "") || null,
        comment: String(data.get("comment") || "") || null,
      });
      root.querySelector("[data-booking-visit-modal]")?.remove();
      ctx.reload();
    } catch (error) {
      if (message) message.textContent = error.message;
    }
  });

  root.addEventListener("change", async (event) => {
    if (event.target.matches("[data-booking-period]")) {
      bookingState.period = event.target.value;
      bookingState.dateFrom = "";
      bookingState.dateTo = "";
      ctx.reload();
      return;
    }
    if (event.target.matches("[data-booking-view]")) {
      bookingState.viewBy = event.target.value;
      bookingState.branchId = "";
      bookingState.employeeId = "";
      ctx.reload();
      return;
    }
    if (event.target.matches("[data-booking-branch]")) {
      bookingState.branchId = event.target.value;
      ctx.reload();
      return;
    }
    if (event.target.matches("[data-booking-master]")) {
      bookingState.employeeId = event.target.value;
      ctx.reload();
      return;
    }
    if (event.target.matches("[data-booking-status]") && !event.target.closest("[data-booking-hover-card]")) {
      event.target.disabled = true;
      try {
        await api.updateBookingVisitStatus(event.target.dataset.visitId, event.target.value);
        ctx.reload();
      } catch (error) {
        event.target.disabled = false;
        alert(error.message);
      }
    }
  });
}
