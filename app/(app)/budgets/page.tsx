import { requireUser } from "@/lib/auth";
import { getBudgets, getCategories, type BudgetProgress } from "@/lib/queries";
import { deleteBudgetAction } from "@/lib/actions";
import { formatMoney } from "@/lib/format";
import { BudgetForm } from "@/components/budget-form";

export default async function BudgetsPage() {
  const user = await requireUser();
  const [budgets, categories] = await Promise.all([
    getBudgets(user.id),
    getCategories(user.id),
  ]);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const monthName = new Date().toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Budgets</h1>
        <p className="text-sm text-muted">
          Monthly spending limits per category · {monthName}
        </p>
      </header>

      <BudgetForm categories={expenseCategories} />

      {budgets.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted shadow-sm">
          No budgets yet. Set a monthly limit for a category above.
        </p>
      ) : (
        <div className="space-y-3">
          {budgets.map((b) => (
            <BudgetRow key={b.id} budget={b} currency={user.currency} />
          ))}
        </div>
      )}
    </div>
  );
}

function BudgetRow({
  budget,
  currency,
}: {
  budget: BudgetProgress;
  currency: string;
}) {
  const pct = budget.amount > 0 ? (budget.spent / budget.amount) * 100 : 0;
  const remaining = budget.amount - budget.spent;
  const over = remaining < 0;
  const barColor = over
    ? "#e11d48"
    : pct >= 80
      ? "#f59e0b"
      : budget.color;

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
            Remove
          </button>
        </form>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${Math.min(pct, 100)}%`,
            backgroundColor: barColor,
          }}
        />
      </div>

      <div className="mt-2 flex items-center justify-between text-sm">
        <span className="text-muted">
          {formatMoney(budget.spent, currency)} of{" "}
          {formatMoney(budget.amount, currency)}
        </span>
        <span
          className={`font-semibold ${over ? "text-expense" : "text-income"}`}
        >
          {over
            ? `${formatMoney(-remaining, currency)} over`
            : `${formatMoney(remaining, currency)} left`}
        </span>
      </div>
    </div>
  );
}
