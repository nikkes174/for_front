import { escapeHtml } from "../dom.js";


import { api } from "../api.js";


const EXPENSE_NAME_OPTIONS = [
  "Сумма в год",
  "Сумма в месяц",
  "Сумма в неделю",
  "Сумма в день",
];

const EXPENSE_TYPE_OPTIONS = [
  "Постоянные",
  "Фиксированные",
];

function expenseMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}


function expenseOptions(values) {
  return values
    .map(
      (value) => `
        <option value="${escapeHtml(value)}">
          ${escapeHtml(value)}
        </option>
      `
    )
    .join("");
}


function expensesTable(rows) {
  return `
    <div class="table-wrap finance-expenses-table-wrap">
      <table class="app-table finance-expenses-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Тип Расхода</th>
            <th>Сумма</th>
            <th class="finance-expenses-actions"></th>
          </tr>
        </thead>


        <tbody data-finance-expenses-body>
          ${
            rows.length
              ? rows
                  .map(
                    (row) => `
                      <tr
                        data-finance-expense-row
                        data-id="${escapeHtml(row.id)}"
                      >
                        <td>
                          ${escapeHtml(row.name)}
                        </td>


                        <td>
                          ${escapeHtml(row.type)}
                        </td>


                        <td>
                          ${escapeHtml(
                            expenseMoney(row.amount)
                          )}
                        </td>


                        <td class="finance-expenses-actions">
                          <button
                            type="button"
                            class="client-delete-icon-button"
                            data-finance-expense-delete="${escapeHtml(
                              row.id
                            )}"
                            aria-label="Удалить расход"
                            title="Удалить расход"
                          >
                            <img
                              src="/fronted/icons/basket.svg"
                              alt=""
                            >
                          </button>
                        </td>
                      </tr>
                    `
                  )
                  .join("")
              : `
                <tr data-finance-expenses-empty>
                  <td colspan="4">
                    Расходов пока нет.
                  </td>
                </tr>
              `
          }
        </tbody>
      </table>
    </div>
  `;
}


export async function expenses(ctx) {
  let rows = [];
  let loadError = "";

  try {
    rows = await api.organizationExpenses(ctx.org.id);
  } catch (error) {
    loadError = error.message;
  }

  return `
    <section class="finance-expenses-page">
      <div class="panel finance-expenses-panel">
        <div class="finance-expenses-head">
          <h2>Расходы</h2>
        </div>


        <form
          class="finance-expenses-form"
          data-finance-expense-form
        >
          <label>
            <span>Название</span>


            <select name="name" required>
              <option value="">
                Выберите название
              </option>


              ${expenseOptions(EXPENSE_NAME_OPTIONS)}
            </select>
          </label>


          <label>
            <span>Тип Расхода</span>


            <select name="type" required>
              <option value="">
                Выберите тип
              </option>


              ${expenseOptions(EXPENSE_TYPE_OPTIONS)}
            </select>
          </label>


          <label>
            <span>Сумма</span>


            <input
              type="number"
              name="amount"
              min="0.01"
              step="0.01"
              required
            >
          </label>


          <button
            type="submit"
            class="primary standard-save-button"
          >
            Сохранить
          </button>
        </form>


        <p
          class="finance-expenses-message"
          data-finance-expenses-message
        >${escapeHtml(loadError)}</p>


        ${expensesTable(rows)}
      </div>
    </section>
  `;
}


export function bindExpenses(root, ctx) {
  root.addEventListener("submit", async (event) => {
    const form = event.target;

    if (
      !form.matches("[data-finance-expense-form]")
    ) {
      return;
    }

    event.preventDefault();

    const data = new FormData(form);

    const name = String(
      data.get("name") || ""
    ).trim();

    const type = String(
      data.get("type") || ""
    ).trim();

    const amount = Number(data.get("amount"));

    if (
      !EXPENSE_NAME_OPTIONS.includes(name)
      || !EXPENSE_TYPE_OPTIONS.includes(type)
      || !Number.isFinite(amount)
      || amount <= 0
    ) {
      form.reportValidity();
      return;
    }

    try {
      await api.createOrganizationExpense({
        organization_id: Number(ctx.org.id),
        name,
        type,
        amount,
      });
      await ctx.reload();
    } catch (error) {
      const message = root.querySelector("[data-finance-expenses-message]");
      if (message) message.textContent = error.message;
    }
  });

  root.addEventListener("click", async (event) => {
    const remove = event.target.closest(
      "[data-finance-expense-delete]"
    );

    if (!remove) return;

    const id =
      remove.dataset.financeExpenseDelete;

    try {
      await api.deleteOrganizationExpense(Number(id));
      await ctx.reload();
    } catch (error) {
      const message = root.querySelector("[data-finance-expenses-message]");
      if (message) message.textContent = error.message;
    }
  });
}
