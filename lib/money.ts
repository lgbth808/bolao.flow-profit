export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value);
}

export function normalizeCurrencyInput(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return "0";
  }

  const asText = String(value).trim().replace(/\./g, "").replace(",", ".");
  const amount = Number(asText);

  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Valor pago deve ser um número positivo.");
  }

  return amount.toFixed(2);
}
