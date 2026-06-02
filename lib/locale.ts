import "server-only";
import { cookies } from "next/headers";
import { isLocale, DEFAULT_LOCALE, type Locale } from "./i18n";

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("lang")?.value;
  return isLocale(v) ? v : DEFAULT_LOCALE;
}

export type Theme = "light" | "dark";

export async function getTheme(): Promise<Theme> {
  return (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";
}
