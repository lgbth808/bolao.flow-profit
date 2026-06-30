export const BRASILIA_TIME_ZONE = "America/Sao_Paulo";

const BRASILIA_UTC_OFFSET = "-03:00";
const LOCAL_DATE_TIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?$/;

type DateInput = Date | string;

function getDatePart(parts: Intl.DateTimeFormatPart[], type: string) {
  return parts.find((part) => part.type === type)?.value ?? "";
}

export function parseBrasiliaDateTimeInput(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return new Date(Number.NaN);
  }

  // datetime-local envia valor sem fuso. No bolão, isso sempre significa horário de Brasília.
  if (LOCAL_DATE_TIME_PATTERN.test(trimmed)) {
    const withSeconds = trimmed.length === 16 ? `${trimmed}:00` : trimmed;

    return new Date(`${withSeconds}${BRASILIA_UTC_OFFSET}`);
  }

  return new Date(trimmed);
}

export function formatBrasiliaDateTime(value: DateInput) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: BRASILIA_TIME_ZONE
  }).format(new Date(value));
}

export function toBrasiliaDateTimeLocal(value: DateInput) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: BRASILIA_TIME_ZONE
  }).formatToParts(date);

  return `${getDatePart(parts, "year")}-${getDatePart(parts, "month")}-${getDatePart(parts, "day")}T${getDatePart(parts, "hour")}:${getDatePart(parts, "minute")}`;
}
