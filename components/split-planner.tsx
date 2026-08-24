"use client";

import { useActionState, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { saveSplitAction, type ActionState } from "@/lib/actions";
import type { SplitBucket } from "@/lib/queries";
import { formatMoney } from "@/lib/format";
import { useT } from "@/components/i18n-provider";

const PALETTE = [
  "#4f46e5",
  "#0d9488",
  "#16a34a",
  "#f59e0b",
  "#ec4899",
  "#3b82f6",
  "#8b5cf6",
  "#06b6d4",
];

type Bucket = { name: string; percent: number; color: string };

export function SplitPlanner({
  initialBuckets,
  baseIncome,
  currency,
}: {
  initialBuckets: SplitBucket[];
  baseIncome: number;
  currency: string;
}) {
  const t = useT();

  const defaults = (): Bucket[] => [
    { name: t("split.needs"), percent: 50, color: PALETTE[0] },
    { name: t("split.wants"), percent: 30, color: PALETTE[1] },
    { name: t("split.savings"), percent: 20, color: PALETTE[2] },
  ];

  const [base, setBase] = useState(baseIncome > 0 ? String(baseIncome) : "");
  const [buckets, setBuckets] = useState<Bucket[]>(
    initialBuckets.length > 0
      ? initialBuckets.map((b) => ({
          name: b.name,
          percent: b.percent,
          color: b.color,
        }))
      : defaults(),
  );

  const [state, formAction, pending] = useActionState<ActionState, FormData>(
    saveSplitAction,
    undefined,
  );

  const baseNum = Math.max(0, parseFloat(base) || 0);
  const totalPct = buckets.reduce((s, b) => s + (Number(b.percent) || 0), 0);
  const remaining = Math.round((100 - totalPct) * 100) / 100;

  const update = (i: number, patch: Partial<Bucket>) =>
    setBuckets((prev) =>
      prev.map((b, idx) => (idx === i ? { ...b, ...patch } : b)),
    );
  const remove = (i: number) =>
    setBuckets((prev) => prev.filter((_, idx) => idx !== i));
  const add = () =>
    setBuckets((prev) => [
      ...prev,
      { name: "", percent: 0, color: PALETTE[prev.length % PALETTE.length] },
    ]);

  const chartData = buckets.filter((b) => (Number(b.percent) || 0) > 0);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Editor */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          <label htmlFor="split-base" className="text-sm font-medium">
            {t("split.base")}
          </label>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-lg text-muted">฿</span>
            <input
              id="split-base"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              value={base}
              onChange={(e) => setBase(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-lg border border-border px-3 py-2 text-lg font-semibold outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <p className="mt-1 text-xs text-muted">{t("split.baseHint")}</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
          {/* Column headers */}
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
            <span className="w-6" aria-hidden="true" />
            <span className="flex-1">{t("split.bucketName")}</span>
            <span className="w-16 text-right">{t("split.percent")}</span>
            <span className="w-28 text-right">{t("split.amount")}</span>
            <span className="w-8" aria-hidden="true" />
          </div>

          {buckets.map((b, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="color"
                value={b.color}
                onChange={(e) => update(i, { color: e.target.value })}
                aria-label={`${b.name || t("split.bucketName")} color`}
                className="h-6 w-6 shrink-0 cursor-pointer rounded border border-border bg-transparent p-0"
              />
              <input
                type="text"
                value={b.name}
                onChange={(e) => update(i, { name: e.target.value })}
                aria-label={t("split.bucketName")}
                className="min-w-0 flex-1 rounded-lg border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={b.percent}
                onChange={(e) =>
                  update(i, { percent: Number(e.target.value) })
                }
                aria-label={t("split.percent")}
                className="w-16 rounded-lg border border-border px-2 py-2 text-right text-sm tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              <span className="w-28 text-right text-sm tabular-nums text-muted">
                {formatMoney((baseNum * (Number(b.percent) || 0)) / 100, currency)}
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                disabled={buckets.length <= 1}
                aria-label={t("split.remove")}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted transition-colors hover:bg-expense/10 hover:text-expense disabled:opacity-30 disabled:hover:bg-transparent"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-4 w-4"
                  aria-hidden="true"
                >
                  <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                </svg>
              </button>
            </div>
          ))}

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={add}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10"
            >
              {t("split.addBucket")}
            </button>
            <button
              type="button"
              onClick={() => setBuckets(defaults())}
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-muted transition-colors hover:bg-subtle"
            >
              {t("split.reset")}
            </button>
          </div>
        </div>
      </div>

      {/* Chart + summary */}
      <div className="space-y-4">
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={chartData}
                  dataKey="percent"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {chartData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => {
                    const pct = Number(value);
                    return [
                      `${formatMoney((baseNum * pct) / 100, currency)} (${pct}%)`,
                      name as string,
                    ];
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex h-[280px] items-center justify-center text-sm text-muted">
              {t("split.subtitle")}
            </div>
          )}
        </div>

        <form
          action={formAction}
          className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm"
        >
          <input type="hidden" name="buckets" value={JSON.stringify(buckets)} />

          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t("split.total")}</span>
            <span
              className={`font-semibold tabular-nums ${
                totalPct === 100
                  ? "text-income"
                  : totalPct > 100
                    ? "text-expense"
                    : "text-muted"
              }`}
            >
              {totalPct}%
            </span>
          </div>

          {/* Balance hint — text + color, not color alone */}
          <p
            className={`text-xs ${
              totalPct === 100
                ? "text-income"
                : totalPct > 100
                  ? "text-expense"
                  : "text-muted"
            }`}
          >
            {totalPct === 100
              ? t("split.balanced")
              : totalPct > 100
                ? t("split.over", { n: Math.round((totalPct - 100) * 100) / 100 })
                : t("split.remaining", { n: remaining })}
          </p>

          {state?.error && (
            <p className="rounded-lg bg-expense/10 px-3 py-2 text-sm text-expense">
              {state.error}
            </p>
          )}
          {state?.ok && (
            <p className="text-sm text-income">{t("common.saved")}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-brand px-4 py-2 font-semibold text-white transition hover:bg-brand-dark active:scale-[0.99] disabled:opacity-60"
          >
            {pending ? t("common.saving") : t("split.save")}
          </button>
        </form>
      </div>
    </div>
  );
}
