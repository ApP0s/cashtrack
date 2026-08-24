"use client";

import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { changePasswordAction, type ActionState } from "@/lib/actions";
import { useT } from "@/components/i18n-provider";

function Save() {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60"
    >
      {pending ? t("common.saving") : t("set.changePassword")}
    </button>
  );
}

export function PasswordForm() {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, formAction] = useActionState<ActionState, FormData>(
    changePasswordAction,
    undefined,
  );

  // Clear the fields after a successful change.
  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  const inputClass =
    "w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20";

  return (
    <form
      ref={formRef}
      action={formAction}
      className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm"
    >
      <h2 className="font-semibold">{t("set.security")}</h2>

      <div>
        <label htmlFor="pw-current" className="mb-1 block text-sm font-medium">
          {t("set.currentPassword")}
        </label>
        <input
          id="pw-current"
          name="current"
          type="password"
          autoComplete="current-password"
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="pw-new" className="mb-1 block text-sm font-medium">
          {t("set.newPassword")}
        </label>
        <input
          id="pw-new"
          name="new"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label htmlFor="pw-confirm" className="mb-1 block text-sm font-medium">
          {t("set.confirmPassword")}
        </label>
        <input
          id="pw-confirm"
          name="confirm"
          type="password"
          autoComplete="new-password"
          minLength={6}
          required
          className={inputClass}
        />
      </div>

      {state?.ok && <p className="text-sm text-income">{t("common.saved")}</p>}
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
