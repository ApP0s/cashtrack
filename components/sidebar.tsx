"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutAction } from "@/lib/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/transactions", label: "Transactions", icon: "⇅" },
  { href: "/categories", label: "Categories", icon: "🏷" },
  { href: "/settings", label: "Settings", icon: "⚙" },
];

export function Sidebar({ userName }: { userName: string }) {
  const pathname = usePathname();

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
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                active
                  ? "bg-brand/10 text-brand"
                  : "text-muted hover:bg-slate-100 hover:text-foreground"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden items-center justify-between border-t border-border px-4 py-3 md:flex">
        <span className="truncate text-sm text-muted" title={userName}>
          {userName}
        </span>
        <form action={logoutAction}>
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-sm font-medium text-expense hover:bg-rose-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </aside>
  );
}
