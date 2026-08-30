import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { getBalancesByMethod, getDailyBreakdown } from "@/lib/queries";
import { formatMoney, formatDate } from "@/lib/format";
import { DailyLogger } from "@/components/daily-logger";

export default async function DailyPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);
  const tr = (k: string) => t(locale, k);

  const [days, balances] = await Promise.all([
    getDailyBreakdown(user.id, 7),
    getBalancesByMethod(user.id),
  ]);

  const today = days[0] ?? { day: "", got: 0, spent: 0, net: 0 };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{tr("daily.title")}</h1>
        <p className="text-sm text-muted">{tr("daily.subtitle")}</p>
      </header>

      {/* Cash vs online balances */}
      <section className="grid grid-cols-2 gap-4">
        <div className="rounded-2xl border border-l-4 border-border border-l-income bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">{tr("dash.cashOnHand")}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatMoney(balances.cash, user.currency)}
          </p>
        </div>
        <div className="rounded-2xl border border-l-4 border-border border-l-brand bg-surface p-5 shadow-sm">
          <p className="text-sm text-muted">{tr("dash.onlineBalance")}</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {formatMoney(balances.online, user.currency)}
          </p>
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Quick add */}
        <DailyLogger />

        {/* Today + recent days */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-3 font-semibold">{tr("daily.today")}</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-xs text-muted">{tr("daily.got")}</p>
                <p className="font-semibold text-income tabular-nums">
                  {formatMoney(today.got, user.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">{tr("daily.spent")}</p>
                <p className="font-semibold text-expense tabular-nums">
                  {formatMoney(today.spent, user.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">{tr("daily.left")}</p>
                <p
                  className={`font-semibold tabular-nums ${
                    today.net >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {formatMoney(today.net, user.currency)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
            <h2 className="mb-2 font-semibold">{tr("daily.recent")}</h2>
            <ul className="divide-y divide-border">
              {days.map((d) => (
                <li
                  key={d.day}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-muted">{formatDate(d.day, locale)}</span>
                  <span className="flex items-center gap-3 tabular-nums">
                    <span className="text-income">
                      +{formatMoney(d.got, user.currency)}
                    </span>
                    <span className="text-expense">
                      −{formatMoney(d.spent, user.currency)}
                    </span>
                    <span
                      className={`w-24 text-right font-semibold ${
                        d.net >= 0 ? "text-income" : "text-expense"
                      }`}
                    >
                      {formatMoney(d.net, user.currency)}
                    </span>
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
