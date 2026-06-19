import {zodResolver} from "@hookform/resolvers/zod";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";
import type {ReactNode} from "react";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {Link, Navigate, Outlet, Route, Routes, useNavigate, useParams} from "react-router-dom";
import {api, ApiError, BonusRule, Branch, Client, ClientVisitListItem, keys, LegalEntity, Organization, User} from "../api";
import {
    branchSchema,
    BranchForm,
    bonusLevelSchema,
    BonusLevelForm,
    bonusOperationSchema,
    BonusOperationForm,
    certificateSchema,
    CertificateForm,
    clientSchema,
    ClientForm,
    loginSchema,
    LoginForm,
    organizationSchema,
    OrganizationForm,
    promotionSchema,
    PromotionForm,
    referralSourceSchema,
    ReferralSourceForm,
    registerSchema,
    RegisterForm,
    ruleSchema,
    RuleForm,
    subscriptionSchema,
    SubscriptionForm,
} from "../forms";

const LAST_ORG_KEY = "loyalty.lastOrganizationId";

export default function App() {
    return (
        <Routes>
            <Route path="/login" element={<Auth mode="login"/>}/>
            <Route path="/register" element={<Auth mode="register"/>}/>
            <Route element={<Protected/>}>
                <Route path="/onboarding" element={<Onboarding/>}/>
                <Route path="/organizations/:organizationId" element={<Shell page="Обзор"><Dashboard/></Shell>}/>
                <Route path="/organizations/:organizationId/clients"
                       element={<Shell page="Клиенты"><Clients/></Shell>}/>
                <Route path="/organizations/:organizationId/clients/:clientId"
                       element={<Shell page="Клиент"><Clients/></Shell>}/>
                <Route path="/organizations/:organizationId/loyalty"
                       element={<Shell page="Лояльность"><Loyalty/></Shell>}/>
                <Route path="/organizations/:organizationId/loyalty/rules"
                       element={<Shell page="Правила начисления"><Loyalty/></Shell>}/>
                <Route path="/organizations/:organizationId/loyalty/levels"
                       element={<Shell page="Уровни клиентов"><Loyalty/></Shell>}/>
                <Route path="/organizations/:organizationId/loyalty/transactions"
                       element={<Shell page="Транзакции"><Loyalty/></Shell>}/>
                <Route path="/organizations/:organizationId/loyalty/promotions"
                       element={<Shell page="Акции"><Loyalty/></Shell>}/>
                <Route path="/organizations/:organizationId/loyalty/certificates"
                       element={<Shell page="Сертификаты"><Loyalty/></Shell>}/>
                <Route path="/organizations/:organizationId/loyalty/subscriptions"
                       element={<Shell page="Абонементы"><Loyalty/></Shell>}/>
                <Route path="/organizations/:organizationId/loyalty/referrals"
                       element={<Shell page="Реферальная программа"><Loyalty/></Shell>}/>
                <Route path="/organizations/:organizationId/settings"
                       element={<Shell page="Настройки оранизации"><Settings/></Shell>}/>
                <Route path="/" element={<Entry/>}/>
            </Route>
            <Route path="*" element={<NotFound/>}/>
        </Routes>
    );
}

function Protected() {
    const me = useQuery({queryKey: keys.me, queryFn: api.me, retry: false});
    if (me.isLoading) return <FullPage text="Проверяем сессию..."/>;
    if (me.isError) return <Navigate to="/login" replace/>;
    return <Outlet/>;
}

function Entry() {
    const orgs = useQuery({queryKey: keys.orgs, queryFn: api.organizations});
    if (orgs.isLoading) return <FullPage text="Загружаем организации..."/>;
    if (orgs.isError) return <ErrorState error={orgs.error} retry={() => orgs.refetch()}/>;
    const organizations = orgs.data ?? [];
    if (!organizations.length) return <Navigate to="/onboarding" replace/>;
    const saved = Number(localStorage.getItem(LAST_ORG_KEY));
    const organization = organizations.find((item) => item.id === saved) ?? organizations[0];
    return <Navigate to={`/organizations/${organization.id}`} replace/>;
}

function Auth({mode}: { mode: "login" | "register" }) {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const [showPassword, setShowPassword] = useState(false);
    const isLogin = mode === "login";
    const login = useForm<LoginForm>({resolver: zodResolver(loginSchema)});
    const register = useForm<RegisterForm>({resolver: zodResolver(registerSchema)});
    const mutation = useMutation({
        mutationFn: (data: LoginForm | RegisterForm) =>
            isLogin
                ? api.login(data as LoginForm)
                : api.register({
                    name: (data as RegisterForm).name,
                    email: (data as RegisterForm).email || undefined,
                    phone: (data as RegisterForm).phone || undefined,
                    password: data.password,
                }),
        onSuccess: async () => {
            await qc.invalidateQueries({queryKey: keys.me});
            navigate("/");
        },
    });

    return (
        <main className="auth-page">
            <form
                className="auth-card"
                onSubmit={
                    isLogin
                        ? login.handleSubmit((data) => mutation.mutate(data))
                        : register.handleSubmit((data) => mutation.mutate(data))
                }
            >
                <h1>{isLogin ? "Вход" : "Регистрация"}</h1>
                {!isLogin && <Field label="Имя"
                                    error={register.formState.errors.name?.message}><input {...register.register("name")} /></Field>}
                <Field label={isLogin ? "Email или телефон" : "Email"}
                       error={isLogin ? login.formState.errors.login?.message : register.formState.errors.email?.message}>
                    <input {...(isLogin ? login.register("login") : register.register("email"))} />
                </Field>
                {!isLogin && <Field label="Телефон"
                                    error={register.formState.errors.phone?.message}><input {...register.register("phone")} /></Field>}
                <Field label="Пароль"
                       error={isLogin ? login.formState.errors.password?.message : register.formState.errors.password?.message}>
                    <div className="password-row">
                        <input
                            type={showPassword ? "text" : "password"} {...(isLogin ? login.register("password") : register.register("password"))} />
                        <button type="button" className="ghost"
                                onClick={() => setShowPassword((value) => !value)}>{showPassword ? "Скрыть" : "Показать"}</button>
                    </div>
                </Field>
                {!isLogin && <Field label="Повтор пароля" error={register.formState.errors.confirm?.message}><input
                    type="password" {...register.register("confirm")} /></Field>}
                {mutation.isError && <p className="form-error">{message(mutation.error)}</p>}
                <button className="primary"
                        disabled={mutation.isPending}>{mutation.isPending ? "Отправляем..." : isLogin ? "Войти" : "Создать аккаунт"}</button>
                <Link to={isLogin ? "/register" : "/login"}>{isLogin ? "Создать аккаунт" : "Уже есть аккаунт"}</Link>
            </form>
        </main>
    );
}

function Onboarding() {
    const navigate = useNavigate();
    const qc = useQueryClient();
    const form = useForm<OrganizationForm>({resolver: zodResolver(organizationSchema)});
    const create = useMutation({
        mutationFn: (data: OrganizationForm) => api.createOrganization({name: data.name}),
        onSuccess: async (org) => {
            localStorage.setItem(LAST_ORG_KEY, String(org.id));
            await qc.invalidateQueries({queryKey: keys.orgs});
            navigate(`/organizations/${org.id}`);
        },
    });
    return (
        <main className="auth-page">
            <form className="auth-card wide" onSubmit={form.handleSubmit((data) => create.mutate(data))}>
                <h1>Создание оранизации</h1>
                <p>После этого откроются филиалы, клиенты и единая программа лояльности организации.</p>
                <Field label="Название организации"
                       error={form.formState.errors.name?.message}><input {...form.register("name")} /></Field>
                {create.isError && <p className="form-error">{message(create.error)}</p>}
                <button className="primary"
                        disabled={create.isPending}>{create.isPending ? "Создаём..." : "Создать организацию"}</button>
            </form>
        </main>
    );
}

function Shell({page, children}: { page: string; children: ReactNode }) {
    const {organizationId = ""} = useParams();
    const id = Number(organizationId);
    const orgs = useQuery({queryKey: keys.orgs, queryFn: api.organizations});
    const navigate = useNavigate();
    const qc = useQueryClient();
    const logout = useMutation({
        mutationFn: api.logout, onSuccess: () => {
            qc.clear();
            navigate("/login");
        }
    });
    if (orgs.isLoading) return <FullPage text="Загружаем кабинет..."/>;
    if (orgs.isError) return <ErrorState error={orgs.error} retry={() => orgs.refetch()}/>;
    const organizations = orgs.data ?? [];
    const current = organizations.find((org) => org.id === id);
    if (!current) return <AccessDenied/>;

    return (
        <div className="app">
            <aside className="sidebar">
                <strong className="brand">Лояльность</strong>
                <select
                    aria-label="Организация"
                    value={id}
                    onChange={(event) => {
                        localStorage.setItem(LAST_ORG_KEY, event.target.value);
                        navigate(`/organizations/${event.target.value}`);
                    }}
                >
                    {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
                </select>
                <button className="ghost" onClick={() => navigate("/onboarding")}>Создать организацию</button>
                <nav>
                    <Nav to={`/organizations/${id}`} label="Обзор"/>
                    <Nav to={`/organizations/${id}/clients`} label="Клиенты"/>
                    <Nav to={`/organizations/${id}/loyalty`} label="Лояльность"/>
                    <Nav to={`/organizations/${id}/settings`} label="Настройки оранизации"/>
                </nav>
            </aside>
            <main className="content">
                <header className="topbar">
                    <div><span>{current.name}</span><h1>{page}</h1></div>
                    <button className="ghost" disabled={logout.isPending} onClick={() => logout.mutate()}>Выйти</button>
                </header>
                {children}
            </main>
        </div>
    );
}

function Dashboard() {
    const org = useOrg();
    const branches = useQuery({queryKey: keys.branches(org.id), queryFn: () => api.branches(org.id)});
    const clients = useQuery({queryKey: keys.clients(org.id), queryFn: () => api.clients(org.id)});
    const rules = useQuery({queryKey: keys.rules(org.id), queryFn: () => api.rules(org.id)});
    return (
        <section className="grid">
            <Metric label="Филиалов" query={branches}/>
            <Metric label="Клиентов" query={clients}/>
            <Metric label="Активных правил" query={rules}
                    value={(rules.data ?? []).filter((rule) => rule.is_active).length}/>
            <div className="panel span">
            </div>
        </section>
    );
}

function Clients() {
    const org = useOrg();
    const [query, setQuery] = useState("");
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [selectedVisit, setSelectedVisit] = useState<ClientVisitListItem | null>(null);
    const [clientCard, setClientCard] = useState({
        first_name: "",
        last_name: "",
        middle_name: "",
        telegram_id: "",
        max_id: "",
        primary_phone: "",
        secondary_phone: "",
        email: "",
        vk_id: "",
        birth_date: "",
        gender: "",
        photo_file_id: "",
        comment: "",
        note: "",
        importance_class: "0",
        online_booking_enabled: true,
        referrer_client_id: "",
        api_field_1: "",
        api_field_2: "",
        api_field_3: "",
        status: "active",
    });
    const [visitCard, setVisitCard] = useState({
        visit_at: new Date().toISOString().slice(0, 16),
        branch_id: "",
        employee_id: "",
        visit_status: "completed",
        total_cost: "0",
        discount_amount: "0",
        paid_amount: "0",
        service_names: "",
        product_names: "",
        comment: "",
    });
    const qc = useQueryClient();
    const clients = useQuery({queryKey: [...keys.clients(org.id), query], queryFn: () => api.clients(org.id, query)});
    const branches = useQuery({queryKey: keys.branches(org.id), queryFn: () => api.branches(org.id)});
    const users = useQuery({queryKey: ["users"], queryFn: api.users});
    const organizationMemberships = useQuery({queryKey: ["organization-memberships", org.id], queryFn: () => api.organizationMemberships(org.id)});
    const roles = useQuery({queryKey: ["roles", org.id], queryFn: () => api.roles(org.id)});
    const selectedClientId = selectedClient?.id ?? null;
    const profile = useQuery({queryKey: ["client-profile", org.id, selectedClientId], queryFn: () => api.clientProfile(selectedClientId!, org.id), enabled: !!selectedClientId});
    const profileMetric = useQuery({queryKey: ["client-profile-metric", selectedClientId], queryFn: () => api.clientProfileMetric(selectedClientId!), enabled: !!selectedClientId});
    const visits = useQuery({queryKey: ["client-history-visits", selectedClientId], queryFn: () => api.clientHistoryVisits(selectedClientId!), enabled: !!selectedClientId});
    const accounts = useQuery({queryKey: ["client-accounts", selectedClientId], queryFn: () => api.clientAccounts(selectedClientId!), enabled: !!selectedClientId});
    const segments = useQuery({queryKey: ["client-segments", org.id], queryFn: () => api.clientSegments(org.id)});
    const categories = useQuery({queryKey: ["client-categories", selectedClientId], queryFn: () => api.clientCategories(selectedClientId!), enabled: !!selectedClientId});
    const additionalFields = useQuery({queryKey: ["client-additional-fields", selectedClientId], queryFn: () => api.clientAdditionalFieldValues(selectedClientId!), enabled: !!selectedClientId});
    const clientBranches = useQuery({queryKey: ["client-branches", selectedClientId], queryFn: () => api.clientBranches(selectedClientId!), enabled: !!selectedClientId});
    const segmentExamples = [
        "Новые клиенты",
        "Не были более 60 дней",
        "Часто отменяют записи",
        "Покупают конкретную услугу",
        "Средний чек выше 10 000 ₽",
        "Пришли из Telegram",
        "Имеют неиспользованный сертификат",
        "Скоро день рождения",
        "Были у уволившегося сотрудника",
    ];
    const metric = profileMetric.data ?? profile.data?.metrics ?? null;
    const buildVisitComment = () => {
        const parts = [
            visitCard.service_names.trim() ? `__services:${visitCard.service_names.trim()}` : "",
            visitCard.product_names.trim() ? `__products:${visitCard.product_names.trim()}` : "",
            visitCard.comment.trim(),
        ].filter(Boolean);
        return parts.join("\n");
    };
    const parseVisitComment = (value?: string | null) => {
        const lines = (value ?? "").split("\n");
        const meta = {serviceNames: "", productNames: "", comment: ""};
        const commentLines: string[] = [];
        for (const line of lines) {
            if (line.startsWith("__services:")) {
                meta.serviceNames = line.slice("__services:".length).trim();
            } else if (line.startsWith("__products:")) {
                meta.productNames = line.slice("__products:".length).trim();
            } else {
                commentLines.push(line);
            }
        }
        meta.comment = commentLines.join("\n").trim();
        return meta;
    };
    const branchOptions = branches.data ?? [];
    const roleOptions = roles.data ?? [];
    const organizationUserIds = new Set((organizationMemberships.data ?? []).map((item) => item.user_id));
    const masterRoleIds = new Set(roleOptions.filter((item) => item.name.toLowerCase().includes("мастер")).map((item) => item.id));
    const userOptions = (users.data ?? []).filter((item) => organizationUserIds.has(item.id));
    const masterUserIds = new Set((organizationMemberships.data ?? []).filter((item) => masterRoleIds.has(item.role_id)).map((item) => item.user_id));
    const masterOptions = userOptions.filter((item) => masterUserIds.has(item.id));
    const form = useForm<ClientForm>({resolver: zodResolver(clientSchema), defaultValues: {online_booking_enabled: true}});
    const create = useMutation({
        mutationFn: (data: ClientForm) => api.createClient({
            organization_id: org.id,
            status: "active",
            ...(data.first_name?.trim() ? {first_name: data.first_name.trim()} : {}),
            ...(data.last_name?.trim() ? {last_name: data.last_name.trim()} : {}),
            ...(data.middle_name?.trim() ? {middle_name: data.middle_name.trim()} : {}),
            ...(data.primary_phone?.trim() ? {primary_phone: data.primary_phone.trim()} : {}),
            ...(data.secondary_phone?.trim() ? {secondary_phone: data.secondary_phone.trim()} : {}),
            ...(data.email?.trim() ? {email: data.email.trim()} : {}),
            ...(data.telegram_id?.trim() ? {telegram_id: Number(data.telegram_id)} : {}),
            ...(data.max_id?.trim() ? {max_id: Number(data.max_id)} : {}),
            ...(data.vk_id?.trim() ? {vk_id: Number(data.vk_id)} : {}),
            ...(data.birth_date?.trim() ? {birth_date: data.birth_date} : {}),
            ...(data.gender?.trim() ? {gender: data.gender.trim()} : {}),
            online_booking_enabled: !!data.online_booking_enabled,
        }),
        onSuccess: async () => {
            form.reset();
            await qc.invalidateQueries({queryKey: keys.clients(org.id)});
        },
    });
    const update = useMutation({
        mutationFn: () => selectedClient ? api.updateClient(selectedClient.id, {
            ...(clientCard.first_name.trim() ? {first_name: clientCard.first_name.trim()} : {}),
            ...(clientCard.last_name.trim() ? {last_name: clientCard.last_name.trim()} : {}),
            ...(clientCard.middle_name.trim() ? {middle_name: clientCard.middle_name.trim()} : {}),
            ...(clientCard.primary_phone.trim() ? {primary_phone: clientCard.primary_phone.trim()} : {}),
            ...(clientCard.secondary_phone.trim() ? {secondary_phone: clientCard.secondary_phone.trim()} : {}),
            ...(clientCard.email.trim() ? {email: clientCard.email.trim()} : {}),
            ...(clientCard.telegram_id.trim() ? {telegram_id: Number(clientCard.telegram_id)} : {}),
            ...(clientCard.max_id.trim() ? {max_id: Number(clientCard.max_id)} : {}),
            ...(clientCard.vk_id.trim() ? {vk_id: Number(clientCard.vk_id)} : {}),
            ...(clientCard.birth_date.trim() ? {birth_date: clientCard.birth_date} : {}),
            ...(clientCard.gender.trim() ? {gender: clientCard.gender.trim()} : {}),
            ...(clientCard.photo_file_id.trim() ? {photo_file_id: clientCard.photo_file_id.trim()} : {}),
            ...(clientCard.comment.trim() ? {comment: clientCard.comment.trim()} : {}),
            ...(clientCard.note.trim() ? {note: clientCard.note.trim()} : {}),
            importance_class: Number(clientCard.importance_class || 0),
            online_booking_enabled: !!clientCard.online_booking_enabled,
            ...(clientCard.referrer_client_id.trim() ? {referrer_client_id: Number(clientCard.referrer_client_id)} : {}),
            ...(clientCard.api_field_1.trim() ? {api_field_1: clientCard.api_field_1.trim()} : {}),
            ...(clientCard.api_field_2.trim() ? {api_field_2: clientCard.api_field_2.trim()} : {}),
            ...(clientCard.api_field_3.trim() ? {api_field_3: clientCard.api_field_3.trim()} : {}),
            ...(clientCard.status.trim() ? {status: clientCard.status.trim()} : {}),
        }) : Promise.reject(new Error("Клиент не выбран")),
        onSuccess: async (client) => {
            setSelectedClient(client);
            await qc.invalidateQueries({queryKey: keys.clients(org.id)});
        },
    });
    const createVisit = useMutation({
        mutationFn: () => selectedClient ? api.createClientVisit({
            organization_id: org.id,
            client_id: selectedClient.id,
            visit_at: new Date(visitCard.visit_at).toISOString(),
            ...(visitCard.branch_id.trim() ? {branch_id: Number(visitCard.branch_id)} : {}),
            ...(visitCard.employee_id.trim() ? {employee_id: Number(visitCard.employee_id)} : {}),
            visit_status: visitCard.visit_status,
            total_cost: Number(visitCard.total_cost || 0),
            discount_amount: Number(visitCard.discount_amount || 0),
            paid_amount: Number(visitCard.paid_amount || 0),
            ...(buildVisitComment() ? {comment: buildVisitComment()} : {}),
        }) : Promise.reject(new Error("Клиент не выбран")),
        onSuccess: async () => {
            setVisitCard({
                visit_at: new Date().toISOString().slice(0, 16),
                branch_id: "",
                employee_id: "",
                visit_status: "completed",
                total_cost: "0",
                discount_amount: "0",
                paid_amount: "0",
                service_names: "",
                product_names: "",
                comment: "",
            });
            await Promise.all([
                visits.refetch(),
                profile.refetch(),
                profileMetric.refetch(),
                accounts.refetch(),
                clientBranches.refetch(),
            ]);
        },
    });
    return (
        <section className="panel">
            <h2>Клиенты</h2>
            <form className="inline-form" onSubmit={form.handleSubmit((data) => create.mutate(data))}>
                <Field label="Имя"><input {...form.register("first_name")} /></Field>
                <Field label="Фамилия"><input {...form.register("last_name")} /></Field>
                <Field label="Отчество"><input {...form.register("middle_name")} /></Field>
                <Field label="Основной телефон"><input {...form.register("primary_phone")} /></Field>
                <Field label="Доп. телефон"><input {...form.register("secondary_phone")} /></Field>
                <Field label="Пол"><select {...form.register("gender")}><option value="">Не указан</option><option value="male">Мужской</option><option value="female">Женский</option></select></Field>
                <Field label="Email" error={form.formState.errors.email?.message}><input {...form.register("email")} /></Field>
                <Field label="Telegram ID"><input {...form.register("telegram_id")} /></Field>
                <button className="primary"
                        disabled={create.isPending}>{create.isPending ? "Сохраняем..." : "Добавить клиента"}</button>
            </form>
            {create.isError && <p className="form-error">{message(create.error)}</p>}
            <input className="search" placeholder="Поиск по имени, телефону или email" value={query}
                   onChange={(event) => setQuery(event.target.value)}/>
            <Table loading={clients.isLoading} error={clients.error} retry={() => clients.refetch()}
                   empty="Клиентов пока нет.">
                {clients.data?.map((item) => (
                    <tr key={item.id}>
                        <td><button type="button" className="ghost" onClick={() => {
                            setSelectedClient(item);
                            setSelectedVisit(null);
                            setClientCard({
                                first_name: item.first_name ?? "",
                                last_name: item.last_name ?? "",
                                middle_name: item.middle_name ?? "",
                                telegram_id: item.telegram_id ? String(item.telegram_id) : "",
                                max_id: item.max_id ? String(item.max_id) : "",
                                primary_phone: item.primary_phone ?? "",
                                secondary_phone: item.secondary_phone ?? "",
                                email: item.email ?? "",
                                vk_id: item.vk_id ? String(item.vk_id) : "",
                                birth_date: item.birth_date ?? "",
                                gender: item.gender ?? "",
                                photo_file_id: item.photo_file_id ?? "",
                                comment: item.comment ?? "",
                                note: item.note ?? "",
                                importance_class: String(item.importance_class ?? 0),
                                online_booking_enabled: !!item.online_booking_enabled,
                                referrer_client_id: item.referrer_client_id ? String(item.referrer_client_id) : "",
                                api_field_1: item.api_field_1 ?? "",
                                api_field_2: item.api_field_2 ?? "",
                                api_field_3: item.api_field_3 ?? "",
                                status: item.status ?? "active",
                            });
                        }}><b>{name(item)}</b><small>{statusLabel(item.status)}</small></button></td>
                        <td>{item.primary_phone ?? "Не указан"}</td>
                        <td>{item.email ?? "Не указан"}</td>
                        <td><small>LTV: Нет данных · Ср. чек: Нет данных</small></td>
                        <td>{new Date(item.created_at).toLocaleDateString("ru-RU")}</td>
                    </tr>
                ))}
            </Table>
            <div className="subpanel">
                <h3>Сервис сегментации</h3>
                <SimpleList loading={segments.isLoading} error={segments.error} retry={() => segments.refetch()}
                            empty="Сегменты пока не настроены."
                            rows={segments.data?.map((item) => `${item.name}${item.is_dynamic ? " · динамический" : ""}`) ?? segmentExamples}/>
            </div>
            {selectedClient && <div className="modal-backdrop" onClick={() => {
                setSelectedVisit(null);
                setSelectedClient(null);
            }}>
                <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                    <div className="modal-head">
                        <h3>{name(selectedClient)}</h3>
                        <button type="button" className="ghost" onClick={() => {
                            setSelectedVisit(null);
                            setSelectedClient(null);
                        }}>Закрыть</button>
                    </div>
                    <form className="modal-grid" onSubmit={(event) => {
                        event.preventDefault();
                        update.mutate();
                    }}>
                        <Field label="Имя"><input value={clientCard.first_name} onChange={(event) => setClientCard({...clientCard, first_name: event.target.value})}/></Field>
                        <Field label="Фамилия"><input value={clientCard.last_name} onChange={(event) => setClientCard({...clientCard, last_name: event.target.value})}/></Field>
                        <Field label="Отчество"><input value={clientCard.middle_name} onChange={(event) => setClientCard({...clientCard, middle_name: event.target.value})}/></Field>
                        <Field label="ФИО"><input value={[clientCard.last_name, clientCard.first_name, clientCard.middle_name].filter(Boolean).join(" ")} readOnly/></Field>
                        <Field label="Телеграм айди"><input value={clientCard.telegram_id} onChange={(event) => setClientCard({...clientCard, telegram_id: event.target.value})}/></Field>
                        <Field label="Макс айди"><input value={clientCard.max_id} onChange={(event) => setClientCard({...clientCard, max_id: event.target.value})}/></Field>
                        <Field label="Телефон"><input value={clientCard.primary_phone} onChange={(event) => setClientCard({...clientCard, primary_phone: event.target.value})}/></Field>
                        <Field label="ВК айди"><input value={clientCard.vk_id} onChange={(event) => setClientCard({...clientCard, vk_id: event.target.value})}/></Field>
                        <Field label="Основной телефон"><input value={clientCard.primary_phone} onChange={(event) => setClientCard({...clientCard, primary_phone: event.target.value})}/></Field>
                        <Field label="Дополнительный телефон"><input value={clientCard.secondary_phone} onChange={(event) => setClientCard({...clientCard, secondary_phone: event.target.value})}/></Field>
                        <Field label="Email"><input value={clientCard.email} onChange={(event) => setClientCard({...clientCard, email: event.target.value})}/></Field>
                        <Field label="Дата рождения"><input type="date" value={clientCard.birth_date} onChange={(event) => setClientCard({...clientCard, birth_date: event.target.value})}/></Field>
                        <Field label="Пол"><select value={clientCard.gender} onChange={(event) => setClientCard({...clientCard, gender: event.target.value})}><option value="">Не указан</option><option value="male">Мужской</option><option value="female">Женский</option></select></Field>
                        <Field label="Фото"><input value={clientCard.photo_file_id} onChange={(event) => setClientCard({...clientCard, photo_file_id: event.target.value})}/></Field>
                        <Field label="Комментарий"><input value={clientCard.comment} onChange={(event) => setClientCard({...clientCard, comment: event.target.value})}/></Field>
                        <Field label="Примечание"><input value={clientCard.note} onChange={(event) => setClientCard({...clientCard, note: event.target.value})}/></Field>
                        <Field label="Класс важности"><input type="number" value={clientCard.importance_class} onChange={(event) => setClientCard({...clientCard, importance_class: event.target.value})}/></Field>
                        <ReadonlyField label="Категории" value={categories.data?.map((item) => item.name).join(", ") ?? ""}/>
                        <Field label="Возможность онлайн-записи"><input type="checkbox" checked={clientCard.online_booking_enabled} onChange={(event) => setClientCard({...clientCard, online_booking_enabled: event.target.checked})}/></Field>
                        <ReadonlyField label="Дополнительные поля" value={additionalFields.data?.map((item) => item.value_text ?? JSON.stringify(item.value_json ?? {})).join(", ") ?? ""}/>
                        <ReadonlyField label="ID клиента" value={String(selectedClient.id)}/>
                        <ReadonlyField label="Дата создания" value={dateTime(selectedClient.created_at)}/>
                        <ReadonlyField label="Источник создания" value={selectedClient.creation_source ?? ""}/>
                        <ReadonlyField label="Кто создал" value={selectedClient.created_by ? String(selectedClient.created_by) : ""}/>
                        <ReadonlyField label="Дата последнего изменения" value={dateTime(selectedClient.updated_at)}/>
                        <Field label="Статус"><select value={clientCard.status} onChange={(event) => setClientCard({...clientCard, status: event.target.value})}><option value="active">Активен</option><option value="archived">В архиве</option></select></Field>
                        <ReadonlyField label="Филиалы, в которых был клиент" value={clientBranches.data?.map((item) => `ID ${item.branch_id}`).join(", ") ?? ""}/>
                        <Field label="Айди рефовода"><input value={clientCard.referrer_client_id} onChange={(event) => setClientCard({...clientCard, referrer_client_id: event.target.value})}/></Field>
                        <Field label="Свободный столбец 1"><input value={clientCard.api_field_1} onChange={(event) => setClientCard({...clientCard, api_field_1: event.target.value})}/></Field>
                        <Field label="Свободный столбец 2"><input value={clientCard.api_field_2} onChange={(event) => setClientCard({...clientCard, api_field_2: event.target.value})}/></Field>
                        <Field label="Свободный столбец 3"><input value={clientCard.api_field_3} onChange={(event) => setClientCard({...clientCard, api_field_3: event.target.value})}/></Field>
                        <ReadonlyField label="LTV" value={metric ? money(metric.ltv) : ""}/>
                        <ReadonlyField label="Частота посещений" value={metric?.visit_frequency ? String(metric.visit_frequency) : ""}/>
                        <ReadonlyField label="Средний чек" value={metric ? money(metric.average_check) : ""}/>
                        <ReadonlyField label="Срок с последнего визита" value={metric?.days_since_last_visit !== null && metric?.days_since_last_visit !== undefined ? `${metric.days_since_last_visit} дней` : ""}/>
                        <ReadonlyField label="Вероятность ухода" value={metric?.churn_probability !== null && metric?.churn_probability !== undefined ? `${Math.round(metric.churn_probability * 100)}%` : ""}/>
                        <ReadonlyField label="Прибыль от клиента" value={metric ? money(metric.profit_amount) : ""}/>
                        <ReadonlyField label="Стоимость привлечения" value={metric ? money(metric.acquisition_cost) : ""}/>
                        <button className="primary" disabled={update.isPending}>{update.isPending ? "Сохраняем..." : "Сохранить"}</button>
                    </form>
                    <div className="subpanel">
                        <h3>Сервис истории</h3>
                        <form className="inline-form compact visit-form" onSubmit={(event) => {
                            event.preventDefault();
                            createVisit.mutate();
                        }}>
                            <Field label="Дата и время"><input type="datetime-local" value={visitCard.visit_at}
                                                               onChange={(event) => setVisitCard({...visitCard, visit_at: event.target.value})}/></Field>
                            <Field label="Филиал"><select value={visitCard.branch_id}
                                                          onChange={(event) => setVisitCard({...visitCard, branch_id: event.target.value})}><option value="">Выберите филиал</option>{branchOptions.map((item) => <option key={item.id} value={String(item.id)}>{item.name}</option>)}</select></Field>
                            <Field label="Мастер"><select value={visitCard.employee_id}
                                                          onChange={(event) => setVisitCard({...visitCard, employee_id: event.target.value})}><option value="">Выберите мастера</option>{masterOptions.map((item) => <option key={item.id} value={String(item.id)}>{[item.first_name, item.last_name].filter(Boolean).join(" ") || item.email || item.phone || `User ${item.id}`}</option>)}</select></Field>
                            <Field label="Статус"><select value={visitCard.visit_status}
                                                          onChange={(event) => setVisitCard({...visitCard, visit_status: event.target.value})}><option value="completed">Завершен</option><option value="scheduled">Запланирован</option><option value="cancelled">Отменен</option><option value="no_show">Не пришел</option></select></Field>
                            <Field label="Стоимость"><input type="number" value={visitCard.total_cost}
                                                            onChange={(event) => {
                                                                const totalCost = event.target.value;
                                                                const paidAmount = Math.max(Number(totalCost || 0) - Number(visitCard.discount_amount || 0), 0);
                                                                setVisitCard({...visitCard, total_cost: totalCost, paid_amount: String(paidAmount)});
                                                            }}/></Field>
                            <Field label="Скидка"><input type="number" value={visitCard.discount_amount}
                                                         onChange={(event) => {
                                                             const discountAmount = event.target.value;
                                                             const paidAmount = Math.max(Number(visitCard.total_cost || 0) - Number(discountAmount || 0), 0);
                                                             setVisitCard({...visitCard, discount_amount: discountAmount, paid_amount: String(paidAmount)});
                                                         }}/></Field>
                            <Field label="Оплачено"><input type="number" value={visitCard.paid_amount} readOnly/></Field>
                            <Field label="Услуги"><input value={visitCard.service_names}
                                                         onChange={(event) => setVisitCard({...visitCard, service_names: event.target.value})}
                                                         placeholder="Можно несколько через запятую"/></Field>
                            <Field label="Товары"><input value={visitCard.product_names}
                                                         onChange={(event) => setVisitCard({...visitCard, product_names: event.target.value})}
                                                         placeholder="Можно несколько через запятую"/></Field>
                            <Field label="Комментарий"><input value={visitCard.comment}
                                                              onChange={(event) => setVisitCard({...visitCard, comment: event.target.value})}/></Field>
                            <button className="primary" disabled={createVisit.isPending}>{createVisit.isPending ? "Сохраняем..." : "Добавить визит"}</button>
                        </form>
                        {createVisit.isError && <p className="form-error">{message(createVisit.error)}</p>}
                        <Table loading={visits.isLoading} error={visits.error} retry={() => visits.refetch()}
                               empty="Истории визитов пока нет.">
                            {visits.data?.map((item) => (
                                <tr key={item.visit.id}>
                                    <td>
                                        <button type="button" className="ghost" onClick={() => setSelectedVisit(item)}>
                                            <b>{dateTime(item.visit.visit_at) || "Дата не указана"}</b>
                                            <small>{visitStatusLabel(item.visit.visit_status)}</small>
                                        </button>
                                    </td>
                                    <td>{visitStatusLabel(item.visit.visit_status)}</td>
                                </tr>
                            ))}
                        </Table>
                        {selectedVisit && <div className="modal-backdrop" onClick={() => setSelectedVisit(null)}>
                            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                                <div className="modal-head">
                                    <h3>Визит</h3>
                                    <button type="button" className="ghost" onClick={() => setSelectedVisit(null)}>Закрыть</button>
                                </div>
                                <div className="modal-grid">
                                    <ReadonlyField label="Дата и время" value={dateTime(selectedVisit.visit.visit_at)}/>
                                    <ReadonlyField label="Филиал" value={selectedVisit.visit.branch_id ? String(selectedVisit.visit.branch_id) : ""}/>
                                    <ReadonlyField label="Айди сотрудника" value={selectedVisit.visit.employee_id ? String(selectedVisit.visit.employee_id) : ""}/>
                                    <ReadonlyField label="Услуги" value={parseVisitComment(selectedVisit.visit.comment).serviceNames || selectedVisit.service_ids.join(", ")}/>
                                    <ReadonlyField label="Товары" value={parseVisitComment(selectedVisit.visit.comment).productNames || selectedVisit.product_ids.join(", ")}/>
                                    <ReadonlyField label="Статус визита" value={visitStatusLabel(selectedVisit.visit.visit_status)}/>
                                    <ReadonlyField label="Стоимость" value={money(selectedVisit.visit.total_cost)}/>
                                    <ReadonlyField label="Скидка" value={money(selectedVisit.visit.discount_amount)}/>
                                    <ReadonlyField label="Оплачено" value={money(selectedVisit.visit.paid_amount)}/>
                                    <ReadonlyField label="Задолженность" value={money(selectedVisit.visit.debt_amount)}/>
                                    <ReadonlyField label="Комментарий" value={parseVisitComment(selectedVisit.visit.comment).comment}/>
                                </div>
                            </div>
                        </div>}
                    </div>
                    <div className="subpanel">
                        <h3>Счета клиента</h3>
                        <div className="modal-grid">
                            <ReadonlyField label="Депозит" value={accounts.data ? money(accounts.data.totals.deposit_balance) : ""}/>
                            <ReadonlyField label="Сертификаты" value={accounts.data ? money(accounts.data.totals.certificate_balance) : ""}/>
                            <ReadonlyField label="Визитов по абонементам" value={accounts.data ? String(accounts.data.totals.subscription_visits_left) : ""}/>
                            <ReadonlyField label="Бонусы" value={accounts.data ? money(accounts.data.totals.bonus_balance) : ""}/>
                        </div>
                    </div>
                    <div className="subpanel">
                        <h3>Сегменты клиента</h3>
                        <SimpleList loading={segments.isLoading} error={segments.error} retry={() => segments.refetch()}
                                    empty="Сегменты пока не рассчитаны."
                                    rows={segments.data?.map((item) => `${item.name}${item.is_dynamic ? " · динамический" : ""}`)}/>
                    </div>
                    {update.isError && <p className="form-error">{message(update.error)}</p>}
                </div>
            </div>}
        </section>
    );
}

function Loyalty() {
    const org = useOrg();
    const qc = useQueryClient();
    const active = window.location.pathname.split("/").pop() ?? "rules";
    const tab = loyaltyTabs.some(([key]) => key === active) ? active : "rules";
    const [clientQuery, setClientQuery] = useState("");
    const [client, setClient] = useState<Client | null>(null);
    const [levelParams, setLevelParams] = useState("");
    const [bonusTransactionType, setBonusTransactionType] = useState<"accrual" | "write_off" | "expiration">("accrual");
    const [ruleExtras, setRuleExtras] = useState({
        target_type: "",
        target_id: "",
        client_level: "",
        level_params: "",
        usage_restrictions: ""
    });
    const [subscriptionExtras, setSubscriptionExtras] = useState({service_restrictions: "", family_client_ids: ""});
    const [promotionExtras, setPromotionExtras] = useState({
        package_offer: "",
        weak_days: "",
        weak_from: "",
        valid_from: "",
        valid_until: "",
        client_segment: ""
    });
    const [actionResult, setActionResult] = useState("");
    const clientId = client?.id ?? null;
    const now = new Date().toISOString().slice(0, 16);

    const clients = useQuery({
        queryKey: [...keys.clients(org.id), clientQuery],
        queryFn: () => api.clients(org.id, clientQuery)
    });
    const rules = useQuery({queryKey: keys.rules(org.id), queryFn: () => api.rules(org.id)});
    const levels = useQuery({queryKey: keys.bonusLevels(org.id), queryFn: () => api.bonusLevels(org.id)});
    const balance = useQuery({
        queryKey: [...keys.clientLoyalty(org.id, clientId), "balance"],
        queryFn: () => api.bonusBalance(clientId!),
        enabled: !!clientId
    });
    const history = useQuery({
        queryKey: [...keys.clientLoyalty(org.id, clientId), "history"],
        queryFn: () => api.bonusHistory(clientId!),
        enabled: !!clientId
    });
    const subscriptions = useQuery({
        queryKey: [...keys.clientLoyalty(org.id, clientId), "subscriptions"],
        queryFn: () => api.subscriptions(clientId!),
        enabled: !!clientId
    });
    const certificates = useQuery({
        queryKey: [...keys.clientLoyalty(org.id, clientId), "certificates"],
        queryFn: () => api.certificates(clientId!),
        enabled: !!clientId
    });
    const referralStats = useQuery({
        queryKey: [...keys.clientLoyalty(org.id, clientId), "referrals"],
        queryFn: () => api.referralStats(clientId!),
        enabled: !!clientId
    });
    const referrals = useQuery({
        queryKey: [...keys.clientLoyalty(org.id, clientId), "referral-list"],
        queryFn: () => api.referrals(clientId!),
        enabled: !!clientId
    });
    const promotions = useQuery({
        queryKey: [...keys.clientLoyalty(org.id, clientId), "promotions"],
        queryFn: () => api.promotions(clientId!),
        enabled: !!clientId
    });

    const ruleForm = useForm<RuleForm>({
        resolver: zodResolver(ruleSchema),
        defaultValues: {rule_type: "service", bonus_type: "cashback", expires_in_days: ""}
    });
    const levelForm = useForm<BonusLevelForm>({resolver: zodResolver(bonusLevelSchema)});
    const bonusForm = useForm<BonusOperationForm>({
        resolver: zodResolver(bonusOperationSchema),
        defaultValues: {client_id: 1, bonus_type: "cashback", reason: ""}
    });
    const subscriptionForm = useForm<SubscriptionForm>({
        resolver: zodResolver(subscriptionSchema),
        defaultValues: {client_id: 1, auto_renewal_enabled: false}
    });
    const certificateForm = useForm<CertificateForm>({
        resolver: zodResolver(certificateSchema),
        defaultValues: {client_id: 1, certificate_type: "digital"}
    });
    const referralForm = useForm<ReferralSourceForm>({
        resolver: zodResolver(referralSourceSchema),
        defaultValues: {referrer_client_id: 1, reward_type: "bonus", reward_bonus_type: "cashback"}
    });
    const promotionForm = useForm<PromotionForm>({
        resolver: zodResolver(promotionSchema),
        defaultValues: {
            client_id: 1,
            promotion_type: "promo_code",
            discount_type: "percent",
            discount_value: 0,
            min_amount: 0
        }
    });

    const refreshClient = async () => qc.invalidateQueries({queryKey: keys.clientLoyalty(org.id, clientId)});
    const action = useMutation({
        mutationFn: (run: () => Promise<unknown>) => run(),
        onSuccess: async (data) => {
            setActionResult(
                data && typeof data === "object" && "profit_amount" in data
                    ? `Прибыль: ${money((data as { profit_amount?: string }).profit_amount)}`
                    : data && typeof data === "object" && "certificate_code" in data && "status" in data && (data as { status?: string }).status === "transferred"
                        ? "Сертификат успешно передан"
                        : data && typeof data === "object" && "subscription_name" in data && "transferred_to_client_id" in data
                            ? "Абонемент успешно передан"
                        : ""
            );
            await refreshClient();
        },
    });
    const createRule = useMutation({
        mutationFn: (data: RuleForm) => api.createRule({
            organization_id: org.id,
            name: data.name,
            rule_type: data.rule_type,
            bonus_type: data.bonus_type,
            amount: Number(data.amount),
            expires_in_days: data.expires_in_days === "" ? undefined : Number(data.expires_in_days),
            is_active: true,
            target_type: ruleExtras.target_type || undefined,
            target_id: undefined,
            client_level: ruleExtras.client_level || undefined,
            level_params: ruleExtras.level_params.trim() ? {cashback: Number(ruleExtras.level_params)} : undefined,
            usage_restrictions: ruleExtras.usage_restrictions.trim() ? {
                allowed_target_types: ruleExtras.usage_restrictions.split(",").map((item) => item.trim()).filter(Boolean)
            } : undefined,
        }),
        onSuccess: async (rule) => {
            if (clientId) await api.applyRule(rule.id, clientId, org.id);
            ruleForm.reset({rule_type: "service", bonus_type: "cashback", expires_in_days: ""});
            setRuleExtras({target_type: "", target_id: "", client_level: "", level_params: "", usage_restrictions: ""});
            await qc.invalidateQueries({queryKey: keys.rules(org.id)});
            await refreshClient();
        },
    });
    const applyRule = useMutation({
        mutationFn: (ruleId: number) => api.applyRule(ruleId, clientId!, org.id),
        onSuccess: refreshClient,
    });
    const createLevel = useMutation({
        mutationFn: (data: BonusLevelForm) => api.createBonusLevel({
            organization_id: org.id,
            name: data.name,
            params: levelParams.trim() ? {cashback: Number(levelParams)} : undefined
        }),
        onSuccess: async () => {
            levelForm.reset();
            setLevelParams("");
            await qc.invalidateQueries({queryKey: keys.bonusLevels(org.id)});
        },
    });
    const bonusOp = useMutation({
        mutationFn: (data: BonusOperationForm) => bonusTransactionType === "write_off"
            ? api.writeOffBonus({
                client_id: clientId!,
                bonus_type: data.bonus_type,
                amount: Number(data.amount),
                reason: data.reason
            })
            : bonusTransactionType === "expiration"
                ? api.expireBonus({
                    client_id: clientId!,
                    bonus_type: data.bonus_type,
                    amount: Number(data.amount),
                    reason: data.reason
                })
                : api.accrueBonus({
                    client_id: clientId!,
                    bonus_type: data.bonus_type,
                    amount: Number(data.amount),
                    reason: data.reason,
                    expires_at: data.expires_at || undefined
                }),
        onSuccess: async () => {
            bonusForm.reset({client_id: 1, bonus_type: "cashback", reason: ""});
            setBonusTransactionType("accrual");
            await refreshClient();
        },
    });
    const createSubscription = useMutation({
        mutationFn: async (data: SubscriptionForm) => {
            await api.syncLoyaltyClient({
                id: clientId!,
                phone: client?.primary_phone ?? undefined,
                telegram_id: client?.telegram_id ? String(client.telegram_id) : undefined,
                max_id: client?.max_id ? String(client.max_id) : undefined,
                vk_id: client?.vk_id ? String(client.vk_id) : undefined,
                full_name: client?.full_name ?? name(client!)
            });
            return api.createSubscription({
                ...data,
                client_id: clientId!,
                visits_total: Number(data.visits_total),
                visits_left: Number(data.visits_total),
                deposit_amount: Number(data.deposit_amount || 0),
                deposit_left: Number(data.deposit_amount || 0),
                started_at: now,
                expires_at: data.expires_at || undefined,
                auto_renewal_enabled: !!data.auto_renewal_enabled,
                service_restrictions: ids(subscriptionExtras.service_restrictions) ? {service_ids: ids(subscriptionExtras.service_restrictions)} : undefined,
                family_client_ids: ids(subscriptionExtras.family_client_ids)
            });
        },
        onSuccess: async () => {
            subscriptionForm.reset({client_id: 1, auto_renewal_enabled: false});
            setSubscriptionExtras({service_restrictions: "", family_client_ids: ""});
            await refreshClient();
        },
    });
    const deleteClient = useMutation({
        mutationFn: (id: number) => api.deleteClient(id),
        onSuccess: async (_, id) => {
            if (clientId === id) setClient(null);
            await qc.invalidateQueries({queryKey: keys.clients(org.id)});
        },
    });
    const createCertificate = useMutation({
        mutationFn: (data: CertificateForm) => api.createCertificate({
            ...data,
            client_id: clientId!,
            nominal_amount: Number(data.nominal_amount),
            balance_amount: Number(data.nominal_amount),
            issued_at: now,
            expires_at: data.expires_at || undefined
        }),
        onSuccess: async () => {
            certificateForm.reset({client_id: 1, certificate_type: "digital"});
            await refreshClient();
        },
    });
    const createReferral = useMutation({
        mutationFn: (data: ReferralSourceForm) => api.createReferralSource({
            ...data,
            referrer_client_id: clientId!,
            reward_amount: Number(data.reward_amount),
            reward_bonus_type: data.reward_bonus_type || undefined,
            is_active: true
        }),
        onSuccess: async () => {
            referralForm.reset({referrer_client_id: 1, reward_type: "bonus", reward_bonus_type: "cashback"});
            await refreshClient();
        },
    });
    const createPromotion = useMutation({
        mutationFn: (data: PromotionForm) => api.createPromotion({
            ...data,
            client_id: clientId!,
            discount_value: Number(data.discount_value || 0),
            min_amount: Number(data.min_amount || 0),
            usage_limit: data.usage_limit === "" ? undefined : data.usage_limit,
            promo_code: data.promo_code || undefined,
            gift: data.gift || undefined,
            package_offer: ids(promotionExtras.package_offer) ? {services: ids(promotionExtras.package_offer)} : undefined,
            weak_hours: promotionExtras.weak_days.trim() || promotionExtras.weak_from.trim() ? {
                days: promotionExtras.weak_days.split(",").map((item) => item.trim()).filter(Boolean),
                from: promotionExtras.weak_from || undefined
            } : undefined,
            valid_from: promotionExtras.valid_from || undefined,
            valid_until: promotionExtras.valid_until || undefined,
            client_segment: promotionExtras.client_segment || undefined
        }),
        onSuccess: async () => {
            promotionForm.reset({
                client_id: 1,
                promotion_type: "promo_code",
                discount_type: "percent",
                discount_value: 0,
                min_amount: 0
            });
            setPromotionExtras({
                package_offer: "",
                weak_days: "",
                weak_from: "",
                valid_from: "",
                valid_until: "",
                client_segment: ""
            });
            await refreshClient();
        },
    });

    return (
        <section className="panel">
            <h2>Лояльность</h2>
            <nav className="tabs">
                {loyaltyTabs.map(([key, label]) => <Link key={key} className={tab === key ? "active" : ""}
                                                         to={`/organizations/${org.id}/loyalty/${key}`}>{label}</Link>)}
            </nav>

            <div className="subpanel">
                <h3>Клиент</h3>
                <input className="search" placeholder="ID, телефон, Telegram, MAX, VK или имя" value={clientQuery}
                       onChange={(event) => setClientQuery(event.target.value)}/>
                <Table loading={clients.isLoading} error={clients.error} retry={() => clients.refetch()}
                       empty="Клиенты не найдены.">
                    {clients.data?.slice(0, 8).map((item) => (
                        <tr key={item.id}>
                            <td>
                                <b>{name(item)}</b>
                            </td>
                            <td className="actions">
                                <button className={clientId === item.id ? "primary" : "ghost"}
                                        onClick={() => setClient(item)}>{clientId === item.id ? "Выбран" : "Выбрать"}</button>
                                <button className="danger ghost" onClick={() => {
                                    if (window.confirm(`Удалить клиента "${name(item)}"?`)) deleteClient.mutate(item.id);
                                }}>Удалить
                                </button>
                            </td>
                        </tr>
                    ))}
                </Table>
            </div>
            {action.isError && <p className="form-error">{message(action.error)}</p>}

            {tab === "rules" && <div className="subpanel">
                <h3>Правила начисления</h3>
                <form className="inline-form compact"
                      onSubmit={ruleForm.handleSubmit((data) => createRule.mutate(data))}>
                    <Field label="Название"
                           error={ruleForm.formState.errors.name?.message}><input {...ruleForm.register("name")} /></Field>
                    <Field
                        label="Тип"><select {...ruleForm.register("rule_type")}>{Object.entries(ruleTypes).map(([value, label]) =>
                        <option key={value} value={value}>{label}</option>)}</select></Field>
                    <Field label="Бонус"><input {...ruleForm.register("bonus_type")} /></Field>
                    <Field label="Сумма"><input type="number" {...ruleForm.register("amount", {valueAsNumber: true})} /></Field>
                    <Field label="Срок, дней"><input
                        type="number" {...ruleForm.register("expires_in_days", {valueAsNumber: true})} /></Field>
                    <Field label="Цель"><input placeholder="service/product" value={ruleExtras.target_type}
                                               onChange={(event) => setRuleExtras({
                                                   ...ruleExtras,
                                                   target_type: event.target.value
                                               })}/></Field>
                    <Field label="Уровень"><input value={ruleExtras.client_level} onChange={(event) => setRuleExtras({
                        ...ruleExtras,
                        client_level: event.target.value
                    })}/></Field>
                    <Field label="Кэшбэк, %"><input type="number" placeholder="7" value={ruleExtras.level_params}
                                                    onChange={(event) => setRuleExtras({
                                                        ...ruleExtras,
                                                        level_params: event.target.value
                                                    })}/></Field>
                    <Field label="Ограничения по целям"><input placeholder="service, product"
                                                           value={ruleExtras.usage_restrictions}
                                                           onChange={(event) => setRuleExtras({
                                                               ...ruleExtras,
                                                               usage_restrictions: event.target.value
                                                           })}/></Field>
                    <button className="primary"
                            disabled={createRule.isPending}>{clientId ? "Создать и начислить" : "Создать"}</button>
                </form>
                {(createRule.isError || applyRule.isError) &&
                    <p className="form-error">{message(createRule.error ?? applyRule.error)}</p>}
                <Table loading={rules.isLoading} error={rules.error} retry={() => rules.refetch()}
                       empty="Правил пока нет.">
                    {rules.data?.map((item) => <tr key={item.id}>
                        <td><b>{item.name}</b><small>{ruleTypes[item.rule_type]}</small></td>
                        <td>{item.bonus_type}</td>
                        <td>{item.amount}</td>
                        <td>{item.expires_in_days ? `${item.expires_in_days} дней` : "Без срока"}</td>
                        <td>
                            <button className="ghost" disabled={!clientId || applyRule.isPending}
                                    onClick={() => applyRule.mutate(item.id)}>Начислить клиенту
                            </button>
                        </td>
                    </tr>)}
                </Table>
            </div>}

            {tab === "levels" && <div className="subpanel">
                <h3>Уровни клиентов</h3>
                <form className="inline-form compact"
                      onSubmit={levelForm.handleSubmit((data) => createLevel.mutate(data))}>
                    <Field label="Название"><input {...levelForm.register("name")} /></Field>
                    <Field label="Кэшбэк, %"><input type="number" placeholder="7" value={levelParams}
                                                         onChange={(event) => setLevelParams(event.target.value)}/></Field>
                    <button className="primary" disabled={createLevel.isPending}>Создать</button>
                </form>
                {createLevel.isError && <p className="form-error">{message(createLevel.error)}</p>}
                <Table loading={levels.isLoading} error={levels.error} retry={() => levels.refetch()}
                       empty="Уровней пока нет.">
                    {levels.data?.map((item) => <tr key={item.id}>
                        <td><b>{item.name}</b></td>
                        <td><small>{JSON.stringify(item.params ?? {})}</small></td>
                    </tr>)}
                </Table>
            </div>}

            {tab === "transactions" && <div className="subpanel">
                <h3>Бонусы клиента</h3>
                <div className="grid loyalty-grid">
                    <Metric label="Баланс" query={{isLoading: balance.isLoading, data: []}}
                            value={balance.data?.balance ?? 0}/>
                    <Metric label="Операций" query={history}/>
                </div>
                <form className="inline-form compact" onSubmit={bonusForm.handleSubmit((data) => bonusOp.mutate(data))}>
                    <Field label="Операция"><select value={bonusTransactionType}
                                                    onChange={(event) => setBonusTransactionType(event.target.value as "accrual" | "write_off" | "expiration")}>
                        <option value="accrual">Начислить</option>
                        <option value="write_off">Списать</option>
                        <option value="expiration">Сжечь</option>
                    </select></Field>
                    <Field label="Бонус"><input {...bonusForm.register("bonus_type")} /></Field>
                    <Field label="Сумма"><input
                        type="number" {...bonusForm.register("amount", {valueAsNumber: true})} /></Field>
                    <Field label="Причина"><input {...bonusForm.register("reason")} /></Field>
                    <Field label="Сгорает"><input type="datetime-local" {...bonusForm.register("expires_at")} /></Field>
                    <button className="primary" disabled={!clientId || bonusOp.isPending}>Провести</button>
                    <button type="button" className="ghost" disabled={action.isPending}
                            onClick={() => action.mutate(api.runBonusExpiration)}>Списать просроченные
                    </button>
                </form>
                {bonusOp.isError && <p className="form-error">{message(bonusOp.error)}</p>}
                <Table loading={history.isLoading} error={history.error} retry={() => history.refetch()}
                       empty="Истории пока нет.">
                    {history.data?.map((item) => <tr key={item.id}>
                        <td>
                            <b>{bonusTransactionTypes[item.transaction_type]}</b><small>{item.reason ?? "Без причины"}</small>
                        </td>
                        <td>{item.bonus_type}</td>
                        <td>{item.amount}</td>
                        <td>{date(item.created_at)}</td>
                    </tr>)}
                </Table>
            </div>}

            {tab === "subscriptions" && <div className="subpanel">
                <h3>Абонементы</h3>
                <form className="inline-form compact"
                      onSubmit={subscriptionForm.handleSubmit((data) => createSubscription.mutate(data))}>
                    <Field label="Название"><input {...subscriptionForm.register("subscription_name")} /></Field>
                    <Field label="Визитов"><input
                        type="number" {...subscriptionForm.register("visits_total", {valueAsNumber: true})} /></Field>
                    <Field label="Депозит"><input type="number"
                                                  step="0.01" {...subscriptionForm.register("deposit_amount", {valueAsNumber: true})} /></Field>
                    <Field label="Старт"><input type="datetime-local" value={now} readOnly/></Field>
                    <Field label="До"><input
                        type="datetime-local" {...subscriptionForm.register("expires_at")} /></Field>
                    <Field label="Услуги ID"><input placeholder="1,2"
                                                      value={subscriptionExtras.service_restrictions}
                                                      onChange={(event) => setSubscriptionExtras({
                                                          ...subscriptionExtras,
                                                          service_restrictions: event.target.value
                                                      })}/></Field>
                    <Field label="Семья ID"><input placeholder="2,3" value={subscriptionExtras.family_client_ids}
                                                   onChange={(event) => setSubscriptionExtras({
                                                       ...subscriptionExtras,
                                                       family_client_ids: event.target.value
                                                   })}/></Field>
                    <Field label="Автопродление"><input
                        type="checkbox" {...subscriptionForm.register("auto_renewal_enabled")} /></Field>
                    <button className="primary" disabled={!clientId || createSubscription.isPending}>Выдать</button>
                </form>
                {createSubscription.isError && <p className="form-error">{message(createSubscription.error)}</p>}
                <Table loading={subscriptions.isLoading} error={subscriptions.error}
                       retry={() => subscriptions.refetch()} empty="Абонементов пока нет.">
                    {subscriptions.data?.map((item) => <tr key={item.id}>
                        <td>
                            <b>{item.subscription_name}</b><small>{item.status}{item.is_frozen ? ", заморожен" : ""}</small>
                        </td>
                        <td>{item.visits_left}/{item.visits_total} визитов<small>семья: {item.family_client_ids?.join(", ") || "-"}</small>
                        </td>
                        <td>{money(item.deposit_left)}/{money(item.deposit_amount)}</td>
                        <td>{date(item.expires_at)}<small>{item.auto_renewal_enabled ? "авто" : "без авто"}</small></td>
                        <td className="actions">
                            <button className="ghost"
                                    onClick={() => action.mutate(() => api.freezeSubscription(item.id, {
                                        frozen_from: new Date().toISOString(),
                                        frozen_until: askDate("Заморозить до")
                                    }))}>Заморозить
                            </button>
                            <button className="ghost"
                                    onClick={() => action.mutate(() => api.unfreezeSubscription(item.id))}>Разморозить
                            </button>
                            <button className="ghost"
                                    onClick={() => action.mutate(async () => {
                                        const phone = askString("Номер телефона клиента");
                                        if (!phone) return;
                                        const matches = await api.clients(org.id, phone);
                                        const target = findClientByPhone(matches, phone);
                                        if (!target) throw new Error("Клиент с таким номером телефона не найден");
                                        const result = await api.transferSubscription(item.id, target.id);
                                        await Promise.all([
                                            qc.invalidateQueries({queryKey: keys.clientLoyalty(org.id, clientId)}),
                                            qc.invalidateQueries({queryKey: keys.clientLoyalty(org.id, target.id)}),
                                        ]);
                                        return result;
                                    })}>Передать
                            </button>
                            <button className="ghost"
                                    onClick={() => mutateNumber(action, "ID члена семьи", (value) => api.addFamilyClient(item.id, value))}>Семья
                            </button>
                            <button className="ghost"
                                    onClick={() => action.mutate(() => api.setAutoRenewal(item.id, !item.auto_renewal_enabled))}>Авто
                            </button>
                            <button className="ghost" onClick={() => mutateVisit(action, item.id)}>Списать визит</button>
                            <button className="ghost" onClick={() => mutateRenew(action, item.id)}>Продлить</button>
                            <button className="danger"
                                    onClick={() => action.mutate(() => api.expireSubscription(item.id))}>Завершить
                            </button>
                        </td>
                    </tr>)}
                </Table>
            </div>}

            {tab === "certificates" && <div className="subpanel">
                <h3>Сертификаты</h3>
                <form className="inline-form compact"
                      onSubmit={certificateForm.handleSubmit((data) => createCertificate.mutate(data))}>
                    <Field label="Тип"><select {...certificateForm.register("certificate_type")}>
                        <option value="digital">Электронный</option>
                        <option value="paper">Бумажный</option>
                    </select></Field>
                    <Field label="Код"><input {...certificateForm.register("certificate_code")} /></Field>
                    <Field label="Номинал"><input type="number"
                                                  step="0.01" {...certificateForm.register("nominal_amount", {valueAsNumber: true})} /></Field>
                    <Field label="Выдан"><input type="datetime-local" value={now} readOnly/></Field>
                    <Field label="До"><input
                        type="datetime-local" {...certificateForm.register("expires_at")} /></Field>
                    <button className="primary" disabled={!clientId || createCertificate.isPending}>Выдать</button>
                </form>
                {createCertificate.isError && <p className="form-error">{message(createCertificate.error)}</p>}
                <Table loading={certificates.isLoading} error={certificates.error} retry={() => certificates.refetch()}
                       empty="Сертификатов пока нет.">
                    {certificates.data?.map((item) => <tr key={item.id}>
                        <td><b>{item.certificate_code}</b><small>{certificateTypeLabel(item.certificate_type)}</small></td>
                        <td>{money(item.balance_amount)} / {money(item.nominal_amount)}<small>депозит: {money(item.deposit_converted_amount)}</small>
                        </td>
                        <td>{certificateStatusLabel(item.status)}</td>
                        <td>{date(item.expires_at)}</td>
                        <td className="actions">
                            <button className="ghost"
                                    onClick={() => mutateNumber(action, "Сумма использования", (amount) => api.useCertificate(item.id, {
                                        amount,
                                        convert_rest_to_deposit: window.confirm("Остаток в депозит?")
                                    }))}>Использовать
                            </button>
                            <button className="ghost"
                                    onClick={() => action.mutate(() => api.convertCertificateToDeposit(item.id))}>В депозит
                            </button>
                            <button className="ghost"
                                    onClick={() => action.mutate(async () => {
                                        const phone = askString("Номер телефона клиента");
                                        if (!phone) return;
                                        const matches = await api.clients(org.id, phone);
                                        const target = findClientByPhone(matches, phone);
                                        if (!target) throw new Error("Клиент с таким номером телефона не найден");
                                        return api.transferCertificate(item.id, target.id);
                                    })}>Передать
                            </button>
                            <button className="danger"
                                    onClick={() => action.mutate(() => api.refundCertificate(item.id))}>Возврат
                            </button>
                            <button className="danger"
                                    onClick={() => action.mutate(() => api.expireCertificate(item.id))}>Завершить
                            </button>
                        </td>
                    </tr>)}
                </Table>
            </div>}

            {tab === "referrals" && <div className="subpanel">
                <h3>Реферальная программа</h3>
                <div className="grid loyalty-grid"><Metric label="Рефералов"
                                                           query={{isLoading: referralStats.isLoading, data: []}}
                                                           value={referralStats.data?.invites_count ?? 0}/><Metric
                    label="Успешных" query={{isLoading: referralStats.isLoading, data: []}}
                    value={referralStats.data?.successful_invites_count ?? 0}/></div>
                <form className="inline-form compact"
                      onSubmit={referralForm.handleSubmit((data) => createReferral.mutate(data))}>
                    <Field label="Код"><input {...referralForm.register("referral_code")} /></Field>
                    <Field label="Ссылка"><input {...referralForm.register("referral_link")} /></Field>
                    <Field label="Тип награды"><select {...referralForm.register("reward_type")}>
                        <option value="bonus">Бонус</option>
                        <option value="money">Деньги</option>
                    </select></Field>
                    <Field label="Бонус"><input {...referralForm.register("reward_bonus_type")} /></Field>
                    <Field label="Сумма"><input type="number"
                                                step="0.01" {...referralForm.register("reward_amount", {valueAsNumber: true})} /></Field>
                    <button className="primary" disabled={!clientId || createReferral.isPending}>Создать</button>
                </form>
                {createReferral.isError && <p className="form-error">{message(createReferral.error)}</p>}
                <div className="actions">
                    <button className="ghost" disabled={!clientId}
                            onClick={() => mutateReferralRegister(action, "code")}>Определить по коду
                    </button>
                    <button className="ghost" disabled={!clientId}
                            onClick={() => mutateReferralRegister(action, "link")}>Определить по ссылке
                    </button>
                </div>
                <Table loading={referrals.isLoading} error={referrals.error} retry={() => referrals.refetch()}
                       empty="Приглашений пока нет.">
                    {referrals.data?.map((item) => <tr key={item.id}>
                        <td><b>ID {item.id}</b><small>приглашён: {item.invited_client_id ?? "-"}</small></td>
                        <td>{item.reward_type} {money(item.reward_amount)}</td>
                        <td>{item.reward_status}<small>{item.first_visit_at ? date(item.first_visit_at) : "первого визита нет"}</small>
                        </td>
                        <td className="actions">
                            <button className="ghost"
                                    onClick={() => action.mutate(() => api.markReferralFirstVisit(item.id, askString("ID первого визита") || String(Date.now())))}>First
                                visit
                            </button>
                            <button className="ghost"
                                    onClick={() => action.mutate(() => api.accrueReferralReward(item.id))}>Reward
                            </button>
                            <button className="danger"
                                    onClick={() => action.mutate(() => api.cancelReferralReward(item.id, askString("Причина отмены") || undefined))}>Cancel
                            </button>
                        </td>
                    </tr>)}
                </Table>
            </div>}

            {tab === "promotions" && <div className="subpanel">
                <h3>Акции и промокоды</h3>
                <form className="inline-form compact"
                      onSubmit={promotionForm.handleSubmit((data) => createPromotion.mutate(data))}>
                    <Field label="Название"><input {...promotionForm.register("promotion_name")} /></Field>
                    <Field label="Код"><input {...promotionForm.register("promo_code")} /></Field>
                    <Field label="Тип"><select {...promotionForm.register("promotion_type")}>
                        <option value="promo_code">Промокод</option>
                        <option value="discount">Скидка</option>
                        <option value="gift">Подарок</option>
                        <option value="package">Пакет</option>
                        <option value="weak_hours">Слабые часы</option>
                    </select></Field>
                    <Field label="Скидка"><select {...promotionForm.register("discount_type")}>
                        <option value="percent">%</option>
                        <option value="fixed">Фикс</option>
                    </select></Field>
                    <Field label="Размер"><input type="number"
                                                 step="0.01" {...promotionForm.register("discount_value", {valueAsNumber: true})} /></Field>
                    <Field label="Мин. сумма"><input type="number"
                                                     step="0.01" {...promotionForm.register("min_amount", {valueAsNumber: true})} /></Field>
                    <Field label="Подарок"><input {...promotionForm.register("gift")} /></Field>
                    <Field label="Лимит"><input
                        type="number" {...promotionForm.register("usage_limit", {valueAsNumber: true})} /></Field>
                    <Field label="Сегмент"><input value={promotionExtras.client_segment}
                                                  onChange={(event) => setPromotionExtras({
                                                      ...promotionExtras,
                                                      client_segment: event.target.value
                                                  })}/></Field>
                    <Field label="С"><input type="datetime-local" value={promotionExtras.valid_from}
                                            onChange={(event) => setPromotionExtras({
                                                ...promotionExtras,
                                                valid_from: event.target.value
                                            })}/></Field>
                    <Field label="До"><input type="datetime-local" value={promotionExtras.valid_until}
                                             onChange={(event) => setPromotionExtras({
                                                 ...promotionExtras,
                                                 valid_until: event.target.value
                                             })}/></Field>
                    <Field label="Пакет: услуги ID"><input placeholder="1,2"
                                                     value={promotionExtras.package_offer}
                                                     onChange={(event) => setPromotionExtras({
                                                         ...promotionExtras,
                                                         package_offer: event.target.value
                                                     })}/></Field>
                    <Field label="Слабые часы: дни"><input placeholder="mon,tue"
                                                           value={promotionExtras.weak_days}
                                                           onChange={(event) => setPromotionExtras({
                                                               ...promotionExtras,
                                                               weak_days: event.target.value
                                                           })}/></Field>
                    <Field label="Слабые часы: c"><input type="time" value={promotionExtras.weak_from}
                                                           onChange={(event) => setPromotionExtras({
                                                               ...promotionExtras,
                                                               weak_from: event.target.value
                                                           })}/></Field>
                    <button className="primary" disabled={!clientId || createPromotion.isPending}>Создать</button>
                </form>
                {createPromotion.isError && <p className="form-error">{message(createPromotion.error)}</p>}
                {actionResult && <p className="empty">{actionResult}</p>}
                <Table loading={promotions.isLoading} error={promotions.error} retry={() => promotions.refetch()}
                       empty="Акций пока нет.">
                    {promotions.data?.map((item) => <tr key={item.id}>
                        <td><b>{item.promotion_name}</b><small>{item.promo_code ?? "Без кода"}</small></td>
                        <td>{item.promotion_type}<small>{item.client_segment ?? "любой сегмент"}</small></td>
                        <td>{item.discount_type ?? "-"} {money(item.discount_value)}<small>{item.used_count}/{item.usage_limit ?? "∞"}</small>
                        </td>
                        <td>{money(item.min_amount)}<small>{date(item.valid_until)}</small></td>
                        <td className="actions">
                            <button className="ghost" onClick={() => mutatePromotionApply(action, item.id)}>Apply
                            </button>
                            <button className="ghost" onClick={() => mutatePromotionProfit(action, item.id)}>Profit
                            </button>
                            {item.promo_code && <button className="ghost" disabled={!clientId}
                                                        onClick={() => mutatePromotionByCode(action, item.promo_code!, clientId!)}>By
                                code</button>}</td>
                    </tr>)}
                </Table>
            </div>}
        </section>
    );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function LoyaltyOld() {
    const org = useOrg();
    const qc = useQueryClient();
    const rules = useQuery({queryKey: keys.rules(org.id), queryFn: () => api.rules(org.id)});
    const form = useForm<RuleForm>({
        resolver: zodResolver(ruleSchema),
        defaultValues: {rule_type: "service", bonus_type: "cashback"}
    });
    const create = useMutation({
        mutationFn: (data: RuleForm) => api.createRule({
            organization_id: org.id,
            name: data.name,
            rule_type: data.rule_type,
            bonus_type: data.bonus_type,
            amount: Number(data.amount),
            expires_in_days: data.expires_in_days === "" ? undefined : Number(data.expires_in_days),
            is_active: true,
        }),
        onSuccess: async () => {
            form.reset({rule_type: "service", bonus_type: "cashback"});
            await qc.invalidateQueries({queryKey: keys.rules(org.id)});
        },
    });
    return (
        <section className="panel">
            <form className="inline-form" onSubmit={form.handleSubmit((data) => create.mutate(data))}>
                <Field label="Название" error={form.formState.errors.name?.message}><input {...form.register("name")} /></Field>
                <Field
                    label="Тип"><select {...form.register("rule_type")}>{Object.entries(ruleTypes).map(([value, label]) =>
                    <option key={value} value={value}>{label}</option>)}</select></Field>
                <Field label="Тип бонусов"
                       error={form.formState.errors.bonus_type?.message}><input {...form.register("bonus_type")} /></Field>
                <Field label="Размер" error={form.formState.errors.amount?.message}><input
                    type="number" {...form.register("amount", {valueAsNumber: true})} /></Field>
                <Field label="Срок, дней"><input
                    type="number" {...form.register("expires_in_days", {valueAsNumber: true})} /></Field>
                <button className="primary"
                        disabled={create.isPending}>{create.isPending ? "Сохраняем..." : "Создать правило"}</button>
            </form>
            {create.isError && <p className="form-error">{message(create.error)}</p>}
            <Table loading={rules.isLoading} error={rules.error} retry={() => rules.refetch()} empty="Правил пока нет.">
                {rules.data?.map((item) => (
                    <tr key={item.id}>
                        <td><b>{item.name}</b><small>{ruleTypes[item.rule_type]}</small></td>
                        <td>{item.bonus_type}</td>
                        <td>{item.amount}</td>
                        <td>{item.expires_in_days ? `${item.expires_in_days} дней` : "Без срока"}</td>
                        <td>{item.is_active ? "Активно" : "Выключено"}</td>
                    </tr>
                ))}
            </Table>
        </section>
    );
}

function Settings() {
    const org = useOrg();
    const qc = useQueryClient();
    const [legal, setLegal] = useState({
        name: "",
        legal_type: "ip",
        tax_system: "",
        inn: "",
        ogrn: "",
        kpp: "",
        legal_address: "",
        bank_name: "",
        bik: "",
        checking_account: "",
        correspondent_account: "",
    });
    const [selectedLegalEntity, setSelectedLegalEntity] = useState<LegalEntity | null>(null);
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [brand, setBrand] = useState("");
    const [department, setDepartment] = useState({branch_id: "", name: ""});
    const branchForm = useForm<BranchForm>({resolver: zodResolver(branchSchema), defaultValues: {timezone: "Europe/Moscow", online_booking_enabled: true}});
    const [workplace, setWorkplace] = useState({branch_id: "", department_id: "", name: "", resource_type: ""});
    const [moduleName, setModuleName] = useState("");
    const [roleName, setRoleName] = useState("");
    const [permission, setPermission] = useState({code: "", name: "", description: ""});
    const [userForm, setUserForm] = useState({first_name: "", last_name: "", phone: "", email: "", telegram_id: "", password_hash: "", role_id: ""});
    const [userAccess, setUserAccess] = useState({user_id: "", role_id: "", branch_id: "", permission_id: "", temp_permission_id: "", temp_from: "", temp_until: "", two_factor_method: "sms"});
    const branches = useQuery({queryKey: keys.branches(org.id), queryFn: () => api.branches(org.id)});
    const brands = useQuery({queryKey: ["brands", org.id], queryFn: () => api.brands(org.id)});
    const legalEntities = useQuery({queryKey: ["legal", org.id], queryFn: () => api.legalEntities(org.id)});
    const departments = useQuery({queryKey: ["departments", org.id], queryFn: () => api.departments(org.id)});
    const workplaces = useQuery({queryKey: ["workplaces", org.id], queryFn: () => api.workplaces(org.id)});
    const modules = useQuery({queryKey: ["modules", org.id], queryFn: () => api.modules(org.id)});
    const roles = useQuery({queryKey: ["roles", org.id], queryFn: () => api.roles(org.id)});
    const permissions = useQuery({queryKey: ["permissions"], queryFn: api.permissions});
    const users = useQuery({queryKey: ["users"], queryFn: api.users});
    const organizationMemberships = useQuery({queryKey: ["organization-memberships", org.id], queryFn: () => api.organizationMemberships(org.id)});
    const branchMemberships = useQuery({queryKey: ["branch-memberships", org.id], queryFn: () => api.branchMemberships(org.id)});
    const loginHistory = useQuery({queryKey: ["login-history", userAccess.user_id], queryFn: () => api.loginHistory(Number(userAccess.user_id)), enabled: !!userAccess.user_id});
    const audit = useQuery({queryKey: ["audit", org.id], queryFn: () => api.auditLogs(org.id)});
    const events = useQuery({queryKey: ["events", org.id], queryFn: () => api.eventLogs(org.id)});
    const branchOptions = branches.data ?? [];
    const brandOptions = brands.data ?? [];
    const legalOptions = legalEntities.data ?? [];
    const departmentOptions = departments.data ?? [];
    const roleOptions = roles.data ?? [];
    const presetRoleOptions = presetRoleNames
        .map((name) => roleOptions.find((item) => item.name.toLowerCase() === name))
        .filter((item): item is NonNullable<typeof item> => !!item);
    const permissionOptions = permissions.data ?? [];
    const allUsers = users.data ?? [];
    const organizationUserIds = new Set((organizationMemberships.data ?? []).map((item) => item.user_id));
    const userOptions = allUsers.filter((item) => organizationUserIds.has(item.id));
    const availableUserOptions: typeof allUsers = [];
    const workplaceDepartments = workplace.branch_id ? departmentOptions.filter((item) => String(item.branch_id) === workplace.branch_id) : departmentOptions;
    const createBranch = useMutation({
        mutationFn: (data: BranchForm) => api.createBranch({
            organization_id: org.id,
            name: data.name,
            address: data.address || undefined,
            phone: data.phone || undefined,
            timezone: data.timezone || undefined,
            brand_id: data.brand_id === "" ? undefined : data.brand_id,
            legal_entity_id: data.legal_entity_id === "" ? undefined : data.legal_entity_id,
            work_schedule: compact({
                workdays: data.workdays ?? "",
                open_time: data.open_time ?? "",
                close_time: data.close_time ?? "",
            }),
            cashbox_id: data.cashbox_id === "" ? undefined : data.cashbox_id,
            warehouse_id: data.warehouse_id === "" ? undefined : data.warehouse_id,
            price_id: data.price_id === "" ? undefined : data.price_id,
            service_ids: ids(data.service_ids ?? ""),
            settings: {
                online_booking_enabled: !!data.online_booking_enabled,
                ...(data.online_booking_note?.trim() ? {online_booking_note: data.online_booking_note.trim()} : {}),
            },
        }),
        onSuccess: async () => {
            branchForm.reset({timezone: "Europe/Moscow", online_booking_enabled: true});
            await qc.invalidateQueries({queryKey: keys.branches(org.id)});
        },
    });
    const removeBranch = useMutation({
        mutationFn: api.deleteBranch,
        onSuccess: async () => qc.invalidateQueries({queryKey: keys.branches(org.id)})
    });
    const removeDepartment = useMutation({
        mutationFn: async (departmentId: number) => {
            const response = await fetch(`/organizations/departments/${departmentId}`, {method: "DELETE", credentials: "include"});
            if (!response.ok) throw new Error("Не удалось удалить подразделение");
        },
        onSuccess: async () => qc.invalidateQueries({queryKey: ["departments", org.id]})
    });
    const removeWorkplace = useMutation({
        mutationFn: async (workplaceId: number) => {
            const response = await fetch(`/organizations/workplaces/${workplaceId}`, {method: "DELETE", credentials: "include"});
            if (!response.ok) throw new Error("Не удалось удалить рабочее место");
        },
        onSuccess: async () => qc.invalidateQueries({queryKey: ["workplaces", org.id]})
    });
    const action = useMutation({
        mutationFn: (run: () => Promise<unknown>) => run(),
        onSuccess: async () => {
            await Promise.all([
                qc.invalidateQueries({queryKey: ["brands", org.id]}),
                qc.invalidateQueries({queryKey: ["legal", org.id]}),
                qc.invalidateQueries({queryKey: ["departments", org.id]}),
                qc.invalidateQueries({queryKey: ["workplaces", org.id]}),
                qc.invalidateQueries({queryKey: ["modules", org.id]}),
                qc.invalidateQueries({queryKey: ["roles", org.id]}),
                qc.invalidateQueries({queryKey: ["permissions"]}),
                qc.invalidateQueries({queryKey: ["users"]}),
                qc.invalidateQueries({queryKey: ["organization-memberships", org.id]}),
                qc.invalidateQueries({queryKey: ["branch-memberships", org.id]}),
                qc.invalidateQueries({queryKey: ["login-history", userAccess.user_id]}),
            ]);
        },
    });

    return <section className="panel">
        <h2>{org.name}</h2>
        {action.isError && <p className="form-error">{message(action.error)}</p>}

        <div className="subpanel">
            <h3>Юридические лица</h3>
            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.createLegalEntity({
                    organization_id: org.id,
                    name: legal.name,
                    legal_type: legal.legal_type || undefined,
                    tax_system: legal.tax_system || undefined,
                    requisites: compact({
                        inn: legal.inn,
                        ogrn: legal.ogrn,
                        kpp: legal.kpp,
                        legal_address: legal.legal_address,
                    }),
                    bank_details: compact({
                        bank_name: legal.bank_name,
                        bik: legal.bik,
                        checking_account: legal.checking_account,
                        correspondent_account: legal.correspondent_account,
                    }),
                }));
                setLegal({name: "", legal_type: "ip", tax_system: "", inn: "", ogrn: "", kpp: "", legal_address: "", bank_name: "", bik: "", checking_account: "", correspondent_account: ""});
            }}>
                <Field label="Название"><input value={legal.name} onChange={(event) => setLegal({...legal, name: event.target.value})}/></Field>
                <Field label="Тип"><input value={legal.legal_type} onChange={(event) => setLegal({...legal, legal_type: event.target.value})}/></Field>
                <Field label="Налоги"><input value={legal.tax_system} onChange={(event) => setLegal({...legal, tax_system: event.target.value})}/></Field>
                <Field label="ИНН"><input value={legal.inn} onChange={(event) => setLegal({...legal, inn: event.target.value})}/></Field>
                <Field label="ОГРН/ОГРНИП"><input value={legal.ogrn} onChange={(event) => setLegal({...legal, ogrn: event.target.value})}/></Field>
                <Field label="КПП"><input value={legal.kpp} onChange={(event) => setLegal({...legal, kpp: event.target.value})}/></Field>
                <Field label="Юр. адрес"><input value={legal.legal_address} onChange={(event) => setLegal({...legal, legal_address: event.target.value})}/></Field>
                <Field label="Банк"><input value={legal.bank_name} onChange={(event) => setLegal({...legal, bank_name: event.target.value})}/></Field>
                <Field label="БИК"><input value={legal.bik} onChange={(event) => setLegal({...legal, bik: event.target.value})}/></Field>
                <Field label="Расчётный счёт"><input value={legal.checking_account} onChange={(event) => setLegal({...legal, checking_account: event.target.value})}/></Field>
                <Field label="Корр. счёт"><input value={legal.correspondent_account} onChange={(event) => setLegal({...legal, correspondent_account: event.target.value})}/></Field>
                <button className="primary" disabled={action.isPending}>Добавить</button>
            </form>
            {legalEntities.isLoading ? <div className="skeleton">Загрузка...</div> :
                legalEntities.isError ? <ErrorState error={legalEntities.error} retry={() => legalEntities.refetch()}/> :
                    legalOptions.length ? <div className="simple-list">
                        {legalOptions.map((item) => <button key={`legal-${item.id}`} type="button" className="ghost"
                                                            onClick={() => setSelectedLegalEntity(item)}>{item.id}: {item.name} · {item.tax_system ?? "налоги не указаны"}</button>)}
                    </div> : <p className="empty">Юрлиц пока нет.</p>}
        </div>

        <div className="subpanel">
            <h3>Филиалы</h3>
            <form className="inline-form compact" onSubmit={branchForm.handleSubmit((data) => createBranch.mutate(data))}>
                <Field label="Название" error={branchForm.formState.errors.name?.message}><input {...branchForm.register("name")} /></Field>
                <Field label="Адрес"><input {...branchForm.register("address")} /></Field>
                <Field label="Телефон"><input {...branchForm.register("phone")} /></Field>
                <Field label="Часовой пояс"><input {...branchForm.register("timezone")} /></Field>
                <Field label="Бренд"><select value={branchForm.watch("brand_id") === "" || branchForm.watch("brand_id") === undefined ? "" : String(branchForm.watch("brand_id"))}
                                            onChange={(event) => branchForm.setValue("brand_id", event.target.value ? Number(event.target.value) : "", {shouldValidate: true})}>
                    <option value="">Без бренда</option>
                    {brandOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Юрлицо"><select value={branchForm.watch("legal_entity_id") === "" || branchForm.watch("legal_entity_id") === undefined ? "" : String(branchForm.watch("legal_entity_id"))}
                                             onChange={(event) => branchForm.setValue("legal_entity_id", event.target.value ? Number(event.target.value) : "", {shouldValidate: true})}>
                    <option value="">Без юрлица</option>
                    {legalOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Касса ID"><input type="number" {...branchForm.register("cashbox_id", {valueAsNumber: true})} /></Field>
                <Field label="Склад ID"><input type="number" {...branchForm.register("warehouse_id", {valueAsNumber: true})} /></Field>
                <Field label="Прайс ID"><input type="number" {...branchForm.register("price_id", {valueAsNumber: true})} /></Field>
                <Field label="Услуги ID"><input placeholder="1,2,3" {...branchForm.register("service_ids")} /></Field>
                <Field label="Дни работы"><input placeholder="пн-вс" {...branchForm.register("workdays")} /></Field>
                <Field label="Открытие"><input type="time" {...branchForm.register("open_time")} /></Field>
                <Field label="Закрытие"><input type="time" {...branchForm.register("close_time")} /></Field>
                <Field label="Онлайн-запись"><input type="checkbox" {...branchForm.register("online_booking_enabled")} /></Field>
                <Field label="Комментарий онлайн-записи"><input placeholder="Запись за 2 часа" {...branchForm.register("online_booking_note")} /></Field>
                <button className="primary" disabled={createBranch.isPending}>Добавить</button>
            </form>
            {createBranch.isError && <p className="form-error">{message(createBranch.error)}</p>}
            <Table loading={branches.isLoading} error={branches.error} retry={() => branches.refetch()} empty="Филиалов пока нет.">
                {branches.data?.map((item) => (
                    <tr key={item.id}>
                        <td><button type="button" className="ghost" onClick={() => setSelectedBranch(item)}>{item.name}</button><small>{item.address ?? "Адрес не указан"}</small></td>
                        <td>{item.phone ?? "Не указан"}</td>
                        <td>{item.timezone ?? "Не указан"}<small>бренд {item.brand_id ?? "-"} / юрлицо {item.legal_entity_id ?? "-"}</small></td>
                        <td>касса {item.cashbox_id ?? "-"} / склад {item.warehouse_id ?? "-"}<small>{typeof item.work_schedule === "object" && item.work_schedule ? `${String(item.work_schedule.workdays ?? "дни не указаны")} ${String(item.work_schedule.open_time ?? "")}-${String(item.work_schedule.close_time ?? "")}` : "график не указан"}</small></td>
                        <td style={{textAlign: "right"}}><button className="danger" disabled={removeBranch.isPending} onClick={() => confirm(`Удалить филиал "${item.name}"?`) && removeBranch.mutate(item.id)}>Удалить</button></td>
                    </tr>
                ))}
            </Table>
        </div>

        <div className="subpanel">
            <h3>Рабочие места</h3>
            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.createWorkplace({organization_id: org.id, branch_id: Number(workplace.branch_id), department_id: workplace.department_id ? Number(workplace.department_id) : undefined, name: workplace.name, resource_type: workplace.resource_type || undefined}));
                setWorkplace({branch_id: "", department_id: "", name: "", resource_type: ""});
            }}>
                <Field label="Филиал"><select value={workplace.branch_id} onChange={(event) => setWorkplace({...workplace, branch_id: event.target.value, department_id: ""})}>
                    <option value="">Выберите филиал</option>
                    {branchOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Подразделение"><select value={workplace.department_id} onChange={(event) => setWorkplace({...workplace, department_id: event.target.value})}>
                    <option value="">Без подразделения</option>
                    {workplaceDepartments.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Название"><input value={workplace.name} onChange={(event) => setWorkplace({...workplace, name: event.target.value})}/></Field>
                <Field label="Тип ресурса"><input value={workplace.resource_type} onChange={(event) => setWorkplace({...workplace, resource_type: event.target.value})}/></Field>
                <button className="primary" disabled={action.isPending}>Добавить</button>
            </form>
            <Table loading={workplaces.isLoading} error={workplaces.error} retry={() => workplaces.refetch()} empty="Рабочих мест пока нет.">
                {workplaces.data?.map((item) => (
                    <tr key={item.id}>
                        <td><b>{item.name}</b><small>ID {item.id} / филиал {item.branch_id}{item.department_id ? ` / подразделение ${item.department_id}` : ""}</small></td>
                        <td>{item.resource_type ?? "ресурс"}</td>
                        <td style={{textAlign: "right"}}><button className="danger" disabled={removeWorkplace.isPending} onClick={() => confirm(`Удалить рабочее место "${item.name}"?`) && removeWorkplace.mutate(item.id)}>Удалить</button></td>
                    </tr>
                ))}
            </Table>
        </div>


        <div className="subpanel">
            <h3>Пользователи и доступ</h3>
            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(async () => {
                    if (!userForm.role_id) throw new Error("Выберите роль");
                    const user = await api.createUser({
                        first_name: userForm.first_name || undefined,
                        last_name: userForm.last_name || undefined,
                        phone: userForm.phone || undefined,
                        email: userForm.email || undefined,
                        telegram_id: userForm.telegram_id ? Number(userForm.telegram_id) : undefined,
                        password_hash: userForm.password_hash || undefined,
                    });
                    return api.assignUserToOrganization({organization_id: org.id, user_id: user.id, role_id: Number(userForm.role_id)});
                });
                setUserForm({first_name: "", last_name: "", phone: "", email: "", telegram_id: "", password_hash: "", role_id: ""});
            }}>
                <Field label="Имя"><input value={userForm.first_name} onChange={(event) => setUserForm({...userForm, first_name: event.target.value})}/></Field>
                <Field label="Фамилия"><input value={userForm.last_name} onChange={(event) => setUserForm({...userForm, last_name: event.target.value})}/></Field>
                <Field label="Телефон"><input value={userForm.phone} onChange={(event) => setUserForm({...userForm, phone: event.target.value})}/></Field>
                <Field label="Email"><input value={userForm.email} onChange={(event) => setUserForm({...userForm, email: event.target.value})}/></Field>
                <Field label="Telegram ID"><input type="number" value={userForm.telegram_id} onChange={(event) => setUserForm({...userForm, telegram_id: event.target.value})}/></Field>
                <Field label="Роль"><select value={userForm.role_id} onChange={(event) => setUserForm({...userForm, role_id: event.target.value})}>
                    <option value="">Выберите роль</option>
                    {presetRoleOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Пароль/хеш"><input value={userForm.password_hash} onChange={(event) => setUserForm({...userForm, password_hash: event.target.value})}/></Field>
                <button className="primary" disabled={action.isPending}>Создать сотрудника</button>
            </form>

            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.assignUserToOrganization({organization_id: org.id, user_id: Number(userAccess.user_id), role_id: Number(userAccess.role_id)}));
            }}>
                <Field label="Пользователь"><select value={userAccess.user_id} onChange={(event) => setUserAccess({...userAccess, user_id: event.target.value})}>
                    <option value="">Выберите пользователя</option>
                    {availableUserOptions.map((item) => <option key={item.id} value={item.id}>{displayUser(item)}</option>)}
                </select></Field>
                <Field label="Роль"><select value={userAccess.role_id} onChange={(event) => setUserAccess({...userAccess, role_id: event.target.value})}>
                    <option value="">Выберите роль</option>
                    {roleOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <button className="primary" disabled={action.isPending}>Выдать роль в организации</button>
            </form>

            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.assignUserToBranch({organization_id: org.id, branch_id: Number(userAccess.branch_id), user_id: Number(userAccess.user_id), role_id: Number(userAccess.role_id)}));
            }}>
                <Field label="Пользователь"><select value={userAccess.user_id} onChange={(event) => setUserAccess({...userAccess, user_id: event.target.value})}>
                    <option value="">Выберите пользователя</option>
                    {userOptions.map((item) => <option key={item.id} value={item.id}>{displayUser(item)}</option>)}
                </select></Field>
                <Field label="Филиал"><select value={userAccess.branch_id} onChange={(event) => setUserAccess({...userAccess, branch_id: event.target.value})}>
                    <option value="">Выберите филиал</option>
                    {branchOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Роль"><select value={userAccess.role_id} onChange={(event) => setUserAccess({...userAccess, role_id: event.target.value})}>
                    <option value="">Выберите роль</option>
                    {roleOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <button className="primary" disabled={action.isPending}>Выдать роль в филиале</button>
            </form>

            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.addPermissionToRole({role_id: Number(userAccess.role_id), permission_id: Number(userAccess.permission_id)}));
            }}>
                <Field label="Роль"><select value={userAccess.role_id} onChange={(event) => setUserAccess({...userAccess, role_id: event.target.value})}>
                    <option value="">Выберите роль</option>
                    {roleOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Право"><select value={userAccess.permission_id} onChange={(event) => setUserAccess({...userAccess, permission_id: event.target.value})}>
                    <option value="">Выберите право</option>
                    {permissionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <button className="primary" disabled={action.isPending}>Привязать право к роли</button>
            </form>

            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.setUserPermission({user_id: Number(userAccess.user_id), organization_id: org.id, branch_id: userAccess.branch_id ? Number(userAccess.branch_id) : undefined, permission_id: Number(userAccess.permission_id), is_allowed: true}));
            }}>
                <Field label="Пользователь"><select value={userAccess.user_id} onChange={(event) => setUserAccess({...userAccess, user_id: event.target.value})}>
                    <option value="">Выберите пользователя</option>
                    {userOptions.map((item) => <option key={item.id} value={item.id}>{displayUser(item)}</option>)}
                </select></Field>
                <Field label="Право"><select value={userAccess.permission_id} onChange={(event) => setUserAccess({...userAccess, permission_id: event.target.value})}>
                    <option value="">Выберите право</option>
                    {permissionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Филиал"><select value={userAccess.branch_id} onChange={(event) => setUserAccess({...userAccess, branch_id: event.target.value})}>
                    <option value="">Все филиалы</option>
                    {branchOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <button className="primary" disabled={action.isPending}>Выдать точечное право</button>
            </form>

            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.grantTemporaryAccess({user_id: Number(userAccess.user_id), organization_id: org.id, branch_id: userAccess.branch_id ? Number(userAccess.branch_id) : undefined, permission_id: Number(userAccess.temp_permission_id), valid_from: userAccess.temp_from, valid_until: userAccess.temp_until}));
            }}>
                <Field label="Пользователь"><select value={userAccess.user_id} onChange={(event) => setUserAccess({...userAccess, user_id: event.target.value})}>
                    <option value="">Выберите пользователя</option>
                    {userOptions.map((item) => <option key={item.id} value={item.id}>{displayUser(item)}</option>)}
                </select></Field>
                <Field label="Право"><select value={userAccess.temp_permission_id} onChange={(event) => setUserAccess({...userAccess, temp_permission_id: event.target.value})}>
                    <option value="">Выберите право</option>
                    {permissionOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="С"><input type="datetime-local" value={userAccess.temp_from} onChange={(event) => setUserAccess({...userAccess, temp_from: event.target.value})}/></Field>
                <Field label="До"><input type="datetime-local" value={userAccess.temp_until} onChange={(event) => setUserAccess({...userAccess, temp_until: event.target.value})}/></Field>
                <button className="primary" disabled={action.isPending}>Временный доступ</button>
            </form>

            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.setTwoFactorAuth({user_id: Number(userAccess.user_id), method: userAccess.two_factor_method, is_enabled: true}));
            }}>
                <Field label="Пользователь"><select value={userAccess.user_id} onChange={(event) => setUserAccess({...userAccess, user_id: event.target.value})}>
                    <option value="">Выберите пользователя</option>
                    {userOptions.map((item) => <option key={item.id} value={item.id}>{displayUser(item)}</option>)}
                </select></Field>
                <Field label="2FA метод"><input value={userAccess.two_factor_method} onChange={(event) => setUserAccess({...userAccess, two_factor_method: event.target.value})} placeholder="sms / email / telegram"/></Field>
                <button className="primary" disabled={action.isPending}>Включить 2FA</button>
            </form>

            <Table loading={users.isLoading || organizationMemberships.isLoading} error={users.error ?? organizationMemberships.error} retry={() => { users.refetch(); organizationMemberships.refetch(); }} empty="Пользователей пока нет.">
                {userOptions.map((item) => (
                    <tr key={item.id}>
                        <td><button type="button" className="ghost" onClick={() => setSelectedUser(item)}>{[item.first_name, item.last_name].filter(Boolean).join(" ") || item.email || item.phone || `User ${item.id}`}</button></td>
                        <td>{item.is_blocked ? "заблокирован" : item.is_active ? "активен" : "неактивен"}</td>
                        <td style={{textAlign: "right"}}><button className={item.is_blocked ? "ghost" : "danger"} onClick={() => action.mutate(() => item.is_blocked ? api.unblockUser(item.id) : api.blockUser(item.id))}>{item.is_blocked ? "Разблокировать" : "Заблокировать"}</button></td>
                    </tr>
                ))}
            </Table>
            <SimpleList loading={loginHistory.isLoading} error={loginHistory.error} retry={() => loginHistory.refetch()} empty="Выберите user ID, чтобы увидеть историю входов." rows={loginHistory.data?.map((item) => `${date(item.login_at)} · ${item.login_method ?? "login"} · ${item.ip_address ?? "-"} · ${item.is_successful ? "успешно" : "ошибка"}`)}/>
        </div>

        <div className="subpanel">
            <h3>Роли и права</h3>
            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.createRole({organization_id: org.id, name: roleName}));
                setRoleName("");
            }}>
                <Field label="Роль"><input value={roleName} onChange={(event) => setRoleName(event.target.value)} placeholder="собственник / администратор / мастер"/></Field>
                <button className="primary" disabled={action.isPending}>Создать роль</button>
            </form>
            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.createPermission({code: permission.code, name: permission.name, description: permission.description || undefined}));
                setPermission({code: "", name: "", description: ""});
            }}>
                <Field label="Код права"><input value={permission.code} onChange={(event) => setPermission({...permission, code: event.target.value})} placeholder="finance.revenue.view"/></Field>
                <Field label="Название"><input value={permission.name} onChange={(event) => setPermission({...permission, name: event.target.value})}/></Field>
                <Field label="Описание"><input value={permission.description} onChange={(event) => setPermission({...permission, description: event.target.value})}/></Field>
                <button className="primary" disabled={action.isPending}>Создать право</button>
            </form>
            <SimpleList loading={roles.isLoading} error={roles.error} retry={() => roles.refetch()} empty="Ролей пока нет." rows={roles.data?.map((item) => `${item.id}: ${item.name}`)}/>
            <SimpleList loading={permissions.isLoading} error={permissions.error} retry={() => permissions.refetch()} empty="Прав пока нет." rows={permissions.data?.slice(0, 20).map((item) => `${item.id}: ${item.code} · ${item.name}`)}/>
        </div>

        <div className="subpanel">
            <h3>Бренды</h3>
            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.createBrand({organization_id: org.id, name: brand}));
                setBrand("");
            }}>
                <Field label="Название"><input value={brand} onChange={(event) => setBrand(event.target.value)}/></Field>
                <button className="primary" disabled={action.isPending}>Добавить</button>
            </form>
            <SimpleList loading={brands.isLoading} error={brands.error} retry={() => brands.refetch()} empty="Брендов пока нет." rows={brands.data?.map((item) => `${item.id}: ${item.name}`)}/>
        </div>

        <div className="subpanel">
            <h3>Подразделения</h3>
            <form className="inline-form compact" onSubmit={(event) => {
                event.preventDefault();
                action.mutate(() => api.createDepartment({organization_id: org.id, branch_id: Number(department.branch_id), name: department.name}));
                setDepartment({branch_id: "", name: ""});
            }}>
                <Field label="Филиал"><select value={department.branch_id} onChange={(event) => setDepartment({...department, branch_id: event.target.value})}>
                    <option value="">Выберите филиал</option>
                    {branchOptions.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                </select></Field>
                <Field label="Название"><input value={department.name} onChange={(event) => setDepartment({...department, name: event.target.value})}/></Field>
                <button className="primary" disabled={action.isPending}>Добавить</button>
            </form>
            <Table loading={departments.isLoading} error={departments.error} retry={() => departments.refetch()} empty="Подразделений пока нет.">
                {departments.data?.map((item) => (
                    <tr key={item.id}>
                        <td><b>{item.name}</b><small>ID {item.id} / филиал {item.branch_id}</small></td>
                        <td style={{textAlign: "right"}}><button className="danger" disabled={removeDepartment.isPending} onClick={() => confirm(`Удалить подразделение "${item.name}"?`) && removeDepartment.mutate(item.id)}>Удалить</button></td>
                    </tr>
                ))}
            </Table>
        </div>

        <div className="subpanel">
            <h3>Аудит и события</h3>
            <SimpleList loading={audit.isLoading} error={audit.error} retry={() => audit.refetch()} empty="Аудита пока нет." rows={audit.data?.slice(0, 10).map((item) => `${date(item.created_at)} · ${item.action} · ${item.entity_type} ${item.entity_id ?? ""}`)}/>
            <SimpleList loading={events.isLoading} error={events.error} retry={() => events.refetch()} empty="Событий пока нет." rows={events.data?.slice(0, 10).map((item) => `${date(item.created_at)} · ${item.event_name ?? item.event_type ?? "event"} · ${item.source_service}`)}/>
        </div>
        {selectedLegalEntity && <div className="modal-backdrop" onClick={() => setSelectedLegalEntity(null)}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-head">
                    <h3>{selectedLegalEntity.name}</h3>
                    <button type="button" className="ghost" onClick={() => setSelectedLegalEntity(null)}>Закрыть</button>
                </div>
                <div className="modal-grid">
                    <ReadonlyField label="Тип" value={selectedLegalEntity.legal_type}/>
                    <ReadonlyField label="Налоги" value={selectedLegalEntity.tax_system}/>
                    <ReadonlyField label="ИНН" value={String(selectedLegalEntity.requisites?.inn ?? "")}/>
                    <ReadonlyField label="ОГРН/ОГРНИП" value={String(selectedLegalEntity.requisites?.ogrn ?? "")}/>
                    <ReadonlyField label="КПП" value={String(selectedLegalEntity.requisites?.kpp ?? "")}/>
                    <ReadonlyField label="Юр. адрес" value={String(selectedLegalEntity.requisites?.legal_address ?? "")}/>
                    <ReadonlyField label="Банк" value={String(selectedLegalEntity.bank_details?.bank_name ?? "")}/>
                    <ReadonlyField label="БИК" value={String(selectedLegalEntity.bank_details?.bik ?? "")}/>
                    <ReadonlyField label="Расчётный счёт" value={String(selectedLegalEntity.bank_details?.checking_account ?? "")}/>
                    <ReadonlyField label="Корр. счёт" value={String(selectedLegalEntity.bank_details?.correspondent_account ?? "")}/>
                </div>
            </div>
        </div>}
        {selectedBranch && <div className="modal-backdrop" onClick={() => setSelectedBranch(null)}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-head">
                    <h3>{selectedBranch.name}</h3>
                    <button type="button" className="ghost" onClick={() => setSelectedBranch(null)}>Закрыть</button>
                </div>
                <div className="modal-grid">
                    <ReadonlyField label="Адрес" value={selectedBranch.address}/>
                    <ReadonlyField label="Телефон" value={selectedBranch.phone}/>
                    <ReadonlyField label="Часовой пояс" value={selectedBranch.timezone}/>
                    <ReadonlyField label="Бренд ID" value={String(selectedBranch.brand_id ?? "")}/>
                    <ReadonlyField label="Юрлицо ID" value={String(selectedBranch.legal_entity_id ?? "")}/>
                    <ReadonlyField label="Касса ID" value={String(selectedBranch.cashbox_id ?? "")}/>
                    <ReadonlyField label="Склад ID" value={String(selectedBranch.warehouse_id ?? "")}/>
                    <ReadonlyField label="Прайс ID" value={String(selectedBranch.price_id ?? "")}/>
                    <ReadonlyField label="Услуги ID" value={selectedBranch.service_ids?.join(", ") ?? ""}/>
                    <ReadonlyField label="График" value={typeof selectedBranch.work_schedule === "object" && selectedBranch.work_schedule ? `${String(selectedBranch.work_schedule.workdays ?? "дни не указаны")} ${String(selectedBranch.work_schedule.open_time ?? "")}-${String(selectedBranch.work_schedule.close_time ?? "")}` : ""}/>
                </div>
            </div>
        </div>}
        {selectedUser && <div className="modal-backdrop" onClick={() => setSelectedUser(null)}>
            <div className="modal-card" onClick={(event) => event.stopPropagation()}>
                <div className="modal-head">
                    <h3>{[selectedUser.first_name, selectedUser.last_name].filter(Boolean).join(" ") || selectedUser.email || selectedUser.phone || `User ${selectedUser.id}`}</h3>
                    <button type="button" className="ghost" onClick={() => setSelectedUser(null)}>Закрыть</button>
                </div>
                <div className="modal-grid">
                    <ReadonlyField label="Имя" value={selectedUser.first_name}/>
                    <ReadonlyField label="Фамилия" value={selectedUser.last_name}/>
                    <ReadonlyField label="Email" value={selectedUser.email}/>
                    <ReadonlyField label="Телефон" value={selectedUser.phone}/>
                    <ReadonlyField label="Статус" value={selectedUser.is_blocked ? "заблокирован" : selectedUser.is_active ? "активен" : "неактивен"}/>
                </div>
            </div>
        </div>}
    </section>;
}

function useOrg(): Organization {
    const {organizationId = ""} = useParams();
    const orgs = useQuery({queryKey: keys.orgs, queryFn: api.organizations});
    const org = orgs.data?.find((item) => item.id === Number(organizationId));
    if (!org) throw new Error("Организация не найдена");
    return org;
}

function Field({label, error, children}: { label: string; error?: string; children: ReactNode }) {
    return <label><span>{label}</span>{children}{error && <small className="field-error">{error}</small>}</label>;
}

function ReadonlyField({label, value}: { label: string; value?: string | null }) {
    return <div className="readonly-field"><span>{label}</span><b>{value?.trim() || "Не указано"}</b></div>;
}

function Table({loading, error, retry, empty, children}: {
    loading: boolean;
    error: unknown;
    retry: () => void;
    empty: string;
    children: ReactNode
}) {
    if (loading) return <div className="skeleton">Загрузка...</div>;
    if (error) return <ErrorState error={error} retry={retry}/>;
    if (!children || (Array.isArray(children) && children.length === 0)) return <p className="empty">{empty}</p>;
    return <div className="table-wrap">
        <table>
            <tbody>{children}</tbody>
        </table>
    </div>;
}

function SimpleList({loading, error, retry, empty, rows}: {
    loading: boolean;
    error: unknown;
    retry: () => void;
    empty: string;
    rows?: string[];
}) {
    if (loading) return <div className="skeleton">Загрузка...</div>;
    if (error) return <ErrorState error={error} retry={retry}/>;
    if (!rows?.length) return <p className="empty">{empty}</p>;
    return <div className="simple-list">{rows.map((row) => <div key={row}>{row}</div>)}</div>;
}

function Metric({label, query, value}: {
    label: string;
    query: { isLoading: boolean; data?: unknown[] };
    value?: number
}) {
    return <div className="metric">
        <span>{label}</span><b>{query.isLoading ? "..." : value ?? query.data?.length ?? 0}</b></div>;
}

function ErrorState({error, retry}: { error: unknown; retry: () => void }) {
    return <div className="empty"><p>{message(error)}</p>
        <button className="ghost" onClick={retry}>Повторить</button>
    </div>;
}

function AccessDenied() {
    return <FullPage text="Организация не найдена или у вас больше нет к ней доступа"/>;
}

function NotFound() {
    return <FullPage text="Страница не найдена"/>;
}

function FullPage({text}: { text: string }) {
    return <main className="auth-page">
        <div className="auth-card"><p>{text}</p></div>
    </main>;
}

function Nav({to, label}: { to: string; label: string }) {
    return <Link to={to}>{label}</Link>;
}

function message(error: unknown): string {
    return error instanceof ApiError || error instanceof Error ? error.message : "Не удалось выполнить действие";
}

function displayUser(user: { id: number; first_name: string | null; last_name: string | null; email: string | null; phone: string | null }) {
    return [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email || user.phone || `User ${user.id}`;
}

function clean<T extends Record<string, string | number | undefined>>(value: T): T {
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== "" && item !== undefined)) as T;
}

function name(client: { full_name: string | null; first_name: string | null; last_name: string | null }) {
    return client.full_name || [client.first_name, client.last_name].filter(Boolean).join(" ") || "Без имени";
}

function statusLabel(status: string | null) {
    if (status === "active") return "Активен";
    if (status === "archived") return "В архиве";
    return "Статус не указан";
}

function visitStatusLabel(status: string | null) {
    if (status === "completed") return "Завершен";
    if (status === "scheduled") return "Запланирован";
    if (status === "cancelled") return "Отменен";
    if (status === "no_show") return "Не пришел";
    return "Статус не указан";
}

function certificateTypeLabel(type: string | null) {
    if (type === "digital") return "Электронный";
    if (type === "paper") return "Бумажный";
    return "Тип не указан";
}

function certificateStatusLabel(status: string | null) {
    if (status === "active") return "Активен";
    if (status === "partially_used") return "Частично использован";
    if (status === "used") return "Использован";
    if (status === "expired") return "Завершен";
    if (status === "transferred") return "Передан";
    if (status === "refunded") return "Возвращен";
    return "Статус не указан";
}

function dateTime(value?: string | null) {
    return value ? new Date(value).toLocaleString("ru-RU") : "";
}

const loyaltyTabs = [
    ["rules", "Правила"],
    ["levels", "Уровни"],
    ["transactions", "Бонусы"],
    ["subscriptions", "Абонементы"],
    ["certificates", "Сертификаты"],
    ["referrals", "Рефералы"],
    ["promotions", "Акции"],
] as const;

const presetRoleNames = [
    "управляющий",
    "администратор",
    "мастер",
    "кассир",
    "бухгалтер",
    "маркетолог",
] as const;

const bonusTransactionTypes = {
    accrual: "Начисление",
    write_off: "Списание",
    expiration: "Сгорание",
};

function date(value?: string | null) {
    return value ? new Date(value).toLocaleDateString("ru-RU") : "Без срока";
}

function money(value?: string | number | null) {
    return Number(value ?? 0).toLocaleString("ru-RU", {maximumFractionDigits: 2});
}

function json(value: string) {
    return value.trim() ? JSON.parse(value) as Record<string, unknown> : undefined;
}

function compact(value: Record<string, string>) {
    const result = Object.fromEntries(Object.entries(value).filter(([, item]) => item.trim()));
    return Object.keys(result).length ? result : undefined;
}

function ids(value: string) {
    const items = value.split(",").map((item) => Number(item.trim())).filter(Boolean);
    return items.length ? items : undefined;
}

function askString(label: string) {
    return window.prompt(label)?.trim() || "";
}

function askDate(label: string) {
    const value = askString(`${label} (YYYY-MM-DDTHH:mm)`);
    return value || undefined;
}

function askNumber(label: string) {
    const value = Number(askString(label));
    return Number.isFinite(value) && value > 0 ? value : null;
}

function normalizePhone(value: string | null | undefined) {
    const digits = (value ?? "").replace(/\D/g, "");
    if (digits.length === 11 && (digits.startsWith("7") || digits.startsWith("8"))) return digits.slice(1);
    return digits;
}

function findClientByPhone(clients: Client[], phone: string) {
    const normalizedPhone = normalizePhone(phone);
    if (!normalizedPhone) return undefined;
    return clients.find((client) =>
        [client.primary_phone, client.secondary_phone]
            .filter(Boolean)
            .some((value) => normalizePhone(value) === normalizedPhone)
    );
}

type ActionMutation = { mutate: (run: () => Promise<unknown>) => void };

function mutateNumber(action: ActionMutation, label: string, run: (value: number) => Promise<unknown>) {
    const value = askNumber(label);
    if (value !== null) action.mutate(() => run(value));
}

function mutateVisit(action: ActionMutation, subscriptionId: number) {
    const visit_id = askNumber("ID визита");
    if (visit_id === null) return;
    const visits_count = askNumber("Списать визитов") ?? 0;
    const deposit_amount = askNumber("Списать депозит") ?? 0;
    action.mutate(() => api.writeOffSubscriptionVisit(subscriptionId, {visit_id, visits_count, deposit_amount}));
}

function mutateRenew(action: ActionMutation, subscriptionId: number) {
    const visits_total = askNumber("Новые визиты") ?? 0;
    const deposit_amount = askNumber("Новый депозит") ?? 0;
    action.mutate(() => api.renewSubscription(subscriptionId, {
        visits_total,
        deposit_amount,
        started_at: new Date().toISOString(),
        expires_at: askDate("Продлить до")
    }));
}

function mutateReferralRegister(action: ActionMutation, mode: "code" | "link") {
    const invited_client_id = askNumber("ID приглашённого клиента");
    const value = askString(mode === "code" ? "Реферальный код" : "Реферальная ссылка");
    if (invited_client_id === null || !value) return;
    action.mutate(() => mode === "code" ? api.registerReferralByCode({
        referral_code: value,
        invited_client_id
    }) : api.registerReferralByLink({referral_link: value, invited_client_id}));
}

function promotionAmounts() {
    const original_amount = askNumber("Сумма продажи");
    const cost_amount = askNumber("Себестоимость");
    if (original_amount === null || cost_amount === null) return null;
    return {original_amount, cost_amount, client_segment: askString("Сегмент клиента") || undefined};
}

function mutatePromotionApply(action: ActionMutation, promotionId: number) {
    const body = promotionAmounts();
    if (body) action.mutate(() => api.applyPromotion(promotionId, body));
}

function mutatePromotionProfit(action: ActionMutation, promotionId: number) {
    const body = promotionAmounts();
    if (body) action.mutate(() => api.promotionProfitability(promotionId, body));
}

function mutatePromotionByCode(action: ActionMutation, promo_code: string, client_id: number) {
    const body = promotionAmounts();
    if (body) action.mutate(() => api.applyPromotionByCode({...body, promo_code, client_id}));
}

const ruleTypes: Record<BonusRule["rule_type"], string> = {
    welcome: "Приветственные бонусы",
    birthday: "День рождения",
    referral: "Реферальная программа",
    service: "Услуга",
    product: "Товар",
};
