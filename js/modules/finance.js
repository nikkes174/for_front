import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

const financeState = {
  organizationId: null,
  dateFrom: "",
  dateTo: "",
  branchId: "",
  employeeId: "",
  employeeQuery: "",
  users: [],
  branchMemberships: [],
  plan: "standard",
};

function isoDate(value) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function resetPeriod(organizationId) {
  if (financeState.organizationId === organizationId) return;
  const today = new Date();
  financeState.organizationId = organizationId;
  financeState.dateFrom = isoDate(new Date(today.getFullYear(), today.getMonth(), 1));
  financeState.dateTo = isoDate(today);
  financeState.branchId = "";
  financeState.employeeId = "";
  financeState.employeeQuery = "";
  financeState.users = [];
  financeState.branchMemberships = [];
  financeState.plan = "standard";
}

function employeeName(user) {
  return [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ")
    || user.email || user.phone || `Сотрудник #${user.id}`;
}

function employeeCandidates(query = "", branchId = financeState.branchId) {
  const allowedIds = new Set(
    financeState.branchMemberships
      .filter((item) => !branchId || String(item.branch_id) === String(branchId))
      .map((item) => String(item.user_id)),
  );
  const normalizedQuery = query.trim().toLocaleLowerCase("ru-RU");
  return financeState.users
    .filter((user) => !branchId || allowedIds.has(String(user.id)))
    .filter((user) => !normalizedQuery || employeeName(user).toLocaleLowerCase("ru-RU").includes(normalizedQuery))
    .sort((left, right) => employeeName(left).localeCompare(employeeName(right), "ru-RU"));
}

function employeeResultsMarkup(query = "", branchId = financeState.branchId) {
  const candidates = employeeCandidates(query, branchId).slice(0, 8);
  return `
    <button type="button" class="finance-user-option ${financeState.employeeId ? "" : "is-selected"}" data-finance-employee="">Все пользователи</button>
    ${candidates.map((user) => `<button type="button" class="finance-user-option ${String(user.id) === financeState.employeeId ? "is-selected" : ""}" data-finance-employee="${user.id}">${escapeHtml(employeeName(user))}</button>`).join("")}
    ${candidates.length ? "" : '<span class="finance-user-empty">Сотрудники не найдены</span>'}
  `;
}

function money(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function selectedSalary(row) {
  return financeState.plan === "alternative" ? row.salary_alternative : row.salary_standard;
}

export async function finance(ctx) {
  resetPeriod(ctx.org.id);
  const [branches, users, branchMemberships, report] = await Promise.all([
    api.branches(ctx.org.id).catch(() => []),
    api.users(ctx.org.id, 500).catch(() => []),
    api.branchMemberships(ctx.org.id).catch(() => []),
    api.financePayroll(
      ctx.org.id,
      financeState.dateFrom,
      financeState.dateTo,
      financeState.branchId,
      financeState.employeeId,
    ),
  ]);
  financeState.users = users;
  financeState.branchMemberships = branchMemberships;
  if (financeState.employeeId && !financeState.employeeQuery) {
    const selectedUser = users.find((user) => String(user.id) === financeState.employeeId);
    financeState.employeeQuery = selectedUser ? employeeName(selectedUser) : "";
  }
  const totals = report.totals || {};
  const rows = report.rows || [];
  const planTitle = financeState.plan === "alternative" ? "35% услуги / 5% товары" : "30% услуги / 15% товары";
  const salaryTotal = financeState.plan === "alternative" ? totals.salary_alternative : totals.salary_standard;

  return `
    <section class="finance-page">
      <div class="panel finance-filter-panel">
        <div>
          <h2>Расчёт зарплаты</h2>
          <p>Начисления по завершённым визитам за выбранный период.</p>
        </div>
        <div class="finance-filters">
          <label>С даты<input type="date" value="${financeState.dateFrom}" data-finance-date-from /></label>
          <label>По дату<input type="date" value="${financeState.dateTo}" data-finance-date-to /></label>
          <label>Филиал<select data-finance-branch>
            <option value="">Все филиалы</option>
            ${branches.map((branch) => `<option value="${branch.id}" ${String(branch.id) === financeState.branchId ? "selected" : ""}>${escapeHtml(branch.name)}</option>`).join("")}
          </select></label>
          <label class="finance-user-search">Пользователь
            <input type="search" autocomplete="off" placeholder="Имя или фамилия" value="${escapeHtml(financeState.employeeQuery)}" data-finance-user-input />
            <span class="finance-user-results" data-finance-user-results hidden>${employeeResultsMarkup(financeState.employeeQuery)}</span>
          </label>
          <label>Схема начисления<select data-finance-plan>
            <option value="standard" ${financeState.plan === "standard" ? "selected" : ""}>30% услуги / 15% товары</option>
            <option value="alternative" ${financeState.plan === "alternative" ? "selected" : ""}>35% услуги / 5% товары</option>
          </select></label>
          <button type="button" class="primary" data-finance-apply>Рассчитать</button>
        </div>
      </div>

      <div class="finance-summary">
        <div class="stat"><span>Завершённых визитов</span><strong>${Number(totals.visits_count || 0)}</strong></div>
        <div class="stat"><span>Выручка по услугам</span><strong>${money(totals.services_base)}</strong></div>
        <div class="stat"><span>Выручка по товарам</span><strong>${money(totals.goods_base)}</strong></div>
        <div class="stat finance-salary-stat"><span>Зарплата · ${planTitle}</span><strong>${money(salaryTotal)}</strong></div>
      </div>

      <div class="panel">
        <div class="finance-table-head">
          <div><h2>Сотрудники</h2><p>${financeState.dateFrom} — ${financeState.dateTo}</p></div>
          <span>${rows.length} сотрудников</span>
        </div>
        <div class="table-wrap finance-table-wrap">
          <table class="finance-table">
            <thead><tr>
              <th>Сотрудник</th><th>Визиты</th><th>Услуги</th><th>Товары</th><th>Оборот</th><th>К выплате</th>
            </tr></thead>
            <tbody>
              ${rows.length ? rows.map((row) => `<tr class="${row.is_active ? "" : "is-inactive"}">
                <td><strong>${escapeHtml(row.name)}</strong>${row.is_active ? "" : "<small>Неактивен</small>"}</td>
                <td>${Number(row.visits_count || 0)}</td>
                <td>${money(row.services_base)}</td>
                <td>${money(row.goods_base)}</td>
                <td>${money(row.turnover)}</td>
                <td class="finance-salary-cell">${money(selectedSalary(row))}</td>
              </tr>`).join("") : `<tr><td colspan="6" class="finance-empty">За выбранный период начислений нет</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  `;
}

export function bindFinance(root, ctx) {
  root.addEventListener("input", (event) => {
    if (!event.target.matches("[data-finance-user-input]")) return;
    financeState.employeeQuery = event.target.value || "";
    const selectedUser = financeState.users.find((user) => String(user.id) === financeState.employeeId);
    if (!selectedUser || employeeName(selectedUser) !== financeState.employeeQuery) financeState.employeeId = "";
    const results = root.querySelector("[data-finance-user-results]");
    if (results) {
      results.innerHTML = employeeResultsMarkup(
        financeState.employeeQuery,
        root.querySelector("[data-finance-branch]")?.value || "",
      );
      results.hidden = false;
    }
  });

  root.addEventListener("focusin", (event) => {
    if (!event.target.matches("[data-finance-user-input]")) return;
    const results = root.querySelector("[data-finance-user-results]");
    if (results) results.hidden = false;
  });

  root.addEventListener("change", (event) => {
    if (!event.target.matches("[data-finance-branch]")) return;
    const candidates = employeeCandidates("", event.target.value || "");
    if (financeState.employeeId && !candidates.some((user) => String(user.id) === financeState.employeeId)) {
      financeState.employeeId = "";
      financeState.employeeQuery = "";
      const input = root.querySelector("[data-finance-user-input]");
      if (input) input.value = "";
    }
  });

  root.addEventListener("click", (event) => {
    const employeeOption = event.target.closest("[data-finance-employee]");
    if (employeeOption) {
      financeState.employeeId = employeeOption.dataset.financeEmployee || "";
      const selectedUser = financeState.users.find((user) => String(user.id) === financeState.employeeId);
      financeState.employeeQuery = selectedUser ? employeeName(selectedUser) : "";
      const input = root.querySelector("[data-finance-user-input]");
      if (input) input.value = financeState.employeeQuery;
      const results = root.querySelector("[data-finance-user-results]");
      if (results) results.hidden = true;
      return;
    }
    const button = event.target.closest("[data-finance-apply]");
    if (!button) {
      if (!event.target.closest("[data-finance-user-search]")) {
        const results = root.querySelector("[data-finance-user-results]");
        if (results) results.hidden = true;
      }
      return;
    }
    financeState.dateFrom = root.querySelector("[data-finance-date-from]")?.value || financeState.dateFrom;
    financeState.dateTo = root.querySelector("[data-finance-date-to]")?.value || financeState.dateTo;
    financeState.branchId = root.querySelector("[data-finance-branch]")?.value || "";
    financeState.plan = root.querySelector("[data-finance-plan]")?.value || "standard";
    const input = root.querySelector("[data-finance-user-input]");
    if (input?.value.trim() && !financeState.employeeId) {
      const candidates = employeeCandidates(input.value, financeState.branchId);
      if (candidates.length === 1) {
        financeState.employeeId = String(candidates[0].id);
        financeState.employeeQuery = employeeName(candidates[0]);
      } else {
        input.setCustomValidity("Выберите сотрудника из списка");
        input.reportValidity();
        input.addEventListener("input", () => input.setCustomValidity(""), { once: true });
        return;
      }
    }
    ctx.reload();
  });
}
