import { api } from "../api.js";
import { escapeHtml } from "../dom.js";
import { openExternalClientCard } from "./clients.js";

const SEGMENT_VARIABLES = [
  { key: "visits_count", label: "Количество визитов", columnLabel: "Количество визитов", type: "number" },
  { key: "spent_amount", label: "Количество потраченных денег", columnLabel: "Потрачено", type: "number" },
  { key: "has_phone", label: "Наличие телефона", columnLabel: "Телефон", type: "boolean" },
  { key: "app_installed", label: "Установлено приложение", columnLabel: "Приложение", type: "boolean" },
  { key: "telegram_id", label: "Telegram ID", columnLabel: "Telegram ID", type: "text" },
  { key: "max_id", label: "MAX ID", columnLabel: "MAX ID", type: "text" },
  { key: "notifications_enabled", label: "Включены уведомления", columnLabel: "Уведомления", type: "boolean" },
  { key: "birth_date", label: "Дата рождения", columnLabel: "Дата рождения", type: "date" },
];

const segmentState = {
  organizationId: null,
  clients: [],
  selectedVariables: [],
  appliedVariables: [],
  search: "",
  sort: "name",
  direction: "asc",
  page: 1,
  pageSize: 10,
  clientCardResources: null,
  clientCardResourcesOrganizationId: null,
  clientCardResourcesRequest: null,
};

function formatClientName(client) {
  if (!client) return "";
  const fullName = [client.last_name, client.first_name, client.middle_name]
    .filter(Boolean)
    .join(" ");
  if (fullName) return fullName;
  return client.full_name || `Клиент #${client.id}`;
}

function formatMoney(value) {
  if (value === null || value === undefined) return "—";
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(value) {
  if (value === null || value === undefined) return "—";
  return new Date(value).toLocaleDateString("ru-RU");
}

function searchMatches(client, search) {
  const lowerSearch = (search || "").toLowerCase();
  const fields = [
    client.full_name,
    client.last_name,
    client.first_name,
    client.middle_name,
    client.primary_phone,
    client.secondary_phone,
    client.phone,
    client.email,
    String(client.telegram_id || client.tg_id || ""),
    String(client.max_id || ""),
  ];
  return fields.some(
    (field) => typeof field === "string" && field.toLowerCase().includes(lowerSearch)
  );
}

function compareValues(left, right, direction, type) {
  const leftNull = left === null || left === undefined;
  const rightNull = right === null || right === undefined;
  if (leftNull && rightNull) return 0;
  if (leftNull) return 1;
  if (rightNull) return -1;
  let comparison;
  if (type === "number") {
    comparison = (Number(left) || 0) - (Number(right) || 0);
  } else if (type === "boolean") {
    comparison = (left ? 1 : 0) - (right ? 1 : 0);
  } else if (type === "date") {
    comparison = new Date(left).getTime() - new Date(right).getTime();
  } else {
    comparison = String(left).localeCompare(String(right), "ru-RU");
  }
  return comparison * direction;
}

function filterAndSortClients() {
  const { clients, search, sort, direction } = segmentState;
  const searchTerm = (search || "").trim().toLowerCase();
  let filtered = clients.filter((client) => {
    if (!searchTerm) return true;
    return searchMatches(client, searchTerm);
  });
  const directionMultiplier = direction === "asc" ? 1 : -1;
  filtered.sort((a, b) => {
    if (sort === "name") {
      const nameA = formatClientName(a).toLowerCase();
      const nameB = formatClientName(b).toLowerCase();
      if (nameA !== nameB) return nameA.localeCompare(nameB, "ru-RU") * directionMultiplier;
      return 0;
    }
    const variable = SEGMENT_VARIABLES.find((v) => v.key === sort);
    if (!variable) {
      const nameA = formatClientName(a).toLowerCase();
      const nameB = formatClientName(b).toLowerCase();
      return nameA.localeCompare(nameB, "ru-RU") * directionMultiplier;
    }
    const valueA = getClientValue(a, sort);
    const valueB = getClientValue(b, sort);
    let comparison = compareValues(valueA, valueB, directionMultiplier, variable.type);
    if (comparison !== 0) return comparison;
    const nameA = formatClientName(a).toLowerCase();
    const nameB = formatClientName(b).toLowerCase();
    return nameA.localeCompare(nameB, "ru-RU") * directionMultiplier;
  });
  return filtered;
}

function getCurrentPageClients() {
  const filtered = filterAndSortClients();
  const { page, pageSize } = segmentState;
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return {
    pageItems: filtered.slice(startIndex, endIndex),
    totalItems: filtered.length,
    totalPages: Math.ceil(filtered.length / pageSize),
  };
}

function getVariableConfig(key) {
  return SEGMENT_VARIABLES.find((v) => v.key === key);
}

function firstDefined(...values) {
  for (const value of values) {
    if (value !== null && value !== undefined) {
      return value;
    }
  }
  return null;
}

function getClientValue(client, key) {
  switch (key) {
    case "visits_count":
      return firstDefined(
        client.visits_count,
        client.visit_count,
        client.total_visits,
        client.metrics?.visits_count,
        client.metric?.visits_count
      );

    case "spent_amount":
      return firstDefined(
        client.spent_amount,
        client.total_spent,
        client.purchase_amount,
        client.metrics?.paid_amount,
        client.metrics?.sold_amount,
        client.metric?.paid_amount,
        client.metric?.sold_amount
      );

    case "has_phone": {
      const backendValue = firstDefined(client.has_phone);

      if (backendValue !== null) {
        return Boolean(backendValue);
      }

      return [
        client.primary_phone,
        client.secondary_phone,
        client.phone,
      ].some((value) => String(value || "").trim());
    }

    case "app_installed":
      return firstDefined(
        client.app_installed,
        client.application_installed,
        client.push_subscription_exists,
        client.push_notifications_enabled
      );

    case "telegram_id":
      return firstDefined(
        client.telegram_id,
        client.tg_id
      );

    case "max_id":
      return firstDefined(client.max_id);

    case "notifications_enabled":
      return firstDefined(
        client.notifications_enabled,
        client.push_notifications_enabled
      );

    case "birth_date":
      return firstDefined(client.birth_date);

    default:
      return null;
  }
}

function variableCellContent(client, key) {
  const variable = getVariableConfig(key);
  const value = getClientValue(client, key);
  if (!variable) return escapeHtml(String(value ?? "—"));
  switch (variable.type) {
    case "boolean": {
      if (value === null || value === undefined) return "—";
      return `<span class="segmentation-boolean ${value ? "is-true" : "is-false"}">${value ? "Да" : "Нет"}</span>`;
    }
    case "number": {
      if (key === "spent_amount") {
        return formatMoney(value);
      }
      if (value === null || value === undefined) return "—";
      return escapeHtml(String(value));
    }
    case "date": {
      return escapeHtml(formatDate(value));
    }
    default: {
      if (value === null || value === undefined) return "—";
      return escapeHtml(String(value));
    }
  }
}

async function loadSegmentClientCardResources(organizationId) {
  if (
    segmentState.clientCardResources
    && String(segmentState.clientCardResourcesOrganizationId)
      === String(organizationId)
  ) {
    return segmentState.clientCardResources;
  }

  if (
    segmentState.clientCardResourcesRequest
    && String(segmentState.clientCardResourcesOrganizationId)
      === String(organizationId)
  ) {
    return segmentState.clientCardResourcesRequest;
  }

  segmentState.clientCardResourcesOrganizationId = organizationId;

  const request = Promise.all([
    api.branches(organizationId).catch(() => []),
    api.departments(organizationId).catch(() => []),
    api.workplaces(organizationId).catch(() => []),
    api.users(organizationId, 500).catch(() => []),
    api.memberships(organizationId).catch(() => []),
    api.branchMemberships(organizationId).catch(() => []),
    api.roles(organizationId).catch(() => []),
    api.clientSegments(organizationId).catch(() => []),
    api.productCategories(organizationId).catch(() => []),
    api.productItems(organizationId).catch(() => []),
  ]).then(([
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
  ]) => ({
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
  }));

  segmentState.clientCardResourcesRequest = request;

  try {
    const resources = await request;

    if (
      String(segmentState.clientCardResourcesOrganizationId)
        === String(organizationId)
    ) {
      segmentState.clientCardResources = resources;
    }

    return resources;
  } finally {
    if (segmentState.clientCardResourcesRequest === request) {
      segmentState.clientCardResourcesRequest = null;
    }
  }
}

function renderTableMarkup() {
  const { appliedVariables } = segmentState;
  const sortButton = (key, label) => {
    const isActive = segmentState.sort === key;
    const marker = isActive ? (segmentState.direction === "asc" ? "↑" : "↓") : "";
    const ariaSort = isActive ? (segmentState.direction === "asc" ? "ascending" : "descending") : "none";
    return `
      <th>
        <button
          type="button"
          class="table-sort"
          data-segment-sort="${escapeHtml(key)}"
          data-segment-direction="${segmentState.direction === "desc" ? "desc" : "asc"}"
          aria-sort="${ariaSort}"
        >
          <span class="table-sort-label">
            ${escapeHtml(label)}
            <span class="table-sort-marker" data-segment-sort-marker aria-hidden="true">${marker}</span>
          </span>
        </button>
      </th>
    `;
  };
  const headers = sortButton("name", "Клиент") + appliedVariables
    .map((key) => {
      const variable = SEGMENT_VARIABLES.find((v) => v.key === key);
      if (variable) return sortButton(key, variable.columnLabel);
      return "";
    })
    .join("");
  const { pageItems, totalItems } = getCurrentPageClients();
  let rows = "";
  if (totalItems === 0) {
    rows = `<tr><td colspan="${appliedVariables.length + 1}">Клиенты не найдены</td></tr>`;
  } else {
    rows = pageItems.map((client) => {
      const clientName = formatClientName(client);
      let cells = `
        <td>
          <button
            type="button"
            class="ghost btn-ghost-secondary"
            data-segment-open-client="${escapeHtml(client.id)}"
          >
            ${escapeHtml(clientName)}
          </button>
        </td>
      `;
      for (const key of appliedVariables) {
        cells += `<td>${variableCellContent(client, key)}</td>`;
      }
      return `<tr data-segment-table-row>${cells}</tr>`;
    }).join("");
  }
  return `
    <table
      class="centered-list-table app-table segmentation-table"
      style="--segment-variable-count: ${appliedVariables.length}"
    >
      <thead><tr>${headers}</tr></thead>
      <tbody data-segmentation-table-body>${rows}</tbody>
    </table>
  `;
}

function renderTable() {
  const { appliedVariables } = segmentState;
  if (!appliedVariables.length) return `<div data-segmentation-table></div>`;
  return `<div data-segmentation-table>${renderTableMarkup()}</div>`;
}

function renderPagination() {
  const { totalItems, totalPages } = getCurrentPageClients();
  const { page } = segmentState;
  return `
    <div class="segmentation-pagination">
      <span class="segmentation-page-info">Страница ${page} из ${totalPages || 1}</span>
      <div class="segmentation-page-controls">
        <button type="button" class="btn" data-segment-page="${page - 1}" ${page <= 1 ? "disabled" : ""}>Назад</button>
        <button type="button" class="btn" data-segment-page="${page + 1}" ${page >= totalPages || totalPages === 0 ? "disabled" : ""}>Вперёд</button>
      </div>
    </div>
  `;
}

function renderPageSizeSelector() {
  const { pageSize } = segmentState;
  return `
    <select class="segmentation-page-size" data-segment-page-size>
      <option value="10" ${pageSize === 10 ? "selected" : ""}>10</option>
      <option value="20" ${pageSize === 20 ? "selected" : ""}>20</option>
      <option value="50" ${pageSize === 50 ? "selected" : ""}>50</option>
    </select>
  `;
}

function renderVariablesFilter() {
  const { selectedVariables } = segmentState;
  const selectedCount = selectedVariables.length;
  const allSelected = selectedCount === SEGMENT_VARIABLES.length;
  let summaryText;
  if (allSelected) {
    summaryText = "Все переменные";
  } else if (selectedCount > 0) {
    summaryText = `Выбрано: ${selectedCount}`;
  } else {
    summaryText = "Переменные не выбраны";
  }
  const options = SEGMENT_VARIABLES.map((variable) => `
    <label class="segmentation-variable-option">
      <input
        type="checkbox"
        class="segmentation-variable-checkbox"
        data-segment-variable="${escapeHtml(variable.key)}"
        ${selectedVariables.includes(variable.key) ? "checked" : ""}
      >
      ${escapeHtml(variable.label)}
    </label>
  `).join("");
  return `
    <div class="segmentation-variable-control">
      <details class="segmentation-variable-select">
        <summary>${escapeHtml(summaryText)}</summary>
        <div class="segmentation-variable-options">
          ${options}
        </div>
      </details>
    </div>
  `;
}

function renderSearchForm() {
  const { search } = segmentState;
  return `
    <form class="client-search segmentation-search" data-segment-search>
      <label>
        <span>Поиск</span>
        <input
          name="q"
          placeholder="Фамилия, телефон, email, Telegram ID или MAX ID"
          value="${escapeHtml(search)}"
        >
      </label>
      <button class="primary client-search-submit" type="submit">Найти</button>
      ${search ? `<button class="ghost" type="button" data-segment-search-clear>Сбросить</button>` : ""}
    </form>
  `;
}

function renderToolbar() {
  const { selectedVariables } = segmentState;
  return `
    <div class="segmentation-filter-controls">
      ${renderVariablesFilter()}
      <button
        type="button"
        class="primary"
        data-segment-apply
        ${selectedVariables.length === 0 ? "disabled" : ""}
      >
        Сформировать
      </button>
    </div>
  `;
}

function renderSegmentPage(clients, error) {
  let content = `
    <section class="finance-page segmentation-page" data-segmentation>
      <div class="panel finance-filter-panel segmentation-filter-panel">
        <div>
          <h2>Сегментация</h2>
          <p>Выберите переменные для формирования таблицы клиентов.</p>
        </div>
        ${renderToolbar()}
      </div>
  `;
  if (error) {
    content += `<p class="segmentation-error" data-message>${escapeHtml(error)}</p>`;
  }
  if (segmentState.appliedVariables.length > 0) {
    content += `
      ${renderSearchForm()}
      ${renderTable()}
      <div class="segmentation-pagination-controls">
        ${renderPageSizeSelector()}
        ${renderPagination()}
      </div>
    `;
  }
  content += `</section>`;
  return content;
}

export async function segment(ctx) {
  const organizationChanged =
    String(segmentState.organizationId || "")
    !== String(ctx.org.id);

  if (organizationChanged) {
    segmentState.clientCardResources = null;
    segmentState.clientCardResourcesRequest = null;
    segmentState.clientCardResourcesOrganizationId = null;
  }

  segmentState.organizationId = ctx.org.id;
  segmentState.selectedVariables = [];
  segmentState.appliedVariables = [];
  segmentState.search = "";
  segmentState.sort = "name";
  segmentState.direction = "asc";
  segmentState.page = 1;
  segmentState.pageSize = 10;
  try {
    const clients = await api.segmentClients(ctx.org.id, { offset: 0, limit: 10000 });
    segmentState.clients = Array.isArray(clients) ? clients : [];
    return renderSegmentPage([], null);
  } catch (err) {
    return renderSegmentPage([], err.message);
  }
}

export function bindSegment(root, ctx) {
  if (!root || root.dataset.segmentationBound) return;
  root.dataset.segmentationBound = "1";

  root.addEventListener("click", async (event) => {
    const container = event.target.closest("[data-segmentation]");
    if (!container) return;

    const clientButton =
      event.target.closest("[data-segment-open-client]");

    if (clientButton) {
      event.preventDefault();

      const clientId =
        clientButton.dataset.segmentOpenClient;

      if (!clientId) return;

      clientButton.disabled = true;

      try {
        const resources =
          await loadSegmentClientCardResources(ctx.org.id);

        await openExternalClientCard(
          ctx,
          clientId,
          resources
        );
      } catch (error) {
        alert(
          error.message
          || "Не удалось открыть карточку клиента"
        );
      } finally {
        if (clientButton.isConnected) {
          clientButton.disabled = false;
        }
      }

      return;
    }

    const sortButton = event.target.closest("[data-segment-sort]");
    if (sortButton) {
      const key = sortButton.dataset.segmentSort;
      const newDirection =
        segmentState.sort === key && segmentState.direction === "asc"
          ? "desc"
          : "asc";
      segmentState.sort = key;
      segmentState.direction = newDirection;
      segmentState.page = 1;
      updateSortMarkers(container);
      renderTableContent(container);
      return;
    }

    const applyButton = event.target.closest("[data-segment-apply]");
    if (applyButton) {
      if (!applyButton.disabled) {
        segmentState.appliedVariables = [...segmentState.selectedVariables];
        segmentState.page = 1;
        container.outerHTML = renderSegmentPage([], null);
      }
      return;
    }

    const pageLink = event.target.closest("[data-segment-page]");
    if (pageLink) {
      const pageNum = Number(pageLink.dataset.segmentPage);
      if (!isNaN(pageNum) && pageNum >= 1) {
        segmentState.page = pageNum;
        renderTableContent(container);
        updatePagination(container);
      }
      return;
    }

    const pageSizeSelect = event.target.closest("[data-segment-page-size]");
    if (pageSizeSelect) {
      const size = Number(event.target.value);
      segmentState.pageSize = size;
      segmentState.page = 1;
      renderTableContent(container);
      updatePageSize(container, size);
      updatePagination(container);
      return;
    }
  });

  root.addEventListener("change", (event) => {
    const container = event.target.closest("[data-segmentation]");
    if (!container) return;

    const checkbox = event.target.closest("[data-segment-variable]");
    if (checkbox) {
      const key = checkbox.dataset.segmentVariable;
      if (checkbox.checked) {
        if (!segmentState.selectedVariables.includes(key)) {
          segmentState.selectedVariables.push(key);
        }
      } else {
        segmentState.selectedVariables = segmentState.selectedVariables.filter((k) => k !== key);
      }
      updateVariableSummary(container);
      updateApplyButton(container);
    }
  });

  root.addEventListener("submit", (event) => {
    const container = event.target.closest("[data-segmentation]");
    if (!container) return;

    const searchForm = event.target.closest("[data-segment-search]");
    if (searchForm) {
      event.preventDefault();
      const input = searchForm.querySelector('input[name="q"]');
      segmentState.search = input ? input.value : "";
      segmentState.page = 1;
      renderTableContent(container);
      updatePagination(container);
      updateSearchForm(container);
    }
  });

  root.addEventListener("click", async (event) => {
    const container = event.target.closest("[data-segmentation]");
    if (!container) return;

    const clearButton = event.target.closest("[data-segment-search-clear]");
    if (clearButton) {
      segmentState.search = "";
      segmentState.page = 1;
      renderTableContent(container);
      updatePagination(container);
      updateSearchForm(container);
    }
  });
}

function updateSortMarkers(container) {
  container.querySelectorAll("[data-segment-sort]").forEach((button) => {
    const isActive = button.dataset.segmentSort === segmentState.sort;
    const marker = button.querySelector("[data-segment-sort-marker]");
    if (marker) {
      marker.textContent = isActive
        ? segmentState.direction === "asc" ? "↑" : "↓"
        : "";
    }
    button.dataset.segmentDirection = segmentState.direction === "desc" ? "desc" : "asc";
    const th = button.closest("th");
    if (th) {
      th.setAttribute("aria-sort", isActive ? segmentState.direction === "asc" ? "ascending" : "descending" : "none");
    }
  });
}

function updateVariableSummary(container) {
  const { selectedVariables } = segmentState;
  const selectedCount = selectedVariables.length;
  const allSelected = selectedCount === SEGMENT_VARIABLES.length;
  let summaryText;
  if (allSelected) {
    summaryText = "Все переменные";
  } else if (selectedCount > 0) {
    summaryText = `Выбрано: ${selectedCount}`;
  } else {
    summaryText = "Переменные не выбраны";
  }
  const summary = container.querySelector(".segmentation-variable-select summary");
  if (summary) summary.textContent = summaryText;
}

function updateApplyButton(container) {
  const { selectedVariables } = segmentState;
  const button = container.querySelector("[data-segment-apply]");
  if (button) {
    button.disabled = selectedVariables.length === 0;
  }
}

function updateSearchForm(container) {
  const searchForm = container.querySelector("[data-segment-search]");
  if (!searchForm) return;
  const hasSearch = !!segmentState.search;
  const existingClear = searchForm.querySelector("[data-segment-search-clear]");
  if (hasSearch && !existingClear) {
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "ghost";
    clearButton.dataset.segmentSearchClear = "";
    clearButton.textContent = "Сбросить";
    searchForm.appendChild(clearButton);
  } else if (!hasSearch && existingClear) {
    existingClear.remove();
  }
  const input = searchForm.querySelector('input[name="q"]');
  if (input) input.value = segmentState.search;
}

function updatePageSize(container, size) {
  const select = container.querySelector("select[data-segment-page-size]");
  if (select) select.value = String(size);
}

function updatePagination(container) {
  const pagination = container.querySelector(".segmentation-pagination");
  if (pagination) pagination.outerHTML = renderPagination();
}

function renderTableContent(container) {
  const tableContainer =
    container.querySelector("[data-segmentation-table]");

  if (!tableContainer) return;

  if (!segmentState.appliedVariables.length) {
    tableContainer.innerHTML = "";
    return;
  }

  tableContainer.innerHTML = renderTableMarkup();
}

