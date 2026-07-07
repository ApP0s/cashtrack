"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { useT } from "@/components/i18n-provider";
import { ThemeSwitchMini } from "@/components/preferences";

type IconName =
  | "dashboard"
  | "transactions"
  | "budgets"
  | "recurring"
  | "loan"
  | "categories"
  | "settings";

const NAV: { href: string; key: string; icon: IconName }[] = [
  { href: "/dashboard", key: "nav.dashboard", icon: "dashboard" },
  { href: "/transactions", key: "nav.transactions", icon: "transactions" },
  { href: "/budgets", key: "nav.budgets", icon: "budgets" },
  { href: "/recurring", key: "nav.recurring", icon: "recurring" },
  { href: "/loan", key: "nav.loan", icon: "loan" },
  { href: "/categories", key: "nav.categories", icon: "categories" },
  { href: "/settings", key: "nav.settings", icon: "settings" },
];

// Consistent single-line (Lucide) icon set — 24px viewBox, 1.5 stroke.
const ICON_PATHS: Record<IconName, React.ReactNode> = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </>
  ),
  transactions: (
    <>
      <path d="m16 3 4 4-4 4" />
      <path d="M20 7H4" />
      <path d="m8 21-4-4 4-4" />
      <path d="M4 17h16" />
    </>
  ),
  budgets: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="1.5" />
    </>
  ),
  recurring: (
    <>
      <path d="m17 2 4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
      <path d="m7 22-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </>
  ),
  loan: (
    <>
      <path d="M22 10 12 5 2 10l10 5 10-5Z" />
      <path d="M6 12v5c0 1 2 3 6 3s6-2 6-3v-5" />
    </>
  ),
  categories: (
    <>
      <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
      <circle cx="7.5" cy="7.5" r="1" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
};

function NavIcon({ name }: { name: IconName }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5 shrink-0"
      aria-hidden="true"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

export function Sidebar({
  userName,
  theme,
}: {
  userName: string;
  theme: "light" | "dark";
}) {
  const pathname = usePathname();
  const t = useT();

  return (
    <aside className="sticky top-0 z-30 flex max-h-dvh w-full shrink-0 flex-col border-b border-border bg-surface md:h-dvh md:w-64 md:self-start md:border-b-0 md:border-r">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white shadow-sm">
          ฿
        </div>
        <span className="text-lg font-bold tracking-tight">CashTrack</span>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-x-visible md:overflow-y-auto">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`group relative flex items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active
                  ? "bg-brand/10 font-semibold text-brand"
                  : "font-medium text-muted hover:bg-subtle hover:text-foreground"
              }`}
            >
              {/* Active accent indicator (desktop) */}
              <span
                className={`absolute left-0 top-1/2 hidden h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand transition-opacity md:block ${
                  active ? "opacity-100" : "opacity-0"
                }`}
                aria-hidden="true"
              />
              <NavIcon name={item.icon} />
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="hidden items-center justify-between gap-2 border-t border-border px-4 py-3 md:flex">
        <span className="truncate text-sm font-medium text-muted" title={userName}>
          {userName}
        </span>
        <div className="flex items-center gap-1">
          <ThemeSwitchMini initial={theme} />
          <form action={logoutAction}>
            <button
              type="submit"
              aria-label={t("common.signOut")}
              className="rounded-md px-2 py-1 text-sm font-medium text-expense transition-colors hover:bg-expense/10"
            >
              {t("common.signOut")}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
