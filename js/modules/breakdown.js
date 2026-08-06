import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

const state = { organizationId: null, dateFrom: "", dateTo: "", branchId: "", itemType: "all", itemKey: "" };

function isoDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resetState(organizationId) {
  if (state.organizationId === organizationId) return;
  const today = new Date();
  state.organizationId = organizationId;
  state.dateFrom = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
  state.dateTo = isoDate(today);
  state.branchId = "";
  state.itemType = "all";
  state.itemKey = "";
}

function money(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency", currency: "RUB", minimumFractionDigits: 2, maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function quantity(value) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? String(value)
    : new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function employeeName(user) {
  return [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ")
    || user.email || user.phone || `Сотрудник #${user.id}`;
}

function rowItemKey(row) {
  return `${row.item_type}:${row.item_id ?? row.item_name}`;
}

export async function breakdown(ctx) {
  resetState(ctx.org.id);
  const [branches, users, categories, catalog, report] = await Promise.all([
    api.branches(ctx.org.id).catch(() => []),
    api.users(ctx.org.id, 500).catch(() => []),
    api.productCategories(ctx.org.id).catch(() => []),
    api.productItems(ctx.org.id).catch(() => []),
    api.financeBreakdown(ctx.org.id, state.dateFrom, state.dateTo, state.branchId),
  ]);

  const categoryTypes = new Map(categories.map((category) => [String(category.id), category.type]));
  const catalogMap = new Map(catalog.map((item) => [
    `${categoryTypes.get(String(item.category_id)) || "product"}:${item.id}`,
    item.title || item.name || `#${item.id}`,
  ]));
  const userMap = new Map(users.map((user) => [String(user.id), employeeName(user)]));
  const branchMap = new Map(branches.map((branch) => [String(branch.id), branch.name]));
  const allRows = (report.rows || []).map((row) => ({
    ...row,
    displayName: row.item_name || catalogMap.get(`${row.item_type}:${row.item_id}`) || `Позиция #${row.item_id || "—"}`,
  }));
  const typeRows = state.itemType === "all" ? allRows : allRows.filter((row) => row.item_type === state.itemType);
  const positions = [...new Map(typeRows.map((row) => [rowItemKey(row), row])).entries()]
    .sort((left, right) => left[1].displayName.localeCompare(right[1].displayName, "ru-RU"));
  if (state.itemKey && !positions.some(([key]) => key === state.itemKey)) state.itemKey = "";
  const rows = state.itemKey ? typeRows.filter((row) => rowItemKey(row) === state.itemKey) : typeRows;
  const totalQuantity = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
  const totalAmount = rows.reduce((sum, row) => sum + Number(row.total_amount || 0), 0);
  const visitsCount = new Set(rows.map((row) => row.visit_id).filter(Boolean)).size;

  return `
    <section class="finance-page breakdown-page">
      <div class="panel finance-filter-panel">
        <div><h2>Детализация продаж</h2><p>Товары и услуги по завершённым визитам за выбранный период.</p></div>
        <div class="finance-filters breakdown-filters">
          <label>С даты<input type="date" value="${state.dateFrom}" data-breakdown-date-from /></label>
          <label>По дату<input type="date" value="${state.dateTo}" data-breakdown-date-to /></label>
          <label>Филиал<select data-breakdown-branch><option value="">Все филиалы</option>${branches.map((branch) => `<option value="${branch.id}" ${String(branch.id) === state.branchId ? "selected" : ""}>${escapeHtml(branch.name)}</option>`).join("")}</select></label>
          <label>Тип позиции<select data-breakdown-type><option value="all" ${state.itemType === "all" ? "selected" : ""}>Товары и услуги</option><option value="product" ${state.itemType === "product" ? "selected" : ""}>Только товары</option><option value="service" ${state.itemType === "service" ? "selected" : ""}>Только услуги</option></select></label>
          <label>Товар или услуга<select data-breakdown-item><option value="">Все позиции</option>${positions.map(([key, row]) => `<option value="${escapeHtml(key)}" ${key === state.itemKey ? "selected" : ""}>${escapeHtml(row.displayName)}</option>`).join("")}</select></label>
          <button type="button" class="primary" data-breakdown-apply>Сформировать</button>
        </div>
      </div>

      <div class="finance-summary">
        <div class="stat"><span>Визитов</span><strong>${visitsCount}</strong></div>
        <div class="stat"><span>Количество</span><strong>${quantity(totalQuantity)}</strong></div>
        <div class="stat finance-salary-stat"><span>Сумма продаж</span><strong>${money(totalAmount)}</strong></div>
      </div>

      <div class="panel">
        <div class="finance-table-head"><div><h2>Отчёт</h2><p>${state.dateFrom} — ${state.dateTo}</p></div><span>${rows.length} позиций</span></div>
        <div class="table-wrap finance-table-wrap">
          <table class="finance-table breakdown-table">
            <thead><tr><th>Дата и время</th><th>Тип</th><th>Позиция</th><th>Кол-во</th><th>Цена</th><th>Скидка</th><th>Сумма</th><th>Сотрудник</th><th>Филиал</th><th>Визит</th></tr></thead>
            <tbody>${rows.length ? rows.map((row) => `<tr>
              <td>${escapeHtml(formatDate(row.sold_at))}</td>
              <td><span class="breakdown-type">${row.item_type === "service" ? "Услуга" : "Товар"}</span></td>
              <td><strong>${escapeHtml(row.displayName)}</strong></td>
              <td>${quantity(row.quantity)}</td><td>${money(row.price)}</td><td>${money(row.discount_amount)}</td><td><strong>${money(row.total_amount)}</strong></td>
              <td>${escapeHtml(userMap.get(String(row.employee_id)) || row.employee_name || `Сотрудник #${row.employee_id || "—"}`)}</td>
              <td>${escapeHtml(branchMap.get(String(row.branch_id)) || `Филиал #${row.branch_id || "—"}`)}</td>
              <td>#${escapeHtml(row.visit_id || "—")}</td>
            </tr>`).join("") : '<tr><td colspan="10" class="finance-empty">По выбранным фильтрам продаж не найдено</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

export function bindBreakdown(root, ctx) {
  root.addEventListener("change", (event) => {
    if (!event.target.matches("[data-breakdown-type]")) return;
    state.dateFrom = root.querySelector("[data-breakdown-date-from]")?.value || state.dateFrom;
    state.dateTo = root.querySelector("[data-breakdown-date-to]")?.value || state.dateTo;
    state.branchId = root.querySelector("[data-breakdown-branch]")?.value || "";
    state.itemType = event.target.value || "all";
    state.itemKey = "";
    ctx.reload();
  });
  root.addEventListener("click", (event) => {
    if (!event.target.closest("[data-breakdown-apply]")) return;
    state.dateFrom = root.querySelector("[data-breakdown-date-from]")?.value || state.dateFrom;
    state.dateTo = root.querySelector("[data-breakdown-date-to]")?.value || state.dateTo;
    state.branchId = root.querySelector("[data-breakdown-branch]")?.value || "";
    state.itemType = root.querySelector("[data-breakdown-type]")?.value || "all";
    state.itemKey = root.querySelector("[data-breakdown-item]")?.value || "";
    ctx.reload();
  });
}