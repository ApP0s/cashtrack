import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { getBudgets, getCategories, type BudgetProgress } from "@/lib/queries";
import { deleteBudgetAction } from "@/lib/actions";
import { formatMoney, formatMonth } from "@/lib/format";
import { BudgetForm } from "@/components/budget-form";

export default async function BudgetsPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);
  const tr = (k: string) => t(locale, k);
  const [budgets, categories] = await Promise.all([
    getBudgets(user.id),
    getCategories(user.id),
  ]);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const monthName = formatMonth(new Date(), locale);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{tr("bud.title")}</h1>
        <p className="text-sm text-muted">
          {tr("bud.subtitle")} · {monthName}
        </p>
      </header>

      <BudgetForm categories={expenseCategories} />

      {budgets.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted shadow-sm">
          {tr("bud.noBudgets")}
        </p>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <BudgetRow
              key={b.id}
              budget={b}
              currency={user.currency}
              overLabel={tr("bud.over")}
              leftLabel={tr("bud.left")}
              ofLabel={tr("bud.of")}
              removeLabel={tr("common.remove")}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetRow({
  budget,
  currency,
  overLabel,
  leftLabel,
  ofLabel,
  removeLabel,
}: {
  budget: BudgetProgress;
  currency: string;
  overLabel: string;
  leftLabel: string;
  ofLabel: string;
  removeLabel: string;
}) {
  const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - budget.spent;
  const over = remaining < 0;
  const barColor = over ? "#e11d48" : pct >= 80 ? "#f59e0b" : budget.color;

  return (
    <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-medium">
          <span
            className="inline-block h-3 w-3 rounded-full"
            style={{ backgroundColor: budget.color }}
          />
          {budget.category}
        </span>
        <form action={deleteBudgetAction}>
          <input type="hidden" name="id" value={budget.id} />
          <button
            type="submit"
            className="text-xs font-medium text-muted hover:text-expense"
          >
            {removeLabel}
          </button>
        </form>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-subtle">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: barColor }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-muted">
          {formatMoney(budget.spent, currency)} {ofLabel}{" "}
          {formatMoney(budget.amount, currency)}
        </span>
        <span
          className={`font-semibold ${over ? "text-expense" : "text-income"}`}
        >
          {over
            ? `${formatMoney(-remaining, currency)} ${overLabel}`
            : `${formatMoney(remaining, currency)} ${leftLabel}`}
        </span>
      </div>
    </div>
  );
}
