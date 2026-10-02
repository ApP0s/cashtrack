"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { useT } from "@/components/i18n-provider";
import { applyTheme } from "@/components/preferences";
import { SearchBox } from "@/components/search-box";
import { MOBILE_PRIMARY, NAV, NavIcon } from "@/components/nav-config";

/**
 * Phone navigation (below md): a fixed bottom tab bar for the main pages and
 * a "More" bottom sheet for everything else, plus search, theme and sign-out.
 */
export function MobileNav({ userName }: { userName: string }) {
  const pathname = usePathname();
  const t = useT();
  const [open, setOpen] = useState(false);

  const primary = NAV.filter((i) => MOBILE_PRIMARY.includes(i.href));
  const secondary = NAV.filter((i) => !MOBILE_PRIMARY.includes(i.href));
  const moreActive = secondary.some((i) => i.href === pathname);

  // While the sheet is open: Escape closes it and the page behind can't scroll.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <ul className="grid grid-cols-5">
          {primary.map((item) => {
            const active = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-14 flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight transition-colors ${
                    active ? "font-semibold text-brand" : "text-muted"
                  }`}
                >
                  <NavIcon name={item.icon} className="h-6 w-6" />
                  <span className="max-w-full truncate">{t(item.key)}</span>
                </Link>
              </li>
            );
          })}
          <li>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={open}
              className={`flex min-h-14 w-full flex-col items-center justify-center gap-0.5 px-1 text-[11px] leading-tight transition-colors ${
                moreActive ? "font-semibold text-brand" : "text-muted"
              }`}
            >
              <NavIcon name="more" className="h-6 w-6" />
              <span className="max-w-full truncate">{t("nav.more")}</span>
            </button>
          </li>
        </ul>
      </nav>

      {open && (
        <div
          className="animate-overlay fixed inset-0 z-50 flex items-end bg-black/40 backdrop-blur-sm md:hidden"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("nav.more")}
            className="animate-panel max-h-[85dvh] w-full overflow-y-auto rounded-t-2xl bg-surface px-4 pt-3 pb-[calc(1rem+env(safe-area-inset-bottom))] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border"
              aria-hidden="true"
            />
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="truncate text-sm font-medium text-muted">
                {userName}
              </span>
              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-2xl leading-none text-muted hover:bg-subtle"
              >
                ×
              </button>
            </div>

            <SearchBox onDone={close} />

            <ul className="mt-4 grid grid-cols-3 gap-2">
              {secondary.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={`flex min-h-20 flex-col items-center justify-center gap-1.5 rounded-xl px-2 py-3 text-center text-xs transition-colors ${
                        active
                          ? "bg-brand/10 font-semibold text-brand"
                          : "bg-subtle text-foreground hover:bg-subtle-hover"
                      }`}
                    >
                      <NavIcon name={item.icon} className="h-6 w-6" />
                      {t(item.key)}
                    </Link>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 space-y-3 border-t border-border pt-4">
              <SheetThemeToggle />
              <form action={logoutAction}>
                <button
                  type="submit"
                  className="min-h-11 w-full rounded-lg border border-border font-medium text-expense transition-colors hover:bg-expense/10"
                >
                  {t("common.signOut")}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** Light/dark switch for the sheet; reads the live theme when the sheet opens. */
function SheetThemeToggle() {
  const t = useT();
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );

  const pick = (next: "light" | "dark") => {
    setTheme(next);
    applyTheme(next);
  };

  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-subtle p-1">
      {(["light", "dark"] as const).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => pick(mode)}
          className={`min-h-10 rounded-md text-sm font-semibold transition ${
            theme === mode ? "bg-surface shadow-sm" : "text-muted"
          }`}
        >
          {mode === "light" ? `☀ ${t("set.light")}` : `☾ ${t("set.dark")}`}
        </button>
      ))}
    </div>
  );
}
