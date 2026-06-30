export function normalizeBrazilianWhatsapp(value: string) {
  const digits = value.replace(/\D/g, "");
  const nationalDigits =
    digits.startsWith("55") && (digits.length === 12 || digits.length === 13)
      ? digits.slice(2)
      : digits;

  if (!/^[1-9][0-9][0-9]{8,9}$/.test(nationalDigits)) {
    throw new Error("Informe um WhatsApp brasileiro valido com DDD.");
  }

  return `55${nationalDigits}`;
}

export function formatBrazilianWhatsapp(normalized: string) {
  const national = normalized.startsWith("55")
    ? normalized.slice(2)
    : normalized.replace(/\D/g, "");
  const ddd = national.slice(0, 2);
  const local = national.slice(2);

  if (local.length === 9) {
    return `(${ddd}) ${local.slice(0, 5)}-${local.slice(5)}`;
  }

  return `(${ddd}) ${local.slice(0, 4)}-${local.slice(4)}`;
}

export function maskBrazilianWhatsapp(normalized: string) {
  const national = normalized.startsWith("55")
    ? normalized.slice(2)
    : normalized.replace(/\D/g, "");
  const ddd = national.slice(0, 2);
  const lastFour = national.slice(-4);

  return `(${ddd}) *****-${lastFour}`;
}
