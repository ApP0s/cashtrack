import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLocale, getToday } from "@/lib/locale";
import { t } from "@/lib/i18n";
import {
  getBalancesByMethod,
  getDailyBreakdown,
  getLastClosedAt,
} from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/format";
import { DailyLogger } from "@/components/daily-logger";
import { LocalTime } from "@/components/local-time";

export default async function DailyPage() {
  const [user, locale, today] = await Promise.all([
    requireUser(),
    getLocale(),
    getToday(),
  ]);
  const tr = (k: string) => t(locale, k);

  const [days, balances, lastClosedAt] = await Promise.all([
    getDailyBreakdown(user.id, today, 7),
    getBalancesByMethod(user.id),
    getLastClosedAt(user.id),
  ]);

  const todayTotals = days[0] ?? { day: today, got: 0, spent: 0, net: 0 };
  const money = (n: number) => formatMoney(n, user.currency);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{tr("daily.title")}</h1>
        <p className="text-sm text-muted">{tr("daily.subtitle")}</p>
      </header>

      {/* Cash vs online balances (since the last cut-off) */}
      <section className="space-y-2">
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="min-w-0 rounded-2xl border border-l-4 border-border border-l-income bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-sm text-muted">{tr("dash.cashOnHand")}</p>
            <p className="mt-1 text-xl font-bold tabular-nums [overflow-wrap:anywhere] sm:text-2xl">
              {money(balances.cash)}
            </p>
          </div>
          <div className="min-w-0 rounded-2xl border border-l-4 border-border border-l-brand bg-surface p-4 shadow-sm sm:p-5">
            <p className="text-sm text-muted">{tr("dash.onlineBalance")}</p>
            <p className="mt-1 text-xl font-bold tabular-nums [overflow-wrap:anywhere] sm:text-2xl">
              {money(balances.online)}
            </p>
          </div>
        </div>
        {lastClosedAt && (
          <p className="text-xs text-muted">
            {tr("dash.sinceCutoff").split("{date}")[0]}
            <LocalTime iso={lastClosedAt.toISOString()} mode="date" />
            {" · "}
            <Link href="/summary" className="font-medium text-brand">
              {tr("nav.summary")}
            </Link>
          </p>
        )}
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Quick add */}
        <DailyLogger />

        {/* Today + recent days */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 font-semibold">{tr("daily.today")}</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="min-w-0">
                <p className="text-xs text-muted">{tr("daily.got")}</p>
                <p className="text-sm font-semibold tabular-nums text-income [overflow-wrap:anywhere] sm:text-base">
                  {money(todayTotals.got)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted">{tr("daily.spent")}</p>
                <p className="text-sm font-semibold tabular-nums text-expense [overflow-wrap:anywhere] sm:text-base">
                  {money(todayTotals.spent)}
                </p>
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted">{tr("daily.left")}</p>
                <p
                  className={`text-sm font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-base ${
                    todayTotals.net >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {money(todayTotals.net)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm sm:p-5">
            <h2 className="mb-1 font-semibold">{tr("daily.recent")}</h2>
            <ul className="divide-y divide-border">
              {days.map((d) => (
                <li
                  key={d.day}
                  className="flex items-center justify-between gap-3 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="text-sm">{formatDate(d.day, locale)}</p>
                    <p className="text-xs tabular-nums text-muted">
                      <span className="text-income">+{money(d.got)}</span>
                      {" · "}
                      <span className="text-expense">−{money(d.spent)}</span>
                    </p>
                  </div>
                  <span
                    className={`shrink-0 font-semibold tabular-nums ${
                      d.net >= 0 ? "text-income" : "text-expense"
                    }`}
                  >
                    {money(d.net)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
