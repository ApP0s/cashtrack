"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { saveTransactionAction, type ActionState } from "@/lib/actions";
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
      className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark active:scale-[0.99] disabled:opacity-60"
    >
      {pending ? t("common.saving") : t("daily.addBtn")}
    </button>
  );
}

export function DailyLogger() {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const [method, setMethod] = useState<"cash" | "online">("cash");
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveTransactionAction,
    undefined,
  );

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <h2 className="font-semibold">{t("daily.quickAdd")}</h2>

      {/* Fixed: this always logs income received today */}
      <input type="hidden" name="type" value="income" />
      <input type="hidden" name="occurred_on" value={todayISO()} />
      <input type="hidden" name="method" value={method} />

      <div className="flex items-center gap-2">
        <span className="text-lg text-muted">฿</span>
        <input
          name="amount"
          type="number"
          inputMode="decimal"
          min="0.01"
          step="0.01"
          required
          autoFocus
          placeholder="0.00"
          aria-label={t("txm.amount")}
          className="w-full rounded-lg border border-border px-3 py-2 text-lg font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {/* Cash vs online */}
      <div className="grid grid-cols-2 gap-2 rounded-lg bg-subtle p-1">
        <button
          type="button"
          onClick={() => setMethod("cash")}
          className={`rounded-md py-2 text-sm font-semibold transition ${
            method === "cash" ? "bg-surface text-brand shadow-sm" : "text-muted"
          }`}
        >
          {t("method.cash")}
        </button>
        <button
          type="button"
          onClick={() => setMethod("online")}
          className={`rounded-md py-2 text-sm font-semibold transition ${
            method === "online"
              ? "bg-surface text-brand shadow-sm"
              : "text-muted"
          }`}
        >
          {t("method.online")}
        </button>
      </div>

      <input
        name="note"
        type="text"
        placeholder={t("daily.note")}
        aria-label={t("daily.note")}
        className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
      />

      {state?.error && (
        <p
          role="alert"
          className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense"
        >
          {state.error}
        </p>
      )}

      <Save />
    </form>
  );
}
