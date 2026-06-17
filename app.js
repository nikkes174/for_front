const DEFAULT_PORTS = {
    crm: "http://127.0.0.1:8051",
    auth: "http://127.0.0.1:8052",
    loyalty: "http://127.0.0.1:8053",
};

const state = {
    config: null,
    crmClients: [],
    selectedClient: null,
    fileCategories: [],
};

function inferDefaults() {
    const origin = window.location.origin;
    const port = window.location.port;
    const defaults = {...DEFAULT_PORTS};

    if (port === "8051") defaults.crm = origin;
    if (port === "8052") defaults.auth = origin;
    if (port === "8053") defaults.loyalty = origin;

    return defaults;
}

function loadConfig() {
    const defaults = inferDefaults();
    return {
        crmBaseUrl: defaults.crm,
        authBaseUrl: defaults.auth,
        loyaltyBaseUrl: defaults.loyalty,
    };
}

function saveConfig(config) {
    localStorage.setItem("loyalty.frontend.config", JSON.stringify(config));
    state.config = config;
}

function normalizeUrl(url) {
    return String(url || "").trim().replace(/\/+$/, "");
}

function serviceUrl(service, path) {
    const base = service === "crm"
        ? state.config.crmBaseUrl
        : service === "auth"
            ? state.config.authBaseUrl
            : state.config.loyaltyBaseUrl;

    return `${normalizeUrl(base)}${path}`;
}

async function requestJson(service, path, options = {}) {
    const headers = {...(options.headers || {})};
    if (options.body !== undefined && !("Content-Type" in headers)) {
        headers["Content-Type"] = "application/json";
    }

    const response = await fetch(serviceUrl(service, path), {
        headers,
        ...options,
    });

    if (!response.ok) {
        let detail = `${response.status} ${response.statusText}`;
        try {
            const data = await response.json();
            detail = typeof data?.detail === "string" ? data.detail : JSON.stringify(data);
        } catch {}
        throw new Error(detail);
    }

    if (response.status === 204) {
        return null;
    }

    return response.json();
}

async function requestRaw(service, path, options = {}) {
    const response = await fetch(serviceUrl(service, path), options);
    if (!response.ok) {
        let detail = `${response.status} ${response.statusText}`;
        try {
            const data = await response.json();
            detail = typeof data?.detail === "string" ? data.detail : JSON.stringify(data);
        } catch {}
        throw new Error(detail);
    }
    if (response.status === 204) {
        return null;
    }
    return response.json();
}

function isoOrNull(value) {
    return value ? new Date(value).toISOString() : null;
}

function formatDateTime(value) {
    if (!value) return "Не указано";
    try {
        return new Date(value).toLocaleString("ru-RU");
    } catch {
        return value;
    }
}

function formatMoney(value) {
    if (value === null || value === undefined || value === "") return "0";
    return new Intl.NumberFormat("ru-RU", {maximumFractionDigits: 2}).format(Number(value));
}

function formatDate(value) {
    if (!value) return "Не указано";
    try {
        return new Date(value).toLocaleDateString("ru-RU");
    } catch {
        return value;
    }
}

function formatGender(value) {
    if (value === "male") return "Мужской";
    if (value === "female") return "Женский";
    return "Не указан";
}

function formatBoolean(value) {
    return value ? "Да" : "Нет";
}

function formatPercent(value) {
    if (value === null || value === undefined || value === "") return "Не указано";
    return `${Number(value).toFixed(1)}%`;
}

// Перевод доменных типов событий (event_type) на русский язык.
// Значения соответствуют тем, что эмитят сервисы бэкенда.
// Неизвестные ключи возвращаются как есть.
const EVENT_TYPE_LABELS = {
    // Бонусы (loylyty/client_bonuses)
    "loyalty.points_accrued": "Начисление бонусов",
    "loyalty.points_spent": "Списание бонусов",
    "loyalty.points_expired": "Сгорание бонусов",

    // Сертификаты (loylyty/client_certificates)
    "certificate.issued": "Выпуск сертификата",
    "certificate.redeemed": "Погашение сертификата",
    "certificate.transferred": "Передача сертификата",
    "certificate.refunded": "Возврат сертификата",
    "certificate.expired": "Истечение сертификата",
    "certificate_changed": "Изменение сертификата",

    // Акции (loylyty/client_promotions)
    "promotion.created": "Создание акции",
    "promotion.applied": "Применение акции",

    // Рефералы (loylyty/client_referrals)
    "referral.link_created": "Создание реферальной ссылки",
    "referral.invitee_linked": "Привязка приглашённого клиента",
    "referral.reward_approved": "Одобрение реферальной награды",
    "referral.reward_accrued": "Начисление реферальной награды",
    "referral.reward_reversed": "Отмена реферальной награды",

    // Абонементы (loylyty/client_subscriptions)
    "subscription.issued": "Выпуск абонемента",
    "subscription.frozen": "Заморозка абонемента",
    "subscription.unfrozen": "Разморозка абонемента",
    "subscription.transferred": "Передача абонемента",
    "subscription.visit_consumed": "Списание визита по абонементу",
    "subscription.extended": "Продление абонемента",
    "subscription.expired": "Истечение абонемента",

    // Клиенты и визиты (client_circout)
    "client_created": "Создание клиента",
    "client_updated": "Обновление клиента",
    "visit_created": "Создание визита",
    "visit_cancelled": "Отмена визита",
};

function translateEvent(value) {
    if (!value) return "—";
    return EVENT_TYPE_LABELS[value] || value;
}

// Перевод типов сущностей (entity_type) на русский язык.
// Значения соответствуют тем, что эмитят сервисы бэкенда.
// Неизвестные ключи возвращаются как есть.
const ENTITY_TYPE_LABELS = {
    "client": "Клиент",
    "visit": "Визит",
    "organization": "Организация",
    "user": "Пользователь",
    "client_bonus": "Бонусы клиента",
    "client_certificate": "Сертификат клиента",
    "client_promotion": "Акция клиента",
    "client_referral": "Реферал клиента",
    "client_referral_source": "Реферальная ссылка",
    "client_subscription": "Абонемент клиента",
    "client_segment": "Сегмент клиента",
    "client_file": "Файл клиента",
};

function translateEntityType(value) {
    if (!value) return "—";
    return ENTITY_TYPE_LABELS[value] || value;
}

// Перевод действий аудита (action) на русский язык.
const AUDIT_ACTION_LABELS = {
    "loyalty.bonus.accrue": "Начисление бонусов",
    "loyalty.bonus.write_off": "Списание бонусов",
    "loyalty.bonus.expire": "Сгорание бонусов",
    "certificate.issue": "Выпуск сертификата",
    "certificate.use": "Погашение сертификата",
    "certificate.transfer": "Передача сертификата",
    "certificate.refund": "Возврат сертификата",
    "certificate.expire": "Истечение сертификата",
    "promotion.create": "Создание акции",
    "promotion.apply": "Применение акции",
    "promotion.apply_by_code": "Применение акции по промокоду",
    "referral.source.create": "Создание реферального источника",
    "referral.register_by_code": "Регистрация по реферальному коду",
    "referral.register_by_link": "Регистрация по реферальной ссылке",
    "referral.first_visit": "Первый визит приглашённого",
    "referral.reward.accrue": "Начисление реферальной награды",
    "referral.reward.cancel": "Отмена реферальной награды",
    "subscription.create": "Создание абонемента",
    "subscription.freeze": "Заморозка абонемента",
    "subscription.unfreeze": "Разморозка абонемента",
    "subscription.transfer": "Передача абонемента",
    "subscription.write_off_after_visit": "Списание после визита",
    "subscription.renew": "Продление абонемента",
    "subscription.expire": "Истечение абонемента",
    "access_scope_granted": "Выдача прав доступа",
    "access_scope_revoked": "Отзыв прав доступа",
    "access_checked": "Проверка доступа",
};

function translateAuditAction(value) {
    if (!value) return "—";
    return AUDIT_ACTION_LABELS[value] || value;
}

function estimateChurnProbability(metrics) {
    const days = Number(metrics.days_since_last_visit ?? 0);
    const avgInterval = Number(metrics.average_visit_interval_days ?? 0);

    if (!days) return 0;
    if (!avgInterval) {
        if (days >= 180) return 95;
        if (days >= 90) return 80;
        if (days >= 45) return 55;
        return 25;
    }

    const ratio = days / avgInterval;
    return Math.max(0, Math.min(99, ratio * 35));
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

function showToast(message, type = "info") {
    const box = document.createElement("div");
    box.className = `toast ${type}`;
    box.textContent = message;
    document.getElementById("toast-container").appendChild(box);
    setTimeout(() => box.remove(), 4200);
}

function setLoading(containerId, text = "\u0417\u0430\u0433\u0440\u0443\u0437\u043a\u0430...") {
    document.getElementById(containerId).innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function setError(containerId, error) {
    document.getElementById(containerId).innerHTML = `<div class="empty-state">\u041e\u0448\u0438\u0431\u043a\u0430: ${escapeHtml(error.message || String(error))}</div>`;
}

function setEmpty(containerId, text) {
    document.getElementById(containerId).innerHTML = `<div class="empty-state">${escapeHtml(text)}</div>`;
}

function createTable(columns, rows) {
    if (!rows.length) {
        return `<div class="empty-state">\u041d\u0435\u0442 \u0434\u0430\u043d\u043d\u044b\u0445.</div>`;
    }

    return `
        <div class="table-shell">
            <table>
                <thead>
                    <tr>${columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join("")}</tr>
                </thead>
                <tbody>
                    ${rows.map((row) => `
                        <tr>
                            ${columns.map((column) => `<td>${column.render(row)}</td>`).join("")}
                        </tr>
                    `).join("")}
                </tbody>
            </table>
        </div>
    `;
}

function switchTab(tab) {
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.classList.toggle("active", link.dataset.tab === tab);
    });
    document.querySelectorAll(".tab-panel").forEach((panel) => {
        panel.classList.toggle("active", panel.id === `tab-${tab}`);
    });
}

async function checkHealth() {
    const targets = [
        {service: "crm", title: "CRM / client_circout", path: "/health"},
        {service: "auth", title: "Auth & Logging", path: "/health"},
        {service: "loyalty", title: "Loyalty / loylyty", path: "/health"},
    ];

    const html = await Promise.all(targets.map(async (target) => {
        try {
            const data = await requestJson(target.service, target.path, {headers: {}});
            return `
                <div class="health-card ok">
                    <div class="health-status"><span class="dot ok"></span> Доступен</div>
                    <div class="metric-value">${escapeHtml(data.status || "ok")}</div>
                    <div class="metric-label">${escapeHtml(target.title)}</div>
                </div>
            `;
        } catch (error) {
            return `
                <div class="health-card fail">
                    <div class="health-status"><span class="dot fail"></span> Недоступен</div>
                    <div class="metric-value">Ошибка</div>
                    <div class="metric-label">${escapeHtml(target.title)}</div>
                </div>
            `;
        }
    }));

    document.getElementById("service-health-grid").innerHTML = html.join("");
}

async function loadSummary() {
    const metricsBox = document.getElementById("summary-metrics");
    metricsBox.innerHTML = "";

    const [organizations, users, clients, events, audit] = await Promise.allSettled([
        requestJson("auth", "/organizations?limit=100&offset=0"),
        requestJson("auth", "/users-access/users?limit=100&offset=0"),
        requestJson("crm", "/clients-core/clients?limit=100&offset=0"),
        requestJson("auth", "/events?limit=20&offset=0"),
        requestJson("auth", "/audit?limit=20&offset=0"),
    ]);

    const cards = [
        {label: "Организаций", value: organizations.status === "fulfilled" ? organizations.value.length : "—"},
        {label: "Пользователей", value: users.status === "fulfilled" ? users.value.length : "—"},
        {label: "Клиентов CRM", value: clients.status === "fulfilled" ? clients.value.length : "—"},
        {label: "Событий", value: events.status === "fulfilled" ? events.value.length : "—"},
        {label: "Записей аудита", value: audit.status === "fulfilled" ? audit.value.length : "—"},
    ];

    metricsBox.innerHTML = cards.map((card) => `
        <div class="metric-card">
            <div class="metric-label">${escapeHtml(card.label)}</div>
            <div class="metric-value">${escapeHtml(card.value)}</div>
        </div>
    `).join("");

    if (events.status === "fulfilled") {
        renderDashboardEvents(events.value);
    } else {
        setError("dashboard-events", events.reason);
    }
}

function renderDashboardEvents(events) {
    const html = createTable([
        {
            label: "Событие",
            render: (item) => `
                <div class="row-title">${escapeHtml(translateEvent(item.event_type || item.event_name))}</div>
                <div class="row-meta">${escapeHtml(item.source_service || "unknown")}</div>
            `,
        },
        {
            label: "Сущность",
            render: (item) => `
                <div>${escapeHtml(item.entity_type || "—")}</div>
                <div class="row-meta">Клиент: ${escapeHtml(item.client_id || "—")}</div>
            `,
        },
        {
            label: "Когда",
            render: (item) => escapeHtml(formatDateTime(item.occurred_at || item.created_at)),
        },
    ], events.slice(0, 8));

    document.getElementById("dashboard-events").innerHTML = html;
}

async function loadOrganizations() {
    setLoading("organizations-list");
    try {
        const organizations = await requestJson("auth", "/organizations?limit=100&offset=0");
        document.getElementById("organizations-list").innerHTML = createTable([
            {
                label: "\u041e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u044f",
                render: (item) => `
                    <div class="row-title">${escapeHtml(item.name)}</div>
                    <div class="row-meta">\u0412\u043b\u0430\u0434\u0435\u043b\u0435\u0446: ${escapeHtml(item.owner_user_id)}</div>
                `,
            },
            {
                label: "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438",
                render: (item) => escapeHtml(item.settings ? "\u0415\u0441\u0442\u044c \u043d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438" : "\u041f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e"),
            },
        ], organizations);
    } catch (error) {
        setError("organizations-list", error);
    }
}

async function loadUsersAndAccess() {
    setLoading("users-list");
    setLoading("roles-list");
    setLoading("permissions-list");
    try {
        const [users, permissions] = await Promise.all([
            requestJson("auth", "/users-access/users?limit=100&offset=0"),
            requestJson("auth", "/users-access/permissions"),
        ]);

        document.getElementById("users-list").innerHTML = createTable([
            {
                label: "\u041f\u043e\u043b\u044c\u0437\u043e\u0432\u0430\u0442\u0435\u043b\u044c",
                render: (item) => `
                    <div class="row-title">${escapeHtml([item.first_name, item.last_name].filter(Boolean).join(" ") || item.email || item.phone || "\u0411\u0435\u0437 \u0438\u043c\u0435\u043d\u0438")}</div>
                    <div class="row-meta">${escapeHtml(item.email || item.phone || item.telegram_id || "\u041a\u043e\u043d\u0442\u0430\u043a\u0442 \u043d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d")}</div>
                `,
            },
            {
                label: "\u0421\u0442\u0430\u0442\u0443\u0441",
                render: (item) => `
                    <span class="pill">${item.is_blocked ? "\u0417\u0430\u0431\u043b\u043e\u043a\u0438\u0440\u043e\u0432\u0430\u043d" : item.is_active ? "\u0410\u043a\u0442\u0438\u0432\u0435\u043d" : "\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u0435\u043d"}</span>
                `,
            },
        ], users);

        document.getElementById("permissions-list").innerHTML = createTable([
            {
                label: "\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043d\u0438\u0435",
                render: (item) => `
                    <div class="row-title">${escapeHtml(item.name)}</div>
                    <div class="row-meta">${escapeHtml(item.code)}</div>
                `,
            },
            {
                label: "\u041e\u043f\u0438\u0441\u0430\u043d\u0438\u0435",
                render: (item) => escapeHtml(item.description || "\u2014"),
            },
        ], permissions);

        const organizations = await requestJson("auth", "/organizations?limit=100&offset=0");
        const roleRequests = organizations.map((org) => requestJson("auth", `/users-access/organizations/${org.id}/roles`));
        const settledRoles = await Promise.allSettled(roleRequests);
        const roles = settledRoles.flatMap((result) => result.status === "fulfilled" ? result.value : []);
        document.getElementById("roles-list").innerHTML = createTable([
            {
                label: "\u0420\u043e\u043b\u044c",
                render: (item) => `
                    <div class="row-title">${escapeHtml(item.name)}</div>
                    <div class="row-meta">\u041e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u044f: ${escapeHtml(item.organization_id)}</div>
                `,
            },
        ], roles);
    } catch (error) {
        setError("users-list", error);
        setError("roles-list", error);
        setError("permissions-list", error);
    }
}

async function loadClients(filters = {}) {
    setLoading("crm-clients-table");
    const query = new URLSearchParams({limit: "100", offset: "0"});
    if (filters.organizationId) query.set("organization_id", String(filters.organizationId));
    if (filters.status) query.set("status", filters.status);

    try {
        const clients = await requestJson("crm", `/clients-core/clients?${query.toString()}`);
        state.crmClients = clients;
        renderClientsTable(clients);
    } catch (error) {
        setError("crm-clients-table", error);
    }
}

function renderClientsTable(clients) {
    const html = createTable([
        {
            label: "Клиент",
            render: (item) => `
                <button type="button" class="link-button" data-client-id="${escapeHtml(item.id)}">
                    <div class="row-title">${escapeHtml(item.full_name || [item.first_name, item.last_name].filter(Boolean).join(" ") || "Без имени")}</div>
                    <div class="row-meta">${escapeHtml(item.primary_phone || item.email || "Контакты не указаны")}</div>
                </button>
            `,
        },
        {
            label: "Контакты",
            render: (item) => `
                <div>${escapeHtml(item.email || "—")}</div>
                <div class="row-meta">Telegram ID: ${escapeHtml(item.telegram_id || "—")}</div>
            `,
        },
        {
            label: "Статус",
            render: (item) => `
                <span class="pill">${escapeHtml(item.status || "active")}</span>
            `,
        },
    ], clients);

    document.getElementById("crm-clients-table").innerHTML = html;
    document.querySelectorAll("[data-client-id]").forEach((button) => {
        button.addEventListener("click", () => selectClient(Number(button.dataset.clientId)));
    });
}

async function searchClients(queryText, organizationId = null) {
    setLoading("crm-clients-table", "Идёт поиск клиентов...");
    try {
        const query = new URLSearchParams({
            query: queryText,
            limit: "100",
            offset: "0",
        });
        if (organizationId) {
            query.set("organization_id", String(organizationId));
        }
        const items = await requestJson("crm", `/clients-core/clients/search?${query.toString()}`);
        state.crmClients = items;
        renderClientsTable(items);
    } catch (error) {
        setError("crm-clients-table", error);
    }
}

function renderSelectedClient(client) {
    document.getElementById("selected-client-badge").textContent = `CRM клиент: ${client.full_name || client.first_name || client.primary_phone || client.id}`;
    document.getElementById("selected-client-summary").innerHTML = `
        <div class="selected-client-card">
            <div class="info-card">
                <div class="info-card-title">Клиент</div>
                <div class="info-card-value">${escapeHtml(client.full_name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "Без имени")}</div>
            </div>
            <div class="info-card">
                <div class="info-card-title">Контакт</div>
                <div class="info-card-value">${escapeHtml(client.primary_phone || client.email || "Не указан")}</div>
            </div>
            <div class="info-card">
                <div class="info-card-title">Статус</div>
                <div class="info-card-value">${escapeHtml(client.status || "active")}</div>
            </div>
        </div>
    `;
}

async function loadClientProfile(client) {
    setLoading("crm-client-profile");
    try {
        const profile = await requestJson("crm", `/client-profile/clients/${client.id}?organization_id=${client.organization_id}&favorite_limit=10`);
        const secondaryResults = await Promise.allSettled([
            requestJson("crm", `/client-history/clients/${client.id}/metrics-source?organization_id=${client.organization_id}`),
            requestJson("crm", `/clients-core/clients/${client.id}/categories?limit=100&offset=0`),
            requestJson("crm", `/clients-core/branches?client_id=${client.id}&limit=100&offset=0`),
            requestJson("crm", `/clients-core/additional-fields?organization_id=${client.organization_id}&limit=100&offset=0`),
            requestJson("crm", `/clients-core/additional-field-values?client_id=${client.id}&limit=100&offset=0`),
        ]);
        const historyMetrics = secondaryResults[0].status === "fulfilled" ? secondaryResults[0].value : {};
        const categories = secondaryResults[1].status === "fulfilled" ? secondaryResults[1].value : [];
        const branches = secondaryResults[2].status === "fulfilled" ? secondaryResults[2].value : [];
        const additionalFields = secondaryResults[3].status === "fulfilled" ? secondaryResults[3].value : [];
        const additionalValues = secondaryResults[4].status === "fulfilled" ? secondaryResults[4].value : [];
        const fieldNames = new Map(additionalFields.map((field) => [field.id, field.name]));
        const effectiveMetrics = {
            ltv: profile.metrics?.ltv ?? historyMetrics.sold_amount ?? 0,
            visit_frequency: profile.metrics?.visit_frequency ?? historyMetrics.visit_frequency,
            average_check: profile.metrics?.average_check ?? historyMetrics.average_check ?? 0,
            days_since_last_visit: profile.metrics?.days_since_last_visit ?? historyMetrics.days_since_last_visit,
            churn_probability: profile.metrics?.churn_probability ?? estimateChurnProbability(profile.metrics || historyMetrics),
            profit_amount: profile.metrics?.profit_amount,
            acquisition_cost: profile.metrics?.acquisition_cost,
            visits_count: profile.metrics?.visits_count ?? historyMetrics.visits_count ?? 0,
            completed_visits_count: profile.metrics?.completed_visits_count ?? historyMetrics.completed_visits_count ?? 0,
            paid_amount: profile.metrics?.paid_amount ?? historyMetrics.paid_amount ?? 0,
            favorite_branch_id: profile.metrics?.favorite_branch_id,
        };
        const categoryList = categories.map((item) => item.name).filter(Boolean);
        const branchList = branches.map((item) => item.branch_id).filter(Boolean);
        const additionalList = additionalValues.map((item) => {
            const title = fieldNames.get(item.field_id) || `Поле ${item.field_id}`;
            const value = item.value_text || (item.value_json ? JSON.stringify(item.value_json) : "—");
            return `<div class="row-meta">${escapeHtml(title)}: ${escapeHtml(value)}</div>`;
        }).join("");
        document.getElementById("crm-client-profile").innerHTML = `
            <div class="stack">
                <div class="info-card">
                    <div class="info-card-title">Единая карточка клиента</div>
                    <div class="info-card-value">${escapeHtml(profile.client.full_name || [profile.client.last_name, profile.client.first_name, profile.client.middle_name].filter(Boolean).join(" ") || "Без имени")}</div>
                    <div class="row-meta">ID клиента: ${escapeHtml(profile.client.id)}</div>
                    <div class="row-meta">Имя: ${escapeHtml(profile.client.first_name || "—")}</div>
                    <div class="row-meta">Фамилия: ${escapeHtml(profile.client.last_name || "—")}</div>
                    <div class="row-meta">Отчество: ${escapeHtml(profile.client.middle_name || "—")}</div>
                    <div class="row-meta">Телефон: ${escapeHtml(profile.client.primary_phone || "—")}</div>
                    <div class="row-meta">Доп. телефон: ${escapeHtml(profile.client.secondary_phone || "—")}</div>
                    <div class="row-meta">Email: ${escapeHtml(profile.client.email || "—")}</div>
                    <div class="row-meta">Telegram ID: ${escapeHtml(profile.client.telegram_id || "—")}</div>
                    <div class="row-meta">MAX ID: ${escapeHtml(profile.client.max_id || "—")}</div>
                    <div class="row-meta">VK ID: ${escapeHtml(profile.client.vk_id || "—")}</div>
                    <div class="row-meta">Дата рождения: ${escapeHtml(formatDate(profile.client.birth_date))}</div>
                    <div class="row-meta">Пол: ${escapeHtml(formatGender(profile.client.gender))}</div>
                    <div class="row-meta">Фото: ${escapeHtml(profile.client.photo_file_id || "Не загружено")}</div>
                    <div class="row-meta">Комментарий: ${escapeHtml(profile.client.comment || "—")}</div>
                    <div class="row-meta">Примечание: ${escapeHtml(profile.client.note || "—")}</div>
                    <div class="row-meta">Класс важности: ${escapeHtml(profile.client.importance_class ?? 0)}</div>
                    <div class="row-meta">Категории: ${escapeHtml(categoryList.join(", ") || "Не заданы")}</div>
                    <div class="row-meta">Онлайн-запись: ${escapeHtml(formatBoolean(profile.client.online_booking_enabled))}</div>
                    <div class="row-meta">Дата создания: ${escapeHtml(formatDateTime(profile.client.created_at))}</div>
                    <div class="row-meta">Источник создания: ${escapeHtml(profile.client.creation_source || "—")}</div>
                    <div class="row-meta">Кто создал: ${escapeHtml(profile.client.created_by || "—")}</div>
                    <div class="row-meta">Последнее изменение: ${escapeHtml(formatDateTime(profile.client.updated_at))}</div>
                    <div class="row-meta">Статус: ${escapeHtml(profile.client.status || "active")}</div>
                    <div class="row-meta">Филиалы клиента: ${escapeHtml(branchList.join(", ") || "Пока нет")}</div>
                    <div class="row-meta">ID рефовода: ${escapeHtml(profile.client.referrer_client_id || "—")}</div>
                    <div class="row-meta">Свободное поле 1: ${escapeHtml(profile.client.api_field_1 || "—")}</div>
                    <div class="row-meta">Свободное поле 2: ${escapeHtml(profile.client.api_field_2 || "—")}</div>
                    <div class="row-meta">Свободное поле 3: ${escapeHtml(profile.client.api_field_3 || "—")}</div>
                    ${additionalList || `<div class="row-meta">Дополнительные поля: не заполнены</div>`}
                </div>
                <div class="info-card">
                    <div class="info-card-title">Экономическая ценность клиента</div>
                    <div class="row-meta">LTV: ${escapeHtml(formatMoney(effectiveMetrics.ltv))}</div>
                    <div class="row-meta">Частота посещений: ${escapeHtml(effectiveMetrics.visit_frequency ? Number(effectiveMetrics.visit_frequency).toFixed(2) : "Не указано")}</div>
                    <div class="row-meta">Средний чек: ${escapeHtml(formatMoney(effectiveMetrics.average_check))}</div>
                    <div class="row-meta">Срок с последнего визита: ${escapeHtml(effectiveMetrics.days_since_last_visit ?? "Не указано")}</div>
                    <div class="row-meta">Вероятность ухода: ${escapeHtml(formatPercent(effectiveMetrics.churn_probability))}</div>
                    <div class="row-meta">Прибыль от клиента: ${escapeHtml(effectiveMetrics.profit_amount !== undefined && effectiveMetrics.profit_amount !== null ? formatMoney(effectiveMetrics.profit_amount) : "Не указано")}</div>
                    <div class="row-meta">Стоимость привлечения: ${escapeHtml(effectiveMetrics.acquisition_cost !== undefined && effectiveMetrics.acquisition_cost !== null ? formatMoney(effectiveMetrics.acquisition_cost) : "Не указано")}</div>
                    <div class="row-meta">Всего визитов: ${escapeHtml(effectiveMetrics.visits_count)}</div>
                    <div class="row-meta">Завершённых визитов: ${escapeHtml(effectiveMetrics.completed_visits_count)}</div>
                    <div class="row-meta">Оплачено: ${escapeHtml(formatMoney(effectiveMetrics.paid_amount))}</div>
                    <div class="row-meta">Любимый филиал: ${escapeHtml(effectiveMetrics.favorite_branch_id || "Не определён")}</div>
                    <div class="row-meta">Любимых услуг: ${escapeHtml(profile.favorite_services.length)}</div>
                    <div class="row-meta">Любимых сотрудников: ${escapeHtml(profile.favorite_employees.length)}</div>
                    <div class="row-meta">Активных записей: ${escapeHtml(profile.active_bookings.length)}</div>
                </div>
            </div>
        `;
    } catch (error) {
        setError("crm-client-profile", error);
    }
}

async function loadClientFiles(client) {
    setLoading("crm-client-files");
    setLoading("crm-client-files-filtered");
    try {
        const files = await requestJson("crm", `/client-files/clients/${client.id}`);
        const tableHtml = createClientFilesTable(files);
        document.getElementById("crm-client-files").innerHTML = tableHtml;
        document.getElementById("crm-client-files-filtered").innerHTML = tableHtml;
    } catch (error) {
        setError("crm-client-files", error);
        setError("crm-client-files-filtered", error);
    }
}

function createClientFilesTable(files) {
    return createTable([
        {
            label: "Файл",
            render: (item) => `
                <div class="row-title">${escapeHtml(item.file_name)}</div>
                <div class="row-meta">Категория: ${escapeHtml(item.file_category)}</div>
                <div class="row-meta">ID файла: ${escapeHtml(item.id)}</div>
                <div class="row-meta">Клиент: ${escapeHtml(item.client_id)} | Организация: ${escapeHtml(item.organization_id)}</div>
            `,
        },
        {
            label: "Метаданные",
            render: (item) => `
                <div>${escapeHtml(item.mime_type)}</div>
                <div class="row-meta">Размер: ${escapeHtml(formatMoney(item.size))} байт</div>
                <div class="row-meta">Загрузил: ${escapeHtml(item.uploaded_by || "—")}</div>
            `,
        },
        {
            label: "Хранение",
            render: (item) => `
                <div>${escapeHtml(item.storage_key)}</div>
                <div class="row-meta">Создан: ${escapeHtml(formatDateTime(item.created_at))}</div>
            `,
        },
    ], files);
}

async function loadClientFilesByCategory(client, category) {
    setLoading("crm-client-files-filtered");
    try {
        const files = category
            ? await requestJson("crm", `/client-files/clients/${client.id}/categories/${encodeURIComponent(category)}`)
            : await requestJson("crm", `/client-files/clients/${client.id}`);
        document.getElementById("crm-client-files-filtered").innerHTML = createClientFilesTable(files);
    } catch (error) {
        setError("crm-client-files-filtered", error);
    }
}

async function loadFileCategories() {
    try {
        const categories = await requestJson("crm", "/client-files/categories");
        state.fileCategories = categories;
        const options = [
            `<option value="">Выберите категорию</option>`,
            ...categories.map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.title)}</option>`),
        ].join("");
        document.getElementById("file-category-select").innerHTML = options;
        document.getElementById("file-category-filter").innerHTML = `<option value="">Все категории</option>${categories.map((item) => `<option value="${escapeHtml(item.code)}">${escapeHtml(item.title)}</option>`).join("")}`;
    } catch (error) {
        document.getElementById("file-category-select").innerHTML = `<option value="">Не удалось загрузить категории</option>`;
        document.getElementById("file-category-filter").innerHTML = `<option value="">Категории недоступны</option>`;
    }
}

async function loadClientHistory(client) {
    setLoading("client-history-metrics");
    setLoading("client-history-list");
    try {
        const [visits, count] = await Promise.all([
            requestJson("crm", `/client-history/clients/${client.id}/visits?organization_id=${client.organization_id}&limit=100&offset=0`),
            requestJson("crm", `/client-history/visits/count?client_id=${client.id}&organization_id=${client.organization_id}`),
        ]);
        const completed = visits.filter((item) => item.visit_status === "completed").length;
        const cancelled = visits.filter((item) => item.visit_status === "cancelled").length;
        const totalSold = visits.reduce((sum, item) => sum + Number(item.total_cost || 0), 0);
        document.getElementById("client-history-metrics").innerHTML = `
            <div class="metrics-grid">
                <div class="metric-card">
                    <div class="metric-label">Всего визитов</div>
                    <div class="metric-value">${escapeHtml(count.count)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Завершено</div>
                    <div class="metric-value">${escapeHtml(completed)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Отменено</div>
                    <div class="metric-value">${escapeHtml(cancelled)}</div>
                </div>
                <div class="metric-card">
                    <div class="metric-label">Продано на сумму</div>
                    <div class="metric-value">${escapeHtml(formatMoney(totalSold))}</div>
                </div>
            </div>
        `;
        document.getElementById("client-history-list").innerHTML = createTable([
            {
                label: "Визит",
                render: (item) => `
                    <div class="row-title">${escapeHtml(formatDateTime(item.visit_at))}</div>
                    <div class="row-meta">Филиал: ${escapeHtml(item.branch_id || "—")}</div>
                `,
            },
            {
                label: "Статус",
                render: (item) => `<span class="pill">${escapeHtml(item.visit_status)}</span>`,
            },
            {
                label: "Финансы",
                render: (item) => `
                    <div>Продажа: ${escapeHtml(formatMoney(item.total_cost))}</div>
                    <div class="row-meta">Оплачено: ${escapeHtml(formatMoney(item.paid_amount))}</div>
                `,
            },
            {
                label: "Комментарий",
                render: (item) => escapeHtml(item.comment || "—"),
            },
        ], visits);
    } catch (error) {
        setError("client-history-metrics", error);
        setError("client-history-list", error);
    }
}

async function loadSegments(client) {
    setLoading("segments-list");
    try {
        const segments = await requestJson("crm", `/client-segments/segments?organization_id=${client.organization_id}&limit=100&offset=0`);
        const membershipResults = await Promise.allSettled(
            segments.map((segment) => requestJson("crm", `/client-segments/segments/${segment.id}/members?limit=1000&offset=0`)),
        );

        const membershipsBySegmentId = new Map();
        membershipResults.forEach((result, index) => {
            membershipsBySegmentId.set(
                segments[index].id,
                result.status === "fulfilled" ? result.value : [],
            );
        });

        document.getElementById("segments-list").innerHTML = createTable([
            {
                label: "РЎРµРіРјРµРЅС‚",
                render: (item) => `
                    <div class="row-title">${escapeHtml(item.name)}</div>
                    <div class="row-meta">${escapeHtml(item.description || "Р‘РµР· РѕРїРёСЃР°РЅРёСЏ")}</div>
                `,
            },
            {
                label: "РўРёРї",
                render: (item) => `<span class="pill">${item.is_dynamic ? "Р”РёРЅР°РјРёС‡РµСЃРєРёР№" : "РЎС‚Р°С‚РёС‡РµСЃРєРёР№"}</span>`,
            },
            {
                label: "РљР»РёРµРЅС‚ РІ СЃРµРіРјРµРЅС‚Рµ",
                render: (item) => {
                    const members = membershipsBySegmentId.get(item.id) || [];
                    const clientMember = members.find((member) => member.client_id === client.id && member.membership_status !== "exited");
                    return clientMember
                        ? `<span class="pill">Р’ СЃРµРіРјРµРЅС‚Рµ</span><div class="row-meta">РЎ ${escapeHtml(formatDateTime(clientMember.entered_at))}</div>`
                        : `<span class="pill">РќРµ СЃРѕСЃС‚РѕРёС‚</span>`;
                },
            },
            {
                label: "РЎС‚Р°С‚СѓСЃ",
                render: (item) => escapeHtml(item.status),
            },
        ], segments);
    } catch (error) {
        setError("segments-list", error);
    }
}

async function loadExtendedClientData(client) {
    await Promise.all([
        loadClientHistory(client),
        loadSegments(client),
        loadClientFiles(client),
    ]);
}

async function selectClient(clientId) {
    const client = state.crmClients.find((item) => item.id === clientId) || await requestJson("crm", `/clients-core/clients/${clientId}`);
    state.selectedClient = client;
    renderSelectedClient(client);
    await Promise.all([
        loadClientProfile(client),
        loadExtendedClientData(client),
        loadLoyaltyData(client),
    ]);
}

async function uploadClientFile(form) {
    const client = requireSelectedClient();
    const formData = new FormData();
    formData.append("organization_id", form.organization_id.value);
    formData.append("client_id", String(client.id));
    formData.append("file_category", form.file_category.value);
    if (form.uploaded_by.value) {
        formData.append("uploaded_by", form.uploaded_by.value);
    }
    if (!form.file.files[0]) {
        throw new Error("Р’С‹Р±РµСЂРёС‚Рµ С„Р°Р№Р» РґР»СЏ Р·Р°РіСЂСѓР·РєРё.");
    }
    formData.append("file", form.file.files[0]);
    const data = await requestRaw("crm", "/client-files/upload", {
        method: "POST",
        body: formData,
    });
    document.getElementById("client-file-upload-result").innerHTML = `
        <div class="info-card">
            <div class="info-card-title">Файл загружен</div>
            <div class="info-card-value">${escapeHtml(data.file_name)}</div>
            <div class="row-meta">Категория: ${escapeHtml(data.file_category)}</div>
            <div class="row-meta">ID файла: ${escapeHtml(data.id)}</div>
            <div class="row-meta">Клиент: ${escapeHtml(data.client_id)} | Организация: ${escapeHtml(data.organization_id)}</div>
            <div class="row-meta">MIME: ${escapeHtml(data.mime_type)}</div>
            <div class="row-meta">Размер: ${escapeHtml(formatMoney(data.size))} байт</div>
            <div class="row-meta">Хранилище: ${escapeHtml(data.storage_key)}</div>
            <div class="row-meta">Загрузил: ${escapeHtml(data.uploaded_by || "—")}</div>
            <div class="row-meta">Создан: ${escapeHtml(formatDateTime(data.created_at))}</div>
        </div>
    `;
    await loadClientFiles(client);
}

async function createClientVisit(form) {
    const client = requireSelectedClient();
    await requestJson("crm", "/client-history/visits", {
        method: "POST",
        body: JSON.stringify({
            organization_id: Number(form.organization_id.value),
            client_id: client.id,
            visit_at: isoOrNull(form.visit_at.value),
            visit_status: form.visit_status.value,
            branch_id: optionalNumber(form.branch_id.value),
            total_cost: Number(form.total_cost.value || 0),
            discount_amount: Number(form.discount_amount.value || 0),
            paid_amount: Number(form.paid_amount.value || 0),
            debt_amount: Number(form.debt_amount.value || 0),
            comment: optionalString(form.comment.value),
        }),
    });
    await loadClientHistory(client);
}

async function createSegment(form) {
    await requestJson("crm", "/client-segments/segments", {
        method: "POST",
        body: JSON.stringify({
            organization_id: Number(form.organization_id.value),
            name: form.name.value,
            description: optionalString(form.description.value),
            is_dynamic: form.is_dynamic.checked,
            status: form.status.value,
        }),
    });
    if (state.selectedClient) {
        await loadSegments(state.selectedClient);
    }
}

async function addClientToSegment(form) {
    const client = requireSelectedClient();
    const segmentId = Number(form.segment_id.value);
    await requestJson("crm", `/client-segments/segments/${segmentId}/members/${client.id}`, {
        method: "POST",
    });
    await loadSegments(client);
}

async function filterClientFiles(form) {
    const client = requireSelectedClient();
    await loadClientFilesByCategory(client, form.file_category.value || null);
}

async function refreshAllData() {
    await Promise.all([
        checkHealth(),
        loadSummary(),
        loadOrganizations(),
        loadUsersAndAccess(),
        loadClients(),
        loadEvents(),
        loadAudit(),
        loadFileCategories(),
    ]);

    if (state.selectedClient) {
        await Promise.all([
            loadClientProfile(state.selectedClient),
            loadExtendedClientData(state.selectedClient),
            loadLoyaltyData(state.selectedClient),
        ]);
    }
}

async function loadLoyaltyClientSearch(queryText) {
    setLoading("loyalty-client-search-results", "Идёт поиск клиента...");
    try {
        const items = await requestJson("crm", `/clients-core/clients/search?query=${encodeURIComponent(queryText)}&limit=50&offset=0`);
        state.crmClients = items;
        const html = createTable([
            {
                label: "Клиент",
                render: (item) => `
                    <button type="button" class="link-button" data-loyalty-client-id="${escapeHtml(item.id)}">
                        <div class="row-title">${escapeHtml(item.full_name || [item.first_name, item.last_name].filter(Boolean).join(" ") || "Без имени")}</div>
                        <div class="row-meta">${escapeHtml(item.primary_phone || item.email || "Контакт не указан")}</div>
                    </button>
                `,
            },
            {
                label: "Статус",
                render: (item) => `<span class="pill">${escapeHtml(item.status || "active")}</span>`,
            },
        ], items);
        document.getElementById("loyalty-client-search-results").innerHTML = html;
        document.querySelectorAll("[data-loyalty-client-id]").forEach((button) => {
            button.addEventListener("click", () => selectClient(Number(button.dataset.loyaltyClientId)));
        });
    } catch (error) {
        setError("loyalty-client-search-results", error);
    }
}

async function loadLoyaltyData(client) {
    await Promise.all([
        loadBonusData(client.id),
        loadCertificates(client.id),
        loadSubscriptions(client.id),
        loadPromotions(client.id),
        loadReferrals(client.id),
    ]);
}

async function loadBonusData(clientId) {
    setLoading("bonus-balance");
    setLoading("bonus-history");
    try {
        const [balance, history] = await Promise.all([
            requestJson("loyalty", `/client-bonuses/clients/${clientId}/balance`),
            requestJson("loyalty", `/client-bonuses/clients/${clientId}/history?limit=100&offset=0`),
        ]);

        document.getElementById("bonus-balance").innerHTML = `
            <div class="metric-card">
                <div class="metric-label">Баланс бонусов</div>
                <div class="metric-value">${escapeHtml(balance.balance)}</div>
            </div>
        `;

        document.getElementById("bonus-history").innerHTML = createTable([
            {
                label: "Операция",
                render: (item) => `
                    <div class="row-title">${escapeHtml(item.transaction_type)}</div>
                    <div class="row-meta">${escapeHtml(item.bonus_type)}</div>
                `,
            },
            {
                label: "Сумма",
                render: (item) => escapeHtml(item.amount),
            },
            {
                label: "Причина",
                render: (item) => escapeHtml(item.reason || "—"),
            },
            {
                label: "Срок действия",
                render: (item) => escapeHtml(formatDateTime(item.expires_at)),
            },
        ], history);
    } catch (error) {
        setError("bonus-balance", error);
        setError("bonus-history", error);
    }
}

async function loadCertificates(clientId) {
    setLoading("certificates-list");
    try {
        const certificates = await requestJson("loyalty", `/client-certificates/clients/${clientId}`);
        document.getElementById("certificates-list").innerHTML = createTable([
            {
                label: "Сертификат",
                render: (item) => `
                    <div class="row-title">${escapeHtml(item.certificate_code)}</div>
                    <div class="row-meta">${escapeHtml(item.certificate_type)}</div>
                `,
            },
            {
                label: "Номинал / остаток",
                render: (item) => `${escapeHtml(formatMoney(item.nominal_amount))} / ${escapeHtml(formatMoney(item.balance_amount))}`,
            },
            {
                label: "Статус",
                render: (item) => `<span class="pill">${escapeHtml(item.status)}</span>`,
            },
            {
                label: "Срок",
                render: (item) => escapeHtml(formatDateTime(item.expires_at || item.issued_at)),
            },
        ], certificates);
    } catch (error) {
        setError("certificates-list", error);
    }
}

async function loadSubscriptions(clientId) {
    setLoading("subscriptions-list");
    try {
        const subscriptions = await requestJson("loyalty", `/client-subscriptions/clients/${clientId}`);
        document.getElementById("subscriptions-list").innerHTML = createTable([
            {
                label: "Абонемент",
                render: (item) => `
                    <div class="row-title">${escapeHtml(item.subscription_name)}</div>
                    <div class="row-meta">ID: ${escapeHtml(item.id)} · ${escapeHtml(item.status)}</div>
                `,
            },
            {
                label: "Визиты",
                render: (item) => `${escapeHtml(item.visits_left)} из ${escapeHtml(item.visits_total)}`,
            },
            {
                label: "Депозит",
                render: (item) => `${escapeHtml(formatMoney(item.deposit_left))} из ${escapeHtml(formatMoney(item.deposit_amount))}`,
            },
            {
                label: "Период",
                render: (item) => `${escapeHtml(formatDateTime(item.started_at))}<div class="row-meta">${escapeHtml(formatDateTime(item.expires_at))}</div>`,
            },
            {
                label: "Семья / авто",
                render: (item) => `
                    <div>${item.family_client_ids?.length ? `Семья: ${escapeHtml(item.family_client_ids.join(", "))}` : "Семья: нет"}</div>
                    <div class="row-meta">${item.auto_renewal_enabled ? "Автопродление включено" : "Автопродление выключено"}</div>
                `,
            },
        ], subscriptions);
    } catch (error) {
        setError("subscriptions-list", error);
    }
}

async function loadPromotions(clientId) {
    setLoading("promotions-list");
    try {
        const promotions = await requestJson("loyalty", `/client-promotions/clients/${clientId}`);
        document.getElementById("promotions-list").innerHTML = createTable([
            {
                label: "Акция",
                render: (item) => `
                    <div class="row-title">${escapeHtml(item.promotion_name)}</div>
                    <div class="row-meta">${escapeHtml(item.promo_code || "Без промокода")}</div>
                `,
            },
            {
                label: "Выгода",
                render: (item) => `${escapeHtml(item.discount_type || item.promotion_type)}: ${escapeHtml(formatMoney(item.discount_value))}`,
            },
            {
                label: "Лимит",
                render: (item) => `${escapeHtml(item.used_count)}${item.usage_limit ? ` / ${escapeHtml(item.usage_limit)}` : ""}`,
            },
            {
                label: "Период",
                render: (item) => `${escapeHtml(formatDateTime(item.valid_from))}<div class="row-meta">${escapeHtml(formatDateTime(item.valid_until))}</div>`,
            },
        ], promotions);
    } catch (error) {
        setError("promotions-list", error);
    }
}

async function loadReferrals(clientId) {
    setLoading("referrals-list");
    try {
        const [stats, referrals] = await Promise.all([
            requestJson("loyalty", `/client-referrals/referrers/${clientId}/stats`),
            requestJson("loyalty", `/client-referrals/referrers/${clientId}/referrals?limit=100&offset=0`),
        ]);
        document.getElementById("referrals-list").innerHTML = `
            <div class="metric-card" style="margin-bottom: 14px;">
                <div class="metric-label">Реферальная статистика</div>
                <div class="metric-value">${escapeHtml(stats.successful_invites_count)} / ${escapeHtml(stats.invites_count)}</div>
                <div class="row-meta">Успешных приглашений / всех приглашений</div>
            </div>
            ${createTable([
                {
                    label: "Приглашение",
                    render: (item) => `
                        <div class="row-title">Приглашённый клиент: ${escapeHtml(item.invited_client_id || "ещё не привязан")}</div>
                        <div class="row-meta">Статус награды: ${escapeHtml(item.reward_status)}</div>
                    `,
                },
                {
                    label: "Награда",
                    render: (item) => `${escapeHtml(item.reward_type)}: ${escapeHtml(formatMoney(item.reward_amount))}`,
                },
                {
                    label: "Первый визит",
                    render: (item) => escapeHtml(formatDateTime(item.first_visit_at)),
                },
            ], referrals)}
        `;
    } catch (error) {
        setError("referrals-list", error);
    }
}

async function loadEvents(filters = {}) {
    setLoading("events-list");
    const query = new URLSearchParams({limit: "100", offset: "0"});
    Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });

    try {
        const events = await requestJson("auth", `/events?${query.toString()}`);
        document.getElementById("events-list").innerHTML = createTable([
            {
                label: "Событие",
                render: (item) => `
                    <div class="row-title">${escapeHtml(translateEvent(item.event_type || item.event_name))}</div>
                    <div class="row-meta">${escapeHtml(item.source_service)}</div>
                `,
            },
            {
                label: "Контекст",
                render: (item) => `
                    <div>${escapeHtml(translateEntityType(item.entity_type))}</div>
                    <div class="row-meta">Клиент: ${escapeHtml(item.client_id || "—")}</div>
                `,
            },
            {
                label: "Дата",
                render: (item) => escapeHtml(formatDateTime(item.occurred_at || item.created_at)),
            },
        ], events);
    } catch (error) {
        setError("events-list", error);
    }
}

async function loadAudit(filters = {}) {
    setLoading("audit-list");
    const query = new URLSearchParams({limit: "100", offset: "0"});
    Object.entries(filters).forEach(([key, value]) => {
        if (value) query.set(key, value);
    });

    try {
        const items = await requestJson("auth", `/audit?${query.toString()}`);
        document.getElementById("audit-list").innerHTML = createTable([
            {
                label: "Действие",
                render: (item) => `
                    <div class="row-title">${escapeHtml(translateAuditAction(item.action))}</div>
                    <div class="row-meta">${escapeHtml(translateEntityType(item.entity_type))}</div>
                `,
            },
            {
                label: "Кто / почему",
                render: (item) => `
                    <div>Пользователь: ${escapeHtml(item.user_id || item.actor_id || "—")}</div>
                    <div class="row-meta">${escapeHtml(item.reason || "Причина не указана")}</div>
                `,
            },
            {
                label: "Когда",
                render: (item) => escapeHtml(formatDateTime(item.occurred_at || item.created_at)),
            },
        ], items);
    } catch (error) {
        setError("audit-list", error);
    }
}

async function refreshAllData() {
    await Promise.all([
        checkHealth(),
        loadSummary(),
        loadOrganizations(),
        loadUsersAndAccess(),
        loadClients(),
        loadEvents(),
        loadAudit(),
    ]);

    if (state.selectedClient) {
        await Promise.all([
            loadClientProfile(state.selectedClient),
            loadClientFiles(state.selectedClient),
            loadLoyaltyData(state.selectedClient),
        ]);
    }
}

function formDataToObject(form) {
    const data = new FormData(form);
    return Object.fromEntries(data.entries());
}

function optionalNumber(value) {
    return value === "" || value === null || value === undefined ? null : Number(value);
}

function optionalString(value) {
    return value === "" ? null : value;
}

function optionalJson(value) {
    const raw = optionalString(value);
    return raw ? JSON.parse(raw) : null;
}

function requireSelectedClient() {
    if (!state.selectedClient) {
        throw new Error("Сначала выберите клиента CRM.");
    }
    return state.selectedClient;
}

function bindEvents() {
    document.querySelectorAll(".nav-link").forEach((link) => {
        link.addEventListener("click", () => switchTab(link.dataset.tab));
    });

    document.getElementById("refresh-all-btn").addEventListener("click", refreshAllData);

    document.getElementById("organization-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formDataToObject(event.target);
        try {
            const organization = await requestJson("auth", "/organizations", {
                method: "POST",
                body: JSON.stringify({
                    name: payload.name,
                    owner_user_id: Number(payload.owner_user_id),
                }),
            });
            event.target.reset();
            showToast("Организация создана.", "success");
            await loadOrganizations();
            await loadSummary();
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("user-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formDataToObject(event.target);
        try {
            const user = await requestJson("auth", "/users-access/users", {
                method: "POST",
                body: JSON.stringify({
                    first_name: optionalString(payload.first_name),
                    last_name: optionalString(payload.last_name),
                    email: optionalString(payload.email),
                    phone: optionalString(payload.phone),
                    telegram_id: optionalNumber(payload.telegram_id),
                    password_hash: optionalString(payload.password_hash),
                }),
            });
            event.target.reset();
            const organizationOwnerField = document.querySelector("#organization-form [name=owner_user_id]");
            if (organizationOwnerField) {
                organizationOwnerField.value = String(user.id);
            }
            showToast(`User created. ID: ${user.id}`, "success");
            await loadUsersAndAccess();
            await loadSummary();
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("role-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formDataToObject(event.target);
        try {
            await requestJson("auth", "/users-access/roles", {
                method: "POST",
                body: JSON.stringify({
                    organization_id: Number(payload.organization_id),
                    name: payload.name,
                }),
            });
            event.target.reset();
            showToast("Р РѕР»СЊ СЃРѕР·РґР°РЅР°.", "success");
            await loadUsersAndAccess();
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("crm-client-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formDataToObject(event.target);
        try {
            await requestJson("crm", "/clients-core/clients", {
                method: "POST",
                body: JSON.stringify({
                    organization_id: Number(payload.organization_id),
                    first_name: optionalString(payload.first_name),
                    last_name: optionalString(payload.last_name),
                    middle_name: optionalString(payload.middle_name),
                    max_id: optionalNumber(payload.max_id),
                    primary_phone: optionalString(payload.primary_phone),
                    secondary_phone: optionalString(payload.secondary_phone),
                    email: optionalString(payload.email),
                    telegram_id: optionalNumber(payload.telegram_id),
                    birth_date: optionalString(payload.birth_date),
                    gender: optionalString(payload.gender),
                    comment: optionalString(payload.comment),
                    status: event.target.querySelector("[name=is_active]").checked ? "active" : "inactive",
                }),
            });
            event.target.reset();
            event.target.querySelector("[name=is_active]").checked = true;
            showToast("РљР»РёРµРЅС‚ CRM СЃРѕР·РґР°РЅ.", "success");
            await loadClients();
            await loadSummary();
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("crm-search-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const queryText = document.getElementById("crm-search-query").value.trim();
        const organizationId = document.getElementById("crm-search-organization").value.trim();
        await searchClients(queryText, organizationId || null);
    });

    document.getElementById("crm-load-all-btn").addEventListener("click", () => {
        const organizationId = document.getElementById("crm-search-organization").value.trim();
        loadClients({organizationId: organizationId || null});
    });

    document.getElementById("client-visit-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await createClientVisit(event.target);
            event.target.reset();
            event.target.querySelector("[name=visit_status]").value = "completed";
            event.target.querySelector("[name=total_cost]").value = "0";
            event.target.querySelector("[name=paid_amount]").value = "0";
            event.target.querySelector("[name=discount_amount]").value = "0";
            event.target.querySelector("[name=debt_amount]").value = "0";
            showToast("Р’РёР·РёС‚ РєР»РёРµРЅС‚Р° РґРѕР±Р°РІР»РµРЅ.", "success");
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("segment-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await createSegment(event.target);
            event.target.reset();
            event.target.querySelector("[name=status]").value = "active";
            showToast("РЎРµРіРјРµРЅС‚ СЃРѕР·РґР°РЅ.", "success");
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("segment-member-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await addClientToSegment(event.target);
            event.target.reset();
            showToast("РљР»РёРµРЅС‚ РґРѕР±Р°РІР»РµРЅ РІ СЃРµРіРјРµРЅС‚.", "success");
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("client-file-upload-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await uploadClientFile(event.target);
            event.target.reset();
            showToast("Р¤Р°Р№Р» РєР»РёРµРЅС‚Р° Р·Р°РіСЂСѓР¶РµРЅ.", "success");
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("client-file-filter-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            await filterClientFiles(event.target);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("client-files-reset-btn").addEventListener("click", async () => {
        try {
            const client = requireSelectedClient();
            document.getElementById("file-category-filter").value = "";
            await loadClientFilesByCategory(client, null);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("loyalty-client-search-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        await loadLoyaltyClientSearch(document.getElementById("loyalty-client-search-query").value.trim());
    });

    document.getElementById("bonus-accrual-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", "/client-bonuses/accruals", {
                method: "POST",
                body: JSON.stringify({
                    client_id: client.id,
                    bonus_type: payload.bonus_type,
                    amount: Number(payload.amount),
                    reason: payload.reason,
                }),
            });
            event.target.reset();
            event.target.querySelector("[name=bonus_type]").value = "cashback";
            showToast("Бонусы начислены.", "success");
            await loadBonusData(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("bonus-writeoff-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", "/client-bonuses/write-offs", {
                method: "POST",
                body: JSON.stringify({
                    client_id: client.id,
                    bonus_type: payload.bonus_type,
                    amount: Number(payload.amount),
                    reason: payload.reason,
                }),
            });
            event.target.reset();
            event.target.querySelector("[name=bonus_type]").value = "cashback";
            showToast("Бонусы списаны.", "success");
            await loadBonusData(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("bonus-level-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", "/client-bonuses/levels", {
                method: "POST",
                body: JSON.stringify({
                    name: payload.name,
                    params: optionalJson(payload.params),
                }),
            });
            event.target.reset();
            showToast("Уровень клиента создан.", "success");
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("bonus-rule-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", "/client-bonuses/rules", {
                method: "POST",
                body: JSON.stringify({
                    name: payload.name,
                    rule_type: payload.rule_type,
                    bonus_type: payload.bonus_type,
                    amount: Number(payload.amount),
                    client_level: optionalString(payload.client_level),
                    expires_in_days: optionalNumber(payload.expires_in_days),
                    usage_restrictions: optionalJson(payload.usage_restrictions),
                    level_params: optionalJson(payload.level_params),
                }),
            });
            event.target.reset();
            event.target.querySelector("[name=bonus_type]").value = "cashback";
            showToast("Правило бонусов создано.", "success");
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("bonus-rule-apply-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", `/client-bonuses/rules/${Number(payload.rule_id)}/apply`, {
                method: "POST",
                body: JSON.stringify({
                    client_id: client.id,
                }),
            });
            event.target.reset();
            showToast("Правило применено.", "success");
            await loadBonusData(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("certificate-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", "/client-certificates", {
                method: "POST",
                body: JSON.stringify({
                    client_id: client.id,
                    certificate_type: payload.certificate_type,
                    certificate_code: payload.certificate_code,
                    nominal_amount: Number(payload.nominal_amount),
                    balance_amount: Number(payload.nominal_amount),
                    issued_at: isoOrNull(payload.issued_at),
                    expires_at: isoOrNull(payload.expires_at),
                }),
            });
            event.target.reset();
            event.target.querySelector("[name=certificate_type]").value = "digital";
            showToast("Сертификат выпущен.", "success");
            await loadCertificates(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("certificate-use-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", `/client-certificates/${Number(payload.certificate_id)}/use`, {
                method: "POST",
                body: JSON.stringify({
                    amount: Number(payload.amount),
                    convert_rest_to_deposit: event.target.querySelector("[name=convert_rest_to_deposit]").checked,
                }),
            });
            event.target.reset();
            showToast("Сертификат погашен.", "success");
            await loadCertificates(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("subscription-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            const visitsTotal = Number(payload.visits_total);
            const depositAmount = Number(payload.deposit_amount);
            await requestJson("loyalty", "/client-subscriptions", {
                method: "POST",
                body: JSON.stringify({
                    client_id: client.id,
                    subscription_name: payload.subscription_name,
                    visits_total: visitsTotal,
                    visits_left: visitsTotal,
                    deposit_amount: depositAmount,
                    deposit_left: depositAmount,
                    started_at: isoOrNull(payload.started_at),
                    expires_at: isoOrNull(payload.expires_at),
                    auto_renewal_enabled: event.target.querySelector("[name=auto_renewal_enabled]").checked,
                }),
            });
            event.target.reset();
            showToast("Абонемент создан.", "success");
            await loadSubscriptions(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("subscription-writeoff-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", `/client-subscriptions/${Number(payload.subscription_id)}/write-off-after-visit`, {
                method: "POST",
                body: JSON.stringify({
                    visit_id: Number(payload.visit_id),
                    consumer_client_id: optionalNumber(payload.consumer_client_id),
                    visits_count: Number(payload.visits_count || 0),
                    deposit_amount: Number(payload.deposit_amount || 0),
                }),
            });
            event.target.reset();
            event.target.querySelector("[name=visits_count]").value = "1";
            event.target.querySelector("[name=deposit_amount]").value = "0";
            showToast("Абонемент списан по визиту.", "success");
            await loadSubscriptions(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("subscription-transfer-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", `/client-subscriptions/${Number(payload.subscription_id)}/transfer`, {
                method: "POST",
                body: JSON.stringify({
                    to_client_id: Number(payload.to_client_id),
                }),
            });
            event.target.reset();
            showToast("Абонемент передан.", "success");
            await loadSubscriptions(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("subscription-family-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", `/client-subscriptions/${Number(payload.subscription_id)}/family-clients`, {
                method: "POST",
                body: JSON.stringify({
                    family_client_id: Number(payload.family_client_id),
                }),
            });
            event.target.reset();
            showToast("Член семьи добавлен.", "success");
            await loadSubscriptions(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("promotion-create-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", "/client-promotions", {
                method: "POST",
                body: JSON.stringify({
                    client_id: client.id,
                    promotion_name: payload.promotion_name,
                    promotion_type: payload.promotion_type,
                    discount_type: optionalString(payload.discount_type),
                    discount_value: Number(payload.discount_value || 0),
                    promo_code: optionalString(payload.promo_code),
                    gift: optionalString(payload.gift),
                    package_offer: optionalJson(payload.package_offer),
                    valid_from: isoOrNull(payload.valid_from),
                    valid_until: isoOrNull(payload.valid_until),
                    client_segment: optionalString(payload.client_segment),
                    min_amount: Number(payload.min_amount || 0),
                    usage_limit: optionalNumber(payload.usage_limit),
                    weak_hours: optionalJson(payload.weak_hours),
                }),
            });
            event.target.reset();
            event.target.querySelector("[name=promotion_type]").value = "discount";
            event.target.querySelector("[name=discount_type]").value = "percent";
            showToast("Акция создана.", "success");
            await loadPromotions(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("referral-source-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        try {
            const client = requireSelectedClient();
            const payload = formDataToObject(event.target);
            await requestJson("loyalty", "/client-referrals/sources", {
                method: "POST",
                body: JSON.stringify({
                    referrer_client_id: client.id,
                    referral_code: payload.referral_code,
                    referral_link: payload.referral_link,
                    reward_type: optionalString(payload.reward_type) || "bonus",
                    reward_amount: Number(payload.reward_amount || 0),
                }),
            });
            event.target.reset();
            showToast("Реферальная ссылка создана.", "success");
            await loadReferrals(client.id);
        } catch (error) {
            showToast(error.message, "error");
        }
    });

    document.getElementById("events-filter-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formDataToObject(event.target);
        await loadEvents(payload);
    });

    document.getElementById("audit-filter-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const payload = formDataToObject(event.target);
        await loadAudit(payload);
    });
}

async function bootstrap() {
    state.config = loadConfig();
    bindEvents();
    await refreshAllData();
}

document.addEventListener("DOMContentLoaded", bootstrap);

