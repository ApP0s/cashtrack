"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";
import { useT } from "@/components/i18n-provider";
import { ThemeSwitchMini } from "@/components/preferences";
import { SearchBox } from "@/components/search-box";
import { NAV, NavIcon } from "@/components/nav-config";

/** Desktop sidebar (md and up). Phones use <MobileNav />. */
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
    <aside className="hidden border-border bg-surface md:sticky md:top-0 md:flex md:h-dvh md:w-64 md:shrink-0 md:flex-col md:self-start md:border-r">
      <div className="flex items-center gap-2.5 border-b border-border px-5 py-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-lg font-bold text-white shadow-sm">
          ฿
        </div>
        <span className="text-lg font-bold tracking-tight">CashTrack</span>
      </div>

      {/* Global search */}
      <div className="px-3 pt-3">
        <SearchBox />
      </div>

      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
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
              {/* Active accent indicator */}
              <span
                className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand transition-opacity ${
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

      <div className="flex items-center justify-between gap-2 border-t border-border px-4 py-3">
        <span className="truncate text-sm font-medium text-muted" title={userName}>
          {userName}
        </span>
        <div className="flex items-center gap-1">
          <ThemeSwitchMini initial={theme} />
          <form action={logoutAction}>
            <button
              type="submit"
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
