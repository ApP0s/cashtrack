import { requireUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { SettingsForm } from "@/components/settings-form";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted">{user.email}</p>
      </header>

      <SettingsForm name={user.name ?? ""} currency={user.currency} />

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">Account</h2>
        <p className="mt-1 text-sm text-muted">
          Signed in as {user.email}.
        </p>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 font-medium text-expense hover:bg-rose-50"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
