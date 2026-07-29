const DEFAULT_TIMEZONE = "Europe/Moscow";

function safeTimezone(value) {
  const timezone = String(value || DEFAULT_TIMEZONE);
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: timezone }).format();
    return timezone;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function timezoneParts(value, timezone) {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimezone(timezone), year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  return Object.fromEntries(formatter.formatToParts(value)
    .filter((item) => item.type !== "literal")
    .map((item) => [item.type, item.value]));
}

function timezoneOffsetMs(value, timezone) {
  const parts = timezoneParts(value, timezone);
  const wallClockAsUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute), Number(parts.second));
  return wallClockAsUtc - Math.floor(value.getTime() / 1000) * 1000;
}

export function branchDateTimeToUtc(value, timezone) {
  const source = String(value || "").trim();
  if (!source) return source;
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(source)) {
    const awareDate = new Date(source);
    return Number.isNaN(awareDate.getTime()) ? source : awareDate.toISOString();
  }
  const match = source.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return source;
  const wallClockUtc = Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6] || 0));
  let result = wallClockUtc;
  for (let attempt = 0; attempt < 2; attempt += 1) result = wallClockUtc - timezoneOffsetMs(new Date(result), timezone);
  return new Date(result).toISOString();
}

export function dateTimeInputInTimezone(value, timezone) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const parts = timezoneParts(date, timezone);
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

export function formatDateTimeInTimezone(value, timezone) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: safeTimezone(timezone), day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
  }).format(date);
}

export function clockInTimezone(value, timezone) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = timezoneParts(date, timezone);
  return `${parts.hour}:${parts.minute}`;
}

export function minutesOfDayInTimezone(value, timezone) {
  if (!value) return 0;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 0;
  const parts = timezoneParts(date, timezone);
  return Number(parts.hour) * 60 + Number(parts.minute);
}
