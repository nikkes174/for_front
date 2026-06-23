import { api } from "../api.js";
import { escapeHtml, rows } from "../dom.js";

const loaders = {
  rules: api.rules,
  levels: api.bonusLevels,
  transactions: api.transactions,
  promotions: api.promotions,
  certificates: api.certificates,
  subscriptions: api.subscriptions,
  referrals: api.referrals,
};

const permissions = {
  rules: "loyalty.rules.view",
  levels: "loyalty.levels.view",
  transactions: "loyalty.transactions.view",
  promotions: "loyalty.promotions.view",
  certificates: "loyalty.certificates.view",
  subscriptions: "loyalty.subscriptions.view",
  referrals: "loyalty.referrals.view",
};

const titles = {
  rules: "Правила начисления",
  levels: "Уровни клиентов",
  transactions: "Транзакции",
  promotions: "Акции",
  certificates: "Сертификаты",
  subscriptions: "Абонементы",
  referrals: "Реферальная программа",
};

export async function loyalty(ctx, tab = "rules") {
  const visibleTabs = Object.keys(loaders).filter((key) => !ctx.can || ctx.can(permissions[key]));
  const activeTab = visibleTabs.includes(tab) ? tab : visibleTabs[0] || "rules";
  const items = await loaders[activeTab](ctx.org.id).catch(() => []);

  return `
    <section class="panel">
      <h2>Лояльность</h2>
      <nav class="tabs">
        ${Object.entries(titles).map(([key, title]) => `
          <a class="${key === activeTab ? "active" : ""}" href="/organizations/${ctx.org.id}/loyalty/${key}" data-permission="${escapeHtml(permissions[key])}">${escapeHtml(title)}</a>
        `).join("")}
      </nav>
      <div class="subpanel">
        <h3>${escapeHtml(titles[activeTab])}</h3>
        <table>
          <thead><tr><th>ID</th><th>Название</th><th>Статус</th></tr></thead>
          <tbody>${rows(items, "Записей пока нет", (item) => `
            <tr>
              <td>${escapeHtml(item.id)}</td>
              <td>${escapeHtml(item.name || item.promotion_name || item.subscription_name || item.certificate_code || item.referral_code || "Без названия")}</td>
              <td>${escapeHtml(item.status || (item.is_active ? "active" : "inactive"))}</td>
            </tr>
          `)}</tbody>
        </table>
      </div>
    </section>
  `;
}
