"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/lib/actions";
import { useT } from "@/components/i18n-provider";

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  const t = useT();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-brand py-2.5 font-semibold text-white transition hover:bg-brand-dark disabled:opacity-60"
    >
      {pending ? t("common.pleaseWait") : label}
    </button>
  );
}

export function AuthForm({
  mode,
  action,
}: {
  mode: "login" | "register";
  action: (state: ActionState, formData: FormData) => Promise<ActionState>;
}) {
  const t = useT();
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    undefined,
  );
  const isRegister = mode === "register";

  return (
    <div className="w-full max-w-sm">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-xl font-bold text-white">
          ฿
        </div>
        <h1 className="text-2xl font-bold">CashTrack</h1>
        <p className="mt-1 text-sm text-muted">
          {isRegister ? t("auth.createAccount") : t("auth.welcomeBack")}
        </p>
      </div>

      <form
        action={formAction}
        className="space-y-4 rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        {isRegister && (
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("auth.name")}
            </label>
            <input
              name="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              placeholder={t("auth.yourName")}
            />
          </div>
        )}
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("auth.email")}
          </label>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("auth.password")}
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete={isRegister ? "new-password" : "current-password"}
            className="w-full rounded-lg border border-border px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
            {state.error}
          </p>
        )}

        <SubmitButton
          label={isRegister ? t("auth.createAccountBtn") : t("auth.signIn")}
        />
      </form>

      <p className="mt-5 text-center text-sm text-muted">
        {isRegister ? (
          <>
            {t("auth.haveAccount")}{" "}
            <Link href="/login" className="font-semibold text-brand">
              {t("auth.signIn")}
            </Link>
          </>
        ) : (
          <>
            {t("auth.newHere")}{" "}
            <Link href="/register" className="font-semibold text-brand">
              {t("auth.createAccountBtn")}
            </Link>
          </>
        )}
      </p>
    </div>
  );
}
