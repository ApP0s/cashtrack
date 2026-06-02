import type { Locale } from "./i18n";

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

// Map our app locale to a BCP-47 tag for Intl formatting.
// Thai uses th-TH which renders the Buddhist era for dates.
function intlLocale(locale?: Locale): string | undefined {
  if (locale === "th") return "th-TH";
  if (locale === "en") return "en-US";
  return undefined;
}

export function currencySymbol(code: string): string {
  return SYMBOLS[code] ?? code + " ";
}

export function formatMoney(amount: number, currency = "THB"): string {
  return (
    currencySymbol(currency) +
    amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatDate(date: string | Date, locale?: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(intlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatMonth(date: string | Date, locale?: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(intlLocale(locale), {
    year: "numeric",
    month: "long",
  });
}
