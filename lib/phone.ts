export const DEFAULT_WHATSAPP_PREFIX = "+55 ";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

function nationalBrazilianDigits(digits: string) {
  return digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
    ? digits.slice(2)
    : digits;
}

function isBrazilianNationalNumber(digits: string) {
  return /^[1-9][0-9][0-9]{8,9}$/.test(digits);
}

function formatBrazilianNational(value: string) {
  const national = value.slice(0, 11);
  const ddd = national.slice(0, 2);
  const local = national.slice(2);

  if (!national) {
    return "";
  }

  if (national.length <= 2) {
    return `(${ddd}`;
  }

  if (local.length <= 4) {
    return `(${ddd}) ${local}`;
  }

  if (local.length <= 8) {
    return `(${ddd}) ${local.slice(0, 4)}-${local.slice(4)}`;
  }

  return `(${ddd}) ${local.slice(0, 5)}-${local.slice(5, 9)}`;
}

export function normalizeBrazilianWhatsapp(value: string) {
  const trimmed = value.trim();
  const digits = digitsOnly(value);
  const nationalDigits = nationalBrazilianDigits(digits);

  if (isBrazilianNationalNumber(nationalDigits)) {
    return `55${nationalDigits}`;
  }

  if (trimmed.startsWith("+") && /^[1-9]\d{7,14}$/.test(digits)) {
    return `+${digits}`;
  }

  throw new Error(
    "Informe um WhatsApp com DDI, como +55 (91) 98258-5313."
  );
}

export function formatBrazilianWhatsapp(normalized: string) {
  const digits = digitsOnly(normalized);
  const national = nationalBrazilianDigits(digits);

  if (isBrazilianNationalNumber(national)) {
    return `+55 ${formatBrazilianNational(national)}`;
  }

  return digits ? `+${digits}` : "";
}

export function maskBrazilianWhatsapp(normalized: string) {
  const digits = digitsOnly(normalized);
  const national = nationalBrazilianDigits(digits);

  if (isBrazilianNationalNumber(national)) {
    const ddd = national.slice(0, 2);
    const lastFour = national.slice(-4);

    return `+55 (${ddd}) *****-${lastFour}`;
  }

  const visiblePrefix = digits.slice(0, Math.min(3, Math.max(1, digits.length - 4)));
  const lastFour = digits.slice(-4);

  return digits ? `+${visiblePrefix} *****-${lastFour}` : "";
}

export function formatWhatsappInput(value: string) {
  const trimmed = value.trimStart();

  if (!trimmed) {
    return "";
  }

  const digits = digitsOnly(value);

  if (trimmed.startsWith("+")) {
    if (digits.startsWith("55")) {
      return `${DEFAULT_WHATSAPP_PREFIX}${formatBrazilianNational(
        digits.slice(2, 13)
      )}`.trimEnd();
    }

    return `+${digits.slice(0, 15)}`;
  }

  if (digits.startsWith("55")) {
    return `${DEFAULT_WHATSAPP_PREFIX}${formatBrazilianNational(
      digits.slice(2, 13)
    )}`.trimEnd();
  }

  return `${DEFAULT_WHATSAPP_PREFIX}${formatBrazilianNational(digits)}`.trimEnd();
}
