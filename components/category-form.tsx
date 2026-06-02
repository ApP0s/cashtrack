"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { saveCategoryAction, type ActionState } from "@/lib/actions";
import { useT } from "@/components/i18n-provider";

const PALETTE = [
  "#ef4444", "#f59e0b", "#16a34a", "#0d9488", "#3b82f6",
  "#6366f1", "#8b5cf6", "#ec4899", "#06b6d4", "#64748b",
];

function Add() {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? t("cat.adding") : t("cat.addCategory")}
    </button>
  );
}

export function CategoryForm() {
  const t = useT();
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveCategoryAction,
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
      <div className="flex-1 basis-40">
        <label className="mb-1 block text-sm font-medium">{t("cat.name")}</label>
        <input
          name="name"
          required
          placeholder={t("cat.namePlaceholder")}
          className="w-full rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("cat.type")}</label>
        <select
          name="type"
          defaultValue="expense"
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="expense">{t("cat.expense")}</option>
          <option value="income">{t("cat.income")}</option>
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t("cat.color")}</label>
        <select
          name="color"
          defaultValue={PALETTE[0]}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          {PALETTE.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <Add />
      {state?.error && (
        <p className="w-full text-sm text-expense">{state.error}</p>
      )}
    </form>
  );
}
