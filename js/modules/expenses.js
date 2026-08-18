import { escapeHtml } from "../dom.js";


import { api } from "../api.js";


function expenseMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}



function expensesTable(rows) {
  return `
    <div class="table-wrap finance-expenses-table-wrap">
      <table class="app-table finance-expenses-table">
        <thead>
          <tr>
            <th>азвание</th>
            <th>Сумма в год</th>
            <th>Сумма в месяц</th>
            <th>Сумма в неделю</th>
            <th>Сумма в день</th>
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
                          ${escapeHtml(
                            expenseMoney(row.amount_year)
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            expenseMoney(row.amount_month)
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            expenseMoney(row.amount_week)
                          )}
                        </td>

                        <td>
                          ${escapeHtml(
                            expenseMoney(row.amount_day)
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
                  <td colspan="6">
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
          <label class="finance-expense-name-field">
            <span>азвание</span>

            <input
              type="text"
              name="name"
              maxlength="255"
              placeholder="Название расхода"
              required
            >
          </label>





          <label class="finance-expense-amount-field">
            <span>Сумма в год</span>
            <input type="number" name="amount_year" min="0" step="0.01" value="0" required>
          </label>

          <label class="finance-expense-amount-field">
            <span>Сумма в месяц</span>
            <input type="number" name="amount_month" min="0" step="0.01" value="0" required>
          </label>

          <label class="finance-expense-amount-field">
            <span>Сумма в неделю</span>
            <input type="number" name="amount_week" min="0" step="0.01" value="0" required>
          </label>

          <label class="finance-expense-amount-field">
            <span>Сумма в день</span>
            <input type="number" name="amount_day" min="0" step="0.01" value="0" required>
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

    const amountYear = Number(
      data.get("amount_year")
    );

    const amountMonth = Number(
      data.get("amount_month")
    );

    const amountWeek = Number(
      data.get("amount_week")
    );

    const amountDay = Number(
      data.get("amount_day")
    );

    const amounts = [
      amountYear,
      amountMonth,
      amountWeek,
      amountDay,
    ];

    if (
      !name
      || amounts.some(
        (value) =>
          !Number.isFinite(value)
          || value < 0
      )
    ) {
      form.reportValidity();
      return;
    }

    try {
      await api.createOrganizationExpense({
        organization_id: Number(ctx.org.id),
        name,
        amount_year: amountYear,
        amount_month: amountMonth,
        amount_week: amountWeek,
        amount_day: amountDay,
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
