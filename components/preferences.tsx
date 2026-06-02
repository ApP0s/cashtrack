"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n-provider";
import type { Locale } from "@/lib/i18n";

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
}

export function ThemeToggle({ initial }: { initial: "light" | "dark" }) {
  const t = useT();
  const [theme, setTheme] = useState<"light" | "dark">(initial);

  function set(next: "light" | "dark") {
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    writeCookie("theme", next);
  }

  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-subtle p-1">
      <button
        type="button"
        onClick={() => set("light")}
        className={`rounded-md py-2 text-sm font-semibold transition ${
          theme === "light" ? "bg-surface shadow-sm" : "text-muted"
        }`}
      >
        ☀ {t("set.light")}
      </button>
      <button
        type="button"
        onClick={() => set("dark")}
        className={`rounded-md py-2 text-sm font-semibold transition ${
          theme === "dark" ? "bg-surface shadow-sm" : "text-muted"
        }`}
      >
        ☾ {t("set.dark")}
      </button>
    </div>
  );
}

export function LanguageToggle({ initial }: { initial: Locale }) {
  const t = useT();
  const router = useRouter();
  const [lang, setLang] = useState<Locale>(initial);

  function pick(next: Locale) {
    if (next === lang) return;
    setLang(next);
    writeCookie("lang", next);
    // Re-render server components so translated strings update.
    router.refresh();
  }

  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-subtle p-1">
      <button
        type="button"
        onClick={() => pick("en")}
        className={`rounded-md py-2 text-sm font-semibold transition ${
          lang === "en" ? "bg-surface shadow-sm" : "text-muted"
        }`}
      >
        {t("set.english")}
      </button>
      <button
        type="button"
        onClick={() => pick("th")}
        className={`rounded-md py-2 text-sm font-semibold transition ${
          lang === "th" ? "bg-surface shadow-sm" : "text-muted"
        }`}
      >
        {t("set.thai")}
      </button>
    </div>
  );
}

/** Compact icon-only theme switch for the sidebar footer. */
export function ThemeSwitchMini({ initial }: { initial: "light" | "dark" }) {
  const [theme, setTheme] = useState<"light" | "dark">(initial);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    writeCookie("theme", next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label="Toggle theme"
      className="rounded-md px-2 py-1 text-sm text-muted transition hover:bg-subtle"
    >
      {theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
