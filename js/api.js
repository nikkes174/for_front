export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

async function errorMessage(response) {
  try {
    const data = await response.json();
    if (typeof data.detail === "string") return data.detail;
    if (Array.isArray(data.detail)) return "Исправьте ошибки в форме";
  } catch {
    // fall through to status text
  }

  if (response.status === 401) return "Сессия истекла. Войдите снова";
  if (response.status === 403) return "Нет доступа";
  if (response.status === 404) return "Запись не найдена";
  if (response.status === 409) return "Такая запись уже существует";
  if (response.status === 422) return "Исправьте ошибки в форме";
  if (response.status >= 500) return "Сервис временно недоступен";
  return "Не удалось выполнить действие";
}

export async function request(path, options = {}) {
  const response = await fetch(path, {
    credentials: "include",
    headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
    ...options,
  });

  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  if (response.status === 204) return null;
  return response.json();
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),

  organizations: () => request("/organizations"),
  createOrganization: (body) => request("/organizations", { method: "POST", body: JSON.stringify(body) }),

  branches: (orgId) => request(`/organizations/${orgId}/branches`),
  createBranch: (body) => request("/organizations/branches", { method: "POST", body: JSON.stringify(body) }),
  updateBranch: (id, body) => request(`/organizations/branches/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteBranch: (id) => request(`/organizations/branches/${id}`, { method: "DELETE" }),

  brands: (orgId) => request(`/organizations/${orgId}/brands`),
  createBrand: (body) => request("/organizations/brands", { method: "POST", body: JSON.stringify(body) }),
  updateBrand: (id, body) => request(`/organizations/brands/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  legalEntities: (orgId) => request(`/organizations/${orgId}/legal-entities`),
  createLegalEntity: (body) => request("/organizations/legal-entities", { method: "POST", body: JSON.stringify(body) }),
  updateLegalEntity: (id, body) => request(`/organizations/legal-entities/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  departments: (orgId) => request(`/organizations/${orgId}/departments`),
  createDepartment: (body) => request("/organizations/departments", { method: "POST", body: JSON.stringify(body) }),
  updateDepartment: (id, body) => request(`/organizations/departments/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  workplaces: (orgId) => request(`/organizations/${orgId}/workplaces`),
  createWorkplace: (body) => request("/organizations/workplaces", { method: "POST", body: JSON.stringify(body) }),
  updateWorkplace: (id, body) => request(`/organizations/workplaces/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  modules: (orgId) => request(`/organizations/${orgId}/modules`),
  createModule: (body) => request("/organizations/modules", { method: "POST", body: JSON.stringify(body) }),
  updateModule: (id, body) => request(`/organizations/modules/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  users: (orgId) => request(`/users-access/organizations/${orgId}/users`),
  createUser: (body) => request("/users-access/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id, body) => request(`/users-access/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  blockUser: (id) => request(`/users-access/users/${id}/block`, { method: "POST" }),
  unblockUser: (id) => request(`/users-access/users/${id}/unblock`, { method: "POST" }),
  roles: (orgId) => request(`/users-access/organizations/${orgId}/roles`),
  createRole: (body) => request("/users-access/roles", { method: "POST", body: JSON.stringify(body) }),
  updateRole: (id, body) => request(`/users-access/roles/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  rolePermissions: (id) => request(`/users-access/roles/${id}/permissions`),
  replaceRolePermissions: (id, body) => request(`/users-access/roles/${id}/permissions`, { method: "PUT", body: JSON.stringify(body) }),
  allowedPermissions: (orgId) => request(`/users-access/organizations/${orgId}/allowed-permissions`),
  permissions: (orgId) => request(`/users-access/permissions${orgId ? `?organization_id=${orgId}` : ""}`),
  createPermission: (body) => request("/users-access/permissions", { method: "POST", body: JSON.stringify(body) }),
  updatePermission: (id, body) => request(`/users-access/permissions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  memberships: (orgId) => request(`/users-access/organizations/${orgId}/memberships`),
  updateMembership: (id, body) => request(`/users-access/organization-memberships/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  branchMemberships: (orgId) => request(`/users-access/organizations/${orgId}/branch-memberships`),
  assignUser: (body) => request("/users-access/memberships", { method: "POST", body: JSON.stringify(body) }),
  assignUserToBranch: (body) => request("/users-access/branch-memberships", { method: "POST", body: JSON.stringify(body) }),
  updateBranchMembership: (id, body) => request(`/users-access/branch-memberships/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  assignRolePermission: (body) => request("/users-access/role-permissions", { method: "POST", body: JSON.stringify(body) }),
  setUserPermission: (body) => request("/users-access/user-permissions", { method: "POST", body: JSON.stringify(body) }),
  grantTemporaryAccess: (body) => request("/users-access/temporary-accesses", { method: "POST", body: JSON.stringify(body) }),
  setTwoFactorAuth: (body) => request("/users-access/two-factor-auth", { method: "POST", body: JSON.stringify(body) }),
  auditLogs: () => request("/audit"),
  events: () => request("/events"),

  clients: (orgId, search = "") => {
    const qs = search ? `?search=${encodeURIComponent(search)}` : "";
    return request(`/crm-api/clients/organizations/${orgId}/clients${qs}`);
  },
  createClient: (body) => request("/crm-api/clients", { method: "POST", body: JSON.stringify(body) }),
  updateClient: (id, body) => request(`/crm-api/clients-core/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  clientProfile: (id, orgId) => request(`/crm-api/client-profile/clients/${id}?organization_id=${orgId}`),
  clientProfileMetric: (id) => request(`/crm-api/client-profile/clients/${id}/metrics`),
  clientHistoryVisits: (id) => request(`/crm-api/client-history/visits?client_id=${id}&include_services=true&include_products=true`),
  createClientVisit: (body) => request("/crm-api/client-history/visits", { method: "POST", body: JSON.stringify(body) }),
  clientAccounts: (id) => request(`/crm-api/client-accounts/clients/${id}`),
  clientSegments: (orgId) => request(`/crm-api/client-segments?organization_id=${orgId}`),
  clientCategories: (id) => request(`/crm-api/clients-core/category-links?client_id=${id}`),
  clientAdditionalFieldValues: (id) => request(`/crm-api/clients-core/additional-field-values?client_id=${id}`),
  clientBranches: (id) => request(`/crm-api/clients-core/branches?client_id=${id}`),

  rules: (orgId) => request(`/loyalty-api/organizations/${orgId}/rules`),
  bonusLevels: (orgId) => request(`/loyalty-api/organizations/${orgId}/bonus-levels`),
  transactions: (orgId) => request(`/loyalty-api/organizations/${orgId}/transactions`),
  promotions: (orgId) => request(`/loyalty-api/organizations/${orgId}/promotions`),
  certificates: (orgId) => request(`/loyalty-api/organizations/${orgId}/gift-certificates`),
  subscriptions: (orgId) => request(`/loyalty-api/organizations/${orgId}/subscriptions`),
  referrals: (orgId) => request(`/loyalty-api/organizations/${orgId}/client-referrals`),
};
