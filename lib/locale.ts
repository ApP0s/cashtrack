import "server-only";
import { cookies } from "next/headers";
import { isLocale, DEFAULT_LOCALE, type Locale } from "./i18n";
import { todayIn } from "./dates";

// Most users are in Thailand; the browser corrects this via the `tz` cookie
// (see components/timezone-sync.tsx).
const DEFAULT_TIME_ZONE = "Asia/Bangkok";

export async function getTimeZone(): Promise<string> {
  const raw = (await cookies()).get("tz")?.value;
  if (raw) {
    const tz = decodeURIComponent(raw);
    try {
      new Intl.DateTimeFormat("en-US", { timeZone: tz });
      return tz;
    } catch {
      // Unknown zone name — fall back to the default.
    }
  }
  return DEFAULT_TIME_ZONE;
}

/** Today's date (YYYY-MM-DD) in the user's timezone. */
export async function getToday(): Promise<string> {
  return todayIn(await getTimeZone());
}

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("lang")?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export type Theme = "light" | "dark";

export async function getTheme(): Promise<Theme> {
  return (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";
}
