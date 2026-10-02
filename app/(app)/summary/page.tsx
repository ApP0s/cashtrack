import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLocale, getToday } from "@/lib/locale";
import { monthRangeOf } from "@/lib/dates";
import { t } from "@/lib/i18n";
import {
  getBalancesByMethod,
  getClosings,
  getSafeBalances,
  getTotals,
  getYearSummary,
} from "@/lib/queries";
import { formatMoney, formatMonthName, formatYear } from "@/lib/format";
import { ClosePeriodButton, UndoClosingButton } from "@/components/close-period";
import { LocalTime } from "@/components/local-time";

type SearchParams = Promise<{ year?: string }>;

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const [user, locale, sp, today] = await Promise.all([
    requireUser(),
    getLocale(),
    searchParams,
    getToday(),
  ]);
  const tr = (k: string, vars?: Record<string, string | number>) =>
    t(locale, k, vars);
  const money = (n: number) => formatMoney(n, user.currency);

  // "Now" in the user's timezone.
  const [thisYear, thisMonth] = today.split("-").map(Number);
  const parsed = Number.parseInt(sp.year ?? "", 10);
  const year =
    Number.isFinite(parsed) && parsed >= 2000 && parsed <= thisYear
      ? parsed
      : thisYear;

  const { from, to } = monthRangeOf(today);
  const [current, safe, closings, summary, month] = await Promise.all([
    getBalancesByMethod(user.id),
    getSafeBalances(user.id),
    getClosings(user.id),
    getYearSummary(user.id, year),
    getTotals(user.id, { from, to }),
  ]);

  const currentTotal = current.cash + current.online;
  const safeTotal = safe.cash + safe.online;
  const lastClosing = closings[0];

  // From the first month with data up to the current month (or the last
  // month with data for past years), newest first. No leading empty months.
  const withData = summary.months
    .filter((m) => m.income !== 0 || m.expense !== 0)
    .map((m) => m.month);
  const isThisYear = year === thisYear;
  const firstMonth = withData.length
    ? Math.min(...withData)
    : isThisYear
      ? thisMonth
      : 13;
  const lastMonth = isThisYear
    ? Math.max(thisMonth, ...withData)
    : Math.max(0, ...withData);
  const months = summary.months
    .filter((m) => m.month >= firstMonth && m.month <= lastMonth)
    .reverse();

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{tr("sum.title")}</h1>
        <p className="text-sm text-muted">{tr("sum.subtitle")}</p>
      </header>

      {/* Balances: current · safe · all-time */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <BalanceCard
          title={tr("sum.current")}
          total={money(currentTotal)}
          accent="border-l-brand"
          lines={[
            [tr("method.cash"), money(current.cash)],
            [tr("method.online"), money(current.online)],
          ]}
        />
        <BalanceCard
          title={tr("sum.safe")}
          total={money(safeTotal)}
          accent="border-l-amber-500"
          hint={tr("sum.safeHint")}
          lines={[
            [tr("method.cash"), money(safe.cash)],
            [tr("method.online"), money(safe.online)],
          ]}
        />
        <BalanceCard
          title={tr("sum.allTime")}
          total={money(currentTotal + safeTotal)}
          accent="border-l-income"
          hint={tr("sum.allTimeHint")}
          lines={[
            [tr("method.cash"), money(current.cash + safe.cash)],
            [tr("method.online"), money(current.online + safe.online)],
          ]}
        />
      </section>

      {/* Cut-off */}
      <section className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div>
          <h2 className="font-semibold">{tr("close.title")}</h2>
          <p className="mt-1 text-sm text-muted">{tr("close.desc")}</p>
        </div>
        <ClosePeriodButton amountLabel={money(currentTotal)} />
        <p className="text-xs text-muted">
          {lastClosing ? (
            <>
              {tr("close.last").split("{date}")[0]}
              <LocalTime iso={lastClosing.closedAt.toISOString()} />
            </>
          ) : (
            tr("close.never")
          )}
        </p>
      </section>

      {/* This month + selected year */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TotalsCard
          title={tr("sum.thisMonth")}
          income={money(month.income)}
          expense={money(month.expense)}
          net={money(month.balance)}
          positive={month.balance >= 0}
          labels={[tr("tx.income"), tr("tx.expense"), tr("tx.net")]}
        />
        <TotalsCard
          title={tr("sum.year", { year: formatYear(year, locale) })}
          income={money(summary.income)}
          expense={money(summary.expense)}
          net={money(summary.net)}
          positive={summary.net >= 0}
          labels={[tr("tx.income"), tr("tx.expense"), tr("tx.net")]}
        />
      </section>

      {/* Month by month */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="font-semibold">{tr("sum.byMonth")}</h2>
          <nav className="flex items-center gap-1" aria-label={tr("sum.byMonth")}>
            <Link
              href={`/summary?year=${year - 1}`}
              aria-label={tr("sum.prevYear")}
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-foreground"
            >
              <Chevron dir="left" />
            </Link>
            <span className="min-w-16 text-center text-sm font-semibold tabular-nums">
              {formatYear(year, locale)}
            </span>
            {year < thisYear ? (
              <Link
                href={`/summary?year=${year + 1}`}
                aria-label={tr("sum.nextYear")}
                className="flex h-11 w-11 items-center justify-center rounded-lg text-muted transition hover:bg-subtle hover:text-foreground"
              >
                <Chevron dir="right" />
              </Link>
            ) : (
              <span
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center text-muted opacity-30"
              >
                <Chevron dir="right" />
              </span>
            )}
          </nav>
        </div>

        {months.length === 0 && (
          <p className="py-4 text-center text-sm text-muted">
            {tr("sum.noData")}
          </p>
        )}
        <ul className="divide-y divide-border">
          {months.map((m) => {
            const empty = m.income === 0 && m.expense === 0;
            const isNow = year === thisYear && m.month === thisMonth;
            return (
              <li
                key={m.month}
                className={`flex items-center justify-between gap-3 py-3 ${
                  empty ? "opacity-50" : ""
                }`}
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-medium">
                    {formatMonthName(m.month, locale)}
                    {isNow && (
                      <span className="rounded-full bg-brand/10 px-2 py-0.5 text-xs font-medium text-brand">
                        {tr("sum.thisMonth")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    <span className="text-income">+{money(m.income)}</span>
                    {" · "}
                    <span className="text-expense">−{money(m.expense)}</span>
                  </p>
                </div>
                <span
                  className={`shrink-0 font-semibold tabular-nums ${
                    m.net >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {money(m.net)}
                </span>
              </li>
            );
          })}
        </ul>
      </section>

      {/* Cut-off history */}
      <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="mb-2 font-semibold">{tr("close.history")}</h2>
        {closings.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted">
            {tr("close.never")}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {closings.map((c, i) => (
              <li
                key={c.id}
                className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">
                    <LocalTime iso={c.closedAt.toISOString()} />
                  </p>
                  <p className="text-xs tabular-nums text-muted">
                    {tr("method.cash")} {money(c.cash)} · {tr("method.online")}{" "}
                    {money(c.online)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-right">
                    <span className="block text-xs text-muted">
                      {tr("close.moved")}
                    </span>
                    <span className="font-semibold tabular-nums">
                      {money(c.cash + c.online)}
                    </span>
                  </span>
                </div>
                {i === 0 && (
                  <div className="flex w-full justify-end">
                    <UndoClosingButton />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function BalanceCard({
  title,
  total,
  accent,
  hint,
  lines,
}: {
  title: string;
  total: string;
  accent: string;
  hint?: string;
  lines: [string, string][];
}) {
  return (
    <div
      className={`rounded-2xl border border-l-4 border-border bg-surface p-5 shadow-sm ${accent}`}
    >
      <p className="text-sm text-muted">{title}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums [overflow-wrap:anywhere]">
        {total}
      </p>
      <dl className="mt-2 space-y-0.5 text-xs">
        {lines.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-2">
            <dt className="text-muted">{label}</dt>
            <dd className="tabular-nums">{value}</dd>
          </div>
        ))}
      </dl>
      {hint && <p className="mt-2 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function TotalsCard({
  title,
  income,
  expense,
  net,
  positive,
  labels,
}: {
  title: string;
  income: string;
  expense: string;
  net: string;
  positive: boolean;
  labels: [string, string, string];
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="mb-3 font-semibold">{title}</h2>
      <dl className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <dt className="text-muted">{labels[0]}</dt>
          <dd className="font-medium tabular-nums text-income">{income}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-muted">{labels[1]}</dt>
          <dd className="font-medium tabular-nums text-expense">{expense}</dd>
        </div>
        <div className="flex justify-between gap-2 border-t border-border pt-1.5">
          <dt className="font-medium">{labels[2]}</dt>
          <dd
            className={`font-bold tabular-nums ${
              positive ? "text-income" : "text-expense"
            }`}
          >
            {net}
          </dd>
        </div>
      </dl>
    </div>
  );
}

function Chevron({ dir }: { dir: "left" | "right" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d={dir === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6"} />
    </svg>
  );
}
