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
  rules: null,
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
  financeState.rules = null;
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
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function numberValue(value) {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(Number(value || 0));
}

function ruleInput(name, label, value, suffix = "%", step = "0.01") {
  return `<label>${label}<span><input type="number" min="0" step="${step}" value="${Number(value || 0)}" data-finance-rule="${name}" /><b>${suffix}</b></span></label>`;
}

export async function finance(ctx) {
  resetPeriod(ctx.org.id);
  const [branches, users, branchMemberships, report] = await Promise.all([
    api.branches(ctx.org.id),
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
  financeState.rules = report.rules || {};
  if (financeState.employeeId && !financeState.employeeQuery) {
    const selectedUser = users.find((user) => String(user.id) === financeState.employeeId);
    financeState.employeeQuery = selectedUser ? employeeName(selectedUser) : "";
  }

  const totals = report.totals || {};
  const rows = report.rows || [];
  const rules = financeState.rules;

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
          <button type="button" class="primary" data-finance-apply>Рассчитать</button>
        </div>
      </div>

      <div class="finance-settings">
        <div class="panel finance-settings-panel finance-base-panel">
          <div class="finance-rules-head">
            <div>
              <h2>Базовые ставки</h2>
            </div>
            <button type="button" class="secondary" data-finance-save-rules>Сохранить ставки</button>
          </div>
          <div class="finance-rules-grid finance-base-grid">
            ${ruleInput("base_services_percent", "Базовый % услуг", rules.base_services_percent)}
            ${ruleInput("base_goods_percent", "Базовый % товаров", rules.base_goods_percent)}
          </div>
        </div>

        <div class="panel finance-settings-panel finance-plan-panel">
          <div class="finance-rules-head">
            <div>
              <div class="finance-plan-title">
                <h2>План</h2>
                <span>Назначен: ${Number(totals.planned_employees || 0)}</span>
              </div>
            </div>
            <button type="button" class="primary" data-finance-save-rules>Сохранить план</button>
          </div>
          <div class="finance-rules-grid finance-plan-grid">
            ${ruleInput("return_rate_threshold_percent", "Возвращаемость от", rules.return_rate_threshold_percent)}
            ${ruleInput("clients_threshold", "Клиентов за период от", rules.clients_threshold, "чел.", "1")}
            ${ruleInput("services_bonus_percent", "Повышенный % услуг", rules.services_bonus_percent)}
            ${ruleInput("goods_sales_threshold", "Продажи товаров от", rules.goods_sales_threshold, "₽")}
            ${ruleInput("goods_bonus_percent", "Повышенный % товаров", rules.goods_bonus_percent)}
          </div>
        </div>
      </div>

      <div class="finance-summary">
        <div class="stat"><span>Завершённых визитов</span><strong>${Number(totals.visits_count || 0)}</strong></div>
        <div class="stat"><span>Уникальных клиентов</span><strong>${Number(totals.clients_count || 0)}</strong></div>
        <div class="stat"><span>Выручка по услугам</span><strong>${money(totals.services_base)}</strong></div>
        <div class="stat"><span>Выручка по товарам</span><strong>${money(totals.goods_base)}</strong></div>
        <div class="stat finance-salary-stat"><span>Зарплата по правилам</span><strong>${money(totals.salary_total)}</strong></div>
      </div>

      <div class="panel">
        <div class="finance-table-head">
          <div><h2>Сотрудники</h2><p>${financeState.dateFrom} — ${financeState.dateTo}</p></div>
          <span>${rows.length} сотрудников</span>
        </div>
        <div class="table-wrap finance-table-wrap">
          <table class="finance-table">
            <thead><tr><th>Сотрудник</th><th>План</th><th>Визиты</th><th>Клиенты</th><th>Возвращаемость</th><th>Услуги</th><th>Товары</th><th>Ставки</th><th>Оборот</th><th>К выплате</th></tr></thead>
            <tbody>
              ${rows.length ? rows.map((row) => `<tr class="${row.is_active ? "" : "is-inactive"}">
                <td><strong>${escapeHtml(row.name)}</strong>${row.is_active ? "" : "<small>Неактивен</small>"}</td>
                <td><button type="button" class="secondary finance-plan-toggle ${row.plan_enabled ? "is-active" : ""}" data-finance-plan-toggle data-employee-id="${row.employee_id}" data-enabled="${row.plan_enabled ? "false" : "true"}">${row.plan_enabled ? "Убрать план" : "Поставить план"}</button></td>
                <td>${Number(row.visits_count || 0)}</td>
                <td>${Number(row.clients_count || 0)}<small>повторных: ${Number(row.returning_clients_count || 0)}</small></td>
                <td>${numberValue(row.return_rate_percent)}%</td>
                <td>${money(row.services_base)}</td>
                <td>${money(row.goods_base)}</td>
                <td><strong>${numberValue(row.services_percent)}% / ${numberValue(row.goods_percent)}%</strong><small>услуги / товары</small></td>
                <td>${money(row.turnover)}</td>
                <td class="finance-salary-cell">${money(row.salary_total)}</td>
              </tr>`).join("") : `<tr><td colspan="10" class="finance-empty">За выбранный период начислений нет</td></tr>`}
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

  root.addEventListener("focusout", (event) => {
    const search = event.target.closest?.("[data-finance-user-search]");
    if (!search) return;
    setTimeout(() => {
      if (search.contains(document.activeElement)) return;
      const results = search.querySelector("[data-finance-user-results]");
      if (results) results.hidden = true;
    }, 0);
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

  root.addEventListener("click", async (event) => {
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

    const planButton = event.target.closest("[data-finance-plan-toggle]");
    if (planButton) {
      planButton.disabled = true;
      try {
        await api.updateFinanceEmployeePlan(
          ctx.org.id,
          Number(planButton.dataset.employeeId),
          planButton.dataset.enabled === "true",
        );
        await ctx.reload();
      } finally {
        planButton.disabled = false;
      }
      return;
    }

    const saveButton = event.target.closest("[data-finance-save-rules]");
    if (saveButton) {
      const payload = {};
      root.querySelectorAll("[data-finance-rule]").forEach((input) => {
        payload[input.dataset.financeRule] = Number(input.value);
      });
      saveButton.disabled = true;
      try {
        financeState.rules = await api.updateFinanceRules(ctx.org.id, payload);
        await ctx.reload();
      } finally {
        saveButton.disabled = false;
      }
      return;
    }

    const button = event.target.closest("[data-finance-apply]");
    if (!button) return;

    financeState.dateFrom = root.querySelector("[data-finance-date-from]")?.value || financeState.dateFrom;
    financeState.dateTo = root.querySelector("[data-finance-date-to]")?.value || financeState.dateTo;
    financeState.branchId = root.querySelector("[data-finance-branch]")?.value || "";
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
    await ctx.reload();
  });
}
