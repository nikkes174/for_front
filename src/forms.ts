import { z } from "zod";

export const loginSchema = z.object({
  login: z.string().min(1, "Укажите email или телефон"),
  password: z.string().min(1, "Укажите пароль"),
});

export const registerSchema = z
  .object({
    name: z.string().min(1, "Укажите имя"),
    email: z.string().email("Укажите корректный email").optional().or(z.literal("")),
    phone: z.string().optional(),
    password: z.string().min(8, "Минимум 8 символов"),
    confirm: z.string().min(1, "Повторите пароль"),
  })
  .refine((value) => value.password === value.confirm, {
    message: "Пароли не совпадают",
    path: ["confirm"],
  });

export const organizationSchema = z.object({
  name: z.string().min(2, "Укажите название организации"),
  settings: z.string().optional(),
});

export const branchSchema = z.object({
  name: z.string().min(2, "Укажите название филиала"),
  address: z.string().optional(),
  phone: z.string().optional(),
  timezone: z.string().optional(),
  brand_id: z.number().int().positive().optional().or(z.literal("")),
  legal_entity_id: z.number().int().positive().optional().or(z.literal("")),
  workdays: z.string().optional(),
  open_time: z.string().optional(),
  close_time: z.string().optional(),
  cashbox_id: z.number().int().positive().optional().or(z.literal("")),
  warehouse_id: z.number().int().positive().optional().or(z.literal("")),
  price_id: z.number().int().positive().optional().or(z.literal("")),
  service_ids: z.string().optional(),
  online_booking_enabled: z.boolean().optional(),
  online_booking_note: z.string().optional(),
});

export const clientSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  middle_name: z.string().optional(),
  primary_phone: z.string().optional(),
  secondary_phone: z.string().optional(),
  email: z.string().email("Укажите корректный email").optional().or(z.literal("")),
  telegram_id: z.string().optional(),
  max_id: z.string().optional(),
  vk_id: z.string().optional(),
  birth_date: z.string().optional(),
  gender: z.string().optional(),
  online_booking_enabled: z.boolean().optional(),
});

export const ruleSchema = z.object({
  name: z.string().min(2, "Укажите название правила"),
  rule_type: z.enum(["welcome", "birthday", "referral", "service", "product"]),
  bonus_type: z.string().min(1, "Укажите тип бонусов"),
  amount: z.number().int().positive("Сумма должна быть больше нуля"),
  expires_in_days: z.number().int().positive().optional().or(z.literal("")),
});

export const bonusOperationSchema = z.object({
  client_id: z.number().int().positive("Выберите клиента"),
  amount: z.number().int().positive("Сумма должна быть больше нуля"),
  bonus_type: z.string().min(1, "Укажите тип бонусов"),
  reason: z.string().min(1, "Укажите причину"),
  expires_at: z.string().optional(),
});

export const bonusLevelSchema = z.object({
  name: z.string().min(2, "Укажите название уровня"),
});

export const subscriptionSchema = z.object({
  client_id: z.number().int().positive("Выберите клиента"),
  subscription_name: z.string().min(2, "Укажите название абонемента"),
  visits_total: z.number().int().min(0),
  deposit_amount: z.number().min(0),
  expires_at: z.string().optional(),
  auto_renewal_enabled: z.boolean().optional(),
});

export const certificateSchema = z.object({
  client_id: z.number().int().positive("Выберите клиента"),
  certificate_type: z.enum(["digital", "paper"]),
  certificate_code: z.string().min(2, "Укажите код сертификата"),
  nominal_amount: z.number().min(0),
  expires_at: z.string().optional(),
});

export const referralSourceSchema = z.object({
  referrer_client_id: z.number().int().positive("Выберите клиента"),
  referral_code: z.string().min(2, "Укажите код"),
  referral_link: z.string().min(2, "Укажите ссылку"),
  reward_type: z.string().min(1),
  reward_bonus_type: z.string().optional(),
  reward_amount: z.number().min(0),
});

export const promotionSchema = z.object({
  client_id: z.number().int().positive("Выберите клиента"),
  promotion_name: z.string().min(2, "Укажите название акции"),
  promotion_type: z.string().min(1),
  promo_code: z.string().optional(),
  discount_type: z.string().optional(),
  discount_value: z.number().min(0),
  gift: z.string().optional(),
  min_amount: z.number().min(0),
  usage_limit: z.number().int().positive().optional().or(z.literal("")),
});

export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type OrganizationForm = z.infer<typeof organizationSchema>;
export type BranchForm = z.infer<typeof branchSchema>;
export type ClientForm = z.infer<typeof clientSchema>;
export type RuleForm = z.infer<typeof ruleSchema>;
export type BonusOperationForm = z.infer<typeof bonusOperationSchema>;
export type BonusLevelForm = z.infer<typeof bonusLevelSchema>;
export type SubscriptionForm = z.infer<typeof subscriptionSchema>;
export type CertificateForm = z.infer<typeof certificateSchema>;
export type ReferralSourceForm = z.infer<typeof referralSourceSchema>;
export type PromotionForm = z.infer<typeof promotionSchema>;
