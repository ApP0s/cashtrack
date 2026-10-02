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

// A plain "YYYY-MM-DD" is a calendar date, parsed as UTC midnight — format it
// in UTC too so it never shifts a day depending on where the code runs.
function calendarZone(date: string | Date): { timeZone?: string } {
  return typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)
    ? { timeZone: "UTC" }
    : {};
}

export function formatDate(date: string | Date, locale?: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(intlLocale(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    ...calendarZone(date),
  });
}

export function formatMonth(date: string | Date, locale?: Locale): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(intlLocale(locale), {
    year: "numeric",
    month: "long",
    ...calendarZone(date),
  });
}

/** Month name only, e.g. "October" / "ตุลาคม". `month` is 1-12. */
export function formatMonthName(month: number, locale?: Locale): string {
  return new Date(2000, month - 1, 1).toLocaleDateString(intlLocale(locale), {
    month: "long",
  });
}

/** A year label in the locale's era — Thai renders the Buddhist year (2569). */
export function formatYear(year: number, locale?: Locale): string {
  return new Date(year, 0, 1).toLocaleDateString(intlLocale(locale), {
    year: "numeric",
  });
}
