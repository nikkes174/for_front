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
  additionalPlans: [],
  rows: [],
  tableSort: "name",
  tableDirection: "asc",
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
  financeState.additionalPlans = [];
  financeState.rows = [];
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

function financeSortValue(row, key) {
  if (key === "name") return String(row.name || "").toLocaleLowerCase("ru-RU");
  if (key === "plan") return [row.has_individual_plan ? 2 : 0, row.additional_plan_id ? 1 : 0, row.plan_enabled ? 1 : 0].join("");
  if (key === "rates") return (Number(row.services_percent || 0) * 1000) + Number(row.goods_percent || 0);
  return Number(row[key] || 0);
}

function sortedFinanceRows(rows) {
  const factor = financeState.tableDirection === "desc" ? -1 : 1;
  const key = financeState.tableSort;
  return [...rows].sort((left, right) => {
    const first = financeSortValue(left, key);
    const second = financeSortValue(right, key);
    return typeof first === "string"
      ? factor * first.localeCompare(second, "ru-RU")
      : factor * (first - second);
  });
}

function financeTableHeader(key, label) {
  const marker = financeState.tableSort === key ? (financeState.tableDirection === "asc" ? " ↑" : " ↓") : "";
  const nextDirection = financeState.tableSort === key && financeState.tableDirection === "asc" ? "desc" : "asc";
  return `<button type="button" class="pagination-link finance-table-sort" data-finance-table-sort="${key}" data-finance-table-direction="${nextDirection}">${escapeHtml(label + marker)}</button>`;
}

function financeTableMarkup(rows) {
  const sortedRows = sortedFinanceRows(rows);
  return `<div class="table-wrap finance-table-wrap" data-finance-table-wrap>
    <table class="finance-table">
      <thead><tr><th>${financeTableHeader("name", "Сотрудник")}</th><th>${financeTableHeader("plan", "План")}</th><th>${financeTableHeader("visits_count", "Визиты")}</th><th>${financeTableHeader("clients_count", "Клиенты")}</th><th>${financeTableHeader("return_rate_percent", "Возвращаемость")}</th><th>${financeTableHeader("services_base", "Услуги")}</th><th>${financeTableHeader("goods_base", "Товары")}</th><th>${financeTableHeader("rates", "Ставки")}</th><th>${financeTableHeader("turnover", "Оборот")}</th><th>${financeTableHeader("salary_total", "К выплате")}</th></tr></thead>
      <tbody>
        ${sortedRows.length ? sortedRows.map((row) => `<tr class="${row.is_active ? "" : "is-inactive"}">
          <td><strong>${escapeHtml(row.name)}</strong>${row.is_active ? "" : "<small>Неактивен</small>"}</td>
          <td><div class="finance-plan-actions">
            <button type="button" class="secondary finance-plan-toggle ${row.plan_enabled ? "is-active" : ""}" data-finance-plan-toggle data-employee-id="${row.employee_id}" data-enabled="${row.plan_enabled ? "false" : "true"}">${row.plan_enabled ? "Убрать общий" : "Поставить общий"}</button>
            <label class="finance-additional-assignment"><span>Доп. план</span><select data-finance-additional-assignment data-employee-id="${row.employee_id}">
              <option value="">Без доп. плана</option>
              ${financeState.additionalPlans.map((plan) => `<option value="${escapeHtml(plan.id)}" ${plan.id === row.additional_plan_id ? "selected" : ""}>${escapeHtml(plan.name)}</option>`).join("")}
            </select></label>
            <button type="button" class="secondary finance-individual-plan-button ${row.has_individual_plan ? "is-active" : ""}" data-finance-individual-open data-employee-id="${row.employee_id}" data-employee-name="${escapeHtml(row.name)}">${row.has_individual_plan ? "Изменить индивидуальный" : "Создать индивидуальный"}</button>
          </div></td>
          <td>${Number(row.visits_count || 0)}</td>
          <td>${Number(row.clients_count || 0)}<small>повторных: ${Number(row.returning_clients_count || 0)}</small></td>
          <td>${numberValue(row.return_rate_percent)}%</td>
          <td>${money(row.services_base)}</td>
          <td>${money(row.goods_base)}</td>
          <td><strong>${numberValue(row.services_percent)}% / ${numberValue(row.goods_percent)}%</strong><small>${row.services_percent_source === "individual" || row.goods_percent_source === "individual" ? "индивидуальный приоритет" : row.services_percent_source === "additional_plan" || row.goods_percent_source === "additional_plan" ? `доп. план: ${row.additional_plan_name || ""}` : "услуги / товары"}</small></td>
          <td>${money(row.turnover)}</td>
          <td class="finance-salary-cell">${money(row.salary_total)}</td>
        </tr>`).join("") : `<tr><td colspan="10" class="finance-empty">За выбранный период начислений нет</td></tr>`}
      </tbody>
    </table>
  </div>`;
}

function ruleInput(name, label, value, suffix = "%", step = "0.01") {
  return `<label>${label}<span><input type="number" min="0" step="${step}" value="${Number(value || 0)}" data-finance-rule="${name}" /><b>${suffix}</b></span></label>`;
}

const INDIVIDUAL_METRICS = [
  ["goods_base", "Сумма товаров"],
  ["services_base", "Сумма услуг"],
  ["turnover", "Общий оборот"],
  ["return_rate_percent", "Возвращаемость"],
  ["clients_count", "Количество клиентов"],
  ["returning_clients_count", "Повторные клиенты"],
  ["visits_count", "Количество визитов"],
];

const INDIVIDUAL_OPERATORS = [
  ["gt", ">"],
  ["gte", "≥"],
  ["lt", "<"],
  ["lte", "≤"],
  ["eq", "="],
];

const INDIVIDUAL_TARGETS = [
  ["goods", "Ставка по товарам"],
  ["services", "Ставка по услугам"],
];

function individualOptions(items, selected) {
  return items
    .map(([value, label]) => `<option value="${value}" ${value === selected ? "selected" : ""}>${label}</option>`)
    .join("");
}

function individualRuleMarkup(rule = {}) {
  const value = {
    metric: rule.metric || "goods_base",
    operator: rule.operator || "gt",
    threshold: Number(rule.threshold ?? 35000),
    target: rule.target || "goods",
    percent: Number(rule.percent ?? 15),
  };
  return `
    <div class="finance-individual-rule" data-finance-individual-rule>
      <label><span>Показатель</span><select data-individual-metric>${individualOptions(INDIVIDUAL_METRICS, value.metric)}</select></label>
      <label><span>Условие</span><select data-individual-operator>${individualOptions(INDIVIDUAL_OPERATORS, value.operator)}</select></label>
      <label><span>Значение N</span><input type="number" step="0.01" value="${value.threshold}" required data-individual-threshold /></label>
      <label><span>Изменить</span><select data-individual-target>${individualOptions(INDIVIDUAL_TARGETS, value.target)}</select></label>
      <label><span>Ставка</span><span class="finance-individual-percent"><input type="number" min="0" max="100" step="0.01" value="${value.percent}" required data-individual-percent /><b>%</b></span></label>
      <button type="button" class="client-delete-icon-button finance-individual-remove" data-finance-individual-remove aria-label="Удалить условие" title="Удалить условие"><img src="/fronted/icons/basket.svg" alt=""></button>
    </div>
  `;
}

function individualPlanModal(plan, employeeId, masterName) {
  const savedRules = Array.isArray(plan?.rules) ? plan.rules : [];
  const visibleRules = savedRules.length ? savedRules : [{}];
  return `
    <div class="modal-backdrop" data-finance-individual-modal data-employee-id="${employeeId}">
      <div class="modal-card finance-individual-modal" role="dialog" aria-modal="true" aria-label="Индивидуальный план">
        <div class="modal-head">
          <div>
            <h3>Индивидуальный план</h3>
            <span class="modal-title-id">${escapeHtml(masterName)}</span>
          </div>
          <button type="button" class="secondary finance-individual-close" aria-label="Закрыть" data-finance-individual-close>×</button>
        </div>

        <div class="finance-individual-rules" data-finance-individual-rules>
          ${visibleRules.map((rule) => individualRuleMarkup(rule)).join("")}
        </div>
        <div class="finance-individual-add-row">
          <button type="button" class="secondary" data-finance-individual-add>+ Добавить переменную</button>
        </div>
        <div class="finance-individual-footer">
          <button type="button" class="danger" data-finance-individual-delete>Удалить план</button>
          <button type="button" class="primary" data-finance-individual-save>Сохранить индивидуальный план</button>
        </div>
      </div>
    </div>
  `;
}


function additionalPlanId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function additionalPlanCardMarkup(plan = {}) {
  const planId = plan.id || additionalPlanId();
  const rules = Array.isArray(plan.rules) && plan.rules.length ? plan.rules : [{}];
  return `
    <section class="finance-additional-card" data-finance-additional-card data-plan-id="${escapeHtml(planId)}">
      <div class="finance-additional-card-head">
        <label><span>Название плана</span><input type="text" maxlength="100" value="${escapeHtml(plan.name || "")}" placeholder="Например: Старший мастер" required data-finance-additional-name /></label>
        <button type="button" class="client-delete-icon-button" data-finance-additional-remove aria-label="Удалить дополнительный план" title="Удалить дополнительный план"><img src="/fronted/icons/basket.svg" alt=""></button>
      </div>
      <div class="finance-individual-rules" data-finance-additional-rules>
        ${rules.map((rule) => individualRuleMarkup(rule)).join("")}
      </div>
      <button type="button" class="secondary finance-additional-rule-add" data-finance-additional-rule-add>+ Добавить переменную в план</button>
    </section>
  `;
}

function additionalPlansModal(plans) {
  return `
    <div class="modal-backdrop" data-finance-additional-modal>
      <div class="modal-card finance-additional-modal" role="dialog" aria-modal="true" aria-label="Дополнительные планы">
        <div class="modal-head">
          <div>
            <h3>Дополнительные планы</h3>
          </div>
          <button type="button" class="secondary finance-individual-close" aria-label="Закрыть" data-finance-additional-close>×</button>
        </div>

        <div class="finance-additional-list" data-finance-additional-list>
          ${plans.map((plan) => additionalPlanCardMarkup(plan)).join("")}
        </div>
        <div class="finance-additional-footer">
          <button type="button" class="secondary" data-finance-additional-create>+ Создать дополнительный план</button>
          <button type="button" class="primary" data-finance-additional-save>Сохранить дополнительные планы</button>
        </div>
      </div>
    </div>
  `;
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
  financeState.additionalPlans = Array.isArray(report.additional_plans)
    ? report.additional_plans
    : [];
  if (financeState.employeeId && !financeState.employeeQuery) {
    const selectedUser = users.find((user) => String(user.id) === financeState.employeeId);
    financeState.employeeQuery = selectedUser ? employeeName(selectedUser) : "";
  }

  const totals = report.totals || {};
  const rows = report.rows || [];
  financeState.rows = rows;
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
            <button type="button" class="primary" data-finance-save-rules>Сохранить ставки</button>
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
                <span>Общий: ${Number(totals.planned_employees || 0)} · Доп.: ${Number(totals.additional_plan_employees || 0)} · Индивидуальный: ${Number(totals.individual_plan_employees || 0)}</span>
              </div>
            </div>
            <div class="finance-plan-head-actions">
              <button type="button" class="secondary" data-finance-additional-open>Дополнительные планы</button>
              <button type="button" class="primary" data-finance-save-rules>Сохранить план</button>
            </div>
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
        <div class="stat"><span>Выручка по услугам</span><strong>${money(totals.services_base)}</strong></div>
        <div class="stat"><span>Выручка по товарам</span><strong>${money(totals.goods_base)}</strong></div>
        <div class="stat finance-salary-stat"><span>Зарплата по правилам</span><strong>${money(totals.salary_total)}</strong></div>
      </div>

      <div class="panel">
        <div class="finance-table-head">
          <div><h2>Сотрудники</h2><p>${financeState.dateFrom} — ${financeState.dateTo}</p></div>
          <span>${rows.length} сотрудников</span>
        </div>
        ${financeTableMarkup(rows)}
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

  root.addEventListener("change", async (event) => {
    if (event.target.matches("[data-finance-additional-assignment]")) {
      const select = event.target;
      select.disabled = true;
      try {
        await api.updateFinanceAdditionalPlanAssignment(
          ctx.org.id,
          Number(select.dataset.employeeId),
          select.value || null,
        );
        await ctx.reload();
      } finally {
        select.disabled = false;
      }
      return;
    }

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
    const tableSort = event.target.closest("[data-finance-table-sort]");
    if (tableSort) {
      financeState.tableSort = tableSort.dataset.financeTableSort || "name";
      financeState.tableDirection = tableSort.dataset.financeTableDirection || "asc";
      const tableWrap = root.querySelector("[data-finance-table-wrap]");
      if (tableWrap) tableWrap.outerHTML = financeTableMarkup(financeState.rows);
      return;
    }

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

    const additionalModal = event.target.closest("[data-finance-additional-modal]");
    const closeAdditional = event.target.closest("[data-finance-additional-close]");
    if (closeAdditional || (additionalModal && event.target === additionalModal)) {
      additionalModal?.remove();
      return;
    }

    const openAdditional = event.target.closest("[data-finance-additional-open]");
    if (openAdditional) {
      root.querySelector("[data-finance-additional-modal]")?.remove();
      root.insertAdjacentHTML(
        "beforeend",
        additionalPlansModal(financeState.additionalPlans),
      );
      return;
    }

    const createAdditional = event.target.closest("[data-finance-additional-create]");
    if (createAdditional) {
      const modal = createAdditional.closest("[data-finance-additional-modal]");
      const list = modal?.querySelector("[data-finance-additional-list]");
      if (!list || list.children.length >= 50) return;
      list.insertAdjacentHTML("beforeend", additionalPlanCardMarkup());
      return;
    }

    const removeAdditional = event.target.closest("[data-finance-additional-remove]");
    if (removeAdditional) {
      removeAdditional.closest("[data-finance-additional-card]")?.remove();
      return;
    }

    const addAdditionalRule = event.target.closest("[data-finance-additional-rule-add]");
    if (addAdditionalRule) {
      const card = addAdditionalRule.closest("[data-finance-additional-card]");
      const rulesContainer = card?.querySelector("[data-finance-additional-rules]");
      if (!rulesContainer || rulesContainer.children.length >= 100) return;
      rulesContainer.insertAdjacentHTML("beforeend", individualRuleMarkup());
      return;
    }

    const saveAdditional = event.target.closest("[data-finance-additional-save]");
    if (saveAdditional) {
      const modal = saveAdditional.closest("[data-finance-additional-modal]");
      const planCards = [...modal.querySelectorAll("[data-finance-additional-card]")];
      const plans = [];

      for (const card of planCards) {
        const nameInput = card.querySelector("[data-finance-additional-name]");
        nameInput.setCustomValidity("");
        if (!nameInput.value.trim()) {
          nameInput.setCustomValidity("Введите название плана");
          nameInput.reportValidity();
          return;
        }

        const rules = [];
        const ruleElements = [...card.querySelectorAll("[data-finance-individual-rule]")];
        for (const ruleElement of ruleElements) {
          const thresholdInput = ruleElement.querySelector("[data-individual-threshold]");
          const percentInput = ruleElement.querySelector("[data-individual-percent]");
          if (!thresholdInput.checkValidity()) {
            thresholdInput.reportValidity();
            return;
          }
          if (!percentInput.checkValidity()) {
            percentInput.reportValidity();
            return;
          }
          rules.push({
            metric: ruleElement.querySelector("[data-individual-metric]").value,
            operator: ruleElement.querySelector("[data-individual-operator]").value,
            threshold: Number(thresholdInput.value),
            target: ruleElement.querySelector("[data-individual-target]").value,
            percent: Number(percentInput.value),
          });
        }

        plans.push({
          id: card.dataset.planId,
          name: nameInput.value.trim(),
          rules,
        });
      }

      saveAdditional.disabled = true;
      try {
        const catalog = await api.updateFinanceAdditionalPlans(
          ctx.org.id,
          { plans },
        );
        financeState.additionalPlans = catalog.plans || [];
        modal.remove();
        await ctx.reload();
      } finally {
        saveAdditional.disabled = false;
      }
      return;
    }

    const individualModal = event.target.closest("[data-finance-individual-modal]");
    const closeIndividual = event.target.closest("[data-finance-individual-close]");
    if (closeIndividual) {
      individualModal?.remove();
      return;
    }

    const openIndividual = event.target.closest("[data-finance-individual-open]");
    if (openIndividual) {
      openIndividual.disabled = true;
      try {
        const employeeId = Number(openIndividual.dataset.employeeId);
        const plan = await api.financeIndividualPlan(ctx.org.id, employeeId);
        root.querySelector("[data-finance-individual-modal]")?.remove();
        root.insertAdjacentHTML(
          "beforeend",
          individualPlanModal(
            plan,
            employeeId,
            openIndividual.dataset.employeeName || `Сотрудник #${employeeId}`,
          ),
        );
      } finally {
        openIndividual.disabled = false;
      }
      return;
    }

    const addIndividualRule = event.target.closest("[data-finance-individual-add]");
    if (addIndividualRule) {
      const modal = addIndividualRule.closest("[data-finance-individual-modal]");
      const rulesContainer = modal?.querySelector("[data-finance-individual-rules]");
      if (!rulesContainer || rulesContainer.children.length >= 100) return;
      rulesContainer.insertAdjacentHTML("beforeend", individualRuleMarkup());
      return;
    }

    const removeIndividualRule = event.target.closest("[data-finance-individual-remove]");
    if (removeIndividualRule) {
      removeIndividualRule.closest("[data-finance-individual-rule]")?.remove();
      return;
    }

    const deleteIndividualPlan = event.target.closest("[data-finance-individual-delete]");
    if (deleteIndividualPlan) {
      const modal = deleteIndividualPlan.closest("[data-finance-individual-modal]");
      deleteIndividualPlan.disabled = true;
      try {
        await api.updateFinanceIndividualPlan(
          ctx.org.id,
          Number(modal.dataset.employeeId),
          { rules: [] },
        );
        modal.remove();
        await ctx.reload();
      } finally {
        deleteIndividualPlan.disabled = false;
      }
      return;
    }

    const saveIndividualPlan = event.target.closest("[data-finance-individual-save]");
    if (saveIndividualPlan) {
      const modal = saveIndividualPlan.closest("[data-finance-individual-modal]");
      const ruleElements = [...modal.querySelectorAll("[data-finance-individual-rule]")];
      const rules = [];
      for (const ruleElement of ruleElements) {
        const thresholdInput = ruleElement.querySelector("[data-individual-threshold]");
        const percentInput = ruleElement.querySelector("[data-individual-percent]");
        if (!thresholdInput.checkValidity()) {
          thresholdInput.reportValidity();
          return;
        }
        if (!percentInput.checkValidity()) {
          percentInput.reportValidity();
          return;
        }
        rules.push({
          metric: ruleElement.querySelector("[data-individual-metric]").value,
          operator: ruleElement.querySelector("[data-individual-operator]").value,
          threshold: Number(thresholdInput.value),
          target: ruleElement.querySelector("[data-individual-target]").value,
          percent: Number(percentInput.value),
        });
      }

      saveIndividualPlan.disabled = true;
      try {
        await api.updateFinanceIndividualPlan(
          ctx.org.id,
          Number(modal.dataset.employeeId),
          { rules },
        );
        modal.remove();
        await ctx.reload();
      } finally {
        saveIndividualPlan.disabled = false;
      }
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
