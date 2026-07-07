import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import {
  getBudgets,
  getCategories,
  getExpenseByCategory,
  getMonthlyTrend,
  getRecurring,
  getTotals,
  getTransactions,
} from "@/lib/queries";
import { recurringSummary } from "@/lib/recurring-summary";
import { formatMoney, formatDate, formatMonth } from "@/lib/format";
import { ExpensePie, MonthlyBars } from "@/components/charts";
import { TransactionModal } from "@/components/transaction-modal";

function monthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(first), to: iso(last) };
}

export default async function DashboardPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);
  const tr = (k: string, vars?: Record<string, string | number>) =>
    t(locale, k, vars);
  // Recurring entries are materialized by a daily cron (see app/api/cron/recurring).

  const { from, to } = monthRange();

  const [
    allTime,
    month,
    byCategory,
    trend,
    recent,
    categories,
    budgets,
    recurring,
  ] = await Promise.all([
    getTotals(user.id),
    getTotals(user.id, { from, to }),
    getExpenseByCategory(user.id, { from, to }),
    getMonthlyTrend(user.id, 6),
    getTransactions(user.id, {}),
    getCategories(user.id),
    getBudgets(user.id),
    getRecurring(user.id),
  ]);

  const recentFew = recent.slice(0, 6);
  const budgetAlerts = budgets.filter((b) => b.spent / b.amount >= 0.8);
  const monthName = formatMonth(new Date(), locale);

  // Recurring summary + the next few upcoming entries.
  const recSummary = recurringSummary(recurring);
  const freqLabel: Record<string, string> = {
    daily: tr("rec.daily"),
    weekly: tr("rec.weekly"),
    monthly: tr("rec.monthly"),
    yearly: tr("rec.yearly"),
  };
  const upcoming = recurring
    .filter((r) => r.active)
    .sort((a, b) => a.next_run.localeCompare(b.next_run))
    .slice(0, 5);

  const firstName = user.name?.split(" ")[0] || user.email.split("@")[0];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-brand-subtle p-5">
        <div>
          <h1 className="text-2xl font-bold">
            {tr("dash.greeting", { name: firstName })}
          </h1>
          <p className="text-sm text-muted">{tr("dash.subtitle", { month: monthName })}</p>
        </div>
        <TransactionModal
          categories={categories}
          trigger={
            <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98]">
              {tr("dash.addTransaction")}
            </button>
          }
        />
      </header>

      {/* Summary cards */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label={tr("dash.currentBalance")}
          value={formatMoney(allTime.balance, user.currency)}
          tone={allTime.balance >= 0 ? "income" : "expense"}
          hint={tr("dash.allTime")}
        />
        <StatCard
          label={tr("dash.incomeThisMonth")}
          value={formatMoney(month.income, user.currency)}
          tone="income"
        />
        <StatCard
          label={tr("dash.expenseThisMonth")}
          value={formatMoney(month.expense, user.currency)}
          tone="expense"
        />
      </section>

      {/* Budget alerts */}
      {budgetAlerts.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-amber-700 dark:text-amber-300">
              {tr("dash.budgetAlerts")}
            </h2>
            <Link href="/budgets" className="text-sm font-medium text-brand">
              {tr("dash.manage")}
            </Link>
          </div>
          <ul className="space-y-1 text-sm">
            {budgetAlerts.map((b) => {
              const over = b.spent > b.amount;
              return (
                <li key={b.id} className="flex justify-between">
                  <span className="text-amber-800 dark:text-amber-200">
                    {b.category}
                  </span>
                  <span
                    className={
                      over
                        ? "font-semibold text-expense"
                        : "text-amber-700 dark:text-amber-300"
                    }
                  >
                    {formatMoney(b.spent, user.currency)} /{" "}
                    {formatMoney(b.amount, user.currency)}
                    {over ? tr("dash.overBudget") : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Charts */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card title={tr("dash.spendingByCategory")} subtitle={monthName}>
          <ExpensePie data={byCategory} currency={user.currency} />
        </Card>
        <Card title={tr("dash.incomeVsExpense")} subtitle={tr("dash.last6Months")}>
          <MonthlyBars data={trend} currency={user.currency} />
        </Card>
      </section>

      {/* Recurring detail */}
      <Card
        title={tr("dash.recurring")}
        action={
          <Link href="/recurring" className="text-sm font-medium text-brand">
            {tr("dash.manage")}
          </Link>
        }
      >
        {recurring.filter((r) => r.active).length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            {tr("dash.noRecurring")}
          </p>
        ) : (
          <div className="space-y-4">
            {/* Monthly-equivalent totals */}
            <div className="grid grid-cols-3 gap-3 rounded-xl bg-subtle p-3 text-center">
              <div>
                <p className="text-xs text-muted">
                  {tr("rec.totals.monthlyIncome")}
                </p>
                <p className="font-semibold text-income">
                  {formatMoney(recSummary.monthlyIncome, user.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">
                  {tr("rec.totals.monthlyExpense")}
                </p>
                <p className="font-semibold text-expense">
                  {formatMoney(recSummary.monthlyExpense, user.currency)}
                </p>
                <p className="text-[11px] text-muted">
                  {tr("rec.totals.perDay", {
                    day: formatMoney(recSummary.perDay, user.currency),
                  })}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted">{tr("rec.totals.net")}</p>
                <p
                  className={`font-semibold ${
                    recSummary.net >= 0 ? "text-income" : "text-expense"
                  }`}
                >
                  {formatMoney(recSummary.net, user.currency)}
                </p>
              </div>
            </div>

            {/* Upcoming entries */}
            <div>
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted">
                {tr("dash.upcoming")}
              </p>
              <ul className="divide-y divide-border">
                {upcoming.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 font-medium">
                        <span className="truncate">
                          {r.category || r.note || tr("rec.label")}
                        </span>
                        <span className="shrink-0 rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">
                          {freqLabel[r.frequency]}
                        </span>
                      </p>
                      <p className="text-xs text-muted">
                        {tr("rec.next")}: {formatDate(r.next_run, locale)}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-semibold ${
                        r.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {r.type === "income" ? "+" : "−"}
                      {formatMoney(r.amount, user.currency)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </Card>

      {/* Recent transactions */}
      <Card
        title={tr("dash.recentTransactions")}
        action={
          <Link href="/transactions" className="text-sm font-medium text-brand">
            {tr("dash.viewAll")}
          </Link>
        }
      >
        {recentFew.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">{tr("dash.noTx")}</p>
        ) : (
          <ul className="divide-y divide-border">
            {recentFew.map((tx) => (
              <li key={tx.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="font-medium">
                    {tx.category ||
                      (tx.note ? tx.note : tr("dash.uncategorized"))}
                  </p>
                  <p className="text-xs text-muted">
                    {formatDate(tx.occurred_on, locale)}
                  </p>
                </div>
                <span
                  className={`font-semibold ${
                    tx.type === "income" ? "text-income" : "text-expense"
                  }`}
                >
                  {tx.type === "income" ? "+" : "−"}
                  {formatMoney(tx.amount, user.currency)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  hint,
}: {
  label: string;
  value: string;
  tone: "income" | "expense";
  hint?: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-l-4 border-border bg-surface p-5 shadow-sm ${
        tone === "income" ? "border-l-income" : "border-l-expense"
      }`}
    >
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold tabular-nums ${
          tone === "income" ? "text-income" : "text-expense"
        }`}
      >
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

function Card({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="font-semibold">{title}</h2>
          {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
