import { api } from "../api.js";
import { escapeHtml, formData, rows, setMessage } from "../dom.js";

const CLIENTS_PAGE_SIZE = 10;
const REGISTRATION_FIELDS_STORAGE_PREFIX = "loyalty.registrationFields.";
const CLIENT_CARD_SECTIONS_STORAGE_PREFIX = "loyalty.clientCardSections.";
const REGISTRATION_FIELD_NAMES = [
  "last_name",
  "first_name",
  "middle_name",
  "phone",
  "gender",
  "telegram_id",
  "max_id",
  "vk_id",
  "email",
];
const DEFAULT_CLIENT_CARD_SECTIONS = ["client_name", "bonus_cashback", "client_level", "client_visits", "client_chat"];

const loyaltyState = {
  selectedClientId: null,
  levelParams: "",
  bonusTransactionType: "accrual",
  ruleExtras: {
    target_type: "",
    target_id: "",
    client_level: "",
    level_params: "",
    usage_restrictions: "",
  },
  subscriptionExtras: {
    service_ids: "",
    category_ids: "",
    family_client_ids: "",
  },
  promotionExtras: {
    weak_day_from: "",
    weak_day_to: "",
    weak_time_from: "",
    weak_time_to: "",
    client_segment: "",
  },
  referralAccrualSettings: {
    apply_to_services: true,
    apply_to_products: false,
  },
  referralRewardType: "bonus",
  referralRewardAmountType: "percent",
  referralDraft: {
    program_name: "",
    reward_bonus_type: "",
    reward_amount: "0",
    trigger_event: "first_visit",
  },
  actionResult: "",
  cardMode: "client",
  cardSelectedVisitId: null,
  registrationFields: null,
  clientCardSections: null,
};

let loyaltyModalCloseBound = false;


const L = {
  delete: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c",
  close: "\u0417\u0430\u043a\u0440\u044b\u0442\u044c",
  save: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c",
  name: "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435",
  type: "\u0422\u0438\u043f",
  bonusType: "\u0422\u0438\u043f \u0431\u043e\u043d\u0443\u0441\u043e\u0432",
  amount: "\u0420\u0430\u0437\u043c\u0435\u0440",
  ruleAmount: "\u0411\u043e\u043d\u0443\u0441\u043e\u0432 \u043d\u0430\u0447\u0438\u0441\u043b\u0438\u0442\u044c",
  sum: "\u0421\u0443\u043c\u043c\u0430",
  termDays: "\u0421\u0440\u043e\u043a, \u0434\u043d\u0435\u0439",
  targetType: "\u0422\u0438\u043f \u0446\u0435\u043b\u0438",
  clientLevel: "\u0423\u0440\u043e\u0432\u0435\u043d\u044c \u043a\u043b\u0438\u0435\u043d\u0442\u0430",
  levelCashback: "\u041f\u0440\u043e\u0446\u0435\u043d\u0442 \u043d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u044f",
  levelParams: "\u041f\u0440\u043e\u0446\u0435\u043d\u0442 \u043d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u044f",
  restrictions: "\u041e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u044f",
  bonusTypesTitle: "\u0422\u0438\u043f\u044b \u0431\u043e\u043d\u0443\u0441\u043e\u0432",
  createBonusType: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0442\u0438\u043f",
  bonusTypesEmpty: "\u0422\u0438\u043f\u043e\u0432 \u0431\u043e\u043d\u0443\u0441\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.",
  active: "\u0410\u043a\u0442\u0438\u0432\u043d\u043e",
  activeShort: "\u0410\u043a\u0442\u0438\u0432\u0435\u043d",
  disabled: "\u0412\u044b\u043a\u043b\u044e\u0447\u0435\u043d",
  rulesTitle: "\u041f\u0440\u0430\u0432\u0438\u043b\u0430 \u043d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u044f",
  createRule: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u0440\u0430\u0432\u0438\u043b\u043e",
  rulesEmpty: "\u041f\u0440\u0430\u0432\u0438\u043b \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.",
  rule: "\u041f\u0440\u0430\u0432\u0438\u043b\u043e",
  bonusKind: "\u0422\u0438\u043f \u0431\u043e\u043d\u0443\u0441\u0430",
  size: "\u0420\u0430\u0437\u043c\u0435\u0440",
  term: "\u0421\u0440\u043e\u043a",
  status: "\u0421\u0442\u0430\u0442\u0443\u0441",
  days: "\u0434\u043d\u0435\u0439",
  noTerm: "\u0411\u0435\u0437 \u0441\u0440\u043e\u043a\u0430",
  apply: "\u041f\u0440\u0438\u043c\u0435\u043d\u0438\u0442\u044c",
  levelsTitle: "\u0423\u0440\u043e\u0432\u043d\u0438 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432",
  cashback: "\u041a\u0435\u0448\u0431\u044d\u043a %",
  createLevel: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0443\u0440\u043e\u0432\u0435\u043d\u044c",
  levelsEmpty: "\u0423\u0440\u043e\u0432\u043d\u0435\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.",
  params: "\u041f\u0430\u0440\u0430\u043c\u0435\u0442\u0440\u044b",
  created: "\u0421\u043e\u0437\u0434\u0430\u043d",
  notSet: "\u041d\u0435 \u0443\u043a\u0430\u0437\u0430\u043d\u043e",
  bonusOps: "\u0411\u043e\u043d\u0443\u0441\u043d\u044b\u0435 \u043e\u043f\u0435\u0440\u0430\u0446\u0438\u0438",
  client: "\u041a\u043b\u0438\u0435\u043d\u0442",
  notSelected: "\u041d\u0435 \u0432\u044b\u0431\u0440\u0430\u043d",
  bonusBalance: "\u0411\u0430\u043b\u0430\u043d\u0441 \u0431\u043e\u043d\u0443\u0441\u043e\u0432",
  operation: "\u041e\u043f\u0435\u0440\u0430\u0446\u0438\u044f",
  reason: "\u041f\u0440\u0438\u0447\u0438\u043d\u0430",
  run: "\u0412\u044b\u043f\u043e\u043b\u043d\u0438\u0442\u044c",
  date: "\u0414\u0430\u0442\u0430",
  bonusHistoryEmpty: "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0431\u043e\u043d\u0443\u0441\u043e\u0432 \u043f\u043e\u043a\u0430 \u043f\u0443\u0441\u0442\u0430.",
  expiresAt: "\u0421\u0440\u043e\u043a \u0434\u043e",
  referralProgram: "\u0420\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u0430\u044f \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0430",
  invites: "\u041f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0439",
  successful: "\u0423\u0441\u043f\u0435\u0448\u043d\u044b\u0445",
  link: "\u0421\u0441\u044b\u043b\u043a\u0430",
  programName: "\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b",
  reward: "\u041d\u0430\u0433\u0440\u0430\u0434\u0430",
  accrual: "\u041d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u0435",
  bonus: "\u0411\u043e\u043d\u0443\u0441\u044b",
  money: "\u0414\u0435\u043d\u044c\u0433\u0438",
  createSource: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a",
  addClientToProgram: "\u0414\u043e\u0431\u0430\u0432\u0438\u0442\u044c \u043a \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0435",
  clientPrograms: "\u041f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b \u043a\u043b\u0438\u0435\u043d\u0442\u0430",
  copyLink: "\u041a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u0442\u044c \u0441\u0441\u044b\u043b\u043a\u0443",
  firstVisitOnly: "\u041f\u043e \u043f\u0435\u0440\u0432\u043e\u043c\u0443 \u0432\u0438\u0437\u0438\u0442\u0443",
  anyVisit: "\u041f\u043e \u043b\u044e\u0431\u043e\u043c\u0443 \u0432\u0438\u0437\u0438\u0442\u0443",
  triggerEvent: "\u0421\u0440\u0430\u0431\u0430\u0442\u044b\u0432\u0430\u043d\u0438\u0435",
  accrualFor: "\u041d\u0430\u0447\u0438\u0441\u043b\u044f\u0442\u044c \u0441",
  services: "\u0423\u0441\u043b\u0443\u0433",
  products: "\u0422\u043e\u0432\u0430\u0440\u043e\u0432",
  noClientSelected: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u0430, \u0447\u0442\u043e\u0431\u044b \u043f\u0440\u0438\u0432\u044f\u0437\u0430\u0442\u044c \u0435\u0433\u043e \u043a \u0440\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u043e\u0439 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0435",
  copied: "\u0421\u0441\u044b\u043b\u043a\u0430 \u0441\u043a\u043e\u043f\u0438\u0440\u043e\u0432\u0430\u043d\u0430",
  rewardSettings: "\u041d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u0435 \u043f\u043e \u0440\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u043e\u0439 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u0435",
  saveAndAccrue: "\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c \u0438 \u043d\u0430\u0447\u0438\u0441\u043b\u0438\u0442\u044c",
  selectAccrualSource: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435, \u0441 \u0447\u0435\u0433\u043e \u043d\u0430\u0447\u0438\u0441\u043b\u044f\u0442\u044c: \u0443\u0441\u043b\u0443\u0433\u0438, \u0442\u043e\u0432\u0430\u0440\u044b \u0438\u043b\u0438 \u043e\u0431\u0430 \u0432\u0430\u0440\u0438\u0430\u043d\u0442\u0430.",
  selectAtLeastOne: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u0445\u043e\u0442\u044f \u0431\u044b \u043e\u0434\u0438\u043d \u0432\u0430\u0440\u0438\u0430\u043d\u0442: \u0443\u0441\u043b\u0443\u0433\u0438 \u0438\u043b\u0438 \u0442\u043e\u0432\u0430\u0440\u044b.",
  detectByLink: "\u041e\u043f\u0440\u0435\u0434\u0435\u043b\u0438\u0442\u044c \u043f\u043e \u0441\u0441\u044b\u043b\u043a\u0435",
  referralsEmpty: "\u041f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.",
  sourcesEmpty: "\u0420\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u044b\u0445 \u0438\u0441\u0442\u043e\u0447\u043d\u0438\u043a\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.",
  invited: "\u041f\u0440\u0438\u0433\u043b\u0430\u0448\u0451\u043d",
  firstVisit: "\u041f\u0435\u0440\u0432\u044b\u0439 \u0432\u0438\u0437\u0438\u0442",
  cancel: "\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c",
  promotionsTitle: "\u0410\u043a\u0446\u0438\u0438 \u0438 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u044b",
  promoCode: "\u041f\u0440\u043e\u043c\u043e\u043a\u043e\u0434",
  discount: "\u0421\u043a\u0438\u0434\u043a\u0430",
  gift: "\u041f\u043e\u0434\u0430\u0440\u043e\u043a",
  weakHours: "\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0447\u0430\u0441\u044b",
  fixed: "\u0424\u0438\u043a\u0441",
  minAmount: "\u041c\u0438\u043d. \u0441\u0443\u043c\u043c\u0430",
  limit: "\u041b\u0438\u043c\u0438\u0442",
  segment: "\u0421\u0435\u0433\u043c\u0435\u043d\u0442",
  from: "\u0421",
  to: "\u0414\u043e",
  weakDaysFrom: "\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0434\u043d\u0438: \u0441",
  weakDaysTo: "\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0434\u043d\u0438: \u0434\u043e",
  weakFrom: "\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0447\u0430\u0441\u044b: \u0441",
  weakTo: "\u041d\u0435\u0430\u043a\u0442\u0438\u0432\u043d\u044b\u0435 \u0447\u0430\u0441\u044b: \u0434\u043e",
  create: "\u0421\u043e\u0437\u0434\u0430\u0442\u044c",
  promotion: "\u0410\u043a\u0446\u0438\u044f",
  promotionsEmpty: "\u0410\u043a\u0446\u0438\u0439 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.",
  noCode: "\u0411\u0435\u0437 \u043a\u043e\u0434\u0430",
  anySegment: "\u043b\u044e\u0431\u043e\u0439 \u0441\u0435\u0433\u043c\u0435\u043d\u0442",
  conditions: "\u0423\u0441\u043b\u043e\u0432\u0438\u044f",
  profit: "\u041f\u0440\u0438\u0431\u044b\u043b\u044c",
  byCode: "\u041f\u043e \u043a\u043e\u0434\u0443",
  confirmDelete: "\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u0437\u0430\u043f\u0438\u0441\u044c?",
  promotionsHint: "\u0417\u0434\u0435\u0441\u044c \u043d\u0430\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u044e\u0442\u0441\u044f \u0430\u043a\u0446\u0438\u0438 \u0438 \u043f\u0440\u043e\u043c\u043e\u043a\u043e\u0434\u044b: \u0442\u0438\u043f \u0430\u043a\u0446\u0438\u0438, \u0441\u043a\u0438\u0434\u043a\u0430, \u043f\u043e\u0434\u0430\u0440\u043e\u043a, \u043b\u0438\u043c\u0438\u0442 \u0438 \u043e\u0433\u0440\u0430\u043d\u0438\u0447\u0435\u043d\u0438\u044f \u043f\u043e \u0434\u043d\u044f\u043c \u0438 \u0447\u0430\u0441\u0430\u043c.",
  rulesHint: "\u0417\u0434\u0435\u0441\u044c \u0441\u043e\u0437\u0434\u0430\u044e\u0442\u0441\u044f \u043f\u0440\u0430\u0432\u0438\u043b\u0430 \u043d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u044f \u0431\u043e\u043d\u0443\u0441\u043e\u0432: \u0437\u0430 \u0443\u0441\u043b\u0443\u0433\u0438, \u0442\u043e\u0432\u0430\u0440\u044b, \u0434\u0435\u043d\u044c \u0440\u043e\u0436\u0434\u0435\u043d\u0438\u044f \u0438 \u0434\u0440\u0443\u0433\u0438\u0435 \u0441\u0446\u0435\u043d\u0430\u0440\u0438\u0438.",
  levelsHint: "\u0423\u0440\u043e\u0432\u043d\u0438 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 \u043d\u0443\u0436\u043d\u044b \u0434\u043b\u044f \u0433\u0438\u0431\u043a\u0438\u0445 \u0443\u0441\u043b\u043e\u0432\u0438\u0439 \u043b\u043e\u044f\u043b\u044c\u043d\u043e\u0441\u0442\u0438, \u043d\u0430\u043f\u0440\u0438\u043c\u0435\u0440 \u0440\u0430\u0437\u043d\u043e\u0433\u043e \u043a\u044d\u0448\u0431\u044d\u043a\u0430.",
  bonusTypesHint: "\u0414\u043e\u043f\u043e\u043b\u043d\u0438\u0442\u0435\u043b\u044c\u043d\u044b\u0435 \u0442\u0438\u043f\u044b \u0431\u043e\u043d\u0443\u0441\u043e\u0432 \u0434\u043b\u044f \u0440\u0430\u0437\u043d\u044b\u0445 \u043c\u0435\u0445\u0430\u043d\u0438\u043a \u043d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u044f. \u041a\u044d\u0448\u0431\u044d\u043a \u0441\u0438\u0441\u0442\u0435\u043c\u043d\u044b\u0439 \u0438 \u0435\u0441\u0442\u044c \u0432\u0441\u0435\u0433\u0434\u0430.",
  bonusOpsHint: "\u0417\u0434\u0435\u0441\u044c \u043c\u043e\u0436\u043d\u043e \u0432\u0440\u0443\u0447\u043d\u0443\u044e \u043d\u0430\u0447\u0438\u0441\u043b\u044f\u0442\u044c, \u0441\u043f\u0438\u0441\u044b\u0432\u0430\u0442\u044c \u0438\u043b\u0438 \u0441\u0436\u0438\u0433\u0430\u0442\u044c \u0431\u043e\u043d\u0443\u0441\u044b \u043a\u043b\u0438\u0435\u043d\u0442\u0430.",
  subscriptionsHint: "\u0410\u0431\u043e\u043d\u0435\u043c\u0435\u043d\u0442\u044b \u0438\u0441\u043f\u043e\u043b\u044c\u0437\u0443\u044e\u0442\u0441\u044f \u0434\u043b\u044f \u043f\u0430\u043a\u0435\u0442\u043e\u0432 \u0432\u0438\u0437\u0438\u0442\u043e\u0432 \u0438 \u0434\u0435\u043f\u043e\u0437\u0438\u0442\u043e\u0432 \u0441\u043e \u0441\u0440\u043e\u043a\u043e\u043c \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044f.",
  certificatesHint: "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u044b \u043d\u0443\u0436\u043d\u044b \u0434\u043b\u044f \u043f\u0440\u043e\u0434\u0430\u0436\u0438 \u043d\u043e\u043c\u0438\u043d\u0430\u043b\u043e\u0432, \u043f\u0435\u0440\u0435\u043d\u043e\u0441\u0430 \u0431\u0430\u043b\u0430\u043d\u0441\u0430 \u0438 \u0441\u043f\u0438\u0441\u0430\u043d\u0438\u044f \u043f\u0440\u0438 \u043e\u043f\u043b\u0430\u0442\u0435.",
  referralsHint: "\u0420\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u044b\u0435 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b \u043d\u0443\u0436\u043d\u044b \u0434\u043b\u044f \u043f\u0440\u0438\u0433\u043b\u0430\u0448\u0435\u043d\u0438\u044f \u043d\u043e\u0432\u044b\u0445 \u043a\u043b\u0438\u0435\u043d\u0442\u043e\u0432 \u0438 \u043d\u0430\u0447\u0438\u0441\u043b\u0435\u043d\u0438\u044f \u043d\u0430\u0433\u0440\u0430\u0434 \u0437\u0430 \u0432\u0438\u0437\u0438\u0442\u044b.",
  clientSelectorHint: "\u0412\u044b\u0431\u0435\u0440\u0438\u0442\u0435 \u043a\u043b\u0438\u0435\u043d\u0442\u0430, \u0447\u0442\u043e\u0431\u044b \u0441\u043c\u043e\u0442\u0440\u0435\u0442\u044c \u0435\u0433\u043e \u0431\u043e\u043d\u0443\u0441\u044b, \u0430\u0431\u043e\u043d\u0435\u043c\u0435\u043d\u0442\u044b, \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u044b \u0438 \u0440\u0435\u0444\u0435\u0440\u0430\u043b\u044c\u043d\u044b\u0435 \u043f\u0440\u043e\u0433\u0440\u0430\u043c\u043c\u044b.",
  currentClientHint: "\u0417\u0434\u0435\u0441\u044c \u043f\u043e\u043a\u0430\u0437\u0430\u043d \u043a\u043b\u0438\u0435\u043d\u0442, \u0434\u043b\u044f \u043a\u043e\u0442\u043e\u0440\u043e\u0433\u043e \u0441\u0435\u0439\u0447\u0430\u0441 \u043e\u0442\u043a\u0440\u044b\u0442 \u0440\u0430\u0437\u0434\u0435\u043b \u043b\u043e\u044f\u043b\u044c\u043d\u043e\u0441\u0442\u0438.",
};

const loyaltyTabs = [
  ["rules", "\u041f\u0440\u0430\u0432\u0438\u043b\u0430"],
  ["levels", "\u0423\u0440\u043e\u0432\u043d\u0438"],
  ["transactions", "\u0411\u043e\u043d\u0443\u0441\u044b"],
  ["cards", "\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0438"],
  ["subscriptions", "\u0410\u0431\u043e\u043d\u0435\u043c\u0435\u043d\u0442\u044b", true],
  ["certificates", "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u044b", true],
  ["referrals", "\u0420\u0435\u0444\u0435\u0440\u0430\u043b\u044b", true],
  ["promotions", "\u0410\u043a\u0446\u0438\u0438", true],
];
const permissions = {
  rules: "loyalty.rules.view",
  levels: "loyalty.levels.view",
  transactions: "loyalty.transactions.view",
  cards: "loyalty.transactions.view",
  promotions: "loyalty.promotions.view",
  certificates: "loyalty.certificates.view",
  subscriptions: "loyalty.subscriptions.view",
  referrals: "loyalty.referrals.view",
};

const createPermissions = {
  rules: "loyalty.rules.create",
  levels: "loyalty.levels.create",
  transactions: "loyalty.transactions.create",
  promotions: "loyalty.promotions.create",
  certificates: "loyalty.certificates.create",
  subscriptions: "loyalty.subscriptions.create",
  referrals: "loyalty.referrals.create",
};

const deletePermissions = {
  rule: "loyalty.rules.delete",
  level: "loyalty.levels.delete",
  "bonus-type": "loyalty.transactions.delete",
  bonus: "loyalty.transactions.delete",
  promotion: "loyalty.promotions.delete",
  certificate: "loyalty.certificates.delete",
  subscription: "loyalty.subscriptions.delete",
  referral: "loyalty.referrals.delete",
};

const ruleTypes = {
  welcome: "Приветственные бонусы",
  birthday: "День рождения",
  referral: "Реферальная программа",
  service: "Услуга",
  product: "Товар",
};

const bonusTransactionTypes = {
  accrual: "Начисление",
  write_off: "Списание",
  expiration: "Сгорание",
};

function optional(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? trimmed : undefined;
}

function date(value) {
  return value ? new Date(value).toLocaleDateString("ru-RU") : "Без срока";
}

function dateTime(value) {
  return value ? new Date(value).toLocaleString("ru-RU") : "";
}

function money(value) {
  return Number(value ?? 0).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
}

function json(value) {
  const trimmed = String(value ?? "").trim();
  return trimmed ? JSON.parse(trimmed) : undefined;
}

function ids(value) {
  const items = String(value ?? "").split(",").map((item) => Number(item.trim())).filter(Boolean);
  return items.length ? items : undefined;
}

function askString(label) {
  return window.prompt(label)?.trim() || "";
}

function askDate(label) {
  const value = askString(`${label} (YYYY-MM-DDTHH:mm)`);
  return value || undefined;
}

function askNumber(label) {
  const value = Number(askString(label));
  return Number.isFinite(value) && value > 0 ? value : null;
}

function unixTimeCode() {
  return String(Math.floor(Date.now() / 1000));
}

function nextCertificateCode(baseCode, existingCodes) {
  let code = String(baseCode || unixTimeCode());
  while (existingCodes.has(code)) {
    const nextValue = Number(code);
    code = Number.isFinite(nextValue) ? String(nextValue + 1) : `${unixTimeCode()}1`;
  }
  return code;
}

async function ensureUniqueCertificateCode(initialCode = "") {
  const existing = await api.certificatesAll().catch(() => []);
  const existingCodes = new Set(
    existing
      .map((item) => String(item?.certificate_code || "").trim())
      .filter(Boolean),
  );
  return nextCertificateCode(initialCode || unixTimeCode(), existingCodes);
}

function certificateTypeLabel(type) {
  if (type === "digital") return "Электронный";
  if (type === "paper") return "Бумажный";
  return "Тип не указан";
}

function certificateStatusLabel(status) {
  if (status === "active") return "Активен";
  if (status === "partially_used") return "Частично использован";
  if (status === "used") return "Использован";
  if (status === "expired") return "Завершен";
  if (status === "transferred") return "Передан";
  if (status === "refunded") return "Возвращен";
  return "Статус не указан";
}

function clientName(client) {
  return client?.full_name || [client?.last_name, client?.first_name, client?.middle_name].filter(Boolean).join(" ") || `#${client?.id ?? ""}`;
}

function field(label, name, value = "", attrs = "") {
  return `<label><span>${escapeHtml(label)}</span><input name="${escapeHtml(name)}" value="${escapeHtml(value ?? "")}" ${attrs}></label>`;
}

function select(label, name, options, selected = "") {
  return `
    <label>
      <span>${escapeHtml(label)}</span>
      <select name="${escapeHtml(name)}">
        ${options.map((item) => `<option value="${escapeHtml(item.value)}" ${String(selected) === String(item.value) ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
      </select>
    </label>
  `;
}

function labelWithHint(label, hint = "") {
  if (!hint) return `<span>${escapeHtml(label)}</span>`;
  return `<span class="subpanel-title">${escapeHtml(label)}<span class="title-hint" tabindex="0" aria-label="${escapeHtml(hint)}" data-tooltip="${escapeHtml(hint)}">?</span></span>`;
}

function fieldWithHint(label, hint, name, value = "", attrs = "") {
  return `<label>${labelWithHint(label, hint)}<input name="${escapeHtml(name)}" value="${escapeHtml(value ?? "")}" ${attrs}></label>`;
}

function selectWithHint(label, hint, name, options, selected = "") {
  return `
    <label>
      ${labelWithHint(label, hint)}
      <select name="${escapeHtml(name)}">
        ${options.map((item) => `<option value="${escapeHtml(item.value)}" ${String(selected) === String(item.value) ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
      </select>
    </label>
  `;
}

function checkbox(label, name, checked = false) {
  return `<label class="checkbox"><input name="${escapeHtml(name)}" type="checkbox" ${checked ? "checked" : ""}> ${escapeHtml(label)}</label>`;
}

function registrationFieldsStorageKey(orgId) {
  return `${REGISTRATION_FIELDS_STORAGE_PREFIX}${orgId || "default"}`;
}

function enabledRegistrationFields(orgId) {
  if (Array.isArray(loyaltyState.registrationFields)) {
    return normalizeRegistrationFields(loyaltyState.registrationFields);
  }
  try {
    const saved = JSON.parse(localStorage.getItem(registrationFieldsStorageKey(orgId)) || "null");
    if (Array.isArray(saved)) return normalizeRegistrationFields(saved);
  } catch {
    // Ignore broken local settings and fall back to defaults.
  }
  return [...REGISTRATION_FIELD_NAMES];
}

function normalizeRegistrationFields(fields) {
  if (!Array.isArray(fields)) return [...REGISTRATION_FIELD_NAMES];
  return [...new Set(fields.filter((name) => REGISTRATION_FIELD_NAMES.includes(name)))];
}

function saveEnabledRegistrationFields(orgId, fields) {
  const normalized = normalizeRegistrationFields(fields);
  localStorage.setItem(registrationFieldsStorageKey(orgId), JSON.stringify(normalized));
}

function clientCardSectionsStorageKey(orgId) {
  return `${CLIENT_CARD_SECTIONS_STORAGE_PREFIX}${orgId || "default"}`;
}

function normalizeClientCardSections(sections) {
  if (!Array.isArray(sections)) return [...DEFAULT_CLIENT_CARD_SECTIONS];
  return [...new Set(sections.filter((name) => DEFAULT_CLIENT_CARD_SECTIONS.includes(name) || String(name).startsWith("bonus_")))];
}

function enabledClientCardSections(orgId) {
  if (Array.isArray(loyaltyState.clientCardSections)) {
    return normalizeClientCardSections(loyaltyState.clientCardSections);
  }
  try {
    const saved = JSON.parse(localStorage.getItem(clientCardSectionsStorageKey(orgId)) || "null");
    if (Array.isArray(saved)) return normalizeClientCardSections(saved);
  } catch {
    // Ignore broken local settings and fall back to defaults.
  }
  return [...DEFAULT_CLIENT_CARD_SECTIONS];
}

function saveEnabledClientCardSections(orgId, sections) {
  const normalized = normalizeClientCardSections(sections);
  localStorage.setItem(clientCardSectionsStorageKey(orgId), JSON.stringify(normalized));
}

function bonusTypeOptions(items, selected = "") {
  const options = [{ value: "cashback", label: "Кэшбэк" }, ...(items || []).map((item) => ({
    value: item.code,
    label: item.name,
  }))];
  if (selected && !options.some((item) => String(item.value) === String(selected))) {
    options.push({ value: selected, label: selected === "cashback" ? "Кэшбэк" : selected });
  }
  return options;
}



function editButton(kind, item, label) {
  return `<button type="button" class="link-button" data-loyalty-edit-kind="${escapeHtml(kind)}" data-loyalty-edit="${escapeHtml(encodeURIComponent(JSON.stringify(item)))}">${escapeHtml(label)}</button>`;
}

function deleteButton(kind, id) {
  return `<button type="button" class="danger" data-loyalty-delete-kind="${escapeHtml(kind)}" data-loyalty-delete="${escapeHtml(id)}">${L.delete}</button>`;
}

function actionButton(label, attr, id, className = "ghost") {
  return `<button type="button" class="${className}" ${attr}="${escapeHtml(id)}">${label}</button>`;
}

function can(ctx, permission) {
  return !permission || !ctx.can || ctx.can(permission);
}

function canCreate(ctx, section) {
  return can(ctx, createPermissions[section]);
}

function canDelete(ctx, kind) {
  return can(ctx, deletePermissions[kind]);
}

function deleteButtonIfAllowed(ctx, kind, id) {
  return canDelete(ctx, kind) ? deleteButton(kind, id) : "";
}

function createPermissionForForm(form) {
  if (form.matches("[data-loyalty-rule-create]")) return createPermissions.rules;
  if (form.matches("[data-loyalty-transition-rule-create]")) return createPermissions.rules;
  if (form.matches("[data-loyalty-level-create]")) return createPermissions.levels;
  if (form.matches("[data-loyalty-bonus-type-create], [data-loyalty-bonus-op]")) return createPermissions.transactions;
  if (form.matches("[data-loyalty-subscription-create]")) return createPermissions.subscriptions;
  if (form.matches("[data-loyalty-certificate-create]")) return createPermissions.certificates;
  if (form.matches("[data-loyalty-referral-create]")) return createPermissions.referrals;
  if (form.matches("[data-loyalty-promotion-create]")) return createPermissions.promotions;
  return "";
}

function syncLoyaltyPermissions(root, ctx) {
  root.querySelectorAll("[data-loyalty] form").forEach((form) => {
    const permission = createPermissionForForm(form);
    if (permission && !can(ctx, permission)) form.remove();
  });

  root.querySelectorAll("[data-loyalty-delete]").forEach((button) => {
    if (!canDelete(ctx, button.dataset.loyaltyDeleteKind)) button.remove();
  });

  const actionRules = [
    ["[data-subscription-visit], [data-subscription-renew], [data-subscription-transfer], [data-subscription-freeze]", createPermissions.subscriptions],
    ["[data-certificate-use], [data-certificate-transfer], [data-certificate-refund], [data-certificate-deposit]", createPermissions.certificates],
    ["[data-referral-assign], [data-referral-first-visit], [data-referral-reward], [data-referral-cancel]", createPermissions.referrals],
    ["[data-subscription-expire]", deletePermissions.subscription],
    ["[data-certificate-expire]", deletePermissions.certificate],
  ];
  actionRules.forEach(([selector, permission]) => {
    root.querySelectorAll(selector).forEach((button) => {
      if (!can(ctx, permission)) button.remove();
    });
  });
}

function titleWithHint(title, hint = "") {
  const hintMarkup = hint
    ? `<span class="title-hint" tabindex="0" aria-label="${escapeHtml(hint)}" data-tooltip="${escapeHtml(hint)}">?</span>`
    : "";
  return `<h3 class="subpanel-title">${escapeHtml(title)}${hintMarkup}</h3>`;
}

function loyaltyRequiredControls(form) {
  return [...form.querySelectorAll("input, select, textarea")].filter((control) => {
    const type = String(control.type || "").toLowerCase();
    if (control.disabled || control.readOnly) return false;
    return !["button", "submit", "reset", "hidden", "checkbox", "radio"].includes(type);
  });
}

function syncLoyaltyCreateForms(root) {
  const forms = root.matches?.("[data-loyalty]")
    ? root.querySelectorAll("form:not([data-loyalty-client-search]):not([data-loyalty-edit-form])")
    : root.querySelectorAll("[data-loyalty] form:not([data-loyalty-client-search]):not([data-loyalty-edit-form])");
  forms.forEach((form) => {
    const controls = loyaltyRequiredControls(form);
    controls.forEach((control) => {
      control.required = true;
    });
    const submit = form.querySelector('button[type="submit"], button.primary');
    if (submit) {
      submit.disabled = controls.some((control) => !String(control.value || "").trim());
    }
  });
}

function levelOptions(levels, selected = "") {
  const options = (levels || []).map((item) => ({
    value: item.name,
    label: item.name,
  }));
  if (selected && !options.some((item) => String(item.value) === String(selected))) {
    options.push({ value: selected, label: selected });
  }
  return options;
}

function loyaltyModal(kind, item) {
  const title = item.name || item.program_name || item.subscription_name || item.certificate_code || item.promotion_name || item.referral_link || item.referral_code || item.bonus_type || `#${item.id}`;
  const typeOptions = Object.entries(ruleTypes).map(([value, label]) => ({ value, label }));
  const promotionTypes = [{ value: "promo_code", label: L.promoCode }, { value: "discount", label: L.discount }, { value: "gift", label: L.gift }, { value: "weak_hours", label: L.weakHours }];
  const rewardTypes = [{ value: "bonus", label: L.bonus }, { value: "money", label: L.money }];
  const discountTypes = [{ value: "percent", label: "%" }, { value: "fixed", label: L.fixed }];
  const bonusTypes = currentBonusTypeOptions(loyaltyState.bonusTypes || [], item.bonus_type || item.reward_bonus_type || "");
  const levels = levelOptions(loyaltyState.levels || [], item.client_level || "");
  let fields = "";
  if (kind === "rule") fields = `${field(L.name, "name", item.name)}${select(L.type, "rule_type", typeOptions, item.rule_type)}${select(L.bonusType, "bonus_type", bonusTypes, item.bonus_type || "")}${field(L.ruleAmount, "amount", item.amount, 'type="number"')}${field(L.termDays, "expires_in_days", item.expires_in_days || "", 'type="number"')}${select(L.clientLevel, "client_level", levelOptions(loyaltyState.levels || [], item.client_level || ""), item.client_level || "")}${field(L.levelCashback, "level_params", item.level_params?.cashback || "", 'type="number" step="0.01"')}<label class="checkbox modal-full"><input name="is_active" type="checkbox" ${item.is_active ? "checked" : ""}> ${L.active}</label>`;
  if (kind === "level") fields = `${field(L.name, "name", item.name)}${field(L.cashback, "params", item.params?.cashback || "", 'type="number" step="0.01"')}`;
  if (kind === "bonus") fields = `<div class="readonly-field"><span>ID</span><b>${escapeHtml(item.id)}</b></div><div class="readonly-field"><span>${L.type}</span><b>${escapeHtml(item.bonus_type || "-")}</b></div>${field(L.reason, "reason", item.reason || "")}${field(L.clientLevel, "client_level", item.client_level || "")}${field(L.levelCashback, "level_params", item.level_params?.cashback || "", 'type="number" step="0.01"')}${field(L.restrictions, "usage_restrictions", item.usage_restrictions?.allowed_target_types?.join(",") || "", 'placeholder="service,product"')}${field(L.expiresAt, "expires_at", item.expires_at ? item.expires_at.slice(0, 16) : "", 'type="datetime-local"')}`;
  if (kind === "subscription") fields = `${select(L.client, "client_id", clientOptions(loyaltyState.clients || [], null), item.client_id || "")}${field("\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435", "subscription_name", item.subscription_name || "")}${field("\u0412\u0438\u0437\u0438\u0442\u043e\u0432 \u0432\u0441\u0435\u0433\u043e", "visits_total", item.visits_total ?? 0, 'type="number"')}${field("\u0412\u0438\u0437\u0438\u0442\u043e\u0432 \u043e\u0441\u0442\u0430\u043b\u043e\u0441\u044c", "visits_left", item.visits_left ?? 0, 'type="number"')}${field("\u0414\u0435\u043f\u043e\u0437\u0438\u0442 \u0432\u0441\u0435\u0433\u043e", "deposit_amount", item.deposit_amount ?? 0, 'type="number" step="0.01"')}${field("\u0414\u0435\u043f\u043e\u0437\u0438\u0442 \u043e\u0441\u0442\u0430\u0442\u043e\u043a", "deposit_left", item.deposit_left ?? 0, 'type="number" step="0.01"')}${field("\u0421\u0440\u043e\u043a \u0434\u043e", "expires_at", item.expires_at ? item.expires_at.slice(0, 16) : "", 'type="datetime-local"')}<label class="checkbox modal-full"><input name="auto_renewal_enabled" type="checkbox" ${item.auto_renewal_enabled ? "checked" : ""}> \u0410\u0432\u0442\u043e\u043f\u0440\u043e\u0434\u043b\u0435\u043d\u0438\u0435</label><label class="checkbox modal-full"><input name="is_frozen" type="checkbox" ${item.is_frozen ? "checked" : ""}> \u0417\u0430\u043c\u043e\u0440\u043e\u0436\u0435\u043d</label>`;
  if (kind === "certificate") fields = `${select(L.client, "client_id", clientOptions(loyaltyState.clients || [], null), item.client_id || "")}${select("\u0422\u0438\u043f", "certificate_type", [{ value: "digital", label: "\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u044b\u0439" }, { value: "paper", label: "\u0411\u0443\u043c\u0430\u0436\u043d\u044b\u0439" }], item.certificate_type || "digital")}${field("\u041a\u043e\u0434", "certificate_code", item.certificate_code || "")}${field("\u041d\u043e\u043c\u0438\u043d\u0430\u043b", "nominal_amount", item.nominal_amount ?? 0, 'type="number" step="0.01"')}${field("\u0411\u0430\u043b\u0430\u043d\u0441", "balance_amount", item.balance_amount ?? 0, 'type="number" step="0.01"')}${field("\u0421\u0440\u043e\u043a \u0434\u043e", "expires_at", item.expires_at ? item.expires_at.slice(0, 16) : "", 'type="datetime-local"')}`;
  if (kind === "referral") fields = `${field(L.programName, "program_name", item.program_name || "")}${select(L.reward, "reward_type", rewardTypes, item.reward_type || "bonus")}${select(L.bonusKind, "reward_bonus_type", bonusTypes, item.reward_bonus_type || "")}${field(L.sum, "reward_amount", item.reward_amount || 0, 'type="number" step="0.01"')}${select(L.triggerEvent, "trigger_event", [{ value: "first_visit", label: L.firstVisitOnly }, { value: "any_visit", label: L.anyVisit }], item.trigger_event || "first_visit")}${item.referrer_client_id ? `<div class="readonly-field modal-full"><span>${L.client}</span><b>${escapeHtml(String(item.referrer_client_id))}</b></div><div class="readonly-field modal-full"><span>${L.link}</span><b>${escapeHtml(item.referral_link || L.notSet)}</b></div>` : ""}<label class="checkbox modal-full"><input name="is_active" type="checkbox" ${item.is_active ? "checked" : ""}> ${L.activeShort}</label>`;
  if (kind === "promotion") fields = `${select(L.client, "client_id", clientOptions(loyaltyState.clients || [], null), item.client_id || "")}${field(L.name, "promotion_name", item.promotion_name || "")}${field(L.code, "promo_code", item.promo_code || "")}${select(L.type, "promotion_type", promotionTypes, item.promotion_type || "promo_code")}${select(L.discount, "discount_type", discountTypes, item.discount_type || "percent")}${field(L.amount, "discount_value", item.discount_value || 0, 'type="number" step="0.01"')}${field(L.minAmount, "min_amount", item.min_amount || 0, 'type="number" step="0.01"')}${field(L.gift, "gift", item.gift || "")}${field(L.limit, "usage_limit", item.usage_limit || "", 'type="number"')}${field(L.segment, "client_segment", item.client_segment || "")}${select(L.weakDaysFrom, "weak_day_from", [{ value: "", label: "-" }, { value: "mon", label: "Пн" }, { value: "tue", label: "Вт" }, { value: "wed", label: "Ср" }, { value: "thu", label: "Чт" }, { value: "fri", label: "Пт" }, { value: "sat", label: "Сб" }, { value: "sun", label: "Вс" }], item.weak_hours?.day_from || "")}${select(L.weakDaysTo, "weak_day_to", [{ value: "", label: "-" }, { value: "mon", label: "Пн" }, { value: "tue", label: "Вт" }, { value: "wed", label: "Ср" }, { value: "thu", label: "Чт" }, { value: "fri", label: "Пт" }, { value: "sat", label: "Сб" }, { value: "sun", label: "Вс" }], item.weak_hours?.day_to || "")}${field(L.weakFrom, "weak_time_from", item.weak_hours?.from || "", 'type="time"')}${field(L.weakTo, "weak_time_to", item.weak_hours?.to || "", 'type="time"')}`;
  return `<div class="modal-backdrop" data-loyalty-modal><div class="modal-card"><div class="modal-head"><h3>${escapeHtml(title)}</h3><button type="button" class="ghost" data-close-loyalty-modal>${L.close}</button></div><form class="modal-grid" data-loyalty-edit-form data-kind="${escapeHtml(kind)}" data-id="${escapeHtml(item.id)}">${fields}<button class="primary modal-full">${L.save}</button><p class="modal-full" data-message></p></form></div></div>`;
}

function taskAddedModal() {
  return `
    <div class="modal-backdrop" data-loyalty-modal>
      <div class="modal-card task-added-card">
        <div class="modal-head">
          <h3>Задача добавлена</h3>
          <button type="button" class="ghost" data-close-loyalty-modal>${L.close}</button>
        </div>
        <div class="modal-grid">
          
          <button type="button" class="primary modal-full" data-go-tasks>Перейти в задачи</button>
        </div>
      </div>
    </div>
  `;
}

function referralAccrualPicker() {
  const settings = loyaltyState.referralAccrualSettings || {};
  return `
    <div class="referral-accrual-picker">
      <span>${escapeHtml(L.accrualFor)}</span>
      <div class="referral-accrual-menu">
        ${checkbox(L.services, "apply_to_services", settings.apply_to_services !== false)}
        ${checkbox(L.products, "apply_to_products", !!settings.apply_to_products)}
      </div>
    </div>
  `;
}

function referralAmountTypeOptions(selected = "percent") {
  return [
    { value: "sum", label: L.sum },
    { value: "percent", label: "%" },
  ].map((item) => ({
    ...item,
    selected: String(selected) === String(item.value),
  }));
}

function currentBonusTypeOptions(items, selected = "") {
  const options = (items || []).map((item) => ({
    value: item.code,
    label: item.name,
  }));
  if (selected && !options.some((item) => String(item.value) === String(selected))) {
    options.push({ value: selected, label: selected });
  }
  return options;
}

function saveReferralDraft(form) {
  const data = formData(form);
  loyaltyState.referralDraft = {
    program_name: data.program_name || "",
    reward_bonus_type: data.reward_bonus_type || "",
    reward_amount: data.reward_amount || "0",
    trigger_event: data.trigger_event || "first_visit",
  };
}

function editPayload(kind, data) {
  if (kind === "rule") return {
    name: data.name,
    rule_type: data.rule_type,
    bonus_type: data.bonus_type,
    amount: Number(data.amount || 0),
    expires_in_days: data.expires_in_days ? Number(data.expires_in_days) : null,
    client_level: optional(data.client_level),
    level_params: optional(data.level_params) ? { cashback: Number(data.level_params) } : null,
    is_active: data.is_active === "on",
  };
  if (kind === "level") return { name: data.name, params: optional(data.params) ? { cashback: Number(data.params) } : null };
  if (kind === "bonus") return {
    reason: optional(data.reason),
    client_level: optional(data.client_level),
    level_params: optional(data.level_params) ? { cashback: Number(data.level_params) } : null,
    usage_restrictions: optional(data.usage_restrictions) ? { allowed_target_types: data.usage_restrictions.split(",").map((item) => item.trim()).filter(Boolean) } : null,
    expires_at: optional(data.expires_at) ? new Date(data.expires_at).toISOString() : null,
  };
  if (kind === "subscription") return {
    client_id: Number(data.client_id) || null,
    subscription_name: data.subscription_name,
    visits_total: Number(data.visits_total || 0),
    visits_left: Number(data.visits_left || 0),
    deposit_amount: Number(data.deposit_amount || 0),
    deposit_left: Number(data.deposit_left || 0),
    expires_at: optional(data.expires_at) ? new Date(data.expires_at).toISOString() : null,
    auto_renewal_enabled: data.auto_renewal_enabled === "on",
    is_frozen: data.is_frozen === "on",
  };
  if (kind === "certificate") return {
    client_id: Number(data.client_id) || null,
    certificate_type: data.certificate_type,
    certificate_code: data.certificate_code,
    nominal_amount: Number(data.nominal_amount || 0),
    balance_amount: Number(data.balance_amount || 0),
    expires_at: optional(data.expires_at) ? new Date(data.expires_at).toISOString() : null,
  };
  if (kind === "referral") return {
    program_name: data.program_name,
    reward_type: data.reward_type,
    reward_bonus_type: optional(data.reward_bonus_type),
    reward_amount: Number(data.reward_amount || 0),
    trigger_event: data.trigger_event,
    is_active: data.is_active === "on",
  };
  if (kind === "promotion") return {
    client_id: Number(data.client_id) || null,
    promotion_name: data.promotion_name,
    promotion_type: data.promotion_type,
    promo_code: optional(data.promo_code),
    discount_type: optional(data.discount_type),
    discount_value: Number(data.discount_value || 0),
    min_amount: Number(data.min_amount || 0),
    gift: optional(data.gift),
    usage_limit: data.usage_limit ? Number(data.usage_limit) : null,
    client_segment: optional(data.client_segment),
    weak_hours: optional(data.weak_day_from) || optional(data.weak_day_to) || optional(data.weak_time_from) || optional(data.weak_time_to) ? {
      day_from: optional(data.weak_day_from),
      day_to: optional(data.weak_day_to),
      from: optional(data.weak_time_from),
      to: optional(data.weak_time_to),
    } : null,
  };
  return {};
}

function clientOptions(clients, selectedClient) {
  return [
    { value: "", label: "Выберите клиента" },
    ...clients.map((client) => ({
      value: String(client.id),
      label: clientName(client),
    })),
  ];
}

function loyaltyClientFilters() {
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";
  const requestedPage = Number(params.get("page") || 1);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? Math.floor(requestedPage) : 1;
  const offset = (page - 1) * CLIENTS_PAGE_SIZE;
  return { query, page, offset };
}

function loyaltyPageUrl(orgId, tab, filters, nextPage) {
  const params = new URLSearchParams();
  if (filters.query) params.set("q", filters.query);
  if (nextPage > 1) params.set("page", nextPage);
  const qs = params.toString();
  return `/organizations/${orgId}/loyalty/${tab}${qs ? `?${qs}` : ""}`;
}

async function loadClientContext(orgId) {
  const filters = loyaltyClientFilters();
  const items = await api.clients(orgId, {
    query: filters.query,
    offset: filters.offset,
    limit: CLIENTS_PAGE_SIZE + 1,
  }).catch(() => []);
  const clients = items.slice(0, CLIENTS_PAGE_SIZE);
  const hasNextPage = items.length > CLIENTS_PAGE_SIZE;
  let selectedClient = clients.find((item) => String(item.id) === String(loyaltyState.selectedClientId)) || null;
  if (!selectedClient && loyaltyState.selectedClientId) {
    selectedClient = await api.clientProfile(loyaltyState.selectedClientId, orgId).catch(() => null);
  }
  const [rules, levels, bonusTypes, registrationSettings, cardSettings] = await Promise.all([
    api.rules(orgId).catch(() => []),
    api.bonusLevels(orgId).catch(() => []),
    api.bonusTypes(orgId).catch(() => []),
    api.clientRegistrationFields(orgId).catch(() => null),
    api.clientCardSections(orgId).catch(() => null),
  ]);
  const result = { clients, selectedClient, rules, levels, bonusTypes, registrationFields: registrationSettings?.fields || null, clientCardSections: cardSettings?.sections || null, filters, hasNextPage };

  if (!selectedClient) {
    const [history, subscriptions, certificates, referralSources, promotions] = await Promise.all([
      api.bonusHistoryAll().catch(() => []),
      api.subscriptionsAll().catch(() => []),
      api.certificatesAll().catch(() => []),
      api.referralSources().catch(() => []),
      api.promotionsAll().catch(() => []),
    ]);
    return {
      ...result,
      balance: null,
      history,
      subscriptions,
      certificates,
      referralStats: null,
      referrals: referralSources,
      promotions,
      clientVisits: [],
      bonusTypeBalances: [],
    };
  }

  const bonusBalanceTypes = ["cashback", ...(bonusTypes || []).map((item) => item.code).filter(Boolean)];
  const [balance, history, subscriptions, certificates, referralStats, referrals, promotions, metric, clientVisits, bonusTypeBalances] = await Promise.all([
    api.bonusBalance(selectedClient.id).catch(() => null),
    api.bonusHistory(selectedClient.id).catch(() => []),
    api.subscriptions(selectedClient.id).catch(() => []),
    api.certificates(selectedClient.id).catch(() => []),
    api.referralStats(selectedClient.id).catch(() => null),
    api.referralSources().catch(() => []),
    api.promotions(selectedClient.id).catch(() => []),
    api.clientProfileMetric(selectedClient.id).catch(() => selectedClient.metrics || null),
    api.clientHistoryVisits(selectedClient.id).catch(() => []),
    Promise.all(bonusBalanceTypes.map((type) => api.bonusBalance(selectedClient.id, type).catch(() => ({ bonus_type: type, balance: 0 })))),
  ]);

  return { ...result, balance, history, subscriptions, certificates, referralStats, referrals, promotions, metric, clientVisits, bonusTypeBalances };
}

function clientSelector(orgId, tab, clients, selectedClient, filters, hasNextPage) {
  return `
    <div class="subpanel">
      ${titleWithHint("Клиент для программы лояльности", L.clientSelectorHint)}
      <form class="client-search" data-loyalty-client-search>
        <label><span>Поиск</span><input name="q" value="${escapeHtml(filters.query)}" placeholder="Фамилия, телефон или email"></label>
        <button class="primary">Найти</button>
        ${filters.query ? `<a class="ghost pagination-link" href="${loyaltyPageUrl(orgId, tab, { query: "" }, 1)}">Сбросить</a>` : ""}
      </form>
      <div class="entity-list">
        ${clients.length ? clients.map((client) => `
          <button type="button" class="entity-card ${selectedClient?.id === client.id ? "selected" : ""}" data-loyalty-client="${escapeHtml(client.id)}">
            <b>${escapeHtml(clientName(client))}</b>
            <span>${escapeHtml(client.primary_phone || client.email || "Без контакта")}</span>
          </button>
        `).join("") : `<p class="empty">Клиенты не найдены.</p>`}
      </div>
      <div class="pagination">
        <span>Страница ${escapeHtml(filters.page)}</span>
        <div>
          ${filters.page > 1 ? `<a class="ghost pagination-link" href="${loyaltyPageUrl(orgId, tab, filters, filters.page - 1)}">Назад</a>` : `<button class="ghost" disabled>Назад</button>`}
          ${hasNextPage ? `<a class="ghost pagination-link" href="${loyaltyPageUrl(orgId, tab, filters, filters.page + 1)}">Вперед</a>` : `<button class="ghost" disabled>Вперед</button>`}
        </div>
      </div>
    </div>
  `;
}

function rulesSection(ctx, rules, selectedClient, bonusTypes, levels) {
  const bonusRules = (rules || []).filter((item) => !isTransitionRule(item));
  return `
    <div class="subpanel">${titleWithHint(L.rulesTitle, L.rulesHint)}
      ${canCreate(ctx, "rules") ? `<form class="inline-form compact" data-loyalty-rule-create>${field(L.name, "name")}${select(L.type, "rule_type", Object.entries(ruleTypes).map(([value, label]) => ({ value, label })), "service")}${select(L.bonusType, "bonus_type", currentBonusTypeOptions(bonusTypes), "")}${field(L.ruleAmount, "amount", "0", 'type="number"')}${field(L.termDays, "expires_in_days", "", 'type="number"')}${select(L.clientLevel, "client_level", levelOptions(levels, loyaltyState.ruleExtras.client_level), loyaltyState.ruleExtras.client_level)}${field(L.levelParams, "level_params", loyaltyState.ruleExtras.level_params, 'placeholder="10"')}<button class="primary" disabled>${L.createRule}</button><p data-message></p></form>` : ""}
      <table><tbody>${rows(bonusRules, L.rulesEmpty, (item) => `<tr><td>${editButton("rule", item, item.name)}</td><td class="actions">${deleteButtonIfAllowed(ctx, "rule", item.id)}</td></tr>`)}</tbody></table>
    </div>
    ${transitionRulesSection(ctx, rules, levels, selectedClient)}`;
}

function isTransitionRule(item) {
  return item?.rule_type === "level_transition" || item?.target_type === "level_transition" || item?.usage_restrictions?.transition_rule === true;
}

function transitionRulesSection(ctx, rules, levels, selectedClient) {
  const transitionRules = (rules || []).filter(isTransitionRule);
  const hasLevels = (levels || []).length > 0;
  return `
    <div class="subpanel">${titleWithHint("Правила перехода", "Условия автоматического перехода клиента на уровень.")}
      ${canCreate(ctx, "rules") ? `<form class="inline-form compact" data-loyalty-transition-rule-create>
        ${field("Сумма покупок клиента больше", "purchase_threshold", "0", 'type="number" step="0.01" min="0"')}
        ${hasLevels ? select("\u041f\u0435\u0440\u0435\u0432\u0435\u0441\u0442\u0438 \u043d\u0430 \u0443\u0440\u043e\u0432\u0435\u043d\u044c", "client_level", levelOptions(levels), "") : `<a class="primary inline-action-link" href="/organizations/${escapeHtml(ctx.org.id)}/loyalty/levels">\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0443\u0440\u043e\u0432\u0435\u043d\u044c</a>`}
        ${hasLevels ? `<button class="primary" disabled>\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u043f\u0440\u0430\u0432\u0438\u043b\u043e</button>` : ""}
        <p data-message></p>
      </form>` : ""}
      <table><tbody>${rows(transitionRules, "Правил перехода пока нет.", (item) => {
        const threshold = item.usage_restrictions?.purchase_amount_gt ?? item.usage_restrictions?.profit_amount_gt ?? item.usage_restrictions?.conditions?.[0]?.value ?? "";
        const targetLevel = item.client_level || "Следующий уровень";
        const apply = selectedClient ? `<button type="button" class="ghost" data-apply-rule="${escapeHtml(item.id)}" data-transition-rule="1">${L.apply}</button>` : "";
        const applyAll = canCreate(ctx, "rules") ? `<button type="button" class="ghost" data-apply-rule-all="${escapeHtml(item.id)}">Применить ко всем</button>` : "";
        return `<tr><td>${escapeHtml(`Сумма покупок > ${threshold}`)}</td><td>${escapeHtml(targetLevel)}</td><td class="actions">${apply}${applyAll}${deleteButtonIfAllowed(ctx, "rule", item.id)}</td></tr>`;
      })}</tbody></table>
      ${loyaltyState.actionResult ? `<p class="empty">${escapeHtml(loyaltyState.actionResult)}</p>` : ""}
    </div>`;
}

function levelsSection(ctx, levels) {
  return `<div class="subpanel">${titleWithHint(L.levelsTitle, L.levelsHint)}${canCreate(ctx, "levels") ? `<form class="inline-form compact" data-loyalty-level-create>${field(L.name, "name")}<button class="primary" disabled>${L.createLevel}</button><p data-message></p></form>` : ""}<table><tbody>${rows(levels, L.levelsEmpty, (item) => `<tr><td>${editButton("level", item, item.name)}</td><td class="actions">${deleteButtonIfAllowed(ctx, "level", item.id)}</td></tr>`)}</tbody></table></div>`;
}

function bonusTypesSection(ctx, bonusTypes) {
  return `<div class="subpanel">${titleWithHint(L.bonusTypesTitle, L.bonusTypesHint)}${canCreate(ctx, "transactions") ? `<form class="inline-form compact" data-loyalty-bonus-type-create>${field(L.name, "name")}<button class="primary" disabled>${L.createBonusType}</button><p data-message></p></form>` : ""}<table><tbody>${rows(bonusTypes || [], L.bonusTypesEmpty, (item) => `<tr><td>${escapeHtml(item.name)}</td><td class="actions">${deleteButtonIfAllowed(ctx, "bonus-type", item.id)}</td></tr>`)}</tbody></table></div>`;
}

function cardOrganizationAccess(ctx, key) {
  const orgName = ctx.org?.name || ctx.org?.title || `#${ctx.org?.id || ""}`;
  return `
    <label class="card-access">
      <span>\u0414\u043e\u0441\u0442\u0443\u043f\u043d\u043e\u0441\u0442\u044c</span>
      <details class="checkbox-select">
        <summary>\u0412\u0441\u0435 \u043e\u0440\u0433\u0430\u043d\u0438\u0437\u0430\u0446\u0438\u0438</summary>
        <label class="checkbox"><input type="checkbox" name="${escapeHtml(key)}_all_orgs" checked> \u0412\u0441\u0435</label>
        <label class="checkbox"><input type="checkbox" name="${escapeHtml(key)}_org_${escapeHtml(ctx.org?.id || "")}" checked> ${escapeHtml(orgName)}</label>
      </details>
    </label>
  `;
}

function cardBlockSettings(ctx, key, enabled = true) {
  const registrationField = key.startsWith("reg_") ? key.slice(4) : "";
  const clientCardSection = registrationField ? "" : key;
  return `
    <div class="card-block-settings">
      <label class="checkbox"><input type="checkbox" name="${escapeHtml(key)}_enabled" ${registrationField ? `data-registration-field="${escapeHtml(registrationField)}"` : ""} ${clientCardSection ? `data-client-card-section="${escapeHtml(clientCardSection)}"` : ""} ${enabled ? "checked" : ""}> \u041f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0442\u044c</label>
      ${cardOrganizationAccess(ctx, key)}
    </div>
  `;
}

function cardConfigBlock(ctx, key, title, preview, enabled = true) {
  return `
    <div class="card-config-block" draggable="true" data-card-config-block="${escapeHtml(key)}">
      <div>
        <h4>${escapeHtml(title)}</h4>
        <div class="card-preview">${preview}</div>
      </div>
      ${cardBlockSettings(ctx, key, enabled)}
    </div>
  `;
}

function bonusBalanceBlocks(ctx, bonusTypes, bonusTypeBalances, enabledSections) {
  const names = new Map([["cashback", "\u041a\u0435\u0448\u0431\u044d\u043a"]]);
  (bonusTypes || []).forEach((item) => names.set(item.code, item.name || item.code));
  const balances = (bonusTypeBalances || []).length ? bonusTypeBalances : [{ bonus_type: "cashback", balance: 0 }];
  return balances.map((item) => {
    const type = item.bonus_type || item.type || "cashback";
    const key = `bonus_${type}`;
    const title = `${names.get(type) || type}: ${money(item.balance)}`;
    return {
      key,
      html: cardConfigBlock(ctx, key, title, `<b>${escapeHtml(money(item.balance))}</b><span>\u0431\u0430\u043b\u043b\u043e\u0432</span>`, enabledSections.includes(key)),
    };
  });
}

function visitTitle(item) {
  const visit = item.visit || item;
  return dateTime(visit.visit_at || visit.created_at) || `#${visit.id || ""}`;
}

function visitItemsList(items, emptyText) {
  const list = Array.isArray(items) ? items : [];
  if (!list.length) return `<p class="empty">${emptyText}</p>`;
  return `<ul class="card-visit-items">${list.map((item) => `<li>${escapeHtml(item.title || item.name || item.service_name || item.product_name || item.good_title || item.id || "-")}</li>`).join("")}</ul>`;
}

function selectedVisitDetails(visits) {
  const selected = (visits || []).find((item) => String((item.visit || item).id) === String(loyaltyState.cardSelectedVisitId));
  if (!selected) return "";
  const visit = selected.visit || selected;
  const services = selected.services || visit.yclients_services || [];
  const products = selected.products || visit.yclients_goods_transactions || [];
  return `
    <div class="card-visit-details">
      <h4>\u0414\u0435\u0442\u0430\u043b\u0438 \u0432\u0438\u0437\u0438\u0442\u0430</h4>
      <div class="modal-grid">
        <div class="readonly-field"><span>\u0414\u0430\u0442\u0430</span><b>${escapeHtml(visitTitle(selected))}</b></div>
        <div class="readonly-field"><span>\u0421\u0442\u0430\u0442\u0443\u0441</span><b>${escapeHtml(visit.visit_status || visit.attendance_title || L.notSet)}</b></div>
        <div class="readonly-field"><span>\u0423\u0441\u043b\u0443\u0433\u0438</span>${visitItemsList(services, "\u0423\u0441\u043b\u0443\u0433 \u043d\u0435\u0442")}</div>
        <div class="readonly-field"><span>\u0422\u043e\u0432\u0430\u0440\u044b</span>${visitItemsList(products, "\u0422\u043e\u0432\u0430\u0440\u043e\u0432 \u043d\u0435\u0442")}</div>
      </div>
    </div>
  `;
}

function visitsPreview(visits) {
  const items = (visits || []).slice(0, 8);
  if (!items.length) return `<p class="empty">\u0412\u0438\u0437\u0438\u0442\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.</p>`;
  return `
    <div class="entity-list compact-list">
      ${items.map((item) => {
        const visit = item.visit || item;
        return `<button type="button" class="entity-card" data-card-visit="${escapeHtml(visit.id)}"><b>${escapeHtml(visitTitle(item))}</b><span>${escapeHtml(visit.visit_status || visit.source || L.notSet)}</span></button>`;
      }).join("")}
    </div>
    ${selectedVisitDetails(visits)}
  `;
}

function registrationBlocks(ctx) {
  const fieldMap = new Map([
    ["last_name", "\u0424\u0430\u043c\u0438\u043b\u0438\u044f"],
    ["first_name", "\u0418\u043c\u044f"],
    ["middle_name", "\u041e\u0442\u0447\u0435\u0441\u0442\u0432\u043e"],
    ["phone", "\u041d\u043e\u043c\u0435\u0440 \u0442\u0435\u043b\u0435\u0444\u043e\u043d\u0430"],
    ["gender", "\u041f\u043e\u043b"],
    ["telegram_id", "Telegram ID"],
    ["max_id", "Max ID"],
    ["vk_id", "VK ID"],
    ["email", "Email"],
  ]);
  const enabledFields = enabledRegistrationFields(ctx.org?.id);
  const fieldOrder = [...enabledFields, ...REGISTRATION_FIELD_NAMES.filter((name) => !enabledFields.includes(name))];
  return fieldOrder.map((key) => {
    const title = fieldMap.get(key) || key;
    return cardConfigBlock(
    ctx,
    `reg_${key}`,
    title,
    `<span>${escapeHtml(title)}</span><input disabled placeholder="${escapeHtml(title)}">`,
    enabledFields.includes(key),
    );
  }).join("");
}

function clientCardBlocks(ctx, selectedClient, bonusTypes, bonusTypeBalances, levels, metric, visits) {
  const level = selectedClient?.client_level || metric?.client_level || metric?.loyalty_level || levels?.[0]?.name || L.notSet;
  const enabledSections = enabledClientCardSections(ctx.org?.id);
  const blocks = [
    {
      key: "client_name",
      html: cardConfigBlock(ctx, "client_name", "\u0424\u0418\u041e", `<b>${escapeHtml(selectedClient ? clientName(selectedClient) : L.notSelected)}</b>`, enabledSections.includes("client_name")),
    },
    ...bonusBalanceBlocks(ctx, bonusTypes, bonusTypeBalances, enabledSections),
    {
      key: "client_level",
      html: cardConfigBlock(ctx, "client_level", "\u0423\u0440\u043e\u0432\u0435\u043d\u044c", `<b>${escapeHtml(level)}</b>`, enabledSections.includes("client_level")),
    },
    {
      key: "client_visits",
      html: cardConfigBlock(ctx, "client_visits", "\u0418\u0441\u0442\u043e\u0440\u0438\u044f \u0432\u0438\u0437\u0438\u0442\u043e\u0432", visitsPreview(visits), enabledSections.includes("client_visits")),
    },
    {
      key: "client_chat",
      html: cardConfigBlock(ctx, "client_chat", "\u0427\u0430\u0442", `<p class="empty">\u0427\u0430\u0442 \u0431\u0443\u0434\u0435\u0442 \u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d \u043f\u043e\u0441\u043b\u0435 backend-\u043b\u043e\u0433\u0438\u043a\u0438.</p>`, enabledSections.includes("client_chat")),
    },
  ];
  const order = new Map(enabledSections.map((key, index) => [key, index]));
  return blocks
    .sort((a, b) => (order.get(a.key) ?? blocks.length) - (order.get(b.key) ?? blocks.length))
    .map((item) => item.html)
    .join("");
}

function cardsSection(ctx, selectedClient, balance, bonusTypes, bonusTypeBalances, levels, metric, visits) {
  const mode = ["registration", "chat"].includes(loyaltyState.cardMode) ? loyaltyState.cardMode : "client";
  const configBody = mode === "registration"
    ? registrationBlocks(ctx)
    : mode === "client"
      ? clientCardBlocks(ctx, selectedClient, bonusTypes, bonusTypeBalances || (balance ? [balance] : []), levels, metric, visits)
      : "";
  return `
    <div class="subpanel">
      ${titleWithHint("\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0438", "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0430 \u0431\u043b\u043e\u043a\u043e\u0432 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0438 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438 \u043a\u043b\u0438\u0435\u043d\u0442\u0430.")}
      <div class="tabs compact-tabs">
        <button type="button" class="${mode === "registration" ? "active" : ""}" data-card-mode="registration">\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044f</button>
        <button type="button" class="${mode === "client" ? "active" : ""}" data-card-mode="client">\u041a\u0430\u0440\u0442\u043e\u0447\u043a\u0430 \u043a\u043b\u0438\u0435\u043d\u0442\u0430</button>
      </div>
      <div class="card-config-grid">
        ${configBody}
      </div>
      ${mode === "registration" ? `
        <div class="form-actions">
          <button type="button" class="primary" data-save-registration-fields>\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c</button>
        </div>
      ` : ""}
      ${mode === "client" ? `
        <div class="form-actions">
          <button type="button" class="primary" data-save-client-card-sections>\u0421\u043e\u0445\u0440\u0430\u043d\u0438\u0442\u044c</button>
        </div>
      ` : ""}
      ${loyaltyState.actionResult ? `<p class="empty">${escapeHtml(loyaltyState.actionResult)}</p>` : ""}
      <div class="card-bottom-switch">
        <button type="button" class="${mode === "client" ? "active" : ""}" data-card-mode="client">\u041a\u0430\u0440\u0442\u0430</button>
        <button type="button" class="${mode === "chat" ? "active" : ""}" data-card-mode="chat">\u0427\u0430\u0442</button>
      </div>
      ${mode === "chat" ? `<div class="readonly-field"><span>\u0427\u0430\u0442</span><b>\u0418\u043d\u0442\u0435\u0440\u0444\u0435\u0439\u0441 \u0447\u0430\u0442\u0430 \u043f\u043e\u043a\u0430 \u0431\u0435\u0437 backend-\u043f\u043e\u0434\u043a\u043b\u044e\u0447\u0435\u043d\u0438\u044f.</b></div>` : ""}
    </div>
  `;
}

function transactionsSection(ctx, clients, selectedClient, balance, history, bonusTypes) {
  return bonusTypesSection(ctx, bonusTypes);
}

function subscriptionsSection(clients, selectedClient, subscriptions) {
  return `
    <div class="subpanel">
      ${titleWithHint("Абонементы", L.subscriptionsHint)}
      <form class="inline-form compact" data-loyalty-subscription-create>
        ${select("\u041a\u043b\u0438\u0435\u043d\u0442", "client_id", clientOptions(clients, selectedClient), selectedClient?.id || "")}
        ${field("\u041d\u0430\u0437\u0432\u0430\u043d\u0438\u0435", "subscription_name")}
        ${field("\u0412\u0438\u0437\u0438\u0442\u043e\u0432", "visits_total", "0", 'type="number"')}
        ${field("\u0414\u0435\u043f\u043e\u0437\u0438\u0442", "deposit_amount", "0", 'type="number" step="0.01"')}
        ${field("\u0421\u0440\u043e\u043a \u0434\u043e", "expires_at", "", 'type="datetime-local"')}
        <label class="checkbox"><input name="auto_renewal_enabled" type="checkbox"> \u0410\u0432\u0442\u043e\u043f\u0440\u043e\u0434\u043b\u0435\u043d\u0438\u0435</label>
        ${field("\u0423\u0441\u043b\u0443\u0433\u0438 ID", "service_ids", loyaltyState.subscriptionExtras.service_ids, 'placeholder="1,2"')}
        ${field("\u041a\u0430\u0442\u0435\u0433\u043e\u0440\u0438\u0438 ID", "category_ids", loyaltyState.subscriptionExtras.category_ids, 'placeholder="1,2"')}
        ${field("\u0421\u0435\u043c\u0435\u0439\u043d\u044b\u0435 ID", "family_client_ids", loyaltyState.subscriptionExtras.family_client_ids, 'placeholder="1,2"')}
        <button class="primary" disabled>\u0421\u043e\u0437\u0434\u0430\u0442\u044c \u0430\u0431\u043e\u043d\u0435\u043c\u0435\u043d\u0442</button>
        <p data-message></p>
      </form>
      <table><tbody>${rows(subscriptions, "\u0410\u0431\u043e\u043d\u0435\u043c\u0435\u043d\u0442\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.", (item) => `<tr><td>${editButton("subscription", item, item.subscription_name)}</td><td class="actions">${actionButton("\u0421\u043f\u0438\u0441\u0430\u0442\u044c", "data-subscription-visit", item.id)}${actionButton("\u041f\u0440\u043e\u0434\u043b\u0438\u0442\u044c", "data-subscription-renew", item.id)}${actionButton("\u041f\u0435\u0440\u0435\u0434\u0430\u0442\u044c", "data-subscription-transfer", item.id)}${actionButton(item.is_frozen ? "\u0420\u0430\u0437\u043c\u043e\u0440\u043e\u0437\u0438\u0442\u044c" : "\u0417\u0430\u043c\u043e\u0440\u043e\u0437\u0438\u0442\u044c", "data-subscription-freeze", item.id)}${actionButton(L.delete, "data-subscription-expire", item.id, "danger")}</td></tr>`)}</tbody></table>
    </div>
  `;
}

function certificatesSection(clients, selectedClient, certificates) {
  const certificateCode = nextCertificateCode(
    unixTimeCode(),
    new Set((certificates || []).map((item) => String(item?.certificate_code || "").trim()).filter(Boolean)),
  );
  return `
    <div class="subpanel">
      ${titleWithHint("Сертификаты", L.certificatesHint)}
      <form class="inline-form compact" data-loyalty-certificate-create>
        ${select("\u041a\u043b\u0438\u0435\u043d\u0442", "client_id", clientOptions(clients, selectedClient), selectedClient?.id || "")}
        ${select("\u0422\u0438\u043f", "certificate_type", [{ value: "digital", label: "\u042d\u043b\u0435\u043a\u0442\u0440\u043e\u043d\u043d\u044b\u0439" }, { value: "paper", label: "\u0411\u0443\u043c\u0430\u0436\u043d\u044b\u0439" }], "digital")}
        ${field("\u041a\u043e\u0434", "certificate_code", certificateCode, 'readonly')}
        ${field("\u041d\u043e\u043c\u0438\u043d\u0430\u043b", "nominal_amount", "0", 'type="number" step="0.01"')}
        ${field("\u0421\u0440\u043e\u043a \u0434\u043e", "expires_at", "", 'type="datetime-local"')}
        <button class="primary" disabled>\u0412\u044b\u043f\u0443\u0441\u0442\u0438\u0442\u044c \u0441\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442</button>
        <p data-message></p>
      </form>
      <table><tbody>${rows(certificates, "\u0421\u0435\u0440\u0442\u0438\u0444\u0438\u043a\u0430\u0442\u043e\u0432 \u043f\u043e\u043a\u0430 \u043d\u0435\u0442.", (item) => `<tr><td>${editButton("certificate", item, item.certificate_code)}</td><td class="actions">${actionButton("\u0421\u043f\u0438\u0441\u0430\u0442\u044c", "data-certificate-use", item.id)}${actionButton("\u041f\u0435\u0440\u0435\u0434\u0430\u0442\u044c", "data-certificate-transfer", item.id)}${actionButton("\u0412\u043e\u0437\u0432\u0440\u0430\u0442", "data-certificate-refund", item.id)}${actionButton("\u0412 \u0434\u0435\u043f\u043e\u0437\u0438\u0442", "data-certificate-deposit", item.id)}${actionButton(L.delete, "data-certificate-expire", item.id, "danger")}</td></tr>`)}</tbody></table>
    </div>
  `;
}

function referralsSection(clients, selectedClient, referralStats, referrals, bonusTypes) {
  const referralRewardType = loyaltyState.referralRewardType || "bonus";
  const referralAmountType = loyaltyState.referralRewardAmountType || "percent";
  const referralDraft = loyaltyState.referralDraft || {};
  const programs = (referrals || []).filter((item) => !item.referrer_client_id);
  const clientPrograms = selectedClient ? (referrals || []).filter((item) => String(item.referrer_client_id) === String(selectedClient.id)) : [];
  const programTable = rows(programs, L.sourcesEmpty, (item) => `<tr><td>${editButton("referral", item, item.program_name || `#${item.id}`)}</td><td>${escapeHtml(item.trigger_event === "any_visit" ? L.anyVisit : L.firstVisitOnly)}</td><td class="actions">${selectedClient ? actionButton(L.addClientToProgram, "data-referral-assign", item.id) : ""}${deleteButton("referral", item.id)}</td></tr>`);
  const clientProgramTable = rows(clientPrograms, L.sourcesEmpty, (item) => `<tr><td>${editButton("referral", item, item.program_name || `#${item.id}`)}</td><td>${escapeHtml(item.referral_link || L.notSet)}</td><td class="actions">${actionButton(L.copyLink, "data-referral-copy-link", item.id)}${actionButton("\u041f\u0435\u0440\u0432\u044b\u0439 \u0432\u0438\u0437\u0438\u0442", "data-referral-first-visit", item.id)}${actionButton("\u041d\u0430\u0447\u0438\u0441\u043b\u0438\u0442\u044c", "data-referral-reward", item.id)}${actionButton("\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c", "data-referral-cancel", item.id)}${deleteButton("referral", item.id)}</td></tr>`);
  return `<div class="subpanel">${titleWithHint(L.referralProgram, L.referralsHint)}<div class="modal-grid"><div class="readonly-field"><span>${L.invites}</span><b>${escapeHtml(referralStats ? String(referralStats.invites_count) : "0")}</b></div><div class="readonly-field"><span>${L.successful}</span><b>${escapeHtml(referralStats ? String(referralStats.successful_invites_count) : "0")}</b></div></div><form class="inline-form compact" data-loyalty-referral-create>${field(L.programName, "program_name", referralDraft.program_name || "")}${select(L.reward, "reward_type", [{ value: "bonus", label: L.bonus }, { value: "money", label: L.money }], referralRewardType)}<label style="${referralRewardType === "money" ? "opacity:0.45;" : ""}"><span>${escapeHtml(L.bonusKind)}</span><select name="reward_bonus_type" ${referralRewardType === "money" ? "disabled" : ""}>${currentBonusTypeOptions(bonusTypes, referralDraft.reward_bonus_type || "").map((item) => `<option value="${escapeHtml(item.value)}" ${String(item.value) === String(referralDraft.reward_bonus_type || "") ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}</select></label>${select(L.accrual, "reward_amount_type", referralAmountTypeOptions(referralAmountType), referralAmountType)}${field(referralAmountType === "percent" ? L.accrualFor : L.sum, "reward_amount", referralDraft.reward_amount || "0", 'type="number" step="0.01"')}${select(L.triggerEvent, "trigger_event", [{ value: "first_visit", label: L.firstVisitOnly }, { value: "any_visit", label: L.anyVisit }], referralDraft.trigger_event || "first_visit")}${referralAmountType === "percent" ? referralAccrualPicker() : ""}<button class="primary" disabled>${L.createSource}</button><p data-message></p></form>${selectedClient ? "" : `<p class="empty">${escapeHtml(L.noClientSelected)}</p>`}<div class="inline-form compact"><button type="button" class="ghost" data-referral-register="link">${L.detectByLink}</button></div><h4>${escapeHtml(L.referralProgram)}</h4><table><thead><tr><th>${escapeHtml(L.programName)}</th><th>${escapeHtml(L.triggerEvent)}</th><th></th></tr></thead><tbody>${programTable}</tbody></table><h4>${escapeHtml(L.clientPrograms)}</h4><table><thead><tr><th>${escapeHtml(L.programName)}</th><th>${escapeHtml(L.link)}</th><th></th></tr></thead><tbody>${clientProgramTable}</tbody></table></div>`;
}

function promotionsSection(clients, selectedClient, promotions) {
  return `<div class="subpanel">${titleWithHint(L.promotionsTitle, L.promotionsHint)}<form class="inline-form compact" data-loyalty-promotion-create>${selectWithHint(L.client, "Для какого клиента действует акция. Можно оставить выбор по клиенту при создании записи.", "client_id", clientOptions(clients, selectedClient), selectedClient?.id || "")}${fieldWithHint(L.name, "Внутреннее название акции или спецпредложения.", "promotion_name")}${fieldWithHint(L.code, "Промокод, который клиент вводит для применения акции.", "promo_code")}${selectWithHint(L.type, "Тип механики: промокод, скидка, подарок или неактивные часы.", "promotion_type", [{ value: "promo_code", label: L.promoCode }, { value: "discount", label: L.discount }, { value: "gift", label: L.gift }, { value: "weak_hours", label: L.weakHours }], "promo_code")}${selectWithHint(L.discount, "Как считать скидку: в процентах или фиксированной суммой.", "discount_type", [{ value: "percent", label: "%" }, { value: "fixed", label: L.fixed }], "percent")}${fieldWithHint(L.amount, "Размер скидки или бонуса по акции.", "discount_value", "0", 'type="number" step="0.01"')}${fieldWithHint(L.minAmount, "Минимальная сумма, от которой акция начинает работать.", "min_amount", "0", 'type="number" step="0.01"')}${fieldWithHint(L.gift, "Что именно выдаётся клиенту как подарок.", "gift")}${fieldWithHint(L.limit, "Сколько раз можно использовать эту акцию.", "usage_limit", "", 'type="number"')}${fieldWithHint(L.segment, "Для какого сегмента клиентов доступна акция.", "client_segment", loyaltyState.promotionExtras.client_segment)}${selectWithHint(L.weakDaysFrom, "С какого дня недели акция не действует.", "weak_day_from", [{ value: "", label: "-" }, { value: "mon", label: "Пн" }, { value: "tue", label: "Вт" }, { value: "wed", label: "Ср" }, { value: "thu", label: "Чт" }, { value: "fri", label: "Пт" }, { value: "sat", label: "Сб" }, { value: "sun", label: "Вс" }], loyaltyState.promotionExtras.weak_day_from)}${selectWithHint(L.weakDaysTo, "По какой день недели акция не действует.", "weak_day_to", [{ value: "", label: "-" }, { value: "mon", label: "Пн" }, { value: "tue", label: "Вт" }, { value: "wed", label: "Ср" }, { value: "thu", label: "Чт" }, { value: "fri", label: "Пт" }, { value: "sat", label: "Сб" }, { value: "sun", label: "Вс" }], loyaltyState.promotionExtras.weak_day_to)}${fieldWithHint(L.weakFrom, "С какого времени акция не действует.", "weak_time_from", loyaltyState.promotionExtras.weak_time_from, 'type="time"')}${fieldWithHint(L.weakTo, "До какого времени акция не действует.", "weak_time_to", loyaltyState.promotionExtras.weak_time_to, 'type="time"')}<button class="primary" disabled>${L.create}</button><p data-message></p></form>${loyaltyState.actionResult ? `<p class="empty">${escapeHtml(loyaltyState.actionResult)}</p>` : ""}<table><tbody>${rows(promotions, L.promotionsEmpty, (item) => `<tr><td>${editButton("promotion", item, item.promotion_name)}</td><td class="actions">${deleteButton("promotion", item.id)}</td></tr>`)}</tbody></table></div>`;
}

function selectedClientBanner(selectedClient) {
  return `
    <div class="subpanel">
      ${titleWithHint("Текущий клиент", L.currentClientHint)}
      <div class="readonly-field"><span>Клиент</span><b>${escapeHtml(selectedClient ? clientName(selectedClient) : "Не выбран")}</b></div>
    </div>
  `;
}

export async function loyalty(ctx, tab = "rules") {
  const visibleTabs = loyaltyTabs.filter(([key]) => !ctx.can || ctx.can(permissions[key]));
  const activeTab = visibleTabs.some(([key]) => key === tab) ? tab : (visibleTabs[0]?.[0] || "rules");
  const data = await loadClientContext(ctx.org.id);
  const { clients, selectedClient, rules, levels, bonusTypes, balance, history, subscriptions, certificates, referralStats, referrals, promotions, metric, clientVisits, bonusTypeBalances, registrationFields, clientCardSections, filters, hasNextPage } = data;
  loyaltyState.clients = clients;
  loyaltyState.bonusTypes = bonusTypes;
  loyaltyState.levels = levels;
  loyaltyState.referrals = referrals;
  loyaltyState.selectedClientMetric = metric;
  loyaltyState.registrationFields = registrationFields;
  loyaltyState.clientCardSections = clientCardSections;

  let body = "";
  if (activeTab === "rules") body = rulesSection(ctx, rules, selectedClient, bonusTypes, levels);
  if (activeTab === "levels") body = levelsSection(ctx, levels);
  if (activeTab === "transactions") body = transactionsSection(ctx, clients, selectedClient, balance, history, bonusTypes);
  if (activeTab === "cards") body = cardsSection(ctx, selectedClient, balance, bonusTypes, bonusTypeBalances, levels, metric, clientVisits);
  if (activeTab === "subscriptions") body = subscriptionsSection(clients, selectedClient, subscriptions);
  if (activeTab === "certificates") body = certificatesSection(clients, selectedClient, certificates);
  if (activeTab === "referrals") body = referralsSection(clients, selectedClient, referralStats, referrals, bonusTypes);
  if (activeTab === "promotions") body = promotionsSection(clients, selectedClient, promotions);

  return `
    <section class="panel" data-loyalty data-tab="${escapeHtml(activeTab)}">
      <h2>Лояльность</h2>
      <nav class="tabs">
        ${visibleTabs.map(([key, title, disabled]) => disabled
          ? `<span class="tab-disabled">${escapeHtml(title)}</span>`
          : `<a class="${key === activeTab ? "active" : ""}" href="/organizations/${ctx.org.id}/loyalty/${key}">${escapeHtml(title)}</a>`).join("")}
      </nav>
      ${body}
    </section>
  `;
}

function actionBody(labelA, labelB) {
  const original_amount = askNumber(labelA);
  const cost_amount = askNumber(labelB);
  if (original_amount === null || cost_amount === null) return null;
  return { original_amount, cost_amount, client_segment: askString("Сегмент клиента") || undefined };
}

export function bindLoyalty(root, ctx) {
  syncLoyaltyPermissions(root, ctx);
  syncLoyaltyCreateForms(root);

  root.addEventListener("input", (event) => {
    const referralForm = event.target.closest("[data-loyalty-referral-create]");
    if (referralForm) saveReferralDraft(referralForm);
    if (event.target.closest("[data-loyalty] form:not([data-loyalty-client-search]):not([data-loyalty-edit-form])")) {
      syncLoyaltyCreateForms(root);
    }
  });

  root.addEventListener("change", (event) => {
    if (event.target.matches('[name="reward_type"]')) {
      const referralForm = event.target.closest("[data-loyalty-referral-create]");
      if (referralForm) saveReferralDraft(referralForm);
      loyaltyState.referralRewardType = event.target.value || "bonus";
      ctx.reload();
      return;
    }
    if (event.target.matches('[name="reward_amount_type"]')) {
      const referralForm = event.target.closest("[data-loyalty-referral-create]");
      if (referralForm) saveReferralDraft(referralForm);
      loyaltyState.referralRewardAmountType = event.target.value || "percent";
      ctx.reload();
      return;
    }
    const referralForm = event.target.closest("[data-loyalty-referral-create]");
    if (referralForm) saveReferralDraft(referralForm);
    if (event.target.closest("[data-loyalty] form:not([data-loyalty-client-search]):not([data-loyalty-edit-form])")) {
      syncLoyaltyCreateForms(root);
    }
  });

  if (!loyaltyModalCloseBound) {
    loyaltyModalCloseBound = true;
    document.addEventListener("click", (event) => {
      const closeButton = event.target.closest("[data-close-loyalty-modal]");
      if (closeButton) {
        closeButton.closest("[data-loyalty-modal]")?.remove();
      }
    });

    document.addEventListener("mousedown", (event) => {
      if (event.target.matches("[data-loyalty-modal]")) {
        event.target.remove();
      }
    });
  }

  root.addEventListener("submit", async (event) => {
    const form = event.target.closest("[data-loyalty] form");
    if (!form) return;
    event.preventDefault();
    setMessage(form, "");
    const data = formData(form);

    try {
      if (form.matches("[data-loyalty-client-search]")) {
        const tab = location.pathname.split("/").filter(Boolean)[3] || "rules";
        const params = new URLSearchParams();
        if (data.q) params.set("q", data.q);
        history.pushState(null, "", `/organizations/${ctx.org.id}/loyalty/${tab}${params.toString() ? `?${params}` : ""}`);
        ctx.reload();
        return;
      }

      const createPermission = createPermissionForForm(form);
      if (createPermission && !can(ctx, createPermission)) {
        setMessage(form, "Недостаточно прав для создания.");
        return;
      }

      if (!form.matches("[data-loyalty-edit-form]") && !form.reportValidity()) return;

      if (form.matches("[data-loyalty-edit-form]")) {
        const kind = form.dataset.kind;
        const id = Number(form.dataset.id);
        const payload = editPayload(kind, data);
        if (kind === "rule") await api.updateRule(id, payload);
        else if (kind === "level") await api.updateBonusLevel(id, payload);
        else if (kind === "bonus") await api.updateBonus(id, payload);
        else if (kind === "subscription") await api.updateSubscription(id, payload);
        else if (kind === "certificate") await api.updateCertificate(id, payload);
        else if (kind === "referral") await api.updateReferralSource(id, payload);
        else if (kind === "promotion") await api.updatePromotion(id, payload);
        form.closest("[data-loyalty-modal]")?.remove();
        ctx.reload();
        return;
      }

      if (form.matches("[data-loyalty-rule-create]")) {
        const rule = await api.createRule({
          organization_id: ctx.org.id,
          name: data.name,
          rule_type: data.rule_type,
          bonus_type: data.bonus_type,
          amount: Number(data.amount),
          expires_in_days: data.expires_in_days ? Number(data.expires_in_days) : undefined,
          is_active: true,
          client_level: optional(data.client_level),
          level_params: optional(data.level_params) ? { cashback: Number(data.level_params) } : undefined,
        });
        if (loyaltyState.selectedClientId) {
          await api.applyRule(rule.id, loyaltyState.selectedClientId, ctx.org.id);
        }
      } else if (form.matches("[data-loyalty-transition-rule-create]")) {
        const targetLevel = optional(data.client_level);
        await api.createRule({
          organization_id: ctx.org.id,
          name: targetLevel ? `Переход на уровень ${targetLevel}` : "Переход на следующий уровень",
          rule_type: "service",
          bonus_type: "cashback",
          amount: 0,
          target_type: "level_transition",
          is_active: true,
          client_level: targetLevel,
          usage_restrictions: {
            transition_rule: true,
            purchase_amount_gt: Number(data.purchase_threshold || 0),
            conditions: [
              {
                field: "purchase_amount",
                operator: "gt",
                value: Number(data.purchase_threshold || 0),
              },
            ],
          },
        });
      } else if (form.matches("[data-loyalty-level-create]")) {
        await api.createBonusLevel({
          organization_id: ctx.org.id,
          name: data.name,
        });
      } else if (form.matches("[data-loyalty-bonus-type-create]")) {
        await api.createBonusType({
          organization_id: ctx.org.id,
          name: data.name,
        });
      } else if (form.matches("[data-loyalty-bonus-op]")) {
        const clientId = Number(data.client_id || loyaltyState.selectedClientId) || null;
        if (!clientId && data.transaction_type !== "accrual") throw new Error("Client is required for this operation");
        const body = {
          client_id: clientId,
          organization_id: ctx.org.id,
          bonus_type: data.bonus_type,
          amount: Number(data.amount),
          reason: data.reason,
        };
        if (data.transaction_type === "write_off") await api.writeOffBonus(body);
        else if (data.transaction_type === "expiration") await api.expireBonus(body);
        else await api.accrueBonus(body);
      } else if (form.matches("[data-loyalty-subscription-create]")) {
        const clientId = Number(data.client_id || loyaltyState.selectedClientId) || null;
        if (clientId) await api.syncLoyaltyClient({ id: clientId, full_name: "" }).catch(() => null);

        await api.createSubscription({
          client_id: clientId,
          subscription_name: data.subscription_name,
          visits_total: Number(data.visits_total || 0),
          visits_left: Number(data.visits_total || 0),
          deposit_amount: Number(data.deposit_amount || 0),
          deposit_left: Number(data.deposit_amount || 0),
          started_at: new Date().toISOString(),
          expires_at: optional(data.expires_at) ? new Date(data.expires_at).toISOString() : undefined,
          auto_renewal_enabled: data.auto_renewal_enabled === "on",
          service_restrictions: ids(data.service_ids) || ids(data.category_ids) ? {
            service_ids: ids(data.service_ids),
            category_ids: ids(data.category_ids),
          } : undefined,
          family_client_ids: ids(data.family_client_ids),
        });
      } else if (form.matches("[data-loyalty-certificate-create]")) {
        const clientId = Number(data.client_id || loyaltyState.selectedClientId) || null;
        const certificateCode = await ensureUniqueCertificateCode(optional(data.certificate_code) || unixTimeCode());
        const codeField = form.elements.certificate_code;
        if (codeField) codeField.value = certificateCode;

        await api.createCertificate({
          client_id: clientId,
          certificate_type: data.certificate_type,
          certificate_code: certificateCode,
          nominal_amount: Number(data.nominal_amount || 0),
          balance_amount: Number(data.nominal_amount || 0),
          issued_at: new Date().toISOString(),
          expires_at: optional(data.expires_at) ? new Date(data.expires_at).toISOString() : undefined,
        });
      } else if (form.matches("[data-loyalty-referral-create]")) {
        const rewardAmountType = data.reward_amount_type || loyaltyState.referralRewardAmountType || "percent";
        const apply_to_services = rewardAmountType === "percent" ? data.apply_to_services === "on" : true;
        const apply_to_products = rewardAmountType === "percent" ? data.apply_to_products === "on" : false;
        if (rewardAmountType === "percent" && !apply_to_services && !apply_to_products) {
          setMessage(form, L.selectAtLeastOne);
          return;
        }
        loyaltyState.referralAccrualSettings = {
          apply_to_services,
          apply_to_products,
        };
        await api.createReferralSource({
          program_name: data.program_name,
          reward_type: data.reward_type,
          reward_bonus_type: data.reward_type === "money" ? undefined : optional(data.reward_bonus_type),
          reward_amount: Number(data.reward_amount || 0),
          trigger_event: data.trigger_event,
          apply_to_services,
          apply_to_products,
          is_active: true,
        });
        loyaltyState.referralDraft = {
          program_name: "",
          reward_bonus_type: "",
          reward_amount: "0",
          trigger_event: "first_visit",
        };
      } else if (form.matches("[data-loyalty-promotion-create]")) {
        const clientId = Number(data.client_id || loyaltyState.selectedClientId) || null;

        await api.createPromotion({
          client_id: clientId,
          promotion_name: data.promotion_name,
          promotion_type: data.promotion_type,
          promo_code: optional(data.promo_code),
          discount_type: optional(data.discount_type),
          discount_value: Number(data.discount_value || 0),
          gift: optional(data.gift),
          client_segment: optional(data.client_segment),
          min_amount: Number(data.min_amount || 0),
          usage_limit: data.usage_limit ? Number(data.usage_limit) : undefined,
          weak_hours: optional(data.weak_day_from) || optional(data.weak_day_to) || optional(data.weak_time_from) || optional(data.weak_time_to) ? {
            day_from: optional(data.weak_day_from),
            day_to: optional(data.weak_day_to),
            from: optional(data.weak_time_from),
            to: optional(data.weak_time_to),
          } : undefined,
        });
      } else {
        return;
      }
      loyaltyState.actionResult = "";
      ctx.reload();
    } catch (error) {
      setMessage(form, error.message);
    }
  });

  root.addEventListener("dragstart", (event) => {
    const block = event.target.closest("[data-card-config-block]");
    if (!block) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", block.dataset.cardConfigBlock || "");
    block.classList.add("dragging");
  });

  root.addEventListener("dragend", (event) => {
    event.target.closest("[data-card-config-block]")?.classList.remove("dragging");
  });

  root.addEventListener("dragover", (event) => {
    const block = event.target.closest("[data-card-config-block]");
    const dragging = root.querySelector("[data-card-config-block].dragging");
    if (!block || !dragging || block === dragging) return;
    event.preventDefault();
    const after = event.clientY > block.getBoundingClientRect().top + block.offsetHeight / 2;
    block.parentNode.insertBefore(dragging, after ? block.nextSibling : block);
  });

  root.addEventListener("click", async (event) => {
    const tasksButton = event.target.closest("[data-go-tasks]");
    if (tasksButton) {
      tasksButton.closest("[data-loyalty-modal]")?.remove();
      ctx.navigate(`/organizations/${ctx.org.id}/tasks`);
      return;
    }

    const clientButton = event.target.closest("[data-loyalty-client]");
    if (clientButton) {
      loyaltyState.selectedClientId = Number(clientButton.dataset.loyaltyClient);
      loyaltyState.cardSelectedVisitId = null;
      loyaltyState.actionResult = "";
      ctx.reload();
      return;
    }

    const cardModeButton = event.target.closest("[data-card-mode]");
    if (cardModeButton) {
      loyaltyState.cardMode = cardModeButton.dataset.cardMode;
      ctx.reload();
      return;
    }

    const cardVisitButton = event.target.closest("[data-card-visit]");
    if (cardVisitButton) {
      loyaltyState.cardSelectedVisitId = cardVisitButton.dataset.cardVisit;
      ctx.reload();
      return;
    }

    const saveRegistrationFieldsButton = event.target.closest("[data-save-registration-fields]");
    if (saveRegistrationFieldsButton) {
      const fields = [...root.querySelectorAll("[data-card-config-block] [data-registration-field]")]
        .filter((input) => input.checked)
        .map((input) => input.dataset.registrationField);
      await api.updateClientRegistrationFields(ctx.org.id, fields);
      saveEnabledRegistrationFields(ctx.org.id, fields);
      loyaltyState.registrationFields = fields;
      loyaltyState.actionResult = "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u0440\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u0438 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b.";
      ctx.reload();
      return;
    }

    const saveClientCardSectionsButton = event.target.closest("[data-save-client-card-sections]");
    if (saveClientCardSectionsButton) {
      const sections = [...root.querySelectorAll("[data-card-config-block] [data-client-card-section]")]
        .filter((input) => input.checked)
        .map((input) => input.dataset.clientCardSection);
      await api.updateClientCardSections(ctx.org.id, sections);
      saveEnabledClientCardSections(ctx.org.id, sections);
      loyaltyState.clientCardSections = sections;
      loyaltyState.actionResult = "\u041d\u0430\u0441\u0442\u0440\u043e\u0439\u043a\u0438 \u043a\u0430\u0440\u0442\u043e\u0447\u043a\u0438 \u043a\u043b\u0438\u0435\u043d\u0442\u0430 \u0441\u043e\u0445\u0440\u0430\u043d\u0435\u043d\u044b.";
      ctx.reload();
      return;
    }

    try {
      const protectedActions = [
        ["[data-subscription-visit], [data-subscription-renew], [data-subscription-transfer], [data-subscription-freeze]", createPermissions.subscriptions, "Недостаточно прав для операций с абонементами."],
        ["[data-certificate-use], [data-certificate-transfer], [data-certificate-refund], [data-certificate-deposit]", createPermissions.certificates, "Недостаточно прав для операций с сертификатами."],
        ["[data-referral-assign], [data-referral-first-visit], [data-referral-reward], [data-referral-cancel]", createPermissions.referrals, "Недостаточно прав для операций с рефералами."],
        ["[data-apply-rule-all]", createPermissions.rules, "Недостаточно прав для применения правил."],
        ["[data-subscription-expire]", deletePermissions.subscription, "Недостаточно прав для удаления абонементов."],
        ["[data-certificate-expire]", deletePermissions.certificate, "Недостаточно прав для удаления сертификатов."],
      ];
      const blockedAction = protectedActions.find(([selector, permission]) => event.target.closest(selector) && !can(ctx, permission));
      if (blockedAction) {
        window.alert(blockedAction[2]);
        return;
      }

      const editButton = event.target.closest("[data-loyalty-edit]");
      if (editButton) {
        const item = JSON.parse(decodeURIComponent(editButton.dataset.loyaltyEdit));
        root.insertAdjacentHTML("beforeend", loyaltyModal(editButton.dataset.loyaltyEditKind, item));
        return;
      }

      const deleteButton = event.target.closest("[data-loyalty-delete]");
      if (deleteButton) {
        if (!canDelete(ctx, deleteButton.dataset.loyaltyDeleteKind)) {
          window.alert("Недостаточно прав для удаления.");
          return;
        }
        if (!window.confirm(L.confirmDelete)) return;
        const id = Number(deleteButton.dataset.loyaltyDelete);
        const kind = deleteButton.dataset.loyaltyDeleteKind;
        if (kind === "rule") await api.deleteRule(id);
        else if (kind === "level") await api.deleteBonusLevel(id);
        else if (kind === "bonus-type") await api.deleteBonusType(id);
        else if (kind === "bonus") await api.deleteBonus(id);
        else if (kind === "referral") await api.deleteReferralSource(id);
        else if (kind === "promotion") await api.deletePromotion(id);
        ctx.reload();
        return;
      }

      const applyRuleAllButton = event.target.closest("[data-apply-rule-all]");
      if (applyRuleAllButton) {
        event.preventDefault();
        await api.startApplyRuleToAllJob(Number(applyRuleAllButton.dataset.applyRuleAll), ctx.org.id);
        loyaltyState.actionResult = "Задача добавлена";
        root.querySelector("[data-loyalty-modal]")?.remove();
        root.insertAdjacentHTML("beforeend", taskAddedModal());
        return;
      }

      const applyRuleButton = event.target.closest("[data-apply-rule]");
      if (applyRuleButton && loyaltyState.selectedClientId) {
        const metric = loyaltyState.selectedClientMetric || {};
        const purchaseAmount = Math.max(
          Number(metric.sold_amount || 0),
          Number(metric.ltv || 0),
          Number(metric.paid_amount || 0),
        );
        const extra = purchaseAmount > 0 ? { purchase_amount: purchaseAmount } : {};
        await api.applyRule(Number(applyRuleButton.dataset.applyRule), loyaltyState.selectedClientId, ctx.org.id, extra);
        ctx.reload();
        return;
      }

      const subscriptionVisitButton = event.target.closest("[data-subscription-visit]");
      if (subscriptionVisitButton) {
        const visit_id = askNumber("ID визита");
        if (visit_id !== null) {
          await api.writeOffSubscriptionVisit(Number(subscriptionVisitButton.dataset.subscriptionVisit), {
            visit_id,
            visits_count: askNumber("Списать визитов") ?? 0,
            deposit_amount: askNumber("Списать депозит") ?? 0,
          });
          ctx.reload();
        }
        return;
      }

      const subscriptionRenewButton = event.target.closest("[data-subscription-renew]");
      if (subscriptionRenewButton) {
        await api.renewSubscription(Number(subscriptionRenewButton.dataset.subscriptionRenew), {
          visits_total: askNumber("Новые визиты") ?? 0,
          deposit_amount: askNumber("Новый депозит") ?? 0,
          started_at: new Date().toISOString(),
          expires_at: askDate("Продлить до") ? new Date(askDate("Продлить до")).toISOString() : undefined,
        });
        ctx.reload();
        return;
      }

      const subscriptionTransferButton = event.target.closest("[data-subscription-transfer]");
      if (subscriptionTransferButton) {
        const toClientId = askNumber("ID клиента, которому передать");
        if (toClientId !== null) {
          await api.transferSubscription(Number(subscriptionTransferButton.dataset.subscriptionTransfer), toClientId);
          ctx.reload();
        }
        return;
      }

      const subscriptionFreezeButton = event.target.closest("[data-subscription-freeze]");
      if (subscriptionFreezeButton) {
        const id = Number(subscriptionFreezeButton.dataset.subscriptionFreeze);
        if (subscriptionFreezeButton.textContent?.includes("Разморозить")) await api.unfreezeSubscription(id);
        else await api.freezeSubscription(id, { frozen_from: new Date().toISOString(), frozen_until: askDate("Заморозить до") ? new Date(askDate("Заморозить до")).toISOString() : undefined });
        ctx.reload();
        return;
      }

      const subscriptionExpireButton = event.target.closest("[data-subscription-expire]");
      if (subscriptionExpireButton) {
        await api.expireSubscription(Number(subscriptionExpireButton.dataset.subscriptionExpire));
        ctx.reload();
        return;
      }

      const certificateUseButton = event.target.closest("[data-certificate-use]");
      if (certificateUseButton) {
        const amount = askNumber("Сумма списания");
        if (amount !== null) {
          await api.useCertificate(Number(certificateUseButton.dataset.certificateUse), {
            amount,
            convert_rest_to_deposit: window.confirm("Остаток перевести в депозит?"),
          });
          ctx.reload();
        }
        return;
      }

      const certificateTransferButton = event.target.closest("[data-certificate-transfer]");
      if (certificateTransferButton) {
        const toClientId = askNumber("ID клиента, которому передать");
        if (toClientId !== null) {
          await api.transferCertificate(Number(certificateTransferButton.dataset.certificateTransfer), toClientId);
          ctx.reload();
        }
        return;
      }

      const certificateRefundButton = event.target.closest("[data-certificate-refund]");
      if (certificateRefundButton) {
        await api.refundCertificate(Number(certificateRefundButton.dataset.certificateRefund));
        ctx.reload();
        return;
      }

      const certificateDepositButton = event.target.closest("[data-certificate-deposit]");
      if (certificateDepositButton) {
        await api.convertCertificateToDeposit(Number(certificateDepositButton.dataset.certificateDeposit));
        ctx.reload();
        return;
      }

      const certificateExpireButton = event.target.closest("[data-certificate-expire]");
      if (certificateExpireButton) {
        await api.expireCertificate(Number(certificateExpireButton.dataset.certificateExpire));
        ctx.reload();
        return;
      }

      const referralRegisterButton = event.target.closest("[data-referral-register]");
      if (referralRegisterButton) {
        const invited_client_id = askNumber("ID приглашённого клиента");
        const value = askString(referralRegisterButton.dataset.referralRegister === "code" ? "Реферальный код" : "Реферальная ссылка");
        if (invited_client_id !== null && value) {
          await api.registerReferralByLink({ referral_link: value, invited_client_id });
          ctx.reload();
        }
        return;
      }

      const referralAssignButton = event.target.closest("[data-referral-assign]");
      if (referralAssignButton) {
        if (!loyaltyState.selectedClientId) {
          window.alert(L.noClientSelected);
          return;
        }
        const template = (loyaltyState.referrals || []).find((item) => String(item.id) === String(referralAssignButton.dataset.referralAssign));
        if (!template) return;
        await api.createReferralSource({
          referrer_client_id: loyaltyState.selectedClientId,
          program_name: template.program_name,
          reward_type: template.reward_type,
          reward_bonus_type: optional(template.reward_bonus_type),
          reward_amount: Number(template.reward_amount || 0),
          trigger_event: template.trigger_event || "first_visit",
          apply_to_services: template.apply_to_services !== false,
          apply_to_products: !!template.apply_to_products,
          is_active: template.is_active !== false,
        });
        ctx.reload();
        return;
      }

      const referralCopyLinkButton = event.target.closest("[data-referral-copy-link]");
      if (referralCopyLinkButton) {
        const source = (loyaltyState.referrals || []).find((item) => String(item.id) === String(referralCopyLinkButton.dataset.referralCopyLink));
        if (!source?.referral_link) return;
        try {
          await navigator.clipboard.writeText(source.referral_link);
          window.alert(L.copied);
        } catch {
          window.prompt(L.link, source.referral_link);
        }
        return;
      }

      const referralFirstVisitButton = event.target.closest("[data-referral-first-visit]");
      if (referralFirstVisitButton) {
        const value = askString("ID первого визита");
        if (value) {
          await api.markReferralFirstVisit(Number(referralFirstVisitButton.dataset.referralFirstVisit), value);
          ctx.reload();
        }
        return;
      }

      const referralRewardButton = event.target.closest("[data-referral-reward]");
      if (referralRewardButton) {
        await api.accrueReferralReward(Number(referralRewardButton.dataset.referralReward));
        ctx.reload();
        return;
      }

      const referralCancelButton = event.target.closest("[data-referral-cancel]");
      if (referralCancelButton) {
        await api.cancelReferralReward(Number(referralCancelButton.dataset.referralCancel), askString("Причина отмены") || undefined);
        ctx.reload();
        return;
      }

      const promotionApplyButton = event.target.closest("[data-promotion-apply]");
      if (promotionApplyButton) {
        const body = actionBody("Сумма продажи", "Себестоимость");
        if (body) {
          await api.applyPromotion(Number(promotionApplyButton.dataset.promotionApply), body);
          loyaltyState.actionResult = "";
          ctx.reload();
        }
        return;
      }

      const promotionProfitButton = event.target.closest("[data-promotion-profit]");
      if (promotionProfitButton) {
        const body = actionBody("Сумма продажи", "Себестоимость");
        if (body) {
          const result = await api.promotionProfitability(Number(promotionProfitButton.dataset.promotionProfit), {
            original_amount: body.original_amount,
            cost_amount: body.cost_amount,
          });
          loyaltyState.actionResult = `Прибыль: ${money(result.profit_amount)}`;
          ctx.reload();
        }
        return;
      }

      const promotionByCodeButton = event.target.closest("[data-promotion-by-code]");
      if (promotionByCodeButton && loyaltyState.selectedClientId) {
        const body = actionBody("Сумма продажи", "Себестоимость");
        if (body) {
          await api.applyPromotionByCode({
            ...body,
            promo_code: promotionByCodeButton.dataset.promotionByCode,
            client_id: loyaltyState.selectedClientId,
          });
          loyaltyState.actionResult = "";
          ctx.reload();
        }
      }
    } catch (error) {
      window.alert(error.message);
    }
  });
}
