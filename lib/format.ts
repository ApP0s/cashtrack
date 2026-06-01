const SYMBOLS: Record<string, string> = {
  THB: "฿",
  USD: "$",
  EUR: "€",
  GBP: "£",
  JPY: "¥",
  CNY: "¥",
  AUD: "A$",
  SGD: "S$",
};

export const CURRENCIES = Object.keys(SYMBOLS);

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? code + " ";
}

export function formatMoney(amount: number, currency = "THB"): string {
  return (
    currencySymbol(currency) +
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
