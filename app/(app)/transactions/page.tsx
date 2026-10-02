import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t, type Locale } from "@/lib/i18n";
import {
  getCategories,
  getTotals,
  getTransactions,
  type Category,
  type Transaction,
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
  const [user, locale, sp] = await Promise.all([
    requireUser(),
    getLocale(),
    searchParams,
  ]);
  const tr = (k: string) => t(locale, k);

  const filters: TxFilters = {
    type: sp.type === "income" || sp.type === "expense" ? sp.type : "all",
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

  const exportQuery = new URLSearchParams(
    Object.entries(sp).filter(([, v]) => v) as [string, string][],
  ).toString();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{tr("tx.title")}</h1>
        <div className="flex gap-2">
          <a
            href={`/api/export${exportQuery ? `?${exportQuery}` : ""}`}
            className="rounded-lg border border-border bg-surface px-4 py-2 font-medium text-foreground transition hover:bg-subtle"
          >
            {tr("tx.exportCsv")}
          </a>
          <TransactionModal
            categories={categories}
            trigger={
              <button className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark">
                {tr("tx.add")}
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
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="all">{tr("tx.allTypes")}</option>
          <option value="income">{tr("tx.income")}</option>
          <option value="expense">{tr("tx.expense")}</option>
        </select>
        <select
          name="category"
          defaultValue={sp.category ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">{tr("tx.allCategories")}</option>
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
          aria-label={tr("tx.fromDate")}
        />
        <input
          type="date"
          name="to"
          defaultValue={sp.to ?? ""}
          className="rounded-lg border border-border px-3 py-2 text-sm"
          aria-label={tr("tx.toDate")}
        />
        <input
          type="text"
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder={tr("tx.search")}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white"
          >
            {tr("common.filter")}
          </button>
          <Link
            href="/transactions"
            className="flex items-center rounded-lg px-2 text-sm text-muted hover:text-foreground"
          >
            {tr("common.reset")}
          </Link>
        </div>
      </form>

      {/* Filtered totals */}
      <section className="grid grid-cols-3 gap-2 text-center sm:gap-3">
        <div className="min-w-0 rounded-xl border border-border bg-surface px-1.5 py-2.5 sm:p-3">
          <p className="text-xs text-muted">{tr("tx.income")}</p>
          <p className="text-sm font-semibold tabular-nums text-income [overflow-wrap:anywhere] sm:text-base">
            {formatMoney(totals.income, user.currency)}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-surface px-1.5 py-2.5 sm:p-3">
          <p className="text-xs text-muted">{tr("tx.expense")}</p>
          <p className="text-sm font-semibold tabular-nums text-expense [overflow-wrap:anywhere] sm:text-base">
            {formatMoney(totals.expense, user.currency)}
          </p>
        </div>
        <div className="min-w-0 rounded-xl border border-border bg-surface px-1.5 py-2.5 sm:p-3">
          <p className="text-xs text-muted">{tr("tx.net")}</p>
          <p
            className={`text-sm font-semibold tabular-nums [overflow-wrap:anywhere] sm:text-base ${
              totals.balance >= 0 ? "text-income" : "text-expense"
            }`}
          >
            {formatMoney(totals.balance, user.currency)}
          </p>
        </div>
      </section>

      {/* List: cards on phones, a table from md up */}
      <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm">
        {transactions.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">
            {tr("tx.noMatch")}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-border md:hidden">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 space-y-1">
                    <TxChips tx={tx} locale={locale} />
                    {tx.note && (
                      <p className="truncate text-sm text-muted">{tx.note}</p>
                    )}
                    <p className="text-xs text-muted">
                      {formatDate(tx.occurred_on, locale)}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span
                      className={`font-semibold tabular-nums ${
                        tx.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {formatMoney(tx.amount, user.currency)}
                    </span>
                    <TxActions
                      tx={tx}
                      categories={categories}
                      editLabel={tr("common.edit")}
                      deleteLabel={tr("common.delete")}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <table className="hidden w-full text-sm md:table">
              <thead className="border-b border-border bg-subtle text-left text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">{tr("tx.date")}</th>
                  <th className="px-4 py-3">{tr("tx.category")}</th>
                  <th className="px-4 py-3">{tr("tx.note")}</th>
                  <th className="px-4 py-3 text-right">{tr("tx.amount")}</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-subtle-hover">
                    <td className="whitespace-nowrap px-4 py-3 text-muted">
                      {formatDate(tx.occurred_on, locale)}
                    </td>
                    <td className="px-4 py-3">
                      <TxChips tx={tx} locale={locale} />
                    </td>
                    <td className="max-w-[14rem] truncate px-4 py-3 text-muted">
                      {tx.note || "—"}
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-3 text-right font-semibold tabular-nums ${
                        tx.type === "income" ? "text-income" : "text-expense"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "−"}
                      {formatMoney(tx.amount, user.currency)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right">
                      <TxActions
                        tx={tx}
                        categories={categories}
                        editLabel={tr("common.edit")}
                        deleteLabel={tr("common.delete")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}

function TxChips({ tx, locale }: { tx: Transaction; locale: Locale }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
          tx.type === "income"
            ? "bg-income/10 text-income"
            : "bg-expense/10 text-expense"
        }`}
      >
        {tx.category || t(locale, "dash.uncategorized")}
      </span>
      <span className="inline-flex items-center rounded-full bg-subtle px-2 py-0.5 text-xs font-medium text-muted">
        {t(locale, `method.${tx.method}`)}
      </span>
    </span>
  );
}

function TxActions({
  tx,
  categories,
  editLabel,
  deleteLabel,
}: {
  tx: Transaction;
  categories: Category[];
  editLabel: string;
  deleteLabel: string;
}) {
  return (
    <div className="flex justify-end gap-1">
      <TransactionModal
        categories={categories}
        transaction={tx}
        trigger={
          <button className="min-h-9 rounded-md px-3 py-1.5 text-xs font-medium text-brand hover:bg-brand/10">
            {editLabel}
          </button>
        }
      />
      <form action={deleteTransactionAction}>
        <input type="hidden" name="id" value={tx.id} />
        <button
          type="submit"
          className="min-h-9 rounded-md px-3 py-1.5 text-xs font-medium text-expense hover:bg-expense/10"
        >
          {deleteLabel}
        </button>
      </form>
    </div>
  );
}
