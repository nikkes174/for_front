import { api } from "../api.js";
import { escapeHtml } from "../dom.js";

export async function dashboard(ctx) {
  const [branches, clients, rules] = await Promise.all([
    api.branches(ctx.org.id).catch(() => []),
    api.clients(ctx.org.id).catch(() => []),
    api.rules(ctx.org.id).catch(() => []),
  ]);

  const activeRules = rules.filter((rule) => rule.is_active).length;
  return `
    <section class="grid">
      <div class="stat"><span>Филиалов</span><strong>${branches.length}</strong></div>
      <div class="stat"><span>Клиентов</span><strong>${clients.length}</strong></div>
      <div class="stat"><span>Активных правил</span><strong>${activeRules}</strong></div>
      <div class="panel span">
        <h2>${escapeHtml(ctx.org.name)}</h2>
        <p>Ванильный фронт уже работает: роутинг, сессия и базовая навигация без React.</p>
      </div>
    </section>
  `;
}
