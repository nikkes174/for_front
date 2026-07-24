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
  branchId: "",
  employeeId: "",
};

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

function statusSelect(event) {
  return `<select class="booking-status booking-status-${escapeHtml(event.visit_status)}" data-booking-status data-visit-id="${escapeHtml(event.id)}">
    ${STATUS_OPTIONS.map(([value, label]) => `<option value="${value}" ${event.visit_status === value ? "selected" : ""}>${label}</option>`).join("")}
  </select>`;
}

function eventCard(event, minHour) {
  const startMinute = minutesOfDay(event.start);
  const endMinute = minutesOfDay(event.end);
  const top = Math.max((startMinute - minHour * 60) * 1.15, 0);
  const height = Math.max((endMinute - startMinute) * 1.15, 46);
  const breakMinutes = Math.round(Number(event.technical_break_seconds || 0) / 60);
  return `<article class="booking-event booking-event-${escapeHtml(event.visit_status)}" style="top:${top}px;height:${height}px">
    <div class="booking-event-time">${clock(event.start)}–${clock(event.end)}</div>
    <strong>${escapeHtml(event.service_names?.join(", ") || "Визит")}</strong>
    <span>${escapeHtml(event.client_name)}</span>
    <small>${escapeHtml(event.employee_name)} · ${escapeHtml(event.branch_name)}</small>
    ${event.client_phone ? `<small>${escapeHtml(event.client_phone)}</small>` : ""}
    ${breakMinutes ? `<small>Техперерыв: ${breakMinutes} мин</small>` : ""}
    ${statusSelect(event)}
  </article>`;
}

function dayColumn(day, data, minHour, maxHour) {
  const dateKey = localIsoDate(day);
  const events = data.events.filter((event) => event.start.slice(0, 10) === dateKey);
  const intervals = data.working_intervals.filter((item) => item.date === dateKey);
  return `<section class="booking-day">
    <header><span>${DAY_NAMES[day.getDay()]}</span><strong>${day.getDate()} ${MONTH_NAMES[day.getMonth()]}</strong></header>
    <div class="booking-day-hours">${intervals.length ? [...new Set(intervals.map((item) => `${item.from}–${item.to}`))].join(", ") : "Нет рабочего времени"}</div>
    <div class="booking-day-body" style="height:${(maxHour - minHour) * 60 * 1.15}px">
      ${events.map((event) => eventCard(event, minHour)).join("")}
    </div>
  </section>`;
}

function timeScale(minHour, maxHour) {
  return `<div class="booking-time-scale">
    <div class="booking-time-spacer"></div>
    <div class="booking-time-body" style="height:${(maxHour - minHour) * 60 * 1.15}px">
      ${Array.from({ length: maxHour - minHour + 1 }, (_, index) => `<span style="top:${index * 60 * 1.15}px">${String(minHour + index).padStart(2, "0")}:00</span>`).join("")}
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
  const end = addDays(start, 6);
  const data = await api.bookingCalendar(
    ctx.org.id,
    localIsoDate(start),
    localIsoDate(end),
    bookingState.viewBy,
    bookingState.branchId,
    bookingState.employeeId,
  );
  const minHour = 8;
  const maxHour = 20;
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return `<section class="booking-page" data-booking-page>
    <div class="booking-toolbar">
      <div class="booking-nav">
        <button type="button" class="ghost" data-booking-week="-7">‹</button>
        <button type="button" class="ghost" data-booking-today>Сегодня</button>
        <button type="button" class="ghost" data-booking-week="7">›</button>
        <strong>${start.getDate()} ${MONTH_NAMES[start.getMonth()]} — ${end.getDate()} ${MONTH_NAMES[end.getMonth()]}</strong>
      </div>
      <div class="booking-filters">
        <label><span>Показывать по</span><select data-booking-view>
          <option value="masters" ${bookingState.viewBy === "masters" ? "selected" : ""}>Мастерам</option>
          <option value="branches" ${bookingState.viewBy === "branches" ? "selected" : ""}>Филиалам</option>
        </select></label>
        ${filterOptions(data)}
      </div>
    </div>
    <div class="booking-calendar">
      ${timeScale(minHour, maxHour)}
      ${days.map((day) => dayColumn(day, data, minHour, maxHour)).join("")}
    </div>
  </section>`;
}

export function bindBooking(root, ctx) {
  root.addEventListener("click", (event) => {
    const weekButton = event.target.closest("[data-booking-week]");
    if (weekButton) {
      bookingState.weekStart = addDays(bookingState.weekStart || weekStart(), Number(weekButton.dataset.bookingWeek));
      ctx.reload();
      return;
    }
    if (event.target.closest("[data-booking-today]")) {
      bookingState.weekStart = weekStart();
      ctx.reload();
    }
  });

  root.addEventListener("change", async (event) => {
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
    if (event.target.matches("[data-booking-status]")) {
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
