"use client";

import { useActionState, useState } from "react";
import {
  closePeriodAction,
  undoClosingAction,
  type ActionState,
} from "@/lib/actions";
import { useT } from "@/components/i18n-provider";

/**
 * Inline-confirm state tied to the action result it was opened against:
 * once the action returns a new result, the confirmation closes by itself
 * (no effect needed). Boxed so an `undefined` result is distinguishable.
 */
function useConfirm(state: ActionState) {
  const [openedFor, setOpenedFor] = useState<{ s: ActionState } | null>(null);
  return {
    confirming: openedFor !== null && openedFor.s === state,
    open: () => setOpenedFor({ s: state }),
    cancel: () => setOpenedFor(null),
  };
}

/** "Cut off now" with an inline confirmation step. */
export function ClosePeriodButton({ amountLabel }: { amountLabel: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    closePeriodAction,
    undefined,
  );
  const { confirming, open, cancel } = useConfirm(state);

  return (
    <div className="space-y-3">
      {confirming ? (
        <form
          action={formAction}
          className="space-y-3 rounded-xl border border-brand/30 bg-brand-subtle p-4"
        >
          <p className="text-sm font-medium">
            {t("close.confirm", { amount: amountLabel })}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="min-h-11 flex-1 rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] disabled:opacity-60 sm:flex-none"
            >
              {pending ? t("common.saving") : t("close.yes")}
            </button>
            <button
              type="button"
              onClick={cancel}
              disabled={pending}
              className="min-h-11 flex-1 rounded-lg px-4 py-2 font-medium text-muted transition hover:bg-subtle sm:flex-none"
            >
              {t("common.cancel")}
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={open}
          className="min-h-11 w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark active:scale-[0.98] sm:w-auto"
        >
          {t("close.button")}
        </button>
      )}

      {!confirming && state?.ok && (
        <p role="status" className="text-sm text-income">
          {t("close.done")}
        </p>
      )}
      {!confirming && state?.error && (
        <p role="alert" className="text-sm text-muted">
          {state.error}
        </p>
      )}
    </div>
  );
}

/** Small "Undo" for the latest cut-off, also confirmed inline. */
export function UndoClosingButton() {
  const t = useT();
  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    undoClosingAction,
    undefined,
  );
  const { confirming, open, cancel } = useConfirm(state);

  if (!confirming) {
    return (
      <div className="flex items-center gap-2">
        {state?.ok && (
          <span role="status" className="text-xs text-muted">
            {t("close.undone")}
          </span>
        )}
        <button
          type="button"
          onClick={open}
          className="min-h-9 rounded-md px-3 py-1.5 text-xs font-medium text-muted transition hover:bg-subtle hover:text-foreground"
        >
          {t("close.undo")}
        </button>
      </div>
    );
  }

  return (
    <form
      action={formAction}
      className="w-full space-y-2 rounded-lg bg-subtle p-3 text-sm"
    >
      <p>{t("close.undoConfirm")}</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={pending}
          className="min-h-9 rounded-md bg-expense px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60"
        >
          {pending ? t("common.saving") : t("close.undoYes")}
        </button>
        <button
          type="button"
          onClick={cancel}
          className="min-h-9 rounded-md px-3 py-1.5 text-xs font-medium text-muted hover:bg-surface"
        >
          {t("common.cancel")}
        </button>
      </div>
    </form>
  );
}
