import { escapeHtml } from "../dom.js";
import { hydrateSettingsCache, loadSettingsData, renderCatalogTab } from "./settings.js";

export async function catalog(ctx, tabSlug = "products") {
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

export function bindCatalog() {}
