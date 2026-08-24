import { requireUser } from "@/lib/auth";
import { getLocale } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { getSplitBuckets, getTotals } from "@/lib/queries";
import { SplitPlanner } from "@/components/split-planner";

function monthRange() {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const iso = (d: Date) => d.toISOString().slice(0, 10);
  return { from: iso(first), to: iso(last) };
}

export default async function SplitPage() {
  const [user, locale] = await Promise.all([requireUser(), getLocale()]);
  const tr = (k: string) => t(locale, k);

  const { from, to } = monthRange();
  const [buckets, month] = await Promise.all([
    getSplitBuckets(user.id),
    getTotals(user.id, { from, to }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{tr("split.title")}</h1>
        <p className="text-sm text-muted">{tr("split.subtitle")}</p>
      </header>

      <SplitPlanner
        initialBuckets={buckets}
        baseIncome={month.income}
        currency={user.currency}
      />
    </div>
  );
}
