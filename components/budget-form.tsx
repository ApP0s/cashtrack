"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { saveBudgetAction, type ActionState } from "@/lib/actions";
import type { Category } from "@/lib/queries";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "Saving…" : "Set budget"}
    </button>
  );
}

export function BudgetForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveBudgetAction,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex flex-wrap items-end gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm"
    >
      <div className="flex-1 basis-44">
        <label className="mb-1 block text-sm font-medium">Category</label>
        <select
          name="category"
          required
          defaultValue=""
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          <option value="" disabled>
            Choose category…
          </option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="basis-32">
        <label className="mb-1 block text-sm font-medium">Monthly limit</label>
        <input
          name="amount"
          type="number"
          step="0.01"
          min="0.01"
          required
          placeholder="0.00"
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <Save />
      {state?.error && (
        <p className="w-full text-sm text-expense">{state.error}</p>
      )}
    </form>
  );
}
