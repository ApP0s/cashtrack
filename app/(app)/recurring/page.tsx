import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { getCategories, getRecurring, type Recurring } from "@/lib/queries";
import { deleteRecurringAction, toggleRecurringAction } from "@/lib/actions";
import { generateDueRecurring } from "@/lib/recurring";
import { formatDate, formatMoney } from "@/lib/format";
import { RecurringModal } from "@/components/recurring-modal";

// Convert one rule's amount to its average monthly cost.
function monthlyEquivalent(amount: number, freq: Recurring["frequency"]): number {
  switch (freq) {
    case "daily":
      return (amount * 365) / 12;
    case "weekly":
      return (amount * 52) / 12;
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
  }
}

export default async function RecurringPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);
  const tr = (k: string, vars?: Record<string, string | number>) =>
    t(locale, k, vars);

  // Catch up any rules that came due since the last visit.
  await generateDueRecurring(user.id);

  const [rules, categories] = await Promise.all([
    getRecurring(user.id),
    getCategories(user.id),
  ]);

  const freqLabel: Record<string, string> = {
    daily: tr("rec.daily"),
    weekly: tr("rec.weekly"),
    monthly: tr("rec.monthly"),
    yearly: tr("rec.yearly"),
  };

  // Monthly-equivalent totals across active rules only.
  const active = rules.filter((r) => r.active);
  const monthlyIncome = active
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + monthlyEquivalent(r.amount, r.frequency), 0);
  const monthlyExpense = active
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + monthlyEquivalent(r.amount, r.frequency), 0);
  const net = monthlyIncome - monthlyExpense;
  const perDay = (monthlyExpense * 12) / 365;
  const perYear = monthlyExpense * 12;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{tr("rec.title")}</h1>
          <p className="text-sm text-muted">{tr("rec.subtitle")}</p>
        </div>
        <RecurringModal
          categories={categories}
          trigger={
            <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark">
              {tr("rec.new")}
            </button>
          }
        />
      </header>

      {/* Totals summary */}
      {active.length > 0 && (
        <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">{tr("rec.totals.monthlyIncome")}</p>
            <p className="mt-1 text-xl font-bold text-income">
              {formatMoney(monthlyIncome, user.currency)}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">
              {tr("rec.totals.monthlyExpense")}
            </p>
            <p className="mt-1 text-xl font-bold text-expense">
              {formatMoney(monthlyExpense, user.currency)}
            </p>
            <p className="mt-1 text-xs text-muted">
              {tr("rec.totals.perDay", {
                day: formatMoney(perDay, user.currency),
              })}{" "}
              ·{" "}
              {tr("rec.totals.perYear", {
                year: formatMoney(perYear, user.currency),
              })}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-4 shadow-sm">
            <p className="text-xs text-muted">{tr("rec.totals.net")}</p>
            <p
              className={`mt-1 text-xl font-bold ${
                net >= 0 ? "text-income" : "text-expense"
              }`}
            >
              {formatMoney(net, user.currency)}
            </p>
          </div>
        </section>
      )}

      {rules.length === 0 ? (
        <p className="rounded-2xl border border-border bg-surface p-8 text-center text-sm text-muted shadow-sm">
          {tr("rec.none")}
        </p>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <RecurringRow
              key={r.id}
              rule={r}
              currency={user.currency}
              locale={locale}
              categories={categories}
              freqLabel={freqLabel[r.frequency]}
              nextLabel={tr("rec.next")}
              pausedLabel={tr("rec.paused")}
              pauseLabel={tr("rec.pause")}
              resumeLabel={tr("rec.resume")}
              editLabel={tr("common.edit")}
              deleteLabel={tr("common.delete")}
              fallbackLabel={tr("rec.label")}
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
  locale,
  categories,
  freqLabel,
  nextLabel,
  pausedLabel,
  pauseLabel,
  resumeLabel,
  editLabel,
  deleteLabel,
  fallbackLabel,
}: {
  rule: Recurring;
  currency: string;
  locale: "en" | "th";
  categories: Awaited<ReturnType<typeof getCategories>>;
  freqLabel: string;
  nextLabel: string;
  pausedLabel: string;
  pauseLabel: string;
  resumeLabel: string;
  editLabel: string;
  deleteLabel: string;
  fallbackLabel: string;
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
            {rule.category || rule.note || fallbackLabel}
          </span>
          <span className="rounded-full bg-subtle px-2 py-0.5 text-xs text-muted">
            {freqLabel}
          </span>
          {!rule.active && (
            <span className="rounded-full bg-subtle px-2 py-0.5 text-xs">
              {pausedLabel}
            </span>
          )}
        </div>
        <p className="text-xs text-muted">
          {nextLabel}: {formatDate(rule.next_run, locale)}
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
            className="rounded-md px-2 py-1 text-xs font-medium text-muted hover:bg-subtle"
          >
            {rule.active ? pauseLabel : resumeLabel}
          </button>
        </form>
        <RecurringModal
          categories={categories}
          rule={rule}
          trigger={
            <button className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10">
              {editLabel}
            </button>
          }
        />
        <form action={deleteRecurringAction}>
          <input type="hidden" name="id" value={rule.id} />
          <button
            type="submit"
            className="rounded-md px-2 py-1 text-xs font-medium text-expense hover:bg-expense/10"
          >
            {deleteLabel}
          </button>
        </form>
      </div>
    </div>
  );
}
