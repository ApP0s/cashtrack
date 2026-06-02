import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import {
  getBudgets,
  getCategories,
  getExpenseByCategory,
  getMonthlyTrend,
  getTotals,
  getTransactions,
} from "@/lib/queries";
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

  const [allTime, month, byCategory, trend, recent, categories, budgets] =
    await Promise.all([
      getTotals(user.id),
      getTotals(user.id, { from, to }),
      getExpenseByCategory(user.id, { from, to }),
      getMonthlyTrend(user.id, 6),
      getTransactions(user.id, {}),
      getCategories(user.id),
      getBudgets(user.id),
    ]);

  const recentFew = recent.slice(0, 6);
  const budgetAlerts = budgets.filter((b) => b.spent / b.amount >= 0.8);
  const monthName = formatMonth(new Date(), locale);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tr("dash.title")}</h1>
          <p className="text-sm text-muted">{monthName}</p>
        </div>
        <TransactionModal
          categories={categories}
          trigger={
            <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark">
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
    <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <p className="text-sm text-muted">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${
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
