import { api } from "../api.js";
import { escapeHtml } from "../dom.js";
import { openProductItemEditor } from "./settings.js";

const esc = (v) => escapeHtml(String(v ?? ""));
const tabs = { subdivisions: "Подразделы", storages: "Склады" };
const storageSubdivisionFilterState = { organizationId: null, selectedIds: null };

function selectedStorageSubdivisionIds(subdivisions) {
  const availableIds = new Set(subdivisions.map((item) => String(item.id)));
  if (storageSubdivisionFilterState.selectedIds === null) return availableIds;
  return new Set([...storageSubdivisionFilterState.selectedIds].filter((id) => availableIds.has(String(id))).map(String));
}

function storageSubdivisionFilterSummary(subdivisions, selectedIds) {
  if (!subdivisions.length) return "Подразделов нет";
  if (selectedIds.size === subdivisions.length) return "Все подразделы";
  if (selectedIds.size === 0) return "Подразделы не выбраны";
  if (selectedIds.size === 1) return subdivisions.find((item) => selectedIds.has(String(item.id)))?.name || "Выбрано: 1";
  return `Выбрано: ${selectedIds.size}`;
}

function storageSubdivisionFilter(subdivisions) {
  const selectedIds = selectedStorageSubdivisionIds(subdivisions);
  return `<div class="warehouse-storage-filters"><label class="warehouse-storage-filter"><span>Подраздел</span><details class="branch-multiselect-dropdown" data-storage-subdivision-filter><summary><span data-storage-subdivision-filter-summary>${esc(storageSubdivisionFilterSummary(subdivisions, selectedIds))}</span></summary><div class="branch-multiselect-options">${subdivisions.length ? subdivisions.map((subdivision) => `<label class="checkbox"><input type="checkbox" value="${Number(subdivision.id)}" data-storage-subdivision-filter-option${selectedIds.has(String(subdivision.id)) ? " checked" : ""}>${esc(subdivision.name)}</label>`).join("") : `<p class="empty">Подразделов пока нет.</p>`}</div></details></label></div>`;
}

export async function warehouse(ctx, tabSlug = "subdivisions") {
  const active = tabs[tabSlug] ? tabSlug : "subdivisions";
  if (String(storageSubdivisionFilterState.organizationId || "") !== String(ctx.org.id)) {
    storageSubdivisionFilterState.organizationId = ctx.org.id;
    storageSubdivisionFilterState.selectedIds = null;
  }
  const can = (p) => ctx.can?.(p) ?? false;
  let subdivisions = [];
  let storages = [];
  let loadError = "";
  const [subdivisionsResult, storagesResult] = await Promise.allSettled([
    api.storageSubdivisions(ctx.org.id),
    api.storages(ctx.org.id),
  ]);
  if (subdivisionsResult.status === "fulfilled") subdivisions = subdivisionsResult.value;
  else loadError = subdivisionsResult.reason?.message || "Не удалось загрузить подразделы склада.";
  if (storagesResult.status === "fulfilled") storages = storagesResult.value;
  else loadError = [loadError, storagesResult.reason?.message || "Не удалось загрузить склады."].filter(Boolean).join(" ");
  return `<section class="panel" data-warehouse data-warehouse-tab="${active}"><h2>${esc(ctx.org.name)}</h2><nav class="tabs">${Object.entries(tabs).map(([slug, label]) => `<a class="btn btn-outline-secondary loyalty-tab-button${slug === active ? " is-active" : ""}" href="/organizations/${Number(ctx.org.id)}/catalog/warehouse/${slug}">${label}</a>`).join("")}</nav>${loadError ? `<p class="warehouse-load-error" data-message>${esc(loadError)}</p>` : ""}${active === "subdivisions" ? subdivisionView(ctx, subdivisions, storages, can) : storageView(ctx, subdivisions, storages, can)}</section>`;
}
function subdivisionView(ctx, rows, storages, can) {
  const storagesBySubdivision = new Map();

  storages.forEach((storage) => {
    const subdivisionId = String(storage.subdivision_id);

    if (!storagesBySubdivision.has(subdivisionId)) {
      storagesBySubdivision.set(subdivisionId, []);
    }

    storagesBySubdivision.get(subdivisionId).push(storage);
  });

  return `
    <div class="subpanel warehouse-subpanel">
      <h3>Подразделы</h3>


      ${
        can("settings.items.create")
          ? `
            <form
              class="inline-form compact warehouse-create-form"
              data-storage-subdivision-create
            >
              <label>
                <span>Название</span>
                <input name="name" required>
              </label>


              <button
                class="primary standard-save-button"
              >
                Сохранить
              </button>
            </form>
          `
          : ""
      }


      <p data-message></p>


      <div class="table-wrap warehouse-subdivision-table-wrap">
        <table class="app-table">
          <thead>
            <tr>
              <th>Название</th>
              <th class="warehouse-subdivision-actions"></th>
            </tr>
          </thead>


          <tbody>
            ${
              rows.length
                ? rows.map((subdivision) => {
                    const subdivisionStorages =
                      storagesBySubdivision.get(
                        String(subdivision.id)
                      ) || [];


                    return `
                      <tr>
                        <td>
                          <div
                            class="warehouse-subdivision-popover"
                            data-subdivision-popover
                          >
                            <button
                              type="button"
                              class="link-button warehouse-subdivision-trigger"
                            >
                              ${esc(subdivision.name)}
                            </button>


                            <div
                              class="warehouse-subdivision-menu"
                            >
                              <form
                                class="warehouse-subdivision-inline-edit"
                                data-storage-subdivision-edit-form
                                data-id="${Number(subdivision.id)}"
                              >
                                <label>
                                  <span>Название</span>


                                  <input
                                    name="name"
                                    value="${esc(subdivision.name)}"
                                    required
                                  >
                                </label>


                                <button
                                  class="primary standard-save-button"
                                >
                                  Сохранить
                                </button>
                              </form>


                              <div
                                class="warehouse-subdivision-menu-storages"
                              >
                                <strong>Склады</strong>


                                ${
                                  subdivisionStorages.length
                                    ? subdivisionStorages.map(
                                        (storage) => `
                                          <div
                                            class="warehouse-subdivision-storage-popover"
                                            data-subdivision-storage-popover
                                          >
                                            <button
                                              type="button"
                                              class="warehouse-subdivision-storage-trigger"
                                              data-subdivision-storage-hover="${Number(storage.id)}"
                                            >
                                              <span>
                                                ${esc(storage.name)}
                                              </span>


                                              <small>
                                                ${esc(
                                                  storage.product_quantity ?? 0
                                                )}
                                              </small>
                                            </button>


                                            <div
                                              class="warehouse-subdivision-storage-menu"
                                              data-subdivision-storage-products
                                              data-storage-id="${Number(storage.id)}"
                                            >
                                              <div
                                                class="warehouse-subdivision-products-loading"
                                              >
                                                Загрузка...
                                              </div>
                                            </div>
                                          </div>
                                        `
                                      ).join("")
                                    : `
                                      <p class="warehouse-subdivision-empty">
                                        К подразделу пока не привязаны склады.
                                      </p>
                                    `
                                }
                              </div>
                            </div>
                          </div>
                        </td>


                        <td class="warehouse-subdivision-actions">
                          ${
                            can("settings.items.delete")
                              ? `
                                <button
                                  type="button"
                                  class="client-delete-icon-button"
                                  data-storage-subdivision-delete="${Number(subdivision.id)}"
                                  aria-label="Удалить"
                                  title="Удалить"
                                >
                                  <img
                                    src="/fronted/icons/basket.svg"
                                    alt=""
                                  >
                                </button>
                              `
                              : ""
                          }
                        </td>
                      </tr>
                    `;
                  }).join("")
                : `
                  <tr>
                    <td colspan="2">
                      Подразделов пока нет.
                    </td>
                  </tr>
                `
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}
function storageTableHeader(key, label) {
  return `
    <button
      type="button"
      class="table-sort"
      data-storage-table-sort="${esc(key)}"
      data-storage-table-direction="asc"
      aria-label="Сортировать по: ${esc(label)}"
    >
      <span class="table-sort-label">
        ${esc(label)}
        <span
          class="table-sort-marker"
          data-storage-table-sort-marker
          aria-hidden="true"
        ></span>
      </span>
    </button>
  `;
}
function storageView(ctx, subs, rows, can) { const options = subs.map((s) => `<option value="${Number(s.id)}">${esc(s.name)}</option>`).join(""); const selectedIds = selectedStorageSubdivisionIds(subs); const subdivisionsById = new Map(subs.map((subdivision) => [String(subdivision.id), subdivision.name])); const storageRows = rows.map((storage) => ({ ...storage, subdivision_name: subdivisionsById.get(String(storage.subdivision_id)) || "Подраздел не указан", })); const visibleStorageCount = storageRows.filter((row) => selectedIds.has(String(row.subdivision_id))).length; return `<div class="subpanel warehouse-subpanel"><h3>Склады</h3>${can("settings.items.create") ? `<form class="inline-form compact warehouse-create-form" data-storage-create><label><span>Название склада</span><input name="name" required></label><label><span>Подраздел</span><select name="subdivision_id" required><option value="">Выберите подраздел</option>${options}</select></label><button class="primary standard-save-button"${subs.length ? "" : " disabled"}>Сохранить</button></form>${subs.length ? "" : "<p>Сначала создайте подраздел.</p>"}` : ""}<p data-message></p>${storageSubdivisionFilter(subs)}<div class="table-wrap"><table class="app-table"><thead><tr><th>${storageTableHeader("subdivision", "Название")}</th><th>${storageTableHeader("quantity", "Количество товара")}</th><th class="warehouse-storage-actions"></th></tr></thead><tbody data-storage-table-body>${storageRows.length ? storageRows.map((row) => storageRow(row, can, selectedIds)).join("") + `<tr data-storage-filter-empty${visibleStorageCount > 0 ? " hidden" : ""}><td colspan="3">Склады по выбранным подразделам не найдены.</td></tr>` : `<tr><td colspan="3">Складов пока нет.</td></tr>`}</tbody></table></div></div>`; }
function storageRow(r, can, selectedIds) { const actions = `${can("settings.items.update") ? `<button class="ghost btn-ghost-secondary" data-storage-edit="${Number(r.id)}">Редактировать</button><button class="ghost btn-ghost-secondary" data-storage-transfer="${Number(r.id)}">Переместить товары</button><button class="ghost btn-ghost-secondary" data-storage-writeoff="${Number(r.id)}">Списать</button>` : ""}${can("settings.items.delete") ? `<button class="client-delete-button" data-storage-delete="${Number(r.id)}">Удалить</button>` : ""}`; const isVisible = selectedIds.has(String(r.subdivision_id)); return `<tr data-storage-table-row data-storage-open-products="${Number(r.id)}" data-storage-subdivision-id="${Number(r.subdivision_id)}"${isVisible ? "" : " hidden"} data-storage-subdivision-name="${esc(String(r.subdivision_name || "").toLocaleLowerCase("ru-RU"))}" data-storage-name="${esc(String(r.name || "").toLocaleLowerCase("ru-RU"))}" data-storage-product-quantity="${Number(r.product_quantity) || 0}"><td><div class="warehouse-storage-name"><strong>${esc(r.name)}</strong><span class="warehouse-storage-subdivision">${esc(r.subdivision_name)}</span></div></td><td><button class="link-button" data-storage-product-count="${Number(r.id)}">${esc(r.product_quantity ?? 0)}</button></td><td class="warehouse-storage-actions"><div class="warehouse-actions-popover"><button type="button" class="warehouse-actions-settings" data-storage-actions-toggle aria-label="Действия склада" title="Действия склада"><img src="/fronted/icons/settings_org.svg" alt=""></button><div class="warehouse-actions-menu">${actions}</div></div></td></tr>`; }
const modal = (title, body, closeOnly = false) => `<div class="modal-backdrop" data-warehouse-modal${closeOnly ? " data-warehouse-close-only" : ""}><div class="modal-card"><div class="modal-head"><h3>${title}</h3><button type="button" class="modal-close-icon" data-warehouse-modal-close>×</button></div>${body}</div></div>`;
function putModal(root, html) { root.querySelector("[data-warehouse-modal]")?.remove(); root.insertAdjacentHTML("beforeend", html); }
async function openStorageProductsModal(root, storageId) {
  putModal(root, modal("Товары на складе", `<div data-storage-products>Загрузка...</div>`, true));
  try {
    const rows = await api.storageProducts(Number(storageId));
    root.querySelector("[data-storage-products]").innerHTML = rows.length ? `<div class="table-wrap"><table class="app-table"><tbody>${rows.map((r) => `<tr data-storage-product-edit="${Number(r.product_item_id)}"><td><button type="button" class="link-button" data-storage-product-edit="${Number(r.product_item_id)}">${esc(r.title)}</button></td><td>${esc(r.amount ?? 0)}</td></tr>`).join("")}</tbody></table></div>` : "На складе пока нет товаров.";
  } catch (err) {
    const target = root.querySelector("[data-storage-products]");
    if (target) target.textContent = err.message;
  }
}
async function openStorageWriteoffModal(root, storageId, storageName) {
  putModal(
    root,
    modal(
      "Списать товар",
      `
      <form
        class="modal-grid warehouse-writeoff-form"
        data-storage-writeoff-form
        data-storage-id="${Number(storageId)}"
      >
        <div class="warehouse-writeoff-storage">
          ${esc(storageName)}
        </div>


        <label>
          <span>Товар</span>


          <select
            name="product_item_id"
            data-storage-writeoff-product
            required
            disabled
          >
            <option value="">
              Загрузка товаров...
            </option>
          </select>
        </label>


        <label>
          <span>Количество</span>


          <input
            type="number"
            name="amount"
            step="0.01"
            min="0.01"
            data-storage-writeoff-amount
            required
            disabled
          >
        </label>


        <small data-storage-writeoff-available></small>


        <label class="warehouse-writeoff-comment-label">
          <span>Комментарий</span>


          <div
            class="notification-message-field warehouse-writeoff-comment"
          >
            <textarea
              name="comment"
              maxlength="1000"
              rows="4"
              wrap="soft"
              placeholder="Введите комментарий ..."
            ></textarea>
          </div>
        </label>


        <p data-message></p>


        <button
          type="submit"
          class="primary standard-save-button"
          data-storage-writeoff-submit
          disabled
        >
          Списать
        </button>
      </form>
    `
    )
  );


  const form = root.querySelector(
    "[data-storage-writeoff-form]"
  );


  if (!form) return;


  form
    .closest(".modal-card")
    ?.classList.add("warehouse-writeoff-modal");
  const select = form.querySelector("[data-storage-writeoff-product]"); const amountInput = form.querySelector("[data-storage-writeoff-amount]"); const submitButton = form.querySelector("[data-storage-writeoff-submit]"); const message = form.querySelector("[data-message]");
  try { const products = await api.storageProducts(Number(storageId)); if (!products.length) { select.innerHTML = `<option value="">На складе нет товаров</option>`; message.textContent = "На этом складе нет товаров для списания."; return; } select.innerHTML = `<option value="">Выберите товар</option>${products.map((product) => `<option value="${Number(product.product_item_id)}" data-available="${Number(product.amount) || 0}">${esc(product.title)}</option>`).join("")}`; select.disabled = false; amountInput.disabled = false; submitButton.disabled = false; } catch (err) { message.textContent = err.message; }
}
export function bindWarehouse(root, ctx) {
  if (!root || root.dataset.warehouseBound) return; root.dataset.warehouseBound = "1"; let timer; let sequence = 0; const selected = new Map();

  async function loadSubdivisionStorageProducts(storageProductsMenu) {
    if (
      !storageProductsMenu
      || storageProductsMenu.dataset.loaded === "1"
      || storageProductsMenu.dataset.loading === "1"
    ) {
      return;
    }

    storageProductsMenu.dataset.loading = "1";

    const storageId = Number(
      storageProductsMenu.dataset.storageId
    );

    try {
      const products = await api.storageProducts(storageId);

      storageProductsMenu.innerHTML = products.length
        ? `
        <div class="warehouse-subdivision-products-list">
          ${products.map(
            (product) => `
              <button
                type="button"
                class="warehouse-subdivision-product"
                data-storage-product-edit="${Number(product.product_item_id)}"
              >
                <span>
                  ${esc(product.title)}
                </span>


                <small>
                  ${esc(product.amount ?? 0)}
                </small>
              </button>
            `
          ).join("")}
        </div>
      `
        : `
        <p class="warehouse-subdivision-empty">
          На складе пока нет товаров.
        </p>
      `;

      storageProductsMenu.dataset.loaded = "1";
    } catch (err) {
      storageProductsMenu.innerHTML =
        `
        <p class="warehouse-subdivision-empty">
          ${esc(err.message)}
        </p>
      `;
    } finally {
      delete storageProductsMenu.dataset.loading;
    }
  }

  function positionSubdivisionMenu(popover) {
    if (!popover) return;

    const trigger = popover.querySelector(
      ".warehouse-subdivision-trigger"
    );

    const menu = popover.querySelector(
      ".warehouse-subdivision-menu"
    );

    if (!trigger || !menu) return;

    requestAnimationFrame(() => {
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();

      const gap = 8;
      const edge = 12;

      let left = triggerRect.right + gap;

      if (
        left + menuRect.width >
        window.innerWidth - edge
      ) {
        left =
          triggerRect.left
          - menuRect.width
          - gap;
      }

      left = Math.max(
        edge,
        Math.min(
          left,
          window.innerWidth - menuRect.width - edge
        )
      );

      let top = triggerRect.top - 12;

      top = Math.max(
        edge,
        Math.min(
          top,
          window.innerHeight - menuRect.height - edge
        )
      );

      menu.style.left = `${Math.round(left)}px`;
      menu.style.top = `${Math.round(top)}px`;
    });
  }

  function positionSubdivisionStorageMenu(storagePopover) {
    if (!storagePopover) return;

    const trigger = storagePopover.querySelector(
      ".warehouse-subdivision-storage-trigger"
    );

    const menu = storagePopover.querySelector(
      ".warehouse-subdivision-storage-menu"
    );

    if (!trigger || !menu) return;

    requestAnimationFrame(() => {
      const triggerRect = trigger.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();

      const gap = 8;
      const edge = 12;

      let left = triggerRect.right + gap;

      if (
        left + menuRect.width >
        window.innerWidth - edge
      ) {
        left =
          triggerRect.left
          - menuRect.width
          - gap;
      }

      left = Math.max(
        edge,
        Math.min(
          left,
          window.innerWidth - menuRect.width - edge
        )
      );

      let top = triggerRect.top - 8;

      top = Math.max(
        edge,
        Math.min(
          top,
          window.innerHeight - menuRect.height - edge
        )
      );

      menu.style.left = `${Math.round(left)}px`;
      menu.style.top = `${Math.round(top)}px`;
    });
  }

  root.addEventListener("pointerover", (event) => {
    const subdivisionPopover = event.target.closest(
      "[data-subdivision-popover]"
    );

    if (!subdivisionPopover) return;

    positionSubdivisionMenu(subdivisionPopover);
  });

  root.addEventListener("pointerover", (event) => {
    const storageTrigger = event.target.closest(
      "[data-subdivision-storage-hover]"
    );

    if (!storageTrigger) return;

    const storagePopover =
      storageTrigger.closest(
        "[data-subdivision-storage-popover]"
      );

    if (!storagePopover) return;

    positionSubdivisionStorageMenu(storagePopover);

    const productsMenu =
      storagePopover.querySelector(
        "[data-subdivision-storage-products]"
      );

    if (!productsMenu) return;

    loadSubdivisionStorageProducts(productsMenu);
  });
  root.addEventListener("click", async (e) => { const toggle = e.target.closest("[data-storage-actions-toggle]"); if (toggle) { toggle.closest(".warehouse-actions-popover").classList.toggle("is-open"); return; } if (!e.target.closest(".warehouse-actions-popover")) root.querySelectorAll(".warehouse-actions-popover.is-open").forEach((n) => n.classList.remove("is-open")); const sortButton = e.target.closest("[data-storage-table-sort]"); if (sortButton) { const tbody = root.querySelector("[data-storage-table-body]"); if (!tbody) return; const sortKey = sortButton.dataset.storageTableSort; const direction = sortButton.dataset.storageTableDirection === "desc" ? "desc" : "asc"; const multiplier = direction === "desc" ? -1 : 1; const rows = [...tbody.querySelectorAll("[data-storage-table-row]")]; rows.sort((left, right) => { if (sortKey === "quantity") { const leftQuantity = Number(left.dataset.storageProductQuantity) || 0; const rightQuantity = Number(right.dataset.storageProductQuantity) || 0; const quantityDifference = (leftQuantity - rightQuantity) * multiplier; if (quantityDifference !== 0) { return quantityDifference; } } else { const subdivisionDifference = String(left.dataset.storageSubdivisionName || "").localeCompare(String(right.dataset.storageSubdivisionName || ""), "ru-RU") * multiplier; if (subdivisionDifference !== 0) { return subdivisionDifference; } } return String(left.dataset.storageName || "").localeCompare(String(right.dataset.storageName || ""), "ru-RU") * multiplier; }); rows.forEach((row) => tbody.append(row)); const emptyRow = tbody.querySelector("[data-storage-filter-empty]"); if (emptyRow) { tbody.append(emptyRow); } root.querySelectorAll("[data-storage-table-sort]").forEach((button) => { const isActive = button === sortButton; const marker = button.querySelector("[data-storage-table-sort-marker]"); if (marker) { marker.textContent = isActive ? direction === "asc" ? "↑" : "↓" : ""; } button.dataset.storageTableDirection = isActive && direction === "asc" ? "desc" : "asc"; button.closest("th")?.setAttribute("aria-sort", isActive ? direction === "asc" ? "ascending" : "descending" : "none"); }); return; } const modalClose = e.target.closest("[data-warehouse-modal-close]"); if (modalClose) { modalClose.closest("[data-warehouse-modal]")?.remove(); return; } if (e.target.matches("[data-warehouse-modal]") && !e.target.hasAttribute("data-warehouse-close-only")) { e.target.remove(); return; } const productEdit = e.target.closest("[data-storage-product-edit]"); if (productEdit) { const productItemId = Number(productEdit.dataset.storageProductEdit); root.querySelector("[data-warehouse-modal]")?.remove(); try { await openProductItemEditor(ctx.org.id, productItemId); } catch (err) { const message = root.querySelector("[data-message]"); if (message) message.textContent = err.message; } return; } const count = e.target.closest("[data-storage-product-count]"); const storageRow = e.target.closest("[data-storage-open-products]"); const storageActions = e.target.closest(".warehouse-storage-actions"); const storageId = count ? Number(count.dataset.storageProductCount) : storageRow && !storageActions ? Number(storageRow.dataset.storageOpenProducts) : null; if (storageId) { await openStorageProductsModal(root, storageId); return; }  const storageEdit = e.target.closest("[data-storage-edit]"); if (storageEdit) { const [subdivisions, storages] = await Promise.all([api.storageSubdivisions(ctx.org.id), api.storages(ctx.org.id)]); const row = storages.find((item) => Number(item.id) === Number(storageEdit.dataset.storageEdit)); if (row) putModal(root, modal("Редактирование склада", `<form class="modal-grid" data-storage-edit-form data-id="${row.id}"><label><span>Название склада</span><input name="name" value="${esc(row.name)}" required></label><label><span>Подраздел</span><select name="subdivision_id" required>${subdivisions.map((item) => `<option value="${Number(item.id)}"${Number(item.id) === Number(row.subdivision_id) ? " selected" : ""}>${esc(item.name)}</option>`).join("")}</select></label><button class="primary standard-save-button">Сохранить</button></form>`)); return; } const writeoff = e.target.closest("[data-storage-writeoff]"); if (writeoff) { const storages = await api.storages(ctx.org.id); const storage = storages.find((item) => Number(item.id) === Number(writeoff.dataset.storageWriteoff)); if (!storage) return; await openStorageWriteoffModal(root, storage.id, storage.name); return; } const subDelete = e.target.closest("[data-storage-subdivision-delete]"); if (subDelete && confirm("Удалить подраздел склада?")) { try { await api.deleteStorageSubdivision(Number(subDelete.dataset.storageSubdivisionDelete)); await ctx.reload(); } catch (err) { root.querySelector("[data-message]").textContent = err.message; } return; } const del = e.target.closest("[data-storage-delete]"); if (del) { const rows = await api.storages(ctx.org.id); const row = rows.find((r) => Number(r.id) === Number(del.dataset.storageDelete)); if (row && confirm(`Удалить склад «${row.name}»?`)) { try { await api.deleteStorage(row.id); await ctx.reload(); } catch (err) { root.querySelector("[data-message]").textContent = err.message; } } return; } });
  root.addEventListener("submit", async (e) => { const form = e.target; if (!form.matches("[data-storage-writeoff-form]")) return; e.preventDefault(); const data = new FormData(form); const productItemId = Number(data.get("product_item_id")); const amount = Number(data.get("amount")); const amountInput = form.querySelector("[data-storage-writeoff-amount]"); const available = Number(amountInput?.max) || 0; const message = form.querySelector("[data-message]"); if (!productItemId) { message.textContent = "Выберите товар."; return; } if (!Number.isFinite(amount) || amount <= 0) { message.textContent = "Введите количество товара для списания."; return; } if (amount > available) { message.textContent = "Количество для списания не может превышать остаток на складе."; return; } try { await api.writeoffStorageProduct(Number(form.dataset.storageId), { product_item_id: productItemId, amount, comment: String(data.get("comment") || "").trim() }); root.querySelector("[data-warehouse-modal]")?.remove(); await ctx.reload(); } catch (err) { message.textContent = err.message; } });
  root.addEventListener("submit", async (e) => { const form = e.target; if (!form.matches("[data-storage-subdivision-create], [data-storage-create], [data-storage-subdivision-edit-form], [data-storage-edit-form]")) return; e.preventDefault(); const data = new FormData(form); try { if (form.matches("[data-storage-subdivision-create]")) await api.createStorageSubdivision({ organization_id: Number(ctx.org.id), name: data.get("name").trim() }); else if (form.matches("[data-storage-create]")) await api.createStorage({ organization_id: Number(ctx.org.id), subdivision_id: Number(data.get("subdivision_id")), name: data.get("name").trim() }); else if (form.matches("[data-storage-edit-form]")) await api.updateStorage(Number(form.dataset.id), { name: data.get("name").trim(), subdivision_id: Number(data.get("subdivision_id")) }); else await api.updateStorageSubdivision(Number(form.dataset.id), { name: data.get("name").trim() }); root.querySelector("[data-warehouse-modal]")?.remove(); await ctx.reload(); } catch (err) { (form.querySelector("[data-message]") || root.querySelector("[data-message]")).textContent = err.message; } });
  root.addEventListener("input", (e) => { if (!e.target.matches("[data-storage-product-search]")) return; clearTimeout(timer); const input = e.target; const current = ++sequence; timer = setTimeout(async () => { const rows = await api.storageProducts(Number(input.dataset.storageId), input.value); if (current !== sequence) return; const target = root.querySelector("[data-storage-product-results]"); if (target) target.innerHTML = rows.map((r) => `<label class="warehouse-product-row"><input type="checkbox" data-storage-product-select="${Number(r.product_item_id)}"><span>${esc(r.title)}</span><small>${esc(r.amount ?? 0)}</small><input type="number" step="0.01" min="0.01" max="${Number(r.amount) || 0}" data-storage-product-amount="${Number(r.product_item_id)}"></label>`).join(""); }, 250); });
  root.addEventListener("change", (e) => { const writeoffProduct = e.target.closest("[data-storage-writeoff-product]"); if (writeoffProduct) { const form = writeoffProduct.closest("[data-storage-writeoff-form]"); if (!form) return; const selectedOption = writeoffProduct.selectedOptions[0]; const available = Number(selectedOption?.dataset.available) || 0; const amountInput = form.querySelector("[data-storage-writeoff-amount]"); const availableText = form.querySelector("[data-storage-writeoff-available]"); if (amountInput) { amountInput.value = ""; amountInput.max = String(available); } if (availableText) availableText.textContent = writeoffProduct.value ? `Доступно на складе: ${available}` : ""; return; } const subdivisionFilterOption = e.target.closest("[data-storage-subdivision-filter-option]"); if (subdivisionFilterOption) { applyStorageSubdivisionFilter(root); return; } const amount = e.target.closest("[data-storage-product-amount]"); if (amount) selected.set(amount.dataset.storageProductAmount, Number(amount.value)); const check = e.target.closest("[data-storage-product-select]"); if (check && !check.checked) selected.delete(check.dataset.storageProductSelect); });
  root.addEventListener("click", async (e) => { const button = e.target.closest("[data-storage-transfer]"); if (!button) return; const rows = await api.storages(ctx.org.id); const source = rows.find((r) => Number(r.id) === Number(button.dataset.storageTransfer)); if (!source) return; const destinations = rows.filter((r) => Number(r.id) !== Number(source.id)); putModal(root, modal("Переместить товары", `<form class="modal-grid" data-storage-transfer-form data-id="${source.id}"><div>${esc(source.name)}</div><input type="search" data-storage-product-search data-storage-id="${source.id}" placeholder="Введите название товара"><div data-storage-product-results></div><label><span>Склад назначения</span><select name="destination_storage_id" required><option value="">Выберите склад</option>${destinations.map((r) => `<option value="${r.id}">${esc(r.name)}</option>`).join("")}</select></label><p data-message>${destinations.length ? "" : "Нет другого склада для перемещения."}</p><button class="primary standard-save-button"${destinations.length ? "" : " disabled"}>Переместить</button></form>`)); });
  root.addEventListener("submit", async (e) => { const form = e.target; if (!form.matches("[data-storage-transfer-form]")) return; e.preventDefault(); const items = [...form.querySelectorAll("[data-storage-product-select]:checked")].map((checkbox) => { const id = checkbox.dataset.storageProductSelect; const input = form.querySelector(`[data-storage-product-amount="${id}"]`); return { product_item_id: Number(id), amount: Number(input?.value), available: Number(input?.max) }; }); const destination = Number(new FormData(form).get("destination_storage_id")); if (!destination || !items.length) { form.querySelector("[data-message]").textContent = "Выберите склад и товары с количеством больше нуля."; return; } if (items.some((item) => !Number.isFinite(item.amount) || item.amount <= 0 || item.amount > item.available)) { form.querySelector("[data-message]").textContent = "Количество товара должно быть больше нуля и не превышать остаток на складе."; return; } try { await api.transferStorageProducts(Number(form.dataset.id), { destination_storage_id: destination, items: items.map(({ product_item_id, amount }) => ({ product_item_id, amount })) }); root.querySelector("[data-warehouse-modal]")?.remove(); await ctx.reload(); } catch (err) { form.querySelector("[data-message]").textContent = err.message; } });
  root.addEventListener("keydown", (e) => { if (e.key !== "Escape") return; const openModal = root.querySelector("[data-warehouse-modal]"); if (openModal && !openModal.hasAttribute("data-warehouse-close-only")) { openModal.remove(); } });

  window.addEventListener("resize", () => {
    root
      .querySelectorAll(
        "[data-subdivision-popover]:hover"
      )
      .forEach(positionSubdivisionMenu);

    root
      .querySelectorAll(
        "[data-subdivision-storage-popover]:hover"
      )
      .forEach(positionSubdivisionStorageMenu);
  });
}

function applyStorageSubdivisionFilter(root) {
  const filter = root.querySelector("[data-storage-subdivision-filter]");
  const tbody = root.querySelector("[data-storage-table-body]");
  if (!filter || !tbody) return;
  const selectedIds = new Set([...filter.querySelectorAll("[data-storage-subdivision-filter-option]:checked")].map((input) => String(input.value)));
  storageSubdivisionFilterState.selectedIds = selectedIds;
  let visibleCount = 0;
  tbody.querySelectorAll("[data-storage-table-row]").forEach((row) => {
    const visible = selectedIds.has(String(row.dataset.storageSubdivisionId));
    row.hidden = !visible;
    if (visible) visibleCount += 1;
  });
  const emptyRow = tbody.querySelector("[data-storage-filter-empty]");
  if (emptyRow) emptyRow.hidden = visibleCount > 0;
  const subdivisions = [...filter.querySelectorAll("[data-storage-subdivision-filter-option]")].map((input) => ({ id: input.value, name: input.closest("label")?.textContent?.trim() || "", }));
  const summary = filter.querySelector("[data-storage-subdivision-filter-summary]");
  if (summary) summary.textContent = storageSubdivisionFilterSummary(subdivisions, selectedIds);
}
