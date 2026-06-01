import Link from "next/link";
import { requireUser } from "@/lib/auth";
import {
  getCategories,
  getTotals,
  getTransactions,
  type TxFilters,
} from "@/lib/queries";
import { formatDate, formatMoney } from "@/lib/format";
import { TransactionModal } from "@/components/transaction-modal";
import { deleteTransactionAction } from "@/lib/actions";

type SearchParams = Promise<{
  type?: string;
  category?: string;
  from?: string;
  to?: string;
  q?: string;
}>;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const filters: TxFilters = {
    type:
      sp.type === "income" || sp.type === "expense" ? sp.type : "all",
    category: sp.category || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    q: sp.q || undefined,
  };

  const [transactions, categories, totals] = await Promise.all([
    getTransactions(user.id, filters),
    getCategories(user.id),
    getTotals(user.id, { from: filters.from, to: filters.to }),
  ]);

  // Build the export link, preserving the active filters.
  const exportQuery = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Transactions</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export${exportQuery ? `?${exportQuery}` : ""}`}
            className="rounded-lg border border-border bg-surface px-4 py-2 font-medium text-foreground transition hover:bg-slate-50"
          >
            Export CSV
          </a>
          <TransactionModal
            categories={categories}
            trigger={
              <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark">
                + Add
              </button>
            }
          />
        </div>
      </header>

      {/* Filters (progressive GET form) */}
      <form
        method="get"
        className="grid grid-cols-2 gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm sm:grid-cols-3 lg:grid-cols-6"
      >
        <select
          name="type"
          defaultValue={sp.type ?? "all"}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="all">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select
          name="category"
          defaultValue={sp.category ?? ""}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={sp.from ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
          aria-label="From date"
        />
        <input
          type="date"
          name="to"
          defaultValue={sp.to ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
          aria-label="To date"
        />
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Search…"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-sm font-medium text-white"
          >
            Filter
          </button>
          <Link
            href="/transactions"
            className="flex items-center rounded-lg px-2 text-sm text-muted hover:text-foreground"
          >
            Reset
          </Link>
        </div>
      </form>

      {/* Filtered totals */}
      <section className="grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Income</p>
          <p className="font-semibold text-income">
            {formatMoney(totals.income, user.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Expense</p>
          <p className="font-semibold text-expense">
            {formatMoney(totals.expense, user.currency)}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-surface p-3">
          <p className="text-xs text-muted">Net</p>
          <p
            className={`font-semibold ${
              totals.balance >= 0 ? "text-income" : "text-expense"
            }`}
          >
            {formatMoney(totals.balance, user.currency)}
          </p>
        </div>
      </section>

      {/* List */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {transactions.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            No transactions match these filters.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-slate-50 text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Note</th>
                <th className="px-4 py-3 text-right">Amount</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50">
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {formatDate(t.occurred_on)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                        t.type === "income"
                          ? "bg-green-50 text-income"
                          : "bg-rose-50 text-expense"
                      }`}
                    >
                      {t.category || "Uncategorized"}
                    </span>
                  </td>
                  <td className="max-w-[14rem] truncate px-4 py-3 text-muted">
                    {t.note || "—"}
                  </td>
                  <td
                    className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${
                      t.type === "income" ? "text-income" : "text-expense"
                    }`}
                  >
                    {t.type === "income" ? "+" : "−"}
                    {formatMoney(t.amount, user.currency)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <TransactionModal
                        categories={categories}
                        transaction={t}
                        trigger={
                          <button className="rounded-md px-2 py-1 text-xs font-medium text-brand hover:bg-brand/10">
                            Edit
                          </button>
                        }
                      />
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="id" value={t.id} />
                        <button
                          type="submit"
                          className="rounded-md px-2 py-1 text-xs font-medium text-expense hover:bg-rose-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
