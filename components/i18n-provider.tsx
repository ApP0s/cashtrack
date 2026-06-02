"use client";

import { createContext, useContext } from "react";
import { t, type Locale } from "@/lib/i18n";

const LocaleContext = createContext<Locale>("en");

export function I18nProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  return (
    <LocaleContext.Provider value={locale}>{children}</LocaleContext.Provider>
  );
}

export function useLocale(): Locale {
  return useContext(LocaleContext);
}

export function useT() {
  const locale = useContext(LocaleContext);
  return (key: string, vars?: Record<string, string | number>) =>
    t(locale, key, vars);
}
