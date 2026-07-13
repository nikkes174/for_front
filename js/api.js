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
  window.dispatchEvent(new CustomEvent("ajax:start"));
  try {
    const response = await fetch(path, {
      credentials: "include",
      headers: options.body ? { "Content-Type": "application/json", ...options.headers } : options.headers,
      ...options,
    });

    if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
    if (response.status === 204) return null;
    return response.json();
  } finally {
    window.dispatchEvent(new CustomEvent("ajax:end"));
  }
}

export async function upload(path, formData) {
  window.dispatchEvent(new CustomEvent("ajax:start"));
  try {
    const response = await fetch(path, {
      method: "POST",
      body: formData,
      credentials: "include",
    });

    if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
    if (response.status === 204) return null;
    return response.json();
  } finally {
    window.dispatchEvent(new CustomEvent("ajax:end"));
  }
}

export const api = {
  register: (body) => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body) => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  restoreSession: (body) => request("/auth/session/restore", { method: "POST", body: JSON.stringify(body) }),
  testResetPassword: (body) => request("/auth/test-reset-password", { method: "POST", body: JSON.stringify(body) }),
  loginContext: () => request("/auth/login-context"),
  startClientMaxAuth: (body) => request("/auth/client-max/start", { method: "POST", body: JSON.stringify(body) }),
  start2fa: (body) => request("/auth/2fa/start", { method: "POST", body: JSON.stringify(body) }),
  verify2fa: (body) => request("/auth/2fa/verify", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request("/auth/logout", { method: "POST" }),
  me: () => request("/auth/me"),
  cabinet: () => request("/auth/cabinet"),

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
  deleteLegalEntity: (id) => request(`/organizations/legal-entities/${id}`, { method: "DELETE" }),

  productCategories: (orgId) => request(`/organizations/${orgId}/product-categories`),
  createProductCategory: (body) => request("/organizations/product-categories", { method: "POST", body: JSON.stringify(body) }),
  updateProductCategory: (id, body) => request(`/organizations/product-categories/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProductCategory: (id) => request(`/organizations/product-categories/${id}`, { method: "DELETE" }),

  productItems: (orgId, categoryId = "") => request(`/organizations/${orgId}/product-items?limit=500${categoryId ? `&category_id=${categoryId}` : ""}`),
  createProductItem: (body) => request("/organizations/product-items", { method: "POST", body: JSON.stringify(body) }),
  updateProductItem: (id, body) => request(`/organizations/product-items/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteProductItem: (id) => request(`/organizations/product-items/${id}`, { method: "DELETE" }),

  achievements: (orgId) => request(`/organizations/${orgId}/achievements`),
  createAchievement: (body) => request("/organizations/achievements", { method: "POST", body: JSON.stringify(body) }),
  updateAchievement: (id, body) => request(`/organizations/achievements/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  uploadAchievementPhoto: (id, file) => {
    const data = new FormData();
    data.append("file", file);
    return upload(`/organizations/achievements/${id}/photo`, data);
  },
  deleteAchievement: (id) => request(`/organizations/achievements/${id}`, { method: "DELETE" }),

  departments: (orgId) => request(`/organizations/${orgId}/departments`),
  createDepartment: (body) => request("/organizations/departments", { method: "POST", body: JSON.stringify(body) }),
  updateDepartment: (id, body) => request(`/organizations/departments/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteDepartment: (id) => request(`/organizations/departments/${id}`, { method: "DELETE" }),

  workplaces: (orgId) => request(`/organizations/${orgId}/workplaces`),
  createWorkplace: (body) => request("/organizations/workplaces", { method: "POST", body: JSON.stringify(body) }),
  updateWorkplace: (id, body) => request(`/organizations/workplaces/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteWorkplace: (id) => request(`/organizations/workplaces/${id}`, { method: "DELETE" }),

  modules: (orgId) => request(`/organizations/${orgId}/modules`),
  createModule: (body) => request("/organizations/modules", { method: "POST", body: JSON.stringify(body) }),
  updateModule: (id, body) => request(`/organizations/modules/${id}`, { method: "PATCH", body: JSON.stringify(body) }),

  users: (orgId, limit = 100) => request(`/users-access/organizations/${orgId}/users?limit=${limit}`),
  user: (id) => request(`/users-access/users/${id}`),
  createUser: (body) => request("/users-access/users", { method: "POST", body: JSON.stringify(body) }),
  updateUser: (id, body) => request(`/users-access/users/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  blockUser: (id) => request(`/users-access/users/${id}/block`, { method: "POST" }),
  unblockUser: (id) => request(`/users-access/users/${id}/unblock`, { method: "POST" }),
  roles: (orgId) => request(`/users-access/organizations/${orgId}/roles`),
  createRole: (body) => request("/users-access/roles", { method: "POST", body: JSON.stringify(body) }),
  updateRole: (id, body) => request(`/users-access/roles/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteRole: (id) => request(`/users-access/roles/${id}`, { method: "DELETE" }),
  rolePermissions: (id) => request(`/users-access/roles/${id}/permissions`),
  replaceRolePermissions: (id, body) => request(`/users-access/roles/${id}/permissions`, { method: "PUT", body: JSON.stringify(body) }),
  allowedPermissions: (orgId) => request(`/users-access/organizations/${orgId}/allowed-permissions`),
  permissions: (orgId) => request(`/users-access/permissions${orgId ? `?organization_id=${orgId}` : ""}`),
  createPermission: (body) => request("/users-access/permissions", { method: "POST", body: JSON.stringify(body) }),
  updatePermission: (id, body) => request(`/users-access/permissions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePermission: (id) => request(`/users-access/permissions/${id}`, { method: "DELETE" }),
  memberships: (orgId) => request(`/users-access/organizations/${orgId}/memberships`),
  updateMembership: (id, body) => request(`/users-access/organization-memberships/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteMembership: (orgId, userId) => request(`/users-access/organizations/${orgId}/memberships/${userId}`, { method: "DELETE" }),
  branchMemberships: (orgId) => request(`/users-access/organizations/${orgId}/branch-memberships`),
  assignUser: (body) => request("/users-access/memberships", { method: "POST", body: JSON.stringify(body) }),
  assignUserToBranch: (body) => request("/users-access/branch-memberships", { method: "POST", body: JSON.stringify(body) }),
  updateBranchMembership: (id, body) => request(`/users-access/branch-memberships/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteBranchMembership: (id) => request(`/users-access/branch-memberships/${id}`, { method: "DELETE" }),
  assignRolePermission: (body) => request("/users-access/role-permissions", { method: "POST", body: JSON.stringify(body) }),
  setUserPermission: (body) => request("/users-access/user-permissions", { method: "POST", body: JSON.stringify(body) }),
  grantTemporaryAccess: (body) => request("/users-access/temporary-accesses", { method: "POST", body: JSON.stringify(body) }),
  setTwoFactorAuth: (body) => request("/users-access/two-factor-auth", { method: "POST", body: JSON.stringify(body) }),
  auditLogs: (orgId) => request(`/audit${orgId ? `?organization_id=${orgId}` : ""}`),
  events: (orgId) => request(`/events${orgId ? `?organization_id=${orgId}` : ""}`),

  clients: (orgId, filters = {}) => {
    const params = new URLSearchParams({ organization_id: orgId });
    if (typeof filters === "string") {
      if (filters) params.set("query", filters);
    } else {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== "" && value !== undefined && value !== null) params.set(key, value);
      });
    }
    return request(`/crm-api/clients-core/clients/search?${params}`);
  },
  client: (id, orgId) => request(`/crm-api/clients-core/clients/${id}${orgId ? `?organization_id=${orgId}` : ""}`),
  createClient: (body) => request("/crm-api/clients-core/clients", { method: "POST", body: JSON.stringify(body) }),
  updateClient: (id, body) => request(`/crm-api/clients-core/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  uploadClientPhoto: (id, file) => {
    const data = new FormData();
    data.append("file", file);
    return upload(`/crm-api/clients-core/clients/${id}/photo`, data);
  },
  deleteClient: (id) => request(`/crm-api/clients-core/clients/${id}`, { method: "DELETE" }),
  createClientAuthLink: (body) => request("/auth/client-auth-links", { method: "POST", body: JSON.stringify(body) }),
  clientRegistrationLink: (organizationId) => request(`/auth/client-registration-link?organization_id=${organizationId}`),
  clientAuthLinks: (organizationId) => request(`/auth/client-auth-links?organization_id=${organizationId}`),
  deleteClientAuthLink: (id) => request(`/auth/client-auth-links/${id}`, { method: "DELETE" }),
  clientRegistrationFields: (organizationId) => request(`/auth/client-registration-fields?organization_id=${organizationId}`),
  updateClientRegistrationFields: (organizationId, fields) => request("/auth/client-registration-fields", { method: "PUT", body: JSON.stringify({ organization_id: organizationId, fields }) }),
  clientCardSections: (organizationId) => request(`/auth/client-card-sections?organization_id=${organizationId}`),
  updateClientCardSections: (organizationId, sections) => request("/auth/client-card-sections", { method: "PUT", body: JSON.stringify({ organization_id: organizationId, sections }) }),
  clientProfile: (id, orgId) => request(`/crm-api/client-profile/clients/${id}?organization_id=${orgId}`),
  clientProfileMetric: (id) => request(`/crm-api/client-profile/clients/${id}/metrics`),
  clientAchievements: (id) => request(`/crm-api/clients-core/clients/${id}/achievements`),
  clientHistoryVisits: (id) => request(`/crm-api/client-history/visits?client_id=${id}&include_services=true&include_products=true`),
  createClientVisit: (body) => request("/crm-api/client-history/visits", { method: "POST", body: JSON.stringify(body) }),
  updateClientVisit: (id, body) => request(`/crm-api/client-history/visits/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteClientVisit: (id) => request(`/crm-api/client-history/visits/${id}`, { method: "DELETE" }),
  clientAccounts: (id) => request(`/crm-api/client-accounts/clients/${id}`),
  clientSegments: (orgId) => request(`/crm-api/client-segments?organization_id=${orgId}`),
  clientCategories: (id) => request(`/crm-api/clients-core/category-links?client_id=${id}`),
  clientAdditionalFieldValues: (id) => request(`/crm-api/clients-core/additional-field-values?client_id=${id}`),
  clientBranches: (id) => request(`/crm-api/clients-core/branches?client_id=${id}`),
  pushStatus: (organizationId, clientId = "", endpoint = "") => request(`/crm-api/client-communications/push/status?organization_id=${organizationId}${clientId ? `&client_id=${clientId}` : ""}${endpoint ? `&endpoint=${encodeURIComponent(endpoint)}` : ""}`, { cache: "no-store" }),
  pushPreference: (body) => request("/crm-api/client-communications/push/preference", { method: "POST", body: JSON.stringify(body) }),
  pushSubscribe: (body) => request("/crm-api/client-communications/push/subscribe", { method: "POST", body: JSON.stringify(body) }),
  pushUnsubscribe: (endpoint) => request("/crm-api/client-communications/push/subscribe", { method: "DELETE", body: JSON.stringify({ endpoint }) }),
  clientPushMessages: (clientId) => request(`/crm-api/client-communications/clients/${clientId}/messages?channel=push&message_type=notification&limit=20`, { cache: "no-store" }),
  sendPushNotification: (body) => request("/crm-api/client-communications/push/send", { method: "POST", body: JSON.stringify(body) }),
  startPushNotificationJob: (body) => request("/crm-api/client-communications/push/send-jobs", { method: "POST", body: JSON.stringify(body) }),
  pushNotificationJobs: (organizationId) => request(`/crm-api/client-communications/push/send-jobs?organization_id=${organizationId}`, { cache: "no-store" }),

  rules: (orgId) => request(`/loyalty-api/organizations/${orgId}/rules`),
  createRule: (body) => request("/loyalty-api/client-bonuses/rules", { method: "POST", body: JSON.stringify(body) }),
  updateRule: (id, body) => request(`/loyalty-api/client-bonuses/rules/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteRule: (id) => request(`/loyalty-api/client-bonuses/rules/${id}`, { method: "DELETE" }),
  applyRule: (ruleId, clientId, organizationId, extra = {}) => request(`/loyalty-api/client-bonuses/rules/${ruleId}/apply`, { method: "POST", body: JSON.stringify({ client_id: clientId, organization_id: organizationId, ...extra }) }),
  applyRuleToAll: (ruleId, organizationId) => request(`/loyalty-api/client-bonuses/rules/${ruleId}/apply-all`, { method: "POST", body: JSON.stringify({ organization_id: organizationId }) }),
  startApplyRuleToAllJob: (ruleId, organizationId) => request(`/loyalty-api/client-bonuses/rules/${ruleId}/apply-all-jobs`, { method: "POST", body: JSON.stringify({ organization_id: organizationId }) }),
  workerJobs: (organizationId) => request(`/loyalty-api/client-bonuses/worker/jobs?organization_id=${organizationId}`),
  applyLevelTransitions: (clientId, organizationId) => request(`/loyalty-api/client-bonuses/clients/${clientId}/apply-level-transitions`, { method: "POST", body: JSON.stringify({ organization_id: organizationId }) }),
  setClientLevel: (clientId, organizationId, clientLevel) => request(`/loyalty-api/client-bonuses/clients/${clientId}/level`, { method: "PUT", body: JSON.stringify({ organization_id: organizationId, client_level: clientLevel || null }) }),
  bonusLevels: (orgId) => request(`/loyalty-api/organizations/${orgId}/bonus-levels`),
  createBonusLevel: (body) => request("/loyalty-api/client-bonuses/levels", { method: "POST", body: JSON.stringify(body) }),
  updateBonusLevel: (id, body) => request(`/loyalty-api/client-bonuses/levels/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteBonusLevel: (id) => request(`/loyalty-api/client-bonuses/levels/${id}`, { method: "DELETE" }),
  bonusTypes: (orgId) => request(`/loyalty-api/client-bonuses/bonus-types?organization_id=${orgId}`),
  createBonusType: (body) => request("/loyalty-api/client-bonuses/bonus-types", { method: "POST", body: JSON.stringify(body) }),
  deleteBonusType: (id) => request(`/loyalty-api/client-bonuses/bonus-types/${id}`, { method: "DELETE" }),
  bonusBalance: (clientId, bonusType = "") => request(`/loyalty-api/client-bonuses/clients/${clientId}/balance${bonusType ? `?bonus_type=${encodeURIComponent(bonusType)}` : ""}`),
  bonusHistory: (clientId) => request(`/loyalty-api/client-bonuses/clients/${clientId}/history`),
  bonusHistoryAll: () => request("/loyalty-api/client-bonuses/history"),
  updateBonus: (id, body) => request(`/loyalty-api/client-bonuses/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteBonus: (id) => request(`/loyalty-api/client-bonuses/${id}`, { method: "DELETE" }),
  accrueBonus: (body) => request("/loyalty-api/client-bonuses/accruals", { method: "POST", body: JSON.stringify(body) }),
  writeOffBonus: (body) => request("/loyalty-api/client-bonuses/write-offs", { method: "POST", body: JSON.stringify(body) }),
  expireBonus: (body) => request("/loyalty-api/client-bonuses/expirations", { method: "POST", body: JSON.stringify(body) }),
  runBonusExpiration: () => request("/loyalty-api/client-bonuses/expirations/run", { method: "POST" }),
  transactions: (orgId) => request(`/loyalty-api/organizations/${orgId}/transactions`),
  promotions: (clientId) => request(`/loyalty-api/client-promotions/clients/${clientId}`),
  promotionsAll: () => request("/loyalty-api/client-promotions"),
  createPromotion: (body) => request("/loyalty-api/client-promotions", { method: "POST", body: JSON.stringify(body) }),
  updatePromotion: (id, body) => request(`/loyalty-api/client-promotions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deletePromotion: (id) => request(`/loyalty-api/client-promotions/${id}`, { method: "DELETE" }),
  applyPromotion: (id, body) => request(`/loyalty-api/client-promotions/${id}/apply`, { method: "POST", body: JSON.stringify(body) }),
  applyPromotionByCode: (body) => request("/loyalty-api/client-promotions/apply-by-promo-code", { method: "POST", body: JSON.stringify(body) }),
  promotionProfitability: (id, body) => request(`/loyalty-api/client-promotions/${id}/profitability`, { method: "POST", body: JSON.stringify(body) }),
  certificates: (clientId) => request(`/loyalty-api/client-certificates/clients/${clientId}`),
  certificatesAll: () => request("/loyalty-api/client-certificates"),
  createCertificate: (body) => request("/loyalty-api/client-certificates", { method: "POST", body: JSON.stringify(body) }),
  updateCertificate: (id, body) => request(`/loyalty-api/client-certificates/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  useCertificate: (id, body) => request(`/loyalty-api/client-certificates/${id}/use`, { method: "POST", body: JSON.stringify(body) }),
  transferCertificate: (id, toClientId) => request(`/loyalty-api/client-certificates/${id}/transfer`, { method: "POST", body: JSON.stringify({ to_client_id: toClientId }) }),
  refundCertificate: (id) => request(`/loyalty-api/client-certificates/${id}/refund`, { method: "POST", body: JSON.stringify({}) }),
  convertCertificateToDeposit: (id) => request(`/loyalty-api/client-certificates/${id}/convert-to-deposit`, { method: "POST" }),
  expireCertificate: (id) => request(`/loyalty-api/client-certificates/${id}/expire`, { method: "POST" }),
  subscriptions: (clientId) => request(`/loyalty-api/client-subscriptions/clients/${clientId}`),
  subscriptionsAll: () => request("/loyalty-api/client-subscriptions"),
  createSubscription: (body) => request("/loyalty-api/client-subscriptions", { method: "POST", body: JSON.stringify(body) }),
  updateSubscription: (id, body) => request(`/loyalty-api/client-subscriptions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  freezeSubscription: (id, body) => request(`/loyalty-api/client-subscriptions/${id}/freeze`, { method: "POST", body: JSON.stringify(body) }),
  unfreezeSubscription: (id) => request(`/loyalty-api/client-subscriptions/${id}/unfreeze`, { method: "POST" }),
  transferSubscription: (id, toClientId) => request(`/loyalty-api/client-subscriptions/${id}/transfer`, { method: "POST", body: JSON.stringify({ to_client_id: toClientId }) }),
  addFamilyClient: (id, familyClientId) => request(`/loyalty-api/client-subscriptions/${id}/family-clients`, { method: "POST", body: JSON.stringify({ family_client_id: familyClientId }) }),
  removeFamilyClient: (id, familyClientId) => request(`/loyalty-api/client-subscriptions/${id}/family-clients/${familyClientId}`, { method: "DELETE" }),
  enableSubscriptionAutoRenewal: (id) => request(`/loyalty-api/client-subscriptions/${id}/auto-renewal/enable`, { method: "POST" }),
  disableSubscriptionAutoRenewal: (id) => request(`/loyalty-api/client-subscriptions/${id}/auto-renewal/disable`, { method: "POST" }),
  writeOffSubscriptionVisit: (id, body) => request(`/loyalty-api/client-subscriptions/${id}/write-off-after-visit`, { method: "POST", body: JSON.stringify(body) }),
  renewSubscription: (id, body) => request(`/loyalty-api/client-subscriptions/${id}/renew`, { method: "POST", body: JSON.stringify(body) }),
  expireSubscription: (id) => request(`/loyalty-api/client-subscriptions/${id}/expire`, { method: "POST" }),
  referrals: (clientId) => request(`/loyalty-api/client-referrals/referrers/${clientId}/referrals`),
  referralSources: () => request("/loyalty-api/client-referrals/sources"),
  referralStats: (clientId) => request(`/loyalty-api/client-referrals/referrers/${clientId}/stats`),
  createReferralSource: (body) => request("/loyalty-api/client-referrals/sources", { method: "POST", body: JSON.stringify(body) }),
  updateReferralSource: (id, body) => request(`/loyalty-api/client-referrals/sources/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteReferralSource: (id) => request(`/loyalty-api/client-referrals/sources/${id}`, { method: "DELETE" }),
  registerReferralByCode: (body) => request("/loyalty-api/client-referrals/register-by-code", { method: "POST", body: JSON.stringify(body) }),
  registerReferralByLink: (body) => request("/loyalty-api/client-referrals/register-by-link", { method: "POST", body: JSON.stringify(body) }),
  markReferralFirstVisit: (id, externalFirstVisitId) => request(`/loyalty-api/client-referrals/${id}/first-visit`, { method: "POST", body: JSON.stringify({ external_first_visit_id: externalFirstVisitId }) }),
  accrueReferralReward: (id) => request(`/loyalty-api/client-referrals/${id}/reward/accrue`, { method: "POST" }),
  cancelReferralReward: (id, fraudReason) => request(`/loyalty-api/client-referrals/${id}/reward/cancel`, { method: "POST", body: JSON.stringify({ fraud_reason: fraudReason }) }),
  syncLoyaltyClient: (body) => request("/loyalty-api/clients/sync", { method: "POST", body: JSON.stringify(body) }),
};
