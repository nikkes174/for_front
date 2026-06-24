import { api } from "../api.js";
import { formData, setMessage } from "../dom.js";

export function onboarding() {
  return `
    <main class="auth-page">
      <form class="auth-card wide" data-create-organization>
        <h1>Создание организации</h1>
        <p>После создания откроются филиалы, клиенты и программа лояльности.</p>
        <label><span>Название организации</span><input name="name" required></label>
        <p data-message></p>
        <button class="primary">Создать организацию</button>
      </form>
    </main>
  `;
}

export function bindOnboarding(root) {
  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-create-organization]");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");

    const data = formData(form);
    try {
      const org = await api.createOrganization({ name: data.name, settings: {} });
      localStorage.setItem("loyalty.lastOrganizationId", String(org.id));
      location.href = `/organizations/${org.id}`;
    } catch (error) {
      setMessage(form, error.message);
    }
  });
}
