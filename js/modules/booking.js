import { api } from "../api.js";
import { escapeHtml } from "../dom.js";
import { branchDateTimeToUtc, clockInTimezone, dateTimeInputInTimezone, minutesOfDayInTimezone } from "../timezone.js";
import { openExternalClientCard } from "./clients.js";

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
  viewBy: "branches",
  period: "day",
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
  defaultsOrganizationId: null,
  defaultBranchInitialized: false,
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

function shiftCalendarPeriod(value, direction) {
  const date = new Date(value);
  if (bookingState.period === "month" || bookingState.period === "all") {
    date.setMonth(date.getMonth() + direction);
    return date;
  }
  return addDays(date, direction * (bookingState.period === "week" ? 7 : 1));
}

function branchTimezone(branchId) {
  return bookingState.calendarData?.branches?.find((branch) => String(branch.id) === String(branchId))?.timezone || "Europe/Moscow";
}

function minutesOfDay(value, branchId) {
  return minutesOfDayInTimezone(value, branchTimezone(branchId));
}

function clock(value, branchId) {
  return clockInTimezone(value, branchTimezone(branchId));
}

function dateTimeInput(value, branchId) {
  return dateTimeInputInTimezone(value, branchTimezone(branchId));
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
  const slotInterval = selectedBookingSlotInterval(data);
  const days = visibleCalendarDays(data);
  const gridStartMinute = selectedBookingGridStart(data, days[0], minHour);
  const gridOffset = ((gridStartMinute - minHour * 60) % slotInterval + slotInterval) % slotInterval;
  const dayCount = Math.max(days.length, 1);
  if (bookingState.period === "day" && days[0]) {
    return masterDayCalendarMarkup(days[0], data, minHour, maxHour, minuteHeight, slotInterval, gridOffset);
  }
  const calendarWidth = 58 + dayCount * 135;
  return `<div class="booking-calendar-viewport" data-booking-calendar aria-label="Календарь записей">
    <div class="booking-calendar" style="--booking-slot-height:${slotInterval * minuteHeight}px;--booking-slot-offset:${gridOffset * minuteHeight}px;grid-template-columns:58px repeat(${dayCount}, minmax(135px, 1fr));width:max(100%, ${calendarWidth}px)">
      ${timeScale(minHour, maxHour, minuteHeight, slotInterval, gridOffset)}
      ${days.map((day) => dayColumn(day, data, minHour, maxHour, minuteHeight)).join("")}
    </div>
  </div>`;
}

function minuteClock(value) {
  const minutes = Math.max(0, Math.min(24 * 60, Number(value) || 0));
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function masterFreeSlots(master, day, data) {
  const dateKey = localIsoDate(day);
  const working = data.working_intervals
    .filter((item) => item.date === dateKey && String(item.employee_id) === String(master.id))
    .filter((item) => !bookingState.branchId || String(item.branch_id) === String(bookingState.branchId));
  const result = [];
  working.forEach((interval) => {
    const [fromHour, fromMinute] = String(interval.from).split(":").map(Number);
    const [toHour, toMinute] = String(interval.to).split(":").map(Number);
    const from = fromHour * 60 + fromMinute;
    const to = toHour * 60 + toMinute;
    const busy = data.events
      .filter((item) => item.start.slice(0, 10) === dateKey && String(item.employee_id) === String(master.id))
      .filter((item) => !["cancelled", "no_show"].includes(eventStatus(item)))
      .filter((item) => String(item.branch_id) === String(interval.branch_id))
      .map((item) => [minutesOfDay(item.start, item.branch_id), minutesOfDay(item.blocked_until || item.end, item.branch_id)])
      .sort((left, right) => left[0] - right[0]);
    let cursor = from;
    busy.forEach(([busyFrom, busyTo]) => {
      if (busyFrom > cursor) result.push({ from: cursor, to: Math.min(busyFrom, to), branchId: interval.branch_id });
      cursor = Math.max(cursor, busyTo);
    });
    if (cursor < to) result.push({ from: cursor, to, branchId: interval.branch_id });
  });
  const now = new Date();
  const todayKey = localIsoDate(now);
  if (dateKey < todayKey) return [];
  const isToday = dateKey === todayKey;
  const currentMinute = (now.getHours() * 60) + now.getMinutes();
  return result.flatMap((item) => {
    const branch = data.branches?.find((candidate) => String(candidate.id) === String(item.branchId));
    const step = Math.max(1, Number(branch?.work_schedule?.slot_interval_minutes) || 30);
    const gridStart = Math.min(...working
      .filter((interval) => String(interval.branch_id) === String(item.branchId))
      .map((interval) => {
        const [hours, minutes] = String(interval.from).split(":").map(Number);
        return (hours * 60) + minutes;
      }));
    const remainder = ((item.from - gridStart) % step + step) % step;
    const firstSlot = item.from + (remainder ? step - remainder : 0);
    const slots = [];
    for (let from = firstSlot; from + step <= item.to; from += step) {
      if (!isToday || from > currentMinute) slots.push({ from, to: item.to, branchId: item.branchId });
    }
    return slots;
  });
}

function masterHeader(master, day, data) {
  const free = masterFreeSlots(master, day, data);
  const dateLabel = day.toLocaleDateString("ru-RU", { weekday: "short", day: "numeric", month: "long" });
  const initials = String(master.name || "?").split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  return `<header class="booking-master-header" tabindex="0">
    ${master.photo_url ? `<img class="booking-master-photo" src="${escapeHtml(master.photo_url)}" alt="${escapeHtml(master.name)}">` : `<span class="booking-master-initials">${escapeHtml(initials)}</span>`}
    <span><strong>${escapeHtml(master.name)}</strong><small>${escapeHtml(master.role || "Без роли")}</small></span>
    <aside class="booking-master-free-popover">
      <b>Свободное время</b>
      <small>${escapeHtml(dateLabel)}</small>
      ${free.length ? free.map((item) => `<button type="button" data-open-booking-create data-master-id="${escapeHtml(master.id)}" data-branch-id="${escapeHtml(item.branchId)}" data-booking-start="${localIsoDate(day)}T${minuteClock(item.from)}">${minuteClock(item.from)} <span>Записать</span></button>`).join("") : "<small>В этот день нет свободного времени</small>"}
    </aside>
  </header>`;
}

function masterDayColumn(master, day, data, minHour, maxHour, minuteHeight) {
  const dateKey = localIsoDate(day);
  const events = data.events.filter((item) => item.start.slice(0, 10) === dateKey && String(item.employee_id) === String(master.id));
  const intervals = data.working_intervals
    .filter((item) => item.date === dateKey && String(item.employee_id) === String(master.id))
    .filter((item) => !bookingState.branchId || String(item.branch_id) === String(bookingState.branchId));
  return `<section class="booking-day booking-master-day">
    ${masterHeader(master, day, data)}
    <div class="booking-day-body" style="height:${(maxHour - minHour) * 60 * minuteHeight}px">
      ${intervals.map((item) => {
        const [fromHour, fromMinute] = String(item.from).split(":").map(Number);
        const [toHour, toMinute] = String(item.to).split(":").map(Number);
        const top = Math.max((fromHour * 60 + fromMinute - minHour * 60) * minuteHeight, 0);
        const height = Math.max((toHour * 60 + toMinute - fromHour * 60 - fromMinute) * minuteHeight, 0);
        return `<span class="booking-working-interval" style="top:${top}px;height:${height}px"></span>`;
      }).join("")}
      ${masterFreeSlots(master, day, data).map((slot) => {
        const top = Math.max((slot.from - minHour * 60) * minuteHeight, 0);
        const height = Math.max(selectedBookingSlotInterval(data) * minuteHeight, 18);
        return `<button type="button" class="booking-grid-create" data-open-booking-create data-master-id="${escapeHtml(master.id)}" data-branch-id="${escapeHtml(slot.branchId)}" data-booking-start="${dateKey}T${minuteClock(slot.from)}" data-booking-available-until="${minuteClock(slot.to)}" style="top:${top}px;height:${height}px" aria-label="Создать запись ${dateKey} в ${minuteClock(slot.from)}"><span>+</span></button>`;
      }).join("")}
      ${events.map((item) => eventCard(item, minHour, minuteHeight)).join("")}
    </div>
  </section>`;
}

function masterDayCalendarMarkup(day, data, minHour, maxHour, minuteHeight, slotInterval, gridOffset) {
  const masters = data.masters
    .filter((master) => !bookingState.branchId || master.branch_ids?.some((id) => String(id) === String(bookingState.branchId)))
    .filter((master) => !bookingState.employeeId || String(master.id) === String(bookingState.employeeId));
  const visibleMasters = masters.length ? masters : [{ id: "", name: "Нет мастеров", branch_ids: [], service_ids: [] }];
  const calendarWidth = 58 + visibleMasters.length * 245;
  return `<div class="booking-calendar-viewport" data-booking-calendar aria-label="Календарь записей по мастерам">
    <div class="booking-calendar booking-master-calendar" style="--booking-slot-height:${slotInterval * minuteHeight}px;--booking-slot-offset:${gridOffset * minuteHeight}px;grid-template-columns:58px repeat(${visibleMasters.length}, minmax(220px, 1fr));width:max(100%, ${calendarWidth}px)">
      ${timeScale(minHour, maxHour, minuteHeight, slotInterval, gridOffset)}
      ${visibleMasters.map((master) => masterDayColumn(master, day, data, minHour, maxHour, minuteHeight)).join("")}
    </div>
  </div>`;
}

function bookingCreateServices(data, branchId, masterId, selectedServiceId = "") {
  const master = data.masters?.find((item) => String(item.id) === String(masterId));
  const serviceIds = new Set((master?.service_ids || []).map(String));
  return (data.services || []).filter((item) => {
    if (serviceIds.size && !serviceIds.has(String(item.id))) return false;
    return !item.branch_ids?.length || item.branch_ids.some((id) => String(id) === String(branchId));
  }).map((item) => `<option value="${escapeHtml(item.id)}" ${String(item.id) === String(selectedServiceId) ? "selected" : ""}>${escapeHtml(item.title)}${Number(item.price) ? ` — ${Number(item.price).toLocaleString("ru-RU")} ₽` : ""}</option>`).join("");
}

function bookingCreateSlotsMarkup(slots, selectedStart = "") {
  if (!slots.length) return '<span class="booking-create-slots-empty">Нет свободного времени для выбранной услуги.</span>';
  return `<div class="booking-create-slots-list">${slots.map((slot) => {
    const selected = String(slot.start).slice(0, 16) === String(selectedStart).slice(0, 16);
    return `<label><input type="radio" name="starts_at" value="${escapeHtml(slot.start)}" ${selected ? "checked" : ""}><span>${escapeHtml(slot.time)}</span></label>`;
  }).join("")}</div>`;
}

async function loadBookingCreateSlots(form, ctx) {
  const slots = form.querySelector("[data-booking-create-slots]");
  const submit = form.querySelector("[data-booking-create-submit]");
  const branchId = Number(form.elements.branch_id?.value || 0);
  const masterId = Number(form.elements.master_id?.value || 0);
  const serviceId = Number(form.elements.service_id?.value || 0);
  const bookingDate = String(form.elements.booking_date?.value || "");
  if (!slots || !branchId || !masterId || !serviceId || !bookingDate) return;
  slots.innerHTML = '<legend>Свободное время</legend><span class="booking-create-slots-empty">Загружаем свободное время…</span>';
  if (submit) submit.disabled = true;
  try {
    const result = await api.bookingCompatibility(ctx.org.id, branchId, masterId, serviceId, bookingDate);
    const selectedStart = form.dataset.bookingSelectedStart || "";
    const available = (result.slots || []).filter((slot) => (slot.master_ids || []).map(String).includes(String(masterId)) && (slot.service_ids || []).map(String).includes(String(serviceId)));
    const selected = available.find((slot) => String(slot.start).slice(0, 16) === String(selectedStart).slice(0, 16));
    form.dataset.bookingSelectedStart = selected ? selected.start : "";
    slots.innerHTML = `<legend>Свободное время</legend>${bookingCreateSlotsMarkup(available, form.dataset.bookingSelectedStart)}`;
    if (submit) submit.disabled = !selected;
  } catch (error) {
    slots.innerHTML = `<legend>Свободное время</legend><span class="booking-create-slots-empty">${escapeHtml(error.message || "Не удалось загрузить свободное время.")}</span>`;
  }
}

function syncBookingCreateSelections(form, data) {
  const branchId = String(form.elements.branch_id.value || "");
  const masterSelect = form.elements.master_id;
  const previousMasterId = masterSelect.value;
  const availableMasters = (data.masters || []).filter((item) => !branchId || item.branch_ids?.some((id) => String(id) === branchId));
  masterSelect.innerHTML = availableMasters.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join("");
  masterSelect.value = availableMasters.some((item) => String(item.id) === String(previousMasterId)) ? previousMasterId : String(availableMasters[0]?.id || "");
  const serviceSelect = form.elements.service_id;
  const previousServiceId = serviceSelect.value;
  serviceSelect.innerHTML = bookingCreateServices(data, branchId, masterSelect.value, previousServiceId);
  if (!serviceSelect.value && serviceSelect.options.length) serviceSelect.selectedIndex = 0;
}

function bookingCreateModal(data, values = {}) {
  const branchId = String(values.branchId || bookingState.branchId || data.branches?.[0]?.id || "");
  const masterId = String(values.masterId || bookingState.employeeId || data.masters?.find((item) => item.branch_ids?.some((id) => String(id) === branchId))?.id || "");
  const selectedDay = visibleCalendarDays(data)[0] || new Date();
  const startsAt = values.startsAt || `${localIsoDate(selectedDay)}T${minuteClock(selectedBookingGridStart(data, selectedDay, 9))}`;
  const bookingDate = String(startsAt).slice(0, 10);
  const services = bookingCreateServices(data, branchId, masterId);
  return `<div class="modal-backdrop" data-booking-create-modal>
    <div class="modal-card booking-create-card">
      <div class="modal-head"><h3>Новая запись</h3><button type="button" class="modal-close-icon" aria-label="Закрыть" title="Закрыть" data-close-booking-create><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button></div>
      <form class="modal-grid" data-booking-create-form data-booking-selected-start="${escapeHtml(startsAt)}">
        <label><span>Филиал</span><select name="branch_id" required>${data.branches.map((item) => `<option value="${escapeHtml(item.id)}" ${String(item.id) === branchId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label><span>Мастер</span><select name="master_id" required>${data.masters.map((item) => `<option value="${escapeHtml(item.id)}" data-branch-ids="${escapeHtml((item.branch_ids || []).join(","))}" ${String(item.id) === masterId ? "selected" : ""}>${escapeHtml(item.name)}</option>`).join("")}</select></label>
        <label><span>Дата</span><input name="booking_date" type="date" value="${escapeHtml(bookingDate)}" required></label>
        <label class="modal-full"><span>Услуга</span><select name="service_id" required>${services}</select></label>
        <fieldset class="modal-full booking-create-slots" data-booking-create-slots><legend>Свободное время</legend><span class="booking-create-slots-empty">Загружаем свободное время…</span></fieldset>
        <label><span>Телефон</span><input name="phone" type="tel" autocomplete="tel" placeholder="+7 999 123-45-67" required></label>
        <label><span>Фамилия</span><input name="last_name" autocomplete="family-name" required></label>
        <label><span>Имя</span><input name="first_name" autocomplete="given-name" required></label>
        <p class="modal-full" data-message></p>
        <button type="submit" class="primary booking-create-submit" data-booking-create-submit disabled>Создать</button>
      </form>
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

function statusKey(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return STATUS_OPTIONS.some(([status]) => status === normalized) ? normalized : "";
}

function statusLabel(value) {
  const key = statusKey(value);
  return STATUS_OPTIONS.find(([status]) => status === key)?.[1] || "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d";
}

function eventStatus(event) {
  return statusKey(event?.visit_status || event?.status || event?.state) || "scheduled";
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
    <div><b>Детали</b><p>${clock(event.start, event.branch_id)}–${clock(event.end, event.branch_id)}</p><p>${durationLabel(event.duration_seconds)}</p></div>
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
  const startMinute = minutesOfDay(event.start, event.branch_id);
  const endMinute = minutesOfDay(event.end, event.branch_id);
  const top = Math.max(startMinute - minHour * 60, 0) * minuteHeight;
  const height = Math.max((endMinute - startMinute) * minuteHeight, 1);
  const breakMinutes = Math.round(Number(event.technical_break_seconds || 0) / 60);
  return `<article class="booking-event booking-event-${escapeHtml(event.visit_status)}" data-booking-visit-id="${escapeHtml(event.id)}" role="button" tabindex="0" style="top:${top}px;height:${height}px">
    <button type="button" class="booking-event-point" data-booking-hover-trigger data-hover-visit-id="${escapeHtml(event.id)}" aria-label="Детали визита"><img src="/fronted/icons/point.svg" alt=""></button>
    <div class="booking-event-time">${clock(event.start, event.branch_id)}–${clock(event.end, event.branch_id)}</div>
    <strong>${escapeHtml(event.service_names?.join(", ") || "Визит")}</strong>
    <span>${escapeHtml(event.client_name)}</span>
    ${event.client_phone ? `<small>${escapeHtml(event.client_phone)}</small>` : ""}
  </article>`;
}

function compactEventClusters(events, minHour, minuteHeight) {
  const groups = new Map();
  events.forEach((event) => {
    const key = String(event.start || "");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(event);
  });
  const clusters = [...groups.values()]
    .map((items) => {
      const startMinute = minutesOfDay(items[0].start, items[0].branch_id);
      return {
        items,
        top: Math.max((startMinute - minHour * 60) * minuteHeight, 12),
      };
    })
    .sort((left, right) => left.top - right.top);
  const laneLastTops = [];
  return clusters.map(({ items, top }) => {
    const first = items[0];
    let lane = laneLastTops.findIndex((lastTop) => top - lastTop >= 36);
    if (lane === -1) lane = laneLastTops.length;
    laneLastTops[lane] = top;
    const left = 10 + lane * 38;
    return `<div class="booking-event-cluster" style="top:${top}px;left:${left}px">
      <button type="button" class="booking-event-indicator" aria-label="${escapeHtml(`${clock(first.start, first.branch_id)}: записей ${items.length}`)}">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M4 4.5C4 4.5 6 3.5 9 3.5C11.3431 3.5 12.6569 5 15 5C16.6162 5 17.8059 4.78678 18.6184 4.55725C19.2067 4.39105 19.5008 4.30796 19.6375 4.34703C19.778 4.38722 19.8484 4.44044 19.9253 4.56478C20 4.68565 20 4.95537 20 5.49481V12.7156C20 13.116 20 13.3162 19.8922 13.585C19.8188 13.768 19.5974 14.0681 19.4441 14.1922C19.2191 14.3745 19.0859 14.4156 18.8195 14.4978C18.0072 14.7486 16.755 15 15 15C12.6569 15 11.3431 13.5 9 13.5C6 13.5 4 14.5 4 14.5V4.5Z" fill="currentColor"/>
          <path d="M4 21V2.50806" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>${items.length}</span>
      </button>
      <div class="booking-event-submenu" role="menu">
        <strong>${escapeHtml(clock(first.start, first.branch_id))}</strong>
        ${items.map((item) => {
          const visitStatus = eventStatus(item);
          return `<button type="button" class="booking-event-submenu-item booking-event-submenu-item-${escapeHtml(visitStatus)}" data-booking-visit-id="${escapeHtml(item.id)}" role="menuitem">
          <span><b>Филиал:</b> ${escapeHtml(item.branch_name || "Не указан")}</span>
          <span><b>Мастер:</b> ${escapeHtml(item.employee_name || "Не указан")}</span>
          <span><b>Клиент:</b> ${escapeHtml(item.client_name || "Не указан")}</span>
          <span><b>\u0421\u0442\u0430\u0442\u0443\u0441:</b> ${escapeHtml(statusLabel(visitStatus))}</span>
        </button>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");
}

function bookingVisitCommentParts(value) {
  const meta = [];
  const comment = [];
  String(value || "").split("\n").forEach((line) => {
    if (line.startsWith("__")) meta.push(line);
    else comment.push(line);
  });
  return { meta: meta.join("\n"), comment: comment.join("\n").trim() };
}

function bookingVisitCommentAlbum(visit) {
  const photos = Array.isArray(visit?.photos_comment) ? visit.photos_comment : [];
  return `<div class="visit-photo-album modal-full" data-visit-photo-album data-visit-photo-stage="comment" data-existing-images-count="${photos.length}">
    <div class="service-image-album-head"><strong>Фото к комментарию</strong><small>До 10 изображений</small></div>
    <label class="photo-upload-control"><input name="visit_comment_photos" type="file" accept="image/*" multiple hidden><span class="photo-upload-button">Добавить изображения</span></label>
    <div class="service-image-previews" data-visit-photo-previews>${photos.map((photo) => `<figure class="service-image-preview" data-visit-photo-id="${escapeHtml(photo.id)}"><img src="/crm-api/client-history/visits/${escapeHtml(visit.id)}/photos/comment/${escapeHtml(photo.id)}" alt="Фото к комментарию"><button type="button" class="ghost" data-remove-booking-visit-photo data-photo-id="${escapeHtml(photo.id)}">Удалить</button></figure>`).join("")}</div>
  </div>`;
}

function bookingVisitModal(visit) {
  const branches = bookingState.calendarData?.branches || [];
  const masters = bookingState.calendarData?.masters || [];
  const commentParts = bookingVisitCommentParts(visit.comment);
  const branchOptions = branches.map((branch) => `<option value="${escapeHtml(branch.id)}" ${String(branch.id) === String(visit.branch_id) ? "selected" : ""}>${escapeHtml(branch.name)}</option>`).join("");
  const masterOptions = masters.map((master) => `<option value="${escapeHtml(master.id)}" ${String(master.id) === String(visit.employee_id) ? "selected" : ""}>${escapeHtml(master.name)}</option>`).join("");
  return `<div class="modal-backdrop" data-booking-visit-modal>
    <div class="modal-card">
      <div class="modal-head"><h3>Редактирование визита</h3><button type="button" class="modal-close-icon" aria-label="Закрыть" title="Закрыть" data-close-booking-visit><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-1" aria-hidden="true"> <path d="M18 6l-12 12"></path> <path d="M6 6l12 12"></path> </svg></button></div>
      <form class="modal-grid" data-booking-visit-form data-visit-id="${escapeHtml(visit.id)}">
        <label><span>Дата и время</span><input name="visit_at" type="datetime-local" value="${escapeHtml(dateTimeInput(visit.visit_at, visit.branch_id))}" required></label>
        <label><span>Филиал</span><select name="branch_id"><option value="">Выберите филиал</option>${branchOptions}</select></label>
        <label><span>Сотрудник</span><select name="employee_id"><option value="">Выберите сотрудника</option>${masterOptions}</select></label>
        <label><span>Клиент</span><input value="${escapeHtml(visit.full_name || visit.client_name || "")}" readonly></label>
        <label><span>Статус</span><select name="visit_status">${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}" ${eventStatus(visit) === value ? "selected" : ""}>${label}</option>`).join("")}</select></label>
        <label><span>Стоимость</span><input name="total_cost" type="number" min="0" step="0.01" value="${escapeHtml(visit.total_cost ?? "")}"></label>
        <label><span>Скидка</span><input name="discount_amount" type="number" min="0" step="0.01" value="${escapeHtml(visit.discount_amount ?? "")}"></label>
        <label><span>Оплачено</span><input name="paid_amount" type="number" min="0" step="0.01" value="${escapeHtml(visit.paid_amount ?? "")}"></label>
        <label><span>Источник</span><input name="source" value="${escapeHtml(visit.source || "")}"></label>
        <label><span>Комментарий</span><input name="comment" value="${escapeHtml(commentParts.comment)}"></label>
        <input name="comment_meta" type="hidden" value="${escapeHtml(commentParts.meta)}">
        ${bookingVisitCommentAlbum(visit)}
        <p data-message></p><button class="primary">Сохранить визит</button>
      </form>
    </div>
  </div>`;
}

function dayColumn(day, data, minHour, maxHour, minuteHeight) {
  const dateKey = localIsoDate(day);
  const events = data.events.filter((event) => event.start.slice(0, 10) === dateKey);
  const compactMode = !bookingState.branchId && !bookingState.employeeId;
  return `<section class="booking-day">
    <header><span>${DAY_NAMES[day.getDay()]}</span><strong>${day.getDate()} ${MONTH_NAMES[day.getMonth()]}</strong></header>
    <div class="booking-day-body" style="height:${(maxHour - minHour) * 60 * minuteHeight}px">
      ${compactMode ? compactEventClusters(events, minHour, minuteHeight) : events.map((event) => eventCard(event, minHour, minuteHeight)).join("")}
    </div>
  </section>`;
}

function timeScale(minHour, maxHour, minuteHeight, slotInterval, gridOffset) {
  const totalMinutes = (maxHour - minHour) * 60;
  const slotOffsets = Array.from(
    { length: Math.floor((totalMinutes - gridOffset) / slotInterval) + 1 },
    (_, index) => gridOffset + index * slotInterval,
  );
  return `<div class="booking-time-scale">
    <div class="booking-time-spacer"></div>
    <div class="booking-time-body" style="height:${(maxHour - minHour) * 60 * minuteHeight}px">
      ${slotOffsets.map((offset) => {
        const absoluteMinutes = (minHour * 60) + offset;
        const hour = Math.floor(absoluteMinutes / 60) % 24;
        const minute = absoluteMinutes % 60;
        const label = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
        return `<span class="booking-time-hour" style="top:${offset * minuteHeight}px">${label}</span>`;
      }).join("")}
    </div>
  </div>`;
}

function selectedBookingSlotInterval(data) {
  const branch = data.branches?.find((item) => String(item.id) === String(bookingState.branchId));
  return Math.max(1, Number(branch?.work_schedule?.slot_interval_minutes) || 30);
}

function selectedBookingGridStart(data, day, minHour) {
  const branch = data.branches?.find((item) => String(item.id) === String(bookingState.branchId));
  const schedule = branch?.work_schedule || {};
  const dayKey = day ? ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][day.getDay()] : "";
  const activeSchedule = schedule?.[dayKey] && typeof schedule[dayKey] === "object" ? schedule[dayKey] : schedule;
  const [hours, minutes] = String(activeSchedule?.from || `${String(minHour).padStart(2, "0")}:00`).split(":").map(Number);
  return Number.isFinite(hours) && Number.isFinite(minutes) ? (hours * 60) + minutes : minHour * 60;
}

function bookingSlotIntervalSettings(data) {
  const branch = data.branches?.find((item) => String(item.id) === String(bookingState.branchId));
  if (!branch) {
    return `<div class="booking-slot-settings"><span>\u0428\u0430\u0433 \u043e\u043d\u043b\u0430\u0439\u043d-\u0437\u0430\u043f\u0438\u0441\u0438</span><small>\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0444\u0438\u043b\u0438\u0430\u043b</small></div>`;
  }
  const interval = selectedBookingSlotInterval(data);
  return `<div class="booking-slot-settings" data-booking-slot-settings data-branch-id="${escapeHtml(branch.id)}">
    <strong>\u0428\u0430\u0433 \u043e\u043d\u043b\u0430\u0439\u043d-\u0437\u0430\u043f\u0438\u0441\u0438</strong>
    <label><span>\u0427\u0430\u0441\u044b</span><input type="number" min="0" max="23" step="1" value="${Math.floor(interval / 60)}" data-booking-slot-hours></label>
    <label><span>\u041c\u0438\u043d\u0443\u0442\u044b</span><input type="number" min="0" max="59" step="1" value="${interval % 60}" data-booking-slot-minutes></label>
    <button type="button" class="ghost" data-save-booking-slot-interval>\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c</button>
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
  if (bookingState.defaultsOrganizationId !== ctx.org.id) {
    bookingState.defaultsOrganizationId = ctx.org.id;
    bookingState.viewBy = "branches";
    bookingState.period = "day";
    bookingState.branchId = "";
    bookingState.employeeId = "";
    bookingState.defaultBranchInitialized = false;
  }
  bookingState.weekStart ||= new Date();
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
  if (!bookingState.defaultBranchInitialized) {
    bookingState.defaultBranchInitialized = true;
    const firstBranch = data.branches?.[0];
    if (firstBranch?.id) {
      bookingState.branchId = String(firstBranch.id);
      return booking(ctx);
    }
  }
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
        <button type="button" class="ghost" data-booking-period-navigation="-1">‹</button>
        <button type="button" class="ghost" data-booking-calendar-toggle>Календарь</button>
        <button type="button" class="ghost" data-booking-period-navigation="1">›</button>
        <strong>${rangeStart.getDate()} ${MONTH_NAMES[rangeStart.getMonth()]} — ${rangeEnd.getDate()} ${MONTH_NAMES[rangeEnd.getMonth()]}</strong>
        ${bookingSlotIntervalSettings(data)}
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
    <div class="booking-add-row"><button type="button" class="primary" data-open-booking-create>+ Добавить запись</button></div>
  </section>`;
}

export function bindBooking(root, ctx) {
  if (!document.body.dataset.bookingDatePickerOutsideBound) {
    document.body.dataset.bookingDatePickerOutsideBound = "true";
    document.addEventListener("click", (event) => {
      const picker = document.querySelector("[data-booking-date-picker]");
      if (!picker || picker.hidden) return;
      if (event.target.closest("[data-booking-date-picker], [data-booking-calendar-toggle]")) return;
      picker.hidden = true;
    });
  }
  root.addEventListener("click", async (event) => {
    const openBookingCreate = event.target.closest("[data-open-booking-create]");
    if (openBookingCreate) {
      root.querySelector("[data-booking-create-modal]")?.remove();
      root.insertAdjacentHTML("beforeend", bookingCreateModal(bookingState.calendarData, {
        branchId: openBookingCreate.dataset.branchId,
        masterId: openBookingCreate.dataset.masterId,
        startsAt: openBookingCreate.dataset.bookingStart,
        availableUntil: openBookingCreate.dataset.bookingAvailableUntil,
      }));
      await loadBookingCreateSlots(root.querySelector("[data-booking-create-form]"), ctx);
      return;
    }
    if (event.target.closest("[data-close-booking-create]")) {
      root.querySelector("[data-booking-create-modal]")?.remove();
      return;
    }
    const saveSlotInterval = event.target.closest("[data-save-booking-slot-interval]");
    if (saveSlotInterval) {
      const settings = saveSlotInterval.closest("[data-booking-slot-settings]");
      const branch = bookingState.calendarData?.branches?.find((item) => String(item.id) === String(settings?.dataset.branchId));
      const hours = Math.max(0, Math.min(23, Number(settings?.querySelector("[data-booking-slot-hours]")?.value) || 0));
      const minutes = Math.max(0, Math.min(59, Number(settings?.querySelector("[data-booking-slot-minutes]")?.value) || 0));
      const interval = (hours * 60) + minutes;
      if (!branch || interval < 1) {
        alert("\u0428\u0430\u0433 \u043e\u043d\u043b\u0430\u0439\u043d-\u0437\u0430\u043f\u0438\u0441\u0438 \u0434\u043e\u043b\u0436\u0435\u043d \u0431\u044b\u0442\u044c \u043d\u0435 \u043c\u0435\u043d\u044c\u0448\u0435 \u043e\u0434\u043d\u043e\u0439 \u043c\u0438\u043d\u0443\u0442\u044b.");
        return;
      }
      saveSlotInterval.disabled = true;
      try {
        await api.updateBranch(branch.id, {
          work_schedule: { ...(branch.work_schedule || {}), slot_interval_minutes: interval },
        });
        branch.work_schedule = { ...(branch.work_schedule || {}), slot_interval_minutes: interval };
        renderCalendar(root);
        showBookingToast("\u0428\u0430\u0433 \u043e\u043d\u043b\u0430\u0439\u043d-\u0437\u0430\u043f\u0438\u0441\u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0451\u043d");
      } catch (error) {
        alert(error.message);
      } finally {
        saveSlotInterval.disabled = false;
      }
      return;
    }
    const removeVisitPhoto = event.target.closest("[data-remove-booking-visit-photo]");
    if (removeVisitPhoto) {
      const form = removeVisitPhoto.closest("[data-booking-visit-form]");
      const album = removeVisitPhoto.closest("[data-visit-photo-album]");
      try {
        await api.deleteVisitPhoto(form?.dataset.visitId, "comment", removeVisitPhoto.dataset.photoId);
        removeVisitPhoto.closest(".service-image-preview")?.remove();
        if (album) album.dataset.existingImagesCount = String(Math.max(Number(album.dataset.existingImagesCount || 1) - 1, 0));
      } catch (error) {
        alert(error.message);
      }
      return;
    }
    const copyPhoneButton = event.target.closest("[data-copy-booking-phone]");
    if (copyPhoneButton) {
      await navigator.clipboard.writeText(copyPhoneButton.dataset.copyBookingPhone);
      return;
    }
    const copyOnlineBookingLink = event.target.closest("[data-copy-online-booking-link]");
    if (copyOnlineBookingLink) {
      await navigator.clipboard.writeText(copyOnlineBookingLink.dataset.copyOnlineBookingLink);
      showBookingToast("Ссылка скопирована");
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
          const [branches, departments, workplaces, users, memberships, branchMemberships, roles, segments, productCategories, productItems] = await Promise.all([
            api.branches(ctx.org.id).catch(() => []),
            api.departments(ctx.org.id).catch(() => []),
            api.workplaces(ctx.org.id).catch(() => []),
            api.users(ctx.org.id, 500).catch(() => []),
            api.memberships(ctx.org.id).catch(() => []),
            api.branchMemberships(ctx.org.id).catch(() => []),
            api.roles(ctx.org.id).catch(() => []),
            api.clientSegments(ctx.org.id).catch(() => []),
            api.productCategories(ctx.org.id).catch(() => []),
            api.productItems(ctx.org.id).catch(() => []),
          ]);
          await openExternalClientCard(ctx, visit.client_id, {
            branches,
            departments,
            workplaces,
            users,
            memberships,
            branchMemberships,
            roles,
            segments,
            productCategories,
            productItems,
            selectedVisitId: visit.id,
            visitOnly: true,
          });
        } catch (error) {
          alert(error.message);
        }
        return;
      }
    }
    const periodNavigationButton = event.target.closest("[data-booking-period-navigation]");
    if (periodNavigationButton) {
      bookingState.weekStart = shiftCalendarPeriod(
        bookingState.weekStart || weekStart(),
        Number(periodNavigationButton.dataset.bookingPeriodNavigation),
      );
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
    const createForm = event.target.closest("[data-booking-create-form]");
    if (createForm) {
      event.preventDefault();
      const data = new FormData(createForm);
      const submitButton = createForm.querySelector('button[type="submit"], button:not([type])');
      const message = createForm.querySelector("[data-message]");
      if (submitButton) submitButton.disabled = true;
      if (message) message.textContent = "Создаём запись...";
      try {
        await api.createStaffBooking({
          organization_id: ctx.org.id,
          branch_id: Number(data.get("branch_id")),
          master_id: Number(data.get("master_id")),
          service_id: Number(data.get("service_id")),
          starts_at: data.get("starts_at"),
          phone: String(data.get("phone") || ""),
          last_name: String(data.get("last_name") || "").trim(),
          first_name: String(data.get("first_name") || "").trim(),
        });
        root.querySelector("[data-booking-create-modal]")?.remove();
        showBookingToast("Запись создана");
        ctx.reload();
      } catch (error) {
        if (message) message.textContent = error.message;
        if (submitButton) submitButton.disabled = false;
      }
      return;
    }
    const form = event.target.closest("[data-booking-visit-form]");
    if (!form) return;
    event.preventDefault();
    const data = new FormData(form);
    const message = form.querySelector("[data-message]");
    try {
      const comment = String(data.get("comment") || "").trim();
      const commentMeta = String(data.get("comment_meta") || "").trim();
      await api.updateClientVisit(form.dataset.visitId, {
        visit_at: branchDateTimeToUtc(data.get("visit_at"), branchTimezone(data.get("branch_id"))),
        branch_id: data.get("branch_id") ? Number(data.get("branch_id")) : null,
        employee_id: data.get("employee_id") ? Number(data.get("employee_id")) : null,
        visit_status: data.get("visit_status"),
        total_cost: Number(data.get("total_cost") || 0),
        discount_amount: Number(data.get("discount_amount") || 0),
        paid_amount: Number(data.get("paid_amount") || 0),
        source: String(data.get("source") || "") || null,
        comment: [commentMeta, comment].filter(Boolean).join("\n") || null,
      });
      if (form.elements.visit_comment_photos?.files?.length) {
        await api.uploadVisitPhotos(form.dataset.visitId, "comment", form.elements.visit_comment_photos.files);
      }
      root.querySelector("[data-booking-visit-modal]")?.remove();
      ctx.reload();
    } catch (error) {
      if (message) message.textContent = error.message;
    }
  });

  root.addEventListener("change", async (event) => {
    const createForm = event.target.closest("[data-booking-create-form]");
    if (createForm) {
      if (event.target.name === "branch_id" || event.target.name === "master_id") syncBookingCreateSelections(createForm, bookingState.calendarData);
      if (["branch_id", "master_id", "service_id", "booking_date"].includes(event.target.name)) {
        createForm.dataset.bookingSelectedStart = "";
        await loadBookingCreateSlots(createForm, ctx);
        return;
      }
      if (event.target.name === "starts_at") {
        createForm.dataset.bookingSelectedStart = event.target.value;
        createForm.querySelector("[data-booking-create-submit]").disabled = false;
        return;
      }
    }
    if (event.target.matches('[name="visit_comment_photos"]')) {
      const album = event.target.closest("[data-visit-photo-album]");
      const previews = album?.querySelector("[data-visit-photo-previews]");
      const files = [...(event.target.files || [])];
      const existing = Number(album?.dataset.existingImagesCount || 0);
      if (!album || !previews || !files.length) return;
      if (existing + files.length > 10) {
        event.target.value = "";
        alert("Можно добавить не более 10 фотографий в альбом.");
        return;
      }
      previews.querySelectorAll("[data-visit-photo-pending]").forEach((preview) => preview.remove());
      previews.insertAdjacentHTML("beforeend", files.map((file) => `<figure class="service-image-preview" data-visit-photo-pending><img src="${escapeHtml(URL.createObjectURL(file))}" alt="Предпросмотр фотографии визита"></figure>`).join(""));
      return;
    }
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
