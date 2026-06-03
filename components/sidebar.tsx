"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { useT } from "@/components/i18n-provider";
import { ThemeSwitchMini } from "@/components/preferences";

const NAV = [
  { href: "/dashboard", key: "nav.dashboard", icon: "▦" },
  { href: "/transactions", key: "nav.transactions", icon: "⇅" },
  { href: "/budgets", key: "nav.budgets", icon: "◴" },
  { href: "/recurring", key: "nav.recurring", icon: "↻" },
  { href: "/loan", key: "nav.loan", icon: "🎓" },
  { href: "/categories", key: "nav.categories", icon: "🏷" },
  { href: "/settings", key: "nav.settings", icon: "⚙" },
];

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
    <aside className="flex w-full shrink-0 flex-col border-border bg-surface md:h-screen md:w-64 md:border-r">
      <div className="flex items-center gap-2 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand font-bold text-white">
          ฿
        </div>
        <span className="text-lg font-bold">CashTrack</span>
      </div>

      <nav className="flex gap-1 overflow-x-auto p-3 md:flex-1 md:flex-col md:overflow-visible">
        {NAV.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted hover:bg-subtle hover:text-foreground"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {t(item.key)}
            </Link>
          );
        })}
      </nav>

      <div className="hidden items-center justify-between border-t border-border px-4 py-3 md:flex">
        <span className="truncate text-sm text-muted" title={userName}>
          {userName}
        </span>
        <div className="flex items-center gap-1">
          <ThemeSwitchMini initial={theme} />
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-sm font-medium text-expense hover:bg-expense/10"
            >
              {t("common.signOut")}
            </button>
          </form>
        </div>
      </div>
    </aside>
  );
}
