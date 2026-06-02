import { requireUser } from "@/lib/auth";
import { getLocale, getTheme } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { logoutAction } from "@/lib/actions";
import { SettingsForm } from "@/components/settings-form";
import { ThemeToggle, LanguageToggle } from "@/components/preferences";

export default async function SettingsPage() {
  const [user, locale, theme] = await Promise.all([
    requireUser(),
    getLocale(),
    getTheme(),
  ]);
  const tr = (k: string, vars?: Record<string, string | number>) =>
    t(locale, k, vars);

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{tr("set.title")}</h1>
        <p className="text-sm text-muted">{user.email}</p>
      </header>

      <SettingsForm name={user.name ?? ""} currency={user.currency} />

      {/* Appearance: theme + language */}
      <div className="space-y-4 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">{tr("set.appearance")}</h2>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {tr("set.theme")}
          </label>
          <ThemeToggle initial={theme} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">
            {tr("set.language")}
          </label>
          <LanguageToggle initial={locale} />
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <h2 className="font-semibold">{tr("set.account")}</h2>
        <p className="mt-1 text-sm text-muted">
          {tr("set.signedInAs", { email: user.email })}
        </p>
        <form action={logoutAction} className="mt-3">
          <button
            type="submit"
            className="rounded-lg border border-border px-4 py-2 font-medium text-expense hover:bg-expense/10"
          >
            {tr("common.signOut")}
          </button>
        </form>
      </div>
    </div>
  );
}
