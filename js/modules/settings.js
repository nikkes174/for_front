import { api } from "../api.js";
import { escapeHtml, formData, numberOrNull, optional, rows, selectField, setMessage } from "../dom.js";

const no = "Не указано";
let cache = {};

const PERMISSION_TREE = [
  {
    service: "Обзор",
    sections: [
      { name: "Главная", actions: [{ code: "overview.view", name: "Просмотр" }] },
    ],
  },
  {
    service: "CRM",
    sections: [
      { name: "Клиенты", actions: [
        { code: "clients.clients.view", name: "Просмотр" },
        { code: "clients.clients.create", name: "Создание" },
        { code: "clients.clients.edit", name: "Редактирование" },
        { code: "clients.visits.create", name: "Добавление визитов" },
      ] },
    ],
  },
  {
    service: "Лояльность",
    sections: [
      { name: "Правила", actions: [{ code: "loyalty.rules.view", name: "Просмотр" }] },
      { name: "Уровни", actions: [{ code: "loyalty.levels.view", name: "Просмотр" }] },
      { name: "Транзакции", actions: [{ code: "loyalty.transactions.view", name: "Просмотр" }] },
      { name: "Акции", actions: [{ code: "loyalty.promotions.view", name: "Просмотр" }] },
      { name: "Сертификаты", actions: [{ code: "loyalty.certificates.view", name: "Просмотр" }] },
      { name: "Абонементы", actions: [{ code: "loyalty.subscriptions.view", name: "Просмотр" }] },
      { name: "Рефералы", actions: [{ code: "loyalty.referrals.view", name: "Просмотр" }] },
    ],
  },
  {
    service: "Настройки",
    sections: [
      { name: "Юридические лица", actions: [
        { code: "settings.legal.view", name: "Просмотр" },
        { code: "settings.legal.create", name: "Создание" },
      ] },
      { name: "Филиалы", actions: [
        { code: "settings.branches.view", name: "Просмотр" },
        { code: "settings.branches.create", name: "Создание" },
      ] },
      { name: "Подразделения", actions: [
        { code: "settings.departments.view", name: "Просмотр" },
        { code: "settings.departments.create", name: "Создание" },
      ] },
      { name: "Рабочие места", actions: [
        { code: "settings.workplaces.view", name: "Просмотр" },
        { code: "settings.workplaces.create", name: "Создание" },
      ] },
      { name: "Роли и права", actions: [{ code: "settings.roles.manage", name: "Управление" }] },
      { name: "Пользователи", actions: [
        { code: "settings.users.view", name: "Просмотр" },
        { code: "settings.users.create", name: "Создание" },
        { code: "settings.users.assign_roles", name: "Назначение ролей" },
      ] },
      { name: "Бренды", actions: [
        { code: "settings.brands.view", name: "Просмотр" },
        { code: "settings.brands.create", name: "Создание" },
      ] },
      { name: "Аудит", actions: [
        { code: "settings.audit.view", name: "Аудит" },
        { code: "settings.events.view", name: "События" },
      ] },
    ],
  },
];

const PERMISSIONS = PERMISSION_TREE.flatMap((service) =>
  service.sections.flatMap((section) =>
    section.actions.map((action) => ({
      ...action,
      description: `${service.service} - ${section.name} - ${action.name}`,
    })),
  ),
);

function permissionByCode(code) {
  return PERMISSIONS.find((permission) => permission.code === code);
}

function nameById(items, id) {
  return items.find((item) => item.id === id)?.name || id || no;
}

function humanizeCode(value) {
  const text = String(value || "").trim();
  if (!text) return no;
  const dictionary = {
    create: "Создание",
    created: "Создание",
    update: "Изменение",
    updated: "Изменение",
    edit: "Редактирование",
    delete: "Удаление",
    deleted: "Удаление",
    login: "Вход",
    logout: "Выход",
    renew: "Продление",
    transfer: "Перенос",
    client: "Клиент",
    subscription: "Абонемент",
    promotion: "Акция",
    subscription_create: "Создание абонемента",
    subscription_renew: "Продление абонемента",
    subscription_transfer: "Перенос абонемента",
    promotion_create: "Создание акции",
    legal: "Юридическое лицо",
    legal_entity: "Юридическое лицо",
    client_subscription: "Абонемент клиента",
    client_promotion: "Акция клиента",
    branch: "Филиал",
    department: "Подразделение",
    workplace: "Рабочее место",
    role: "Роль",
    permission: "Право доступа",
    user: "Пользователь",
    membership: "Доступ пользователя",
    event: "Событие",
  };
  const phraseKey = text.toLowerCase().replace(/\s+/g, "_");
  if (dictionary[phraseKey]) return dictionary[phraseKey];
  return dictionary[text] || dictionary[text.toLowerCase()] || text
    .split(/[\s._-]+/)
    .map((part) => dictionary[part.toLowerCase()] || part)
    .join(" ");
}

function formatDateTime(value) {
  if (!value) return no;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function jsonOrNull(value) {
  if (!String(value || "").trim()) return null;
  return JSON.parse(value);
}

function legalRequisites(data) {
  return {
    inn: optional(data.inn),
    ogrn: optional(data.ogrn),
    kpp: optional(data.kpp),
    legal_address: optional(data.legal_address),
  };
}

function bankDetails(data) {
  return {
    bank: optional(data.bank),
    bik: optional(data.bik),
    settlement_account: optional(data.settlement_account),
    correspondent_account: optional(data.correspondent_account),
  };
}

function section(title, body, hint = "") {
  const hintMarkup = hint
    ? `<span class="title-hint" tabindex="0" aria-label="${escapeHtml(hint)}" data-tooltip="${escapeHtml(hint)}">?</span>`
    : "";
  return `<div class="subpanel"><h3 class="subpanel-title">${escapeHtml(title)}${hintMarkup}</h3>${body}</div>`;
}

function entityList(items, empty, type, title, subtitle = () => "", actions = {}) {
  if (!items.length) return `<p class="empty">${escapeHtml(empty)}</p>`;
  const deleteType = actions.deleteType || type;
  const deleteId = actions.deleteId || ((item) => item.id);
  const deleteLabel = actions.deleteLabel || "Удалить";
  return `
    <div class="entity-list">
      ${items.map((item) => {
        const subtitleText = subtitle(item);
        const itemDeleteId = deleteId(item);
        return `
          <div style="display:flex; gap:8px; align-items:stretch;">
            <button type="button" class="entity-card" data-edit-entity="${escapeHtml(type)}" data-id="${item.id}" style="flex:1; min-width:0;">
              <b>${escapeHtml(title(item))}</b>
              ${subtitleText ? `<span>${escapeHtml(subtitleText)}</span>` : ""}
            </button>
            ${itemDeleteId !== undefined && itemDeleteId !== null && itemDeleteId !== ""
              ? `<button type="button" class="ghost" data-delete-entity="${escapeHtml(deleteType)}" data-id="${escapeHtml(itemDeleteId)}">${escapeHtml(deleteLabel)}</button>`
              : ""
            }
          </div>
        `;
      }).join("")}
    </div>
  `;
}

function findEntity(type, id) {
  const source = {
    brand: cache.brands,
    legal: cache.legalEntities,
    branch: cache.branches,
    department: cache.departments,
    workplace: cache.workplaces,
    module: cache.modules,
    user: cache.users,
    role: cache.roles,
    permission: cache.permissions,
    branchMembership: cache.branchMemberships,
  }[type] || [];
  return source.find((item) => String(item.id) === String(id));
}

function modalFields(type, item) {
  if (type === "brand") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
  `;
  if (type === "legal") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Тип</span><input name="legal_type" value="${escapeHtml(item.legal_type || "")}"></label>
    <label><span>Налоговая система</span><input name="tax_system" value="${escapeHtml(item.tax_system || "")}"></label>
    <label><span>ИНН</span><input name="inn" value="${escapeHtml(item.requisites?.inn || "")}"></label>
    <label><span>ОГРН/ОГРНИП</span><input name="ogrn" value="${escapeHtml(item.requisites?.ogrn || "")}"></label>
    <label><span>КПП</span><input name="kpp" value="${escapeHtml(item.requisites?.kpp || "")}"></label>
    <label><span>Юр. адрес</span><input name="legal_address" value="${escapeHtml(item.requisites?.legal_address || "")}"></label>
    <label><span>Банк</span><input name="bank" value="${escapeHtml(item.bank_details?.bank || "")}"></label>
    <label><span>БИК</span><input name="bik" value="${escapeHtml(item.bank_details?.bik || "")}"></label>
    <label><span>Расчётный счёт</span><input name="settlement_account" value="${escapeHtml(item.bank_details?.settlement_account || "")}"></label>
    <label><span>Корр. счёт</span><input name="correspondent_account" value="${escapeHtml(item.bank_details?.correspondent_account || "")}"></label>
  `;
  if (type === "branch") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Адрес</span><input name="address" value="${escapeHtml(item.address || "")}"></label>
    <label><span>Телефон</span><input name="phone" value="${escapeHtml(item.phone || "")}"></label>
    <label><span>Часовой пояс</span><input name="timezone" value="${escapeHtml(item.timezone || "Europe/Moscow")}"></label>
    ${selectField("Бренд", "brand_id", cache.brands, item.brand_id)}
    ${selectField("Юридическое лицо", "legal_entity_id", cache.legalEntities, item.legal_entity_id)}
  `;
  if (type === "department") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
  `;
  if (type === "workplace") return `
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    ${selectField("Подразделение", "department_id", cache.departments, item.department_id)}
  `;
  if (type === "module") return `
    <label><span>Название модуля</span><input name="module_name" value="${escapeHtml(item.module_name)}" required></label>
  `;
  if (type === "user") return `
    <div class="readonly-field"><span>ID пользователя</span><b>${escapeHtml(item.id)}</b></div>
    <div class="readonly-field"><span>Создан</span><b>${escapeHtml(item.created_at || no)}</b></div>
    <label><span>Имя</span><input name="first_name" value="${escapeHtml(item.first_name || "")}"></label>
    <label><span>Отчество</span><input name="middle_name" value="${escapeHtml(item.middle_name || "")}"></label>
    <label><span>Фамилия</span><input name="last_name" value="${escapeHtml(item.last_name || "")}"></label>
    <label><span>Телефон</span><input name="phone" value="${escapeHtml(item.phone || "")}"></label>
    <label><span>Email</span><input name="email" value="${escapeHtml(item.email || "")}"></label>
    ${selectField("Роль в организации", "role_id", cache.roles, cache.memberships.find((membership) => membership.user_id === item.id)?.role_id)}
    <label><span>Активен</span><select name="is_active">
      <option value="true" ${item.is_active ? "selected" : ""}>Да</option>
      <option value="false" ${!item.is_active ? "selected" : ""}>Нет</option>
    </select></label>
    <label><span>Заблокирован</span><select name="is_blocked">
      <option value="false" ${!item.is_blocked ? "selected" : ""}>Нет</option>
      <option value="true" ${item.is_blocked ? "selected" : ""}>Да</option>
    </select></label>
  `;
  if (type === "role") return `
    <label class="modal-full"><span>Название роли</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <div class="permission-matrix modal-permission-matrix modal-full">
      ${PERMISSION_TREE.map((service) => `
        <div class="permission-service">
          <h5>${escapeHtml(service.service)}</h5>
          ${service.sections.map((part) => `
            <div class="permission-section">
              <strong>${escapeHtml(part.name)}</strong>
              <div class="permission-actions">
                ${part.actions.map((action) => `
                  <label class="checkbox">
                    <input
                      type="checkbox"
                      name="permission_codes"
                      value="${escapeHtml(action.code)}"
                      ${new Set((cache.rolePermissions?.[item.id] || []).map((permission) => permission.code)).has(action.code) ? "checked" : ""}
                    >
                    ${escapeHtml(action.name)}
                  </label>
                `).join("")}
              </div>
            </div>
          `).join("")}
        </div>
      `).join("")}
    </div>
  `;
  if (type === "permission") return `
    <label><span>Код</span><input name="code" value="${escapeHtml(item.code)}" required></label>
    <label><span>Название</span><input name="name" value="${escapeHtml(item.name)}" required></label>
    <label><span>Описание</span><input name="description" value="${escapeHtml(item.description || "")}"></label>
  `;
  if (type === "branchMembership") return `
    ${selectField("Роль", "role_id", cache.roles, item.role_id, "Выберите роль")}
  `;
  return "";
}

function openEntityModal(type, item) {
  const titles = {
    brand: "Бренд",
    legal: "Юридическое лицо",
    branch: "Филиал",
    department: "Подразделение",
    workplace: "Рабочее место",
    module: "Модуль",
    user: "Пользователь",
    role: "Роль",
    permission: "Право",
    branchMembership: "Доступ к филиалу",
  };
  const modalTitle = item.name
    || item.module_name
    || [item.last_name, item.first_name, item.middle_name].filter(Boolean).join(" ")
    || item.email
    || item.phone
    || `${titles[type] || "Сущность"} #${item.id}`;

  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-backdrop" data-settings-modal>
      <div class="modal-card">
        <div class="modal-head">
          <h3>${escapeHtml(modalTitle)}</h3>
          <button type="button" class="ghost" data-close-modal>Закрыть</button>
        </div>
        <form class="modal-grid" data-entity-edit data-type="${escapeHtml(type)}" data-id="${escapeHtml(item.id)}">
          ${modalFields(type, item)}
          <p data-message></p>
          <button class="primary">Сохранить</button>
        </form>
      </div>
    </div>
  `);
}

async function saveEntity(type, id, data) {
  if (type === "brand") return api.updateBrand(id, { name: data.name });
  if (type === "legal") return api.updateLegalEntity(id, {
    name: data.name,
    legal_type: optional(data.legal_type),
    tax_system: optional(data.tax_system),
    requisites: legalRequisites(data),
    bank_details: bankDetails(data),
  });
  if (type === "branch") return api.updateBranch(id, {
    name: data.name,
    address: optional(data.address),
    phone: optional(data.phone),
    timezone: optional(data.timezone),
    brand_id: numberOrNull(data.brand_id),
    legal_entity_id: numberOrNull(data.legal_entity_id),
  });
  if (type === "department") return api.updateDepartment(id, { name: data.name });
  if (type === "workplace") return api.updateWorkplace(id, {
    name: data.name,
    department_id: numberOrNull(data.department_id),
  });
  if (type === "module") return api.updateModule(id, { module_name: data.module_name });
  if (type === "user") return api.updateUser(id, {
    first_name: optional(data.first_name),
    middle_name: optional(data.middle_name),
    last_name: optional(data.last_name),
    phone: optional(data.phone),
    email: optional(data.email),
    is_active: data.is_active === "true",
    is_blocked: data.is_blocked === "true",
  }).then(async (updated) => {
    const membership = cache.memberships.find((item) => String(item.user_id) === String(id));
    const roleId = numberOrNull(data.role_id);
    if (roleId && membership) {
      await api.updateMembership(membership.id, { role_id: roleId });
    } else if (roleId) {
      await api.assignUser({ user_id: Number(id), organization_id: cache.organizationId, role_id: roleId });
    }
    return updated;
  });
  if (type === "role") return api.updateRole(id, { name: data.name }).then(async (updated) => {
    const codes = Array.isArray(data.permission_codes)
      ? data.permission_codes
      : data.permission_codes
        ? [data.permission_codes]
        : [];
    await api.replaceRolePermissions(id, {
      permissions: codes.map((code) => {
        const permission = permissionByCode(code);
        return {
          organization_id: cache.organizationId,
          code,
          name: permission?.name || code,
          description: permission?.description,
        };
      }),
    });
    return updated;
  });
  if (type === "permission") return api.updatePermission(id, {
    code: data.code,
    name: data.name,
    description: optional(data.description),
  });
  if (type === "branchMembership") return api.updateBranchMembership(id, {
    role_id: numberOrNull(data.role_id),
  });
}

async function deleteEntity(type, id) {
  if (type === "legal") return api.deleteLegalEntity(id);
  if (type === "branch") return api.deleteBranch(id);
  if (type === "department") return api.deleteDepartment(id);
  if (type === "workplace") return api.deleteWorkplace(id);
  if (type === "role") return api.deleteRole(id);
  if (type === "permission") return api.deletePermission(id);
  if (type === "userAccess") return api.deleteMembership(cache.organizationId, id);
  if (type === "branchMembership") return api.deleteBranchMembership(id);
  throw new Error("Неизвестная сущность");
}

export async function settings(ctx) {
  const [
    branches,
    brands,
    legalEntities,
    departments,
    workplaces,
    modules,
    users,
    roles,
    permissions,
    memberships,
    branchMemberships,
    auditLogs,
    events,
  ] = await Promise.all([
    api.branches(ctx.org.id).catch(() => []),
    api.brands(ctx.org.id).catch(() => []),
    api.legalEntities(ctx.org.id).catch(() => []),
    api.departments(ctx.org.id).catch(() => []),
    api.workplaces(ctx.org.id).catch(() => []),
    api.modules(ctx.org.id).catch(() => []),
    api.users(ctx.org.id).catch(() => []),
    api.roles(ctx.org.id).catch(() => []),
    api.permissions(ctx.org.id).catch(() => []),
    api.memberships(ctx.org.id).catch(() => []),
    api.branchMemberships(ctx.org.id).catch(() => []),
    api.auditLogs().catch(() => []),
    api.events().catch(() => []),
  ]);
  const rolePermissions = Object.fromEntries(await Promise.all(
    roles.map(async (role) => [role.id, await api.rolePermissions(role.id).catch(() => [])]),
  ));

  cache = { organizationId: ctx.org.id, branches, brands, legalEntities, departments, workplaces, modules, users, roles, permissions, memberships, branchMemberships, rolePermissions };

  return `
    <section class="panel" data-settings>
      <h2>${escapeHtml(ctx.org.name)}</h2>

      <div id="legal" data-permission="settings.legal.view">
        ${section("Юридические лица", `
          <form class="inline-form compact" data-legal-create data-permission="settings.legal.create">
            <label><span>Название</span><input name="name" required></label>
            <label><span>Тип</span><input name="legal_type" placeholder="ООО, ИП"></label>
            <label><span>Налоги</span><input name="tax_system"></label>
            <label><span>ИНН</span><input name="inn"></label>
            <label><span>ОГРН/ОГРНИП</span><input name="ogrn"></label>
            <label><span>КПП</span><input name="kpp"></label>
            <label><span>Юр. адрес</span><input name="legal_address"></label>
            <label><span>Банк</span><input name="bank"></label>
            <label><span>БИК</span><input name="bik"></label>
            <label><span>Расчётный счёт</span><input name="settlement_account"></label>
            <label><span>Корр. счёт</span><input name="correspondent_account"></label>
            <button class="primary">Добавить Юридическое лицо</button>
            <p data-message></p>
          </form>
          ${entityList(legalEntities, "Юридических лиц пока нет", "legal", (item) => item.name, (item) => `${item.legal_type || no} · ИНН ${item.requisites?.inn || no}`, {
            deleteLabel: "Удалить",
          })}
        `, "Юридические лица — это функциональная зона или отдел внутри бизнеса.")}
      </div>

      <div id="branches" data-permission="settings.branches.view">
        ${section("Филиалы", `
          <form class="inline-form compact" data-branch-create data-permission="settings.branches.create">
            <label><span>Название</span><input name="name" required></label>
            <label><span>Адрес</span><input name="address"></label>
            <label><span>Телефон</span><input name="phone"></label>
            <label><span>Часовой пояс</span><input name="timezone" value="Europe/Moscow"></label>
            ${selectField("Юридическое лицо", "legal_entity_id", legalEntities)}
            <label class="checkbox"><input type="checkbox" name="online_booking_enabled" checked> Онлайн-запись</label>
            <button class="primary">Добавить филиал</button>
            <p data-message></p>
          </form>
          ${entityList(branches, "Филиалов пока нет", "branch", (branch) => branch.name, (branch) => `${branch.address || no} · ${branch.phone || no}`, {
            deleteLabel: "Удалить",
          })}
        `, "Филиалы — это отдельные точки или локации организации.")}
      </div>

      <div id="departments" data-permission="settings.departments.view">
        ${section("Подразделения", `
          <form class="inline-form compact" data-department-create data-permission="settings.departments.create">
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал")}
            <label><span>Название</span><input name="name" required></label>
            <button class="primary">Добавить Подразделение</button>
            <p data-message></p>
          </form>
          ${entityList(departments, "Подразделениеов пока нет", "department", (item) => item.name, (item) => `Филиал: ${nameById(branches, item.branch_id)}`, {
            deleteLabel: "Удалить",
          })}
        `, "Подразделения — это отделы внутри филиала, например администрация или мастера.")}
      </div>

      <div id="workplaces" data-permission="settings.workplaces.view">
        ${section("Рабочие места", `
          <form class="inline-form compact" data-workplace-create data-permission="settings.workplaces.create">
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал")}
            ${selectField("Подразделение", "department_id", departments)}
            <label><span>Название</span><input name="name" required></label>
            <button class="primary">Добавить рабочее место</button>
            <p data-message></p>
          </form>
          ${entityList(workplaces, "Рабочих мест пока нет", "workplace", (item) => item.name, (item) => `${nameById(branches, item.branch_id)} · ${nameById(departments, item.department_id)}`, {
            deleteLabel: "Удалить",
          })}
        `, "Рабочие места — это конкретные места оказания услуг внутри подразделений.")}
      </div>

      <div id="roles-rights" data-permission="settings.roles.manage">
        ${section("Роли и права", `
          <form class="inline-form compact" data-role-create>
            <label><span>Роль</span><input name="name" required placeholder="собственник / администратор / мастер"></label>
            <button class="primary">Создать роль</button>
            <p data-message></p>
          </form>
          ${section("Список ролей", `
            ${entityList(roles, "Ролей пока нет", "role", (role) => role.name, () => "", {
              deleteLabel: "Удалить",
            })}
          `, "Список ролей показывает созданные роли и их права доступа.")}
        `, "Роли и права определяют, что пользователи могут видеть и изменять.")}
      </div>

      <div id="users" data-permission="settings.users.view">
        ${section("Пользователи и доступ", `
          <form class="inline-form compact" data-user-create data-permission="settings.users.create">
            <label><span>Имя</span><input name="first_name" required></label>
            <label><span>Отчество</span><input name="middle_name"></label>
            <label><span>Фамилия</span><input name="last_name"></label>
            <label><span>Телефон</span><input name="phone"></label>
            <label><span>Email</span><input name="email"></label>
            <label><span>Пароль/хеш</span><input name="password" type="password" required></label>
            ${selectField("Роль", "role_id", roles)}
            <button class="primary">Создать пользователя</button>
            <p data-message></p>
          </form>

          <form class="inline-form compact" data-org-role-assign data-permission="settings.users.assign_roles">
            ${selectField("Пользователь", "user_id", users.map((user) => ({ id: user.id, name: [user.last_name, user.first_name, user.middle_name, user.email, user.phone].filter(Boolean).join(" ") || `#${user.id}` })), "", "Выберите пользователя")}
            ${selectField("Роль", "role_id", roles, "", "Выберите роль")}
            <button class="primary">Выдать роль в организации</button>
            <p data-message></p>
          </form>

          <form class="inline-form compact" data-branch-user-create data-permission="settings.users.assign_roles">
            ${selectField("Пользователь", "user_id", users.map((user) => ({ id: user.id, name: [user.last_name, user.first_name, user.middle_name, user.email, user.phone].filter(Boolean).join(" ") || `#${user.id}` })), "", "Выберите пользователя")}
            ${selectField("Филиал", "branch_id", branches, "", "Выберите филиал")}
            ${selectField("Роль", "role_id", roles, "", "Выберите роль")}
            <button class="primary">Выдать роль в филиале</button>
            <p data-message></p>
          </form>

          <form class="inline-form compact" data-two-factor-create>
            ${selectField("Пользователь", "user_id", users.map((user) => ({ id: user.id, name: [user.last_name, user.first_name, user.middle_name, user.email, user.phone].filter(Boolean).join(" ") || `#${user.id}` })), "", "Выберите пользователя")}
            <label><span>2FA метод</span><input name="method" value="sms" required></label>
            <button class="primary">Включить 2FA</button>
            <p data-message></p>
          </form>

          ${entityList(users, "Пользователей пока нет", "user", (user) => [user.last_name, user.first_name, user.middle_name].filter(Boolean).join(" ") || `#${user.id}`, (user) => {
              const membership = memberships.find((item) => item.user_id === user.id);
              const status = user.is_blocked ? "заблокирован" : user.is_active ? "активен" : "неактивен";
              return `${[user.phone, user.email].filter(Boolean).join(" / ") || no} · ${nameById(roles, membership?.role_id)} · ${status}`;
            }, {
              deleteType: "userAccess",
              deleteId: (user) => user.id,
              deleteLabel: "Удалить",
            })}
        `, "Пользователи и доступ — это сотрудники и их роли в организации или филиалах.")}
      </div>

      <div id="audit" data-permission="settings.audit.view">
        ${section("Аудит и события", `
          <table><thead><tr><th>Действие</th><th>Сущность</th><th>Дата и время</th></tr></thead><tbody>
            ${rows(auditLogs, "Записей аудита пока нет", (item) => `
              <tr>
                <td>${escapeHtml(humanizeCode(item.action))}</td>
                <td>${escapeHtml(humanizeCode(item.entity_type || item.entity))}</td>
                <td>${escapeHtml(formatDateTime(item.created_at))}</td>
              </tr>
            `)}
          </tbody></table>
        `, "Аудит и события показывает важные действия и изменения в системе.")}
      </div>

      <div id="events" data-permission="settings.events.view">
        ${section("События", `
          <table><thead><tr><th>Событие</th><th>Сущность</th><th>Дата и время</th></tr></thead><tbody>
            ${rows(events, "Событий пока нет", (item) => `
              <tr>
                <td>${escapeHtml(humanizeCode(item.event_name || item.name))}</td>
                <td>${escapeHtml(humanizeCode(item.entity_type))}</td>
                <td>${escapeHtml(formatDateTime(item.created_at))}</td>
              </tr>
            `)}
          </tbody></table>
        `, "События — это системные записи о произошедших действиях.")}
      </div>
    </section>
  `;
}

export function bindSettings(root, ctx) {
  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-settings] form");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");
    const data = formData(form);

    try {
      if (form.matches("[data-brand-create]")) {
        await api.createBrand({ organization_id: ctx.org.id, name: data.name });
      } else if (form.matches("[data-legal-create]")) {
        await api.createLegalEntity({
          organization_id: ctx.org.id,
          name: data.name,
          legal_type: optional(data.legal_type),
          tax_system: optional(data.tax_system),
          requisites: legalRequisites(data),
          bank_details: bankDetails(data),
        });
      } else if (form.matches("[data-branch-create]")) {
        await api.createBranch({
          organization_id: ctx.org.id,
          name: data.name,
          address: optional(data.address),
          phone: optional(data.phone),
          timezone: optional(data.timezone) || "Europe/Moscow",
          brand_id: numberOrNull(data.brand_id),
          legal_entity_id: numberOrNull(data.legal_entity_id),
          online_booking_enabled: data.online_booking_enabled === "on",
        });
      } else if (form.matches("[data-department-create]")) {
        await api.createDepartment({
          organization_id: ctx.org.id,
          branch_id: Number(data.branch_id),
          name: data.name,
        });
      } else if (form.matches("[data-workplace-create]")) {
        await api.createWorkplace({
          organization_id: ctx.org.id,
          branch_id: Number(data.branch_id),
          department_id: numberOrNull(data.department_id),
          name: data.name,
        });
      } else if (form.matches("[data-user-create]")) {
        const created = await api.createUser({
          first_name: data.first_name,
          middle_name: optional(data.middle_name),
          last_name: optional(data.last_name),
          phone: optional(data.phone),
          email: optional(data.email),
          password_hash: data.password,
        });
        if (data.role_id) {
          await api.assignUser({
            user_id: created.id,
            organization_id: ctx.org.id,
            role_id: Number(data.role_id),
          });
        }
      } else if (form.matches("[data-org-role-assign]")) {
        await api.assignUser({
          user_id: Number(data.user_id),
          organization_id: ctx.org.id,
          role_id: Number(data.role_id),
        });
      } else if (form.matches("[data-role-create]")) {
        await api.createRole({ organization_id: ctx.org.id, name: data.name });
      } else if (form.matches("[data-branch-user-create]")) {
        await api.assignUserToBranch({
          organization_id: ctx.org.id,
          user_id: Number(data.user_id),
          branch_id: Number(data.branch_id),
          role_id: Number(data.role_id),
        });
      } else if (form.matches("[data-two-factor-create]")) {
        await api.setTwoFactorAuth({
          user_id: Number(data.user_id),
          method: data.method,
          is_enabled: true,
        });
      }
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });

  root.addEventListener("click", async (event) => {
    const editButton = event.target.closest("[data-edit-entity]");
    if (editButton) {
      const item = findEntity(editButton.dataset.editEntity, editButton.dataset.id);
      if (item) openEntityModal(editButton.dataset.editEntity, item);
      return;
    }

    const deleteButton = event.target.closest("[data-delete-entity]");
    if (!deleteButton) return;
    const type = deleteButton.dataset.deleteEntity;
    const labels = {
      legal: "Удалить юридическое лицо?",
      branch: "Удалить филиал?",
      department: "Удалить подразделение?",
      workplace: "Удалить рабочее место?",
      role: "Удалить роль?",
      permission: "Удалить право доступа?",
      userAccess: "Удалить доступ пользователя к организации?",
      branchMembership: "Удалить доступ пользователя к филиалу?",
    };
    if (!confirm(labels[type] || "Удалить запись?")) return;
    try {
      await deleteEntity(type, deleteButton.dataset.id);
      ctx.reload();
    } catch (error) {
      alert(error.message);
    }
  });

  document.addEventListener("click", (event) => {
    const closeButton = event.target.closest("[data-close-modal]");
    if (closeButton) {
      closeButton.closest("[data-settings-modal]")?.remove();
      return;
    }

    if (event.target.matches("[data-settings-modal]")) {
      event.target.remove();
    }
  });

  document.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-entity-edit]");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");
    try {
      const payload = formData(form);
      if (form.dataset.type === "role") {
        payload.permission_codes = new FormData(form).getAll("permission_codes");
      }
      await saveEntity(form.dataset.type, form.dataset.id, payload);
      form.closest("[data-settings-modal]")?.remove();
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });
}

