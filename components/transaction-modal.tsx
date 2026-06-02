"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveTransactionAction, type ActionState } from "@/lib/actions";
import type { Category, Transaction } from "@/lib/queries";
import { useT } from "@/components/i18n-provider";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function Save() {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? t("common.saving") : t("common.save")}
    </button>
  );
}

export function TransactionModal({
  categories,
  transaction,
  trigger,
}: {
  categories: Category[];
  transaction?: Transaction;
  trigger: React.ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">(
    transaction?.type ?? "expense",
  );
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveTransactionAction,
    undefined,
  );
  const wasOpen = useRef(false);

  useEffect(() => {
    if (open && state?.ok) setOpen(false);
  }, [state, open]);

  useEffect(() => {
    if (open && !wasOpen.current) setType(transaction?.type ?? "expense");
    wasOpen.current = open;
  }, [open, transaction]);

  const visibleCategories = categories.filter((c) => c.type === type);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-t-2xl bg-surface p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {transaction ? t("txm.edit") : t("txm.add")}
              </h2>
              <button
                onClick={() => setOpen(false)}
                className="text-2xl leading-none text-muted hover:text-foreground"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form action={formAction} className="space-y-4">
              {transaction && (
                <input type="hidden" name="id" value={transaction.id} />
              )}
              <input type="hidden" name="type" value={type} />

              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 rounded-lg bg-subtle p-1">
                <button
                  type="button"
                  onClick={() => setType("expense")}
                  className={`rounded-md py-2 text-sm font-semibold transition ${
                    type === "expense"
                      ? "bg-surface text-expense shadow-sm"
                      : "text-muted"
                  }`}
                >
                  {t("txm.expense")}
                </button>
                <button
                  type="button"
                  onClick={() => setType("income")}
                  className={`rounded-md py-2 text-sm font-semibold transition ${
                    type === "income"
                      ? "bg-surface text-income shadow-sm"
                      : "text-muted"
                  }`}
                >
                  {t("txm.income")}
                </button>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("txm.amount")}
                </label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={transaction?.amount ?? ""}
                  className="w-full rounded-lg border border-border px-3 py-2 text-lg font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("txm.category")}
                </label>
                <select
                  name="category"
                  defaultValue={transaction?.category ?? ""}
                  className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  key={type}
                >
                  <option value="">{t("common.none")}</option>
                  {visibleCategories.map((c) => (
                    <option key={c.id} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("txm.date")}
                </label>
                <input
                  name="occurred_on"
                  type="date"
                  required
                  defaultValue={transaction?.occurred_on ?? todayISO()}
                  className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("txm.note")}
                </label>
                <input
                  name="note"
                  type="text"
                  defaultValue={transaction?.note ?? ""}
                  className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder={t("txm.optionalDesc")}
                />
              </div>

              {state?.error && (
                <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
                  {state.error}
                </p>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-4 py-2 font-medium text-muted hover:bg-subtle"
                >
                  {t("common.cancel")}
                </button>
                <Save />
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
