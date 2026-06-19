export type User = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  is_active: boolean;
  is_blocked: boolean;
};

export type Organization = {
  id: number;
  name: string;
  owner_user_id: number;
  settings: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
};

export type Branch = {
  id: number;
  organization_id: number;
  brand_id: number | null;
  legal_entity_id: number | null;
  name: string;
  address: string | null;
  phone: string | null;
  timezone: string | null;
  work_schedule: Record<string, unknown> | null;
  cashbox_id: number | null;
  warehouse_id: number | null;
  price_id: number | null;
  service_ids: number[] | null;
  settings: Record<string, unknown> | null;
};

export type Brand = { id: number; organization_id: number; name: string };
export type LegalEntity = { id: number; organization_id: number; name: string; legal_type: string | null; requisites: Record<string, unknown> | null; bank_details: Record<string, unknown> | null; tax_system: string | null };
export type Department = { id: number; organization_id: number; branch_id: number; name: string };
export type Workplace = { id: number; organization_id: number; branch_id: number; department_id: number | null; name: string; resource_type: string | null };
export type OrganizationModule = { id: number; organization_id: number; module_name: string };
export type Role = { id: number; organization_id: number; name: string };
export type Permission = { id: number; code: string; name: string; description: string | null };
export type UserOrganizationMembership = { id: number; organization_id: number; user_id: number; role_id: number };
export type UserBranchMembership = { id: number; organization_id: number; branch_id: number; user_id: number; role_id: number };
export type RolePermission = { id: number; role_id: number; permission_id: number };
export type UserPermission = { id: number; user_id: number; organization_id: number; branch_id: number | null; permission_id: number; is_allowed: boolean };
export type TemporaryAccess = { id: number; user_id: number; organization_id: number; branch_id: number | null; permission_id: number; valid_from: string; valid_until: string };
export type LoginHistory = { id: number; user_id: number | null; ip_address: string | null; device: string | null; login_method: string | null; is_successful: boolean; login_at: string };
export type TwoFactorAuth = { id: number; user_id: number; method: string; is_enabled: boolean };
export type AuditLog = { id: number; organization_id: number | null; branch_id: number | null; user_id: number | null; action: string; entity_type: string; entity_id: number | null; reason: string | null; created_at: string };
export type EventLog = { id: number; event_name?: string; event_type?: string; source_service: string; organization_id: number | null; branch_id: number | null; entity_type: string | null; entity_id: number | null; created_at: string };

export type Client = {
  id: number;
  organization_id: number;
  first_name: string | null;
  last_name: string | null;
  middle_name: string | null;
  full_name: string | null;
  telegram_id: number | null;
  max_id: number | null;
  vk_id: number | null;
  primary_phone: string | null;
  secondary_phone: string | null;
  email: string | null;
  birth_date: string | null;
  gender: string | null;
  photo_file_id: string | null;
  comment: string | null;
  note: string | null;
  importance_class: number;
  online_booking_enabled: boolean;
  referrer_client_id: number | null;
  api_field_1: string | null;
  api_field_2: string | null;
  api_field_3: string | null;
  created_by: number | null;
  creation_source: string | null;
  status: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ClientProfileMetric = {
  client_id: number;
  visits_count: number;
  completed_visits_count: number;
  cancelled_visits_count: number;
  no_show_visits_count: number;
  sold_amount: string;
  paid_amount: string;
  average_check: string;
  last_visit_at: string | null;
  next_visit_at: string | null;
  favorite_branch_id: number | null;
  visit_frequency: number | null;
  ltv: string;
  profit_amount: string;
  average_visit_interval_days: number | null;
  days_since_last_visit: number | null;
  churn_probability: number | null;
  acquisition_cost: string;
};

export type ClientProfile = {
  client: Record<string, unknown>;
  metrics: ClientProfileMetric | null;
  active_bookings: Record<string, unknown>[];
  favorite_services: Record<string, unknown>[];
  favorite_employees: Record<string, unknown>[];
  recommendations: Record<string, unknown>[];
  external: Record<string, unknown>;
};

export type ClientVisit = {
  id: number;
  client_id: number;
  visit_at: string;
  branch_id: number | null;
  employee_id: number | null;
  visit_status: string;
  total_cost: string;
  discount_amount: string;
  paid_amount: string;
  debt_amount: string;
  comment: string | null;
};

export type ClientVisitListItem = {
  visit: ClientVisit;
  services: Record<string, unknown>[];
  products: Record<string, unknown>[];
  service_ids: number[];
  product_ids: number[];
};

export type ClientAccountsSummary = {
  client_id: number;
  deposits: Record<string, unknown>[];
  certificates: Record<string, unknown>[];
  subscriptions: Record<string, unknown>[];
  bonus_balance: { balance: string | number } | null;
  totals: {
    deposit_balance: string | number;
    certificate_balance: string | number;
    subscription_visits_left: number;
    bonus_balance: string | number;
  };
};

export type ClientSegment = {
  id: number;
  organization_id: number;
  name: string;
  description: string | null;
  is_dynamic: boolean;
  status: string;
};

export type ClientCategory = {
  id: number;
  organization_id: number;
  name: string;
  color: string | null;
};

export type ClientAdditionalFieldValue = {
  id: number;
  client_id: number;
  field_id: number;
  value_text: string | null;
  value_json: Record<string, unknown> | null;
};

export type ClientBranchRelation = {
  id: number;
  client_id: number;
  branch_id: number;
  first_visit_at: string | null;
  last_visit_at: string | null;
};

export type BonusRule = {
  id: number;
  organization_id: number;
  name: string;
  rule_type: "welcome" | "birthday" | "referral" | "service" | "product";
  bonus_type: string;
  amount: number;
  expires_in_days: number | null;
  is_active: boolean;
  created_at: string;
};

export type BonusLevel = {
  id: number;
  organization_id: number;
  name: string;
  params: Record<string, unknown> | null;
  created_at: string;
};

export type ClientBonus = {
  id: number;
  client_id: number;
  bonus_type: string;
  transaction_type: "accrual" | "write_off" | "expiration";
  amount: number;
  reason: string | null;
  expires_at: string | null;
  created_at: string;
};

export type BonusBalance = {
  client_id: number;
  bonus_type: string | null;
  balance: number;
};

export type ClientSubscription = {
  id: number;
  client_id: number;
  subscription_name: string;
  visits_total: number;
  visits_left: number;
  deposit_amount: string;
  deposit_left: string;
  status: string;
  started_at: string;
  expires_at: string | null;
  is_frozen: boolean;
  frozen_from?: string | null;
  frozen_until?: string | null;
  transferred_from_client_id?: number | null;
  transferred_to_client_id?: number | null;
  family_client_ids?: number[] | null;
  auto_renewal_enabled: boolean;
  last_visit_id?: number | null;
  last_write_off_at?: string | null;
  created_at: string;
};

export type ClientCertificate = {
  id: number;
  client_id: number;
  certificate_type: "digital" | "paper";
  certificate_code: string;
  nominal_amount: string;
  balance_amount: string;
  status: string;
  issued_at: string;
  expires_at: string | null;
  is_refunded: boolean;
  transferred_from_client_id?: number | null;
  transferred_to_client_id?: number | null;
  deposit_converted_amount?: string;
  created_at: string;
};

export type ReferralSource = {
  id: number;
  referrer_client_id: number;
  referral_code: string;
  referral_link: string;
  reward_type: string;
  reward_bonus_type: string | null;
  reward_amount: string;
  is_active: boolean;
  created_at: string;
};

export type ReferralStats = {
  referrer_client_id: number;
  invites_count: number;
  successful_invites_count: number;
};

export type ClientReferral = {
  id: number;
  referral_source_id: number;
  referrer_client_id: number;
  invited_client_id: number | null;
  external_first_visit_id: string | null;
  first_visit_at: string | null;
  reward_type: string;
  reward_bonus_type: string | null;
  reward_amount: string;
  reward_status: string;
  fraud_reason: string | null;
  created_at: string;
};

export type ClientPromotion = {
  id: number;
  client_id: number;
  promotion_name: string;
  promo_code: string | null;
  promotion_type: string;
  discount_type: string | null;
  discount_value: string;
  gift: string | null;
  package_offer?: Record<string, unknown> | null;
  valid_from: string | null;
  valid_until: string | null;
  client_segment: string | null;
  min_amount: string;
  usage_limit: number | null;
  used_count: number;
  final_amount: string | null;
  profit_amount: string | null;
  original_amount?: string | null;
  discount_amount?: string | null;
  created_at: string;
};

export type PromotionProfitability = {
  original_amount: string;
  discount_amount: string;
  final_amount: string;
  profit_amount: string;
};

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(path, {
    credentials: "include",
    headers: init.body ? { "Content-Type": "application/json", ...init.headers } : init.headers,
    ...init,
  });
  if (!response.ok) throw new ApiError(await errorMessage(response), response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

async function errorMessage(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: unknown };
    if (typeof data.detail === "string" && /[А-Яа-яЁё]/.test(data.detail)) return data.detail;
    if (Array.isArray(data.detail)) return "Исправьте ошибки в выделенных полях";
  } catch {
    if (response.status === 0) return "Не удалось подключиться к серверу. Проверьте соединение и повторите попытку";
  }
  if (response.status === 401) return "Сессия истекла. Войдите снова";
  if (response.status === 403) return "У вас нет доступа к этому разделу";
  if (response.status === 404) return "Организация не найдена или у вас больше нет к ней доступа";
  if (response.status === 409) return "Клиент или запись с такими данными уже существует";
  if (response.status === 422) return "Исправьте ошибки в выделенных полях";
  if (response.status === 429) return "Слишком много запросов. Повторите попытку позже";
  if (response.status >= 500) return "Сервис временно недоступен. Повторите попытку позже";
  return "Не удалось выполнить действие";
}

export const keys = {
  me: ["me"] as const,
  orgs: ["organizations"] as const,
  branches: (organizationId: number) => ["organizations", organizationId, "branches"] as const,
  clients: (organizationId: number) => ["organizations", organizationId, "clients"] as const,
  rules: (organizationId: number) => ["organizations", organizationId, "loyalty", "rules"] as const,
  bonusLevels: (organizationId: number) => ["organizations", organizationId, "loyalty", "levels"] as const,
  clientLoyalty: (organizationId: number, clientId: number | null) => ["organizations", organizationId, "loyalty", "client", clientId] as const,
};

export const api = {
  register: (body: { name: string; email?: string; phone?: string; password: string }) =>
    request<{ user: User }>("/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { login: string; password: string }) =>
    request<{ user: User }>("/auth/login", { method: "POST", body: JSON.stringify(body) }),
  logout: () => request<void>("/auth/logout", { method: "POST" }),
  me: () => request<User>("/auth/me"),

  organizations: () => request<Organization[]>("/organizations"),
  createOrganization: (body: { name: string; settings?: Record<string, unknown> }) =>
    request<Organization>("/organizations", { method: "POST", body: JSON.stringify(body) }),

  branches: (organizationId: number) => request<Branch[]>(`/organizations/${organizationId}/branches`),
  createBranch: (body: { organization_id: number; name: string; address?: string; phone?: string; timezone?: string; brand_id?: number; legal_entity_id?: number; work_schedule?: Record<string, unknown>; cashbox_id?: number; warehouse_id?: number; price_id?: number; service_ids?: number[]; settings?: Record<string, unknown> }) =>
    request<Branch>("/organizations/branches", { method: "POST", body: JSON.stringify(body) }),
  deleteBranch: (branchId: number) => request<void>(`/organizations/branches/${branchId}`, { method: "DELETE" }),
  brands: (organizationId: number) => request<Brand[]>(`/organizations/${organizationId}/brands`),
  createBrand: (body: { organization_id: number; name: string }) => request<Brand>("/organizations/brands", { method: "POST", body: JSON.stringify(body) }),
  legalEntities: (organizationId: number) => request<LegalEntity[]>(`/organizations/${organizationId}/legal-entities`),
  createLegalEntity: (body: { organization_id: number; name: string; legal_type?: string; requisites?: Record<string, unknown>; bank_details?: Record<string, unknown>; tax_system?: string }) => request<LegalEntity>("/organizations/legal-entities", { method: "POST", body: JSON.stringify(body) }),
  departments: (organizationId: number) => request<Department[]>(`/organizations/${organizationId}/departments`),
  createDepartment: (body: { organization_id: number; branch_id: number; name: string }) => request<Department>("/organizations/departments", { method: "POST", body: JSON.stringify(body) }),
  workplaces: (organizationId: number) => request<Workplace[]>(`/organizations/${organizationId}/workplaces`),
  createWorkplace: (body: { organization_id: number; branch_id: number; department_id?: number; name: string; resource_type?: string }) => request<Workplace>("/organizations/workplaces", { method: "POST", body: JSON.stringify(body) }),
  modules: (organizationId: number) => request<OrganizationModule[]>(`/organizations/${organizationId}/modules`),
  createModule: (body: { organization_id: number; module_name: string }) => request<OrganizationModule>("/organizations/modules", { method: "POST", body: JSON.stringify(body) }),
  roles: (organizationId: number) => request<Role[]>(`/users-access/organizations/${organizationId}/roles`),
  createRole: (body: { organization_id: number; name: string }) => request<Role>("/users-access/roles", { method: "POST", body: JSON.stringify(body) }),
  permissions: () => request<Permission[]>("/users-access/permissions"),
  createPermission: (body: { code: string; name: string; description?: string }) => request<Permission>("/users-access/permissions", { method: "POST", body: JSON.stringify(body) }),
  users: () => request<User[]>("/users-access/users"),
  createUser: (body: { phone?: string; email?: string; telegram_id?: number; first_name?: string; last_name?: string; password_hash?: string }) => request<User>("/users-access/users", { method: "POST", body: JSON.stringify(body) }),
  blockUser: (userId: number) => request<User>(`/users-access/users/${userId}/block`, { method: "POST" }),
  unblockUser: (userId: number) => request<User>(`/users-access/users/${userId}/unblock`, { method: "POST" }),
  organizationMemberships: (organizationId: number) => request<UserOrganizationMembership[]>(`/users-access/organizations/${organizationId}/organization-memberships`),
  branchMemberships: (organizationId: number) => request<UserBranchMembership[]>(`/users-access/organizations/${organizationId}/branch-memberships`),
  assignUserToOrganization: (body: { organization_id: number; user_id: number; role_id: number }) => request<UserOrganizationMembership>("/users-access/organization-memberships", { method: "POST", body: JSON.stringify(body) }),
  assignUserToBranch: (body: { organization_id: number; branch_id: number; user_id: number; role_id: number }) => request<UserBranchMembership>("/users-access/branch-memberships", { method: "POST", body: JSON.stringify(body) }),
  addPermissionToRole: (body: { role_id: number; permission_id: number }) => request<RolePermission>("/users-access/role-permissions", { method: "POST", body: JSON.stringify(body) }),
  setUserPermission: (body: { user_id: number; organization_id: number; branch_id?: number; permission_id: number; is_allowed: boolean }) => request<UserPermission>("/users-access/user-permissions", { method: "POST", body: JSON.stringify(body) }),
  grantTemporaryAccess: (body: { user_id: number; organization_id: number; branch_id?: number; permission_id: number; valid_from: string; valid_until: string }) => request<TemporaryAccess>("/users-access/temporary-accesses", { method: "POST", body: JSON.stringify(body) }),
  loginHistory: (userId: number) => request<LoginHistory[]>(`/users-access/users/${userId}/login-history`),
  setTwoFactorAuth: (body: { user_id: number; method: string; is_enabled: boolean }) => request<TwoFactorAuth>("/users-access/two-factor-auth", { method: "POST", body: JSON.stringify(body) }),
  auditLogs: (organizationId: number) => request<AuditLog[]>(`/audit?organization_id=${organizationId}`),
  eventLogs: (organizationId: number) => request<EventLog[]>(`/events?organization_id=${organizationId}`),

  clients: (organizationId: number, query = "") =>
    request<Client[]>(
      `/crm-api/clients-core/clients/search?organization_id=${organizationId}&query=${encodeURIComponent(query)}`,
    ),
  createClient: (body: { organization_id: number; first_name?: string; last_name?: string; middle_name?: string; primary_phone?: string; secondary_phone?: string; email?: string; telegram_id?: number; max_id?: number; vk_id?: number; birth_date?: string; gender?: string; online_booking_enabled?: boolean; status: string }) =>
    request<Client>("/crm-api/clients-core/clients", { method: "POST", body: JSON.stringify(body) }),
  updateClient: (id: number, body: { first_name?: string; last_name?: string; middle_name?: string; primary_phone?: string; secondary_phone?: string; email?: string; telegram_id?: number; max_id?: number; vk_id?: number; birth_date?: string; gender?: string; photo_file_id?: string; comment?: string; note?: string; importance_class?: number; online_booking_enabled?: boolean; referrer_client_id?: number; api_field_1?: string; api_field_2?: string; api_field_3?: string; status?: string }) =>
    request<Client>(`/crm-api/clients-core/clients/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteClient: (clientId: number) =>
    request<void>(`/crm-api/clients-core/clients/${clientId}`, { method: "DELETE" }),
  clientProfile: (clientId: number, organizationId: number) =>
    request<ClientProfile>(`/crm-api/client-profile/clients/${clientId}?organization_id=${organizationId}`),
  clientProfileMetric: (clientId: number) =>
    request<ClientProfileMetric | null>(`/crm-api/client-profile/clients/${clientId}/metrics`),
  clientHistoryVisits: (clientId: number) =>
    request<ClientVisitListItem[]>(`/crm-api/client-history/visits?client_id=${clientId}&include_services=true&include_products=true`),
  createClientVisit: (body: { organization_id: number; client_id: number; visit_at: string; branch_id?: number; employee_id?: number; visit_status: string; total_cost: number; discount_amount: number; paid_amount: number; comment?: string }) =>
    request<ClientVisit>("/crm-api/client-history/visits", { method: "POST", body: JSON.stringify(body) }),
  clientAccounts: (clientId: number) =>
    request<ClientAccountsSummary>(`/crm-api/client-accounts/clients/${clientId}`),
  clientSegments: (organizationId: number) =>
    request<ClientSegment[]>(`/crm-api/client-segments/segments?organization_id=${organizationId}`),
  clientCategories: (clientId: number) =>
    request<ClientCategory[]>(`/crm-api/clients-core/clients/${clientId}/categories`),
  clientAdditionalFieldValues: (clientId: number) =>
    request<ClientAdditionalFieldValue[]>(`/crm-api/clients-core/additional-field-values?client_id=${clientId}`),
  clientBranches: (clientId: number) =>
    request<ClientBranchRelation[]>(`/crm-api/clients-core/branches?client_id=${clientId}`),
  syncLoyaltyClient: (body: { id: number; phone?: string; telegram_id?: string; max_id?: string; vk_id?: string; full_name?: string }) =>
    request<{ id: number }>("/loyalty-api/clients/sync", { method: "POST", body: JSON.stringify(body) }),

  rules: (organizationId: number) => request<BonusRule[]>(`/loyalty-api/client-bonuses/rules?organization_id=${organizationId}`),
  createRule: (body: { organization_id: number; name: string; rule_type: BonusRule["rule_type"]; bonus_type: string; amount: number; expires_in_days?: number; is_active: boolean; target_type?: string; target_id?: number; client_level?: string; level_params?: Record<string, unknown>; usage_restrictions?: Record<string, unknown> }) =>
    request<BonusRule>("/loyalty-api/client-bonuses/rules", { method: "POST", body: JSON.stringify(body) }),
  applyRule: (ruleId: number, clientId: number, organizationId: number) =>
    request<ClientBonus>(`/loyalty-api/client-bonuses/rules/${ruleId}/apply`, { method: "POST", body: JSON.stringify({ client_id: clientId, organization_id: organizationId }) }),
  bonusLevels: (organizationId: number) => request<BonusLevel[]>(`/loyalty-api/client-bonuses/levels?organization_id=${organizationId}`),
  createBonusLevel: (body: { organization_id: number; name: string; params?: Record<string, unknown> }) =>
    request<BonusLevel>("/loyalty-api/client-bonuses/levels", { method: "POST", body: JSON.stringify(body) }),
  bonusBalance: (clientId: number, bonusType = "") =>
    request<BonusBalance>(`/loyalty-api/client-bonuses/clients/${clientId}/balance${bonusType ? `?bonus_type=${encodeURIComponent(bonusType)}` : ""}`),
  bonusHistory: (clientId: number) =>
    request<ClientBonus[]>(`/loyalty-api/client-bonuses/clients/${clientId}/history`),
  accrueBonus: (body: { client_id: number; amount: number; bonus_type: string; reason: string; expires_at?: string; rule_type?: BonusRule["rule_type"]; target_type?: string; target_id?: number; client_level?: string; level_params?: Record<string, unknown>; usage_restrictions?: Record<string, unknown> }) =>
    request<ClientBonus>("/loyalty-api/client-bonuses/accruals", { method: "POST", body: JSON.stringify(body) }),
  writeOffBonus: (body: { client_id: number; amount: number; bonus_type: string; reason: string }) =>
    request<ClientBonus>("/loyalty-api/client-bonuses/write-offs", { method: "POST", body: JSON.stringify(body) }),
  expireBonus: (body: { client_id: number; amount: number; bonus_type: string; reason?: string }) =>
    request<ClientBonus>("/loyalty-api/client-bonuses/expirations", { method: "POST", body: JSON.stringify(body) }),
  runBonusExpiration: () => request<ClientBonus[]>("/loyalty-api/client-bonuses/expirations/run", { method: "POST" }),
  subscriptions: (clientId: number) =>
    request<ClientSubscription[]>(`/loyalty-api/client-subscriptions/clients/${clientId}`),
  createSubscription: (body: { client_id: number; subscription_name: string; visits_total: number; visits_left: number; deposit_amount: number; deposit_left: number; started_at: string; expires_at?: string; auto_renewal_enabled: boolean; service_restrictions?: Record<string, unknown>; family_client_ids?: number[] }) =>
    request<ClientSubscription>("/loyalty-api/client-subscriptions", { method: "POST", body: JSON.stringify(body) }),
  freezeSubscription: (id: number, body: { frozen_from: string; frozen_until?: string }) =>
    request<ClientSubscription>(`/loyalty-api/client-subscriptions/${id}/freeze`, { method: "POST", body: JSON.stringify(body) }),
  unfreezeSubscription: (id: number) => request<ClientSubscription>(`/loyalty-api/client-subscriptions/${id}/unfreeze`, { method: "POST" }),
  transferSubscription: (id: number, to_client_id: number) =>
    request<ClientSubscription>(`/loyalty-api/client-subscriptions/${id}/transfer`, { method: "POST", body: JSON.stringify({ to_client_id }) }),
  addFamilyClient: (id: number, family_client_id: number) =>
    request<ClientSubscription>(`/loyalty-api/client-subscriptions/${id}/family-clients`, { method: "POST", body: JSON.stringify({ family_client_id }) }),
  setAutoRenewal: (id: number, enabled: boolean) =>
    request<ClientSubscription>(`/loyalty-api/client-subscriptions/${id}/auto-renewal/${enabled ? "enable" : "disable"}`, { method: "POST" }),
  writeOffSubscriptionVisit: (id: number, body: { visit_id: number; consumer_client_id?: number; visits_count: number; deposit_amount: number; write_off_at?: string }) =>
    request<ClientSubscription>(`/loyalty-api/client-subscriptions/${id}/write-off-after-visit`, { method: "POST", body: JSON.stringify(body) }),
  renewSubscription: (id: number, body: { visits_total: number; deposit_amount: number; started_at: string; expires_at?: string }) =>
    request<ClientSubscription>(`/loyalty-api/client-subscriptions/${id}/renew`, { method: "POST", body: JSON.stringify(body) }),
  expireSubscription: (id: number) => request<ClientSubscription>(`/loyalty-api/client-subscriptions/${id}/expire`, { method: "POST" }),
  certificates: (clientId: number) =>
    request<ClientCertificate[]>(`/loyalty-api/client-certificates/clients/${clientId}`),
  createCertificate: (body: { client_id: number; certificate_type: "digital" | "paper"; certificate_code: string; nominal_amount: number; balance_amount: number; issued_at: string; expires_at?: string }) =>
    request<ClientCertificate>("/loyalty-api/client-certificates", { method: "POST", body: JSON.stringify(body) }),
  useCertificate: (id: number, body: { amount: number; convert_rest_to_deposit: boolean }) =>
    request<ClientCertificate>(`/loyalty-api/client-certificates/${id}/use`, { method: "POST", body: JSON.stringify(body) }),
  transferCertificate: (id: number, to_client_id: number) =>
    request<ClientCertificate>(`/loyalty-api/client-certificates/${id}/transfer`, { method: "POST", body: JSON.stringify({ to_client_id }) }),
  refundCertificate: (id: number) => request<ClientCertificate>(`/loyalty-api/client-certificates/${id}/refund`, { method: "POST", body: JSON.stringify({}) }),
  convertCertificateToDeposit: (id: number) => request<ClientCertificate>(`/loyalty-api/client-certificates/${id}/convert-to-deposit`, { method: "POST" }),
  expireCertificate: (id: number) => request<ClientCertificate>(`/loyalty-api/client-certificates/${id}/expire`, { method: "POST" }),
  referralStats: (clientId: number) =>
    request<ReferralStats>(`/loyalty-api/client-referrals/referrers/${clientId}/stats`),
  referrals: (clientId: number) =>
    request<ClientReferral[]>(`/loyalty-api/client-referrals/referrers/${clientId}/referrals`),
  createReferralSource: (body: { referrer_client_id: number; referral_code: string; referral_link: string; reward_type: string; reward_bonus_type?: string; reward_amount: number; is_active: boolean }) =>
    request<ReferralSource>("/loyalty-api/client-referrals/sources", { method: "POST", body: JSON.stringify(body) }),
  registerReferralByCode: (body: { referral_code: string; invited_client_id: number }) =>
    request<ClientReferral>("/loyalty-api/client-referrals/register-by-code", { method: "POST", body: JSON.stringify(body) }),
  registerReferralByLink: (body: { referral_link: string; invited_client_id: number }) =>
    request<ClientReferral>("/loyalty-api/client-referrals/register-by-link", { method: "POST", body: JSON.stringify(body) }),
  markReferralFirstVisit: (id: number, external_first_visit_id: string) =>
    request<ClientReferral>(`/loyalty-api/client-referrals/${id}/first-visit`, { method: "POST", body: JSON.stringify({ external_first_visit_id }) }),
  accrueReferralReward: (id: number) => request<ClientReferral>(`/loyalty-api/client-referrals/${id}/reward/accrue`, { method: "POST" }),
  cancelReferralReward: (id: number, fraud_reason?: string) =>
    request<ClientReferral>(`/loyalty-api/client-referrals/${id}/reward/cancel`, { method: "POST", body: JSON.stringify({ fraud_reason }) }),
  promotions: (clientId: number) =>
    request<ClientPromotion[]>(`/loyalty-api/client-promotions/clients/${clientId}`),
  createPromotion: (body: { client_id: number; promotion_name: string; promotion_type: string; promo_code?: string; discount_type?: string; discount_value: number; gift?: string; package_offer?: Record<string, unknown>; valid_from?: string; valid_until?: string; client_segment?: string; min_amount: number; usage_limit?: number; weak_hours?: Record<string, unknown> }) =>
    request<ClientPromotion>("/loyalty-api/client-promotions", { method: "POST", body: JSON.stringify(body) }),
  applyPromotion: (id: number, body: { original_amount: number; cost_amount: number; client_segment?: string }) =>
    request<ClientPromotion>(`/loyalty-api/client-promotions/${id}/apply`, { method: "POST", body: JSON.stringify(body) }),
  applyPromotionByCode: (body: { client_id: number; promo_code: string; original_amount: number; cost_amount: number; client_segment?: string }) =>
    request<ClientPromotion>("/loyalty-api/client-promotions/apply-by-promo-code", { method: "POST", body: JSON.stringify(body) }),
  promotionProfitability: (id: number, body: { original_amount: number; cost_amount: number }) =>
    request<PromotionProfitability>(`/loyalty-api/client-promotions/${id}/profitability`, { method: "POST", body: JSON.stringify(body) }),
};
