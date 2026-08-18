import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

const inventoryState = {
  organizationId: null,
  started: false,
  createdAt: null,
  subdivisions: [],
  storages: [],
  products: [],
  categories: [],
  selectedSubdivisionIds: new Set(),
  selectedStorageIds: new Set(),
  selectedCategoryIds: new Set(),
  rows: [],
  sourceRows: [],
  factualValues: new Map(),
  comment: "",
  loading: false,
};

const numberFormat = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 3 });
const moneyFormat = new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 2 });

function resetInventoryState(orgId) {
  inventoryState.organizationId = orgId;
  inventoryState.started = false;
  inventoryState.createdAt = null;
  inventoryState.subdivisions = [];
  inventoryState.storages = [];
  inventoryState.products = [];
  inventoryState.categories = [];
  inventoryState.selectedSubdivisionIds = new Set();
  inventoryState.selectedStorageIds = new Set();
  inventoryState.selectedCategoryIds = new Set();
  inventoryState.rows = [];
  inventoryState.sourceRows = [];
  inventoryState.factualValues = new Map();
  inventoryState.comment = "";
  inventoryState.loading = false;
}

function formatQuantity(value) { return numberFormat.format(Number(value) || 0); }
function formatMoney(value) { return moneyFormat.format(Number(value) || 0); }
function productUnitCost(product) { return Number(product.cost ?? product.actual_cost ?? 0) || 0; }

function selectedSummary(items, selectedIds, allLabel) {
  if (!items.length) return "Нет вариантов";
  if (selectedIds.size === items.length) return allLabel;
  if (!selectedIds.size) return "Ничего не выбрано";
  if (selectedIds.size === 1) return items.find((item) => selectedIds.has(String(item.id)))?.name || "Выбрано: 1";
  return `Выбрано: ${selectedIds.size}`;
}

function inventoryFilter(type, items, selectedIds, allLabel) {
  const allSelected = items.length > 0 && selectedIds.size === items.length;
  return `<label class="inventory-filter"><span>${type === "subdivision" ? "Подраздел" : type === "storage" ? "Склад" : "Категория"}</span><details class="branch-multiselect-dropdown" data-inventory-filter="${type}"><summary><span data-inventory-filter-summary>${escapeHtml(selectedSummary(items, selectedIds, allLabel))}</span></summary><div class="branch-multiselect-options"><label class="checkbox"><input type="checkbox" data-inventory-filter-all="${type}"${allSelected ? " checked" : ""}>${escapeHtml(allLabel)}</label>${items.map((item) => `<label class="checkbox"><input type="checkbox" value="${Number(item.id)}" data-inventory-filter-option="${type}"${selectedIds.has(String(item.id)) ? " checked" : ""}>${escapeHtml(item.name)}</label>`).join("")}</div></details></label>`;
}

function inventoryFilters() {
  const availableStorages = inventoryState.storages.filter((storage) => inventoryState.selectedSubdivisionIds.has(String(storage.subdivision_id)));
  return `<div class="inventory-filters">${inventoryFilter("subdivision", inventoryState.subdivisions, inventoryState.selectedSubdivisionIds, "Все подразделы")}${inventoryFilter("storage", availableStorages, inventoryState.selectedStorageIds, "Все склады")}${inventoryFilter("category", inventoryState.categories, inventoryState.selectedCategoryIds, "Все категории")}</div>`;
}

function differenceMarkup(productId, calculated) {
  const factual = inventoryState.factualValues.get(String(productId));
  if (factual === undefined || factual === "") return `<span class="inventory-difference is-zero" data-inventory-difference="${Number(productId)}">—</span>`;
  const difference = Number(factual) - Number(calculated);
  const className = difference < 0 ? "is-negative" : difference > 0 ? "is-positive" : "is-zero";
  return `<span class="inventory-difference ${className}" data-inventory-difference="${Number(productId)}">${difference > 0 ? "+" : ""}${formatQuantity(difference)}</span>`;
}

function inventoryTableMarkup() {
  if (inventoryState.loading) return `<p class="empty">Обновляем данные...</p>`;
  if (!inventoryState.rows.length) return `<p class="empty">Товаров по выбранным фильтрам нет.</p>`;
  return `<div class="table-wrap"><table class="app-table"><thead><tr><th>Товар</th><th>Значение на складе</th><th>Себестоимость значения на складе</th><th>Фактическое значение</th><th>Разница</th></tr></thead><tbody>${inventoryState.rows.map((row) => `<tr data-inventory-row data-product-id="${Number(row.product_item_id)}"><td>${escapeHtml(row.title)}</td><td>${formatQuantity(row.calculated_quantity)}</td><td>${formatMoney(row.calculated_cost)}</td><td><input class="inventory-actual-input" type="number" min="0" step="0.01" data-inventory-factual data-product-id="${Number(row.product_item_id)}" value="${inventoryState.factualValues.get(String(row.product_item_id)) ?? ""}"></td><td>${differenceMarkup(row.product_item_id, row.calculated_quantity)}</td></tr>`).join("")}</tbody></table></div>`;
}

function inventoryContentMarkup() {
  if (!inventoryState.started) return `<p class="empty">Инвентаризация ещё не создана.</p>`;
  return `<div class="inventory-created-at">Создана: ${escapeHtml(inventoryState.createdAt.toLocaleString("ru-RU"))}</div>${inventoryFilters()}<div class="inventory-actions"><button type="button" class="btn btn-outline-secondary" data-inventory-zero>Обнулить фактические остатки</button><button type="button" class="btn btn-outline-secondary" data-inventory-calculate>Рассчитать фактические остатки</button></div><label class="inventory-comment"><span>Комментарий</span><textarea rows="3" maxlength="1000" data-inventory-comment placeholder="Комментарий к инвентаризации">${escapeHtml(inventoryState.comment)}</textarea></label><div data-inventory-table>${inventoryTableMarkup()}</div>`;
}

function renderInventory(root) {
  const target = root.querySelector("[data-inventory-content]");
  if (target) target.innerHTML = inventoryContentMarkup();
}

function applyCategoryFilter() {
  inventoryState.rows = inventoryState.sourceRows.filter((row) => inventoryState.selectedCategoryIds.has(String(row.category_id)));
}

async function rebuildInventoryRows(root) {
  inventoryState.loading = true;
  renderInventory(root);
  const selectedStorageIds = [...inventoryState.selectedStorageIds];
  const storageResults = await Promise.all(selectedStorageIds.map((storageId) => api.storageProducts(Number(storageId))));
  const quantities = new Map();
  storageResults.flat().forEach((item) => {
    const id = String(item.product_item_id);
    quantities.set(id, (quantities.get(id) || 0) + (Number(item.amount) || 0));
  });
  const productsById = new Map(inventoryState.products.map((product) => [String(product.id), product]));
  inventoryState.sourceRows = [...quantities.entries()].map(([productId, calculatedQuantity]) => {
    const product = productsById.get(productId) || {};
    const unitCost = productUnitCost(product);
    return { product_item_id: Number(productId), category_id: Number(product.category_id), title: product.title || "Товар", calculated_quantity: calculatedQuantity, unit_cost: unitCost, calculated_cost: calculatedQuantity * unitCost };
  });
  applyCategoryFilter();
  inventoryState.loading = false;
  renderInventory(root);
}

async function createInventory(root, ctx) {
  if (inventoryState.started && !confirm("Создать новую инвентаризацию?\nВведённые фактические значения будут очищены.")) return;
  inventoryState.loading = true;
  inventoryState.started = true;
  inventoryState.createdAt = new Date();
  inventoryState.factualValues = new Map();
  inventoryState.comment = "";
  try {
    const [subdivisions, storages, categories, products] = await Promise.all([api.storageSubdivisions(ctx.org.id), api.storages(ctx.org.id), api.productCategories(ctx.org.id), api.productItems(ctx.org.id)]);
    inventoryState.subdivisions = subdivisions || [];
    inventoryState.storages = storages || [];
    inventoryState.categories = (categories || []).filter((category) => category.type === "product");
    inventoryState.products = products || [];
    inventoryState.selectedSubdivisionIds = new Set(inventoryState.subdivisions.map((item) => String(item.id)));
    inventoryState.selectedStorageIds = new Set(inventoryState.storages.map((item) => String(item.id)));
    inventoryState.selectedCategoryIds = new Set(inventoryState.categories.map((item) => String(item.id)));
    await rebuildInventoryRows(root);
  } catch (error) {
    inventoryState.loading = false;
    renderInventory(root);
    const target = root.querySelector("[data-inventory-table]");
    if (target) target.innerHTML = `<p class="empty">${escapeHtml(error.message)}</p>`;
  }
}

export async function inventory(ctx) {
  if (String(inventoryState.organizationId || "") !== String(ctx.org.id)) resetInventoryState(ctx.org.id);
  return `<section class="panel inventory-panel"><div class="inventory-head"><div class="inventory-title"><h2>Инвентаризация</h2><div data-inventory-content>${inventoryContentMarkup()}</div></div><button type="button" class="primary" data-inventory-create>Создать</button></div></section>`;
}

export function bindInventory(root, ctx) {
  root.addEventListener("click", async (event) => {
    if (event.target.closest("[data-inventory-create]")) {
      await createInventory(root, ctx);
      return;
    }
    if (event.target.closest("[data-inventory-zero]")) {
      inventoryState.rows.forEach((row) => inventoryState.factualValues.set(String(row.product_item_id), 0));
      renderInventory(root);
      return;
    }
    if (event.target.closest("[data-inventory-calculate]")) {
      inventoryState.rows.forEach((row) => inventoryState.factualValues.set(String(row.product_item_id), row.calculated_quantity));
      renderInventory(root);
    }
  });

  root.addEventListener("input", (event) => {
    const factual = event.target.closest("[data-inventory-factual]");
    if (factual) {
      const productId = String(factual.dataset.productId);
      inventoryState.factualValues.set(productId, factual.value);
      const row = inventoryState.rows.find((item) => String(item.product_item_id) === productId);
      const difference = root.querySelector(`[data-inventory-difference="${Number(productId)}"]`);
      if (difference && row) difference.outerHTML = differenceMarkup(productId, row.calculated_quantity);
      return;
    }
    const comment = event.target.closest("[data-inventory-comment]");
    if (comment) inventoryState.comment = comment.value;
  });

  root.addEventListener("change", async (event) => {
    const option = event.target.closest("[data-inventory-filter-option]");
    const allOption = event.target.closest("[data-inventory-filter-all]");
    if (!option && !allOption) return;
    const type = (option || allOption).dataset.inventoryFilterOption || (allOption ? allOption.dataset.inventoryFilterAll : "");
    const items = type === "subdivision" ? inventoryState.subdivisions : type === "storage" ? inventoryState.storages.filter((storage) => inventoryState.selectedSubdivisionIds.has(String(storage.subdivision_id))) : inventoryState.categories;
    const selectedIds = type === "subdivision" ? inventoryState.selectedSubdivisionIds : type === "storage" ? inventoryState.selectedStorageIds : inventoryState.selectedCategoryIds;
    if (allOption) {
      if (allOption.checked) items.forEach((item) => selectedIds.add(String(item.id)));
      else selectedIds.clear();
    } else if (option.checked) selectedIds.add(String(option.value));
    else selectedIds.delete(String(option.value));
    if (type === "subdivision") {
      const availableStorageIds = new Set(inventoryState.storages.filter((storage) => selectedIds.has(String(storage.subdivision_id))).map((storage) => String(storage.id)));
      inventoryState.selectedStorageIds = new Set([...inventoryState.selectedStorageIds].filter((id) => availableStorageIds.has(id)));
      await rebuildInventoryRows(root);
    } else if (type === "storage") {
      await rebuildInventoryRows(root);
    } else {
      applyCategoryFilter();
      renderInventory(root);
    }
  });
}
