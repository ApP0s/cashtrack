"use client";

import { useEffect, useRef, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveRecurringAction, type ActionState } from "@/lib/actions";
import type { Category, Recurring } from "@/lib/queries";
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
      className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? t("common.saving") : t("common.save")}
    </button>
  );
}

export function RecurringModal({
  categories,
  rule,
  trigger,
}: {
  categories: Category[];
  rule?: Recurring;
  trigger: React.ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"income" | "expense">(
    rule?.type ?? "expense",
  );
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveRecurringAction,
    undefined,
  );
  const wasOpen = useRef(false);
  // Track which action result we've already acted on. useActionState keeps the
  // last result around, so without this a stale `ok` would immediately re-close
  // the modal the next time it's opened. A new submit yields a new object.
  const handledState = useRef<ActionState>(undefined);

  useEffect(() => {
    if (open && state?.ok && state !== handledState.current) {
      handledState.current = state;
      setOpen(false);
    }
  }, [state, open]);

  useEffect(() => {
    if (open && !wasOpen.current) setType(rule?.type ?? "expense");
    wasOpen.current = open;
  }, [open, rule]);

  const visibleCategories = categories.filter((c) => c.type === type);

  return (
    <>
      <span onClick={() => setOpen(true)}>{trigger}</span>

      {open && (
        <div
          className="animate-overlay fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="animate-panel w-full max-w-md rounded-t-2xl bg-surface p-6 shadow-xl sm:rounded-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {rule ? t("recm.edit") : t("recm.new")}
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
              {rule && <input type="hidden" name="id" value={rule.id} />}
              <input type="hidden" name="type" value={type} />

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
                  {t("recm.amount")}
                </label>
                <input
                  name="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  defaultValue={rule?.amount ?? ""}
                  className="w-full rounded-lg border border-border px-3 py-2 text-lg font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {t("recm.frequency")}
                  </label>
                  <select
                    name="frequency"
                    defaultValue={rule?.frequency ?? "monthly"}
                    className="w-full rounded-lg border border-border px-3 py-2"
                  >
                    <option value="daily">{t("rec.daily")}</option>
                    <option value="weekly">{t("rec.weekly")}</option>
                    <option value="monthly">{t("rec.monthly")}</option>
                    <option value="yearly">{t("rec.yearly")}</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    {rule ? t("recm.nextRun") : t("recm.startDate")}
                  </label>
                  <input
                    name="next_run"
                    type="date"
                    required
                    defaultValue={rule?.next_run ?? todayISO()}
                    className="w-full rounded-lg border border-border px-3 py-2"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">
                  {t("recm.category")}
                </label>
                <select
                  name="category"
                  defaultValue={rule?.category ?? ""}
                  className="w-full rounded-lg border border-border px-3 py-2"
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
                  {t("recm.note")}
                </label>
                <input
                  name="note"
                  type="text"
                  defaultValue={rule?.note ?? ""}
                  className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  placeholder={t("recm.notePlaceholder")}
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
