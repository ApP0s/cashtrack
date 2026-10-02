import { requireUser } from "@/lib/auth";
import { getLocale, getToday } from "@/lib/locale";
import { t } from "@/lib/i18n";
import { monthRangeOf } from "@/lib/dates";
import { getSplitBuckets, getTotals } from "@/lib/queries";
import { SplitPlanner } from "@/components/split-planner";

export default async function SplitPage() {
  const [user, locale, today] = await Promise.all([
    requireUser(),
    getLocale(),
    getToday(),
  ]);
  const tr = (k: string) => t(locale, k);

  const { from, to } = monthRangeOf(today);
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
