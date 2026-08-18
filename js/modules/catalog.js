import { escapeHtml } from "../dom.js";
import { hydrateSettingsCache, loadSettingsData, renderCatalogTab } from "./settings.js";
import { warehouse, bindWarehouse } from "./warehouse.js";
import { inventory, bindInventory } from "./inventory.js";

export async function catalog(ctx, tabSlug = "products", subpage = "") {
  if (String(tabSlug).trim().toLowerCase() === "warehouse") return warehouse(ctx, subpage);
  if (tabSlug === "inventory") return inventory(ctx);
  const activeTab = tabSlug === "services" ? "services" : "products";
  const settingsData = await loadSettingsData(ctx.org.id);
  hydrateSettingsCache(ctx.org.id, settingsData);

  return `
    <section class="panel" data-settings data-settings-section="catalog-${escapeHtml(activeTab)}">
      <h2>${escapeHtml(ctx.org.name)}</h2>
      ${renderCatalogTab(activeTab, settingsData)}
    </section>
  `;
}

export function bindCatalog(root, ctx) { bindWarehouse(root, ctx); bindInventory(root, ctx); }
