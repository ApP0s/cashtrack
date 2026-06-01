import { requireUser } from "@/lib/auth";
import { getCategories, getRecurring, type Recurring } from "@/lib/queries";
import {
  deleteRecurringAction,
  toggleRecurringAction,
} from "@/lib/actions";
import { generateDueRecurring } from "@/lib/recurring";
import { formatDate, formatMoney } from "@/lib/format";
import { RecurringModal } from "@/components/recurring-modal";

const FREQ_LABEL: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

export default async function RecurringPage() {
  const user = await requireUser();
  // Catch up any rules that came due since the last visit.
  await generateDueRecurring(user.id);

  const [rules, categories] = await Promise.all([
    getRecurring(user.id),
    getCategories(user.id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Recurring</h1>
          <p className="text-sm text-muted">
            Auto-added on schedule (salary, rent, subscriptions…)
          </p>
        </div>
        <RecurringModal
          categories={categories}
          trigger={
            <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark">
              + New recurring
            </button>
          }
        />
      </header>

      {rules.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted shadow-sm">
          No recurring entries yet. Create one to have it added automatically.
        </p>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <RecurringRow
              key={r.id}
              rule={r}
              currency={user.currency}
              categories={categories}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function RecurringRow({
  rule,
  currency,
  categories,
}: {
  rule: Recurring;
  currency: string;
  categories: Awaited<ReturnType<typeof getCategories>>;
}) {
  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm ${
        rule.active ? "" : "opacity-60"
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {rule.category || rule.note || "Recurring"}
          </span>
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-muted">
            {FREQ_LABEL[rule.frequency]}
          </span>
          {!rule.active && (
            <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs">
              Paused
            </span>
          )}
        </div>
        <p className="text-xs text-muted">
          Next: {formatDate(rule.next_run)}
          {rule.note && rule.category ? ` · ${rule.note}` : ""}
        </p>
      </div>

      <div className="flex items-center gap-3">
        <span
          className={`font-semibold ${
            rule.type === "income" ? "text-income" : "text-expense"
          }`}
        >
          {rule.type === "income" ? "+" : "−"}
          {formatMoney(rule.amount, currency)}
        </span>
        <form action={toggleRecurringAction}>
          <input type="hidden" name="id" value={rule.id} />
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-slate-100"
          >
            {rule.active ? "Pause" : "Resume"}
          </button>
        </form>
        <RecurringModal
          categories={categories}
          rule={rule}
          trigger={
            <button className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10">
              Edit
            </button>
          }
        />
        <form action={deleteRecurringAction}>
          <input type="hidden" name="id" value={rule.id} />
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-xs font-medium text-expense hover:bg-rose-50"
          >
            Delete
          </button>
        </form>
      </div>
    </div>
  );
}
