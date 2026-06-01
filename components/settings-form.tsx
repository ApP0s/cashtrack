"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { updateSettingsAction, type ActionState } from "@/lib/actions";
import { CURRENCIES, currencySymbol } from "@/lib/format";

function Save() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? "Saving…" : "Save changes"}
    </button>
  );
}

export function SettingsForm({
  name,
  currency,
}: {
  name: string;
  currency: string;
}) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateSettingsAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">Display name</label>
        <input
          name="name"
          defaultValue={name}
          className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Currency</label>
        <select
          name="currency"
          defaultValue={currency}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2"
        >
          {CURRENCIES.map((c) => (
            <option key={c} value={c}>
              {c} ({currencySymbol(c)})
            </option>
          ))}
        </select>
      </div>

      {state?.ok && (
        <p className="text-sm text-income">Saved.</p>
      )}
      {state?.error && <p className="text-sm text-expense">{state.error}</p>}

      <Save />
    </form>
  );
}
