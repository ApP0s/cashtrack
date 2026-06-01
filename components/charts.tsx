"use client";

import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { CategorySlice, MonthlyPoint } from "@/lib/queries";
import { formatMoney } from "@/lib/format";

export function ExpensePie({
  data,
  currency,
}: {
  data: CategorySlice[];
  currency: string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-muted">
        No expenses in this period.
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={data}
          dataKey="total"
          nameKey="category"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
        >
          {data.map((d) => (
            <Cell key={d.category} fill={d.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value) => formatMoney(Number(value), currency)}
        />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={{ fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function MonthlyBars({
  data,
  currency,
}: {
  data: MonthlyPoint[];
  currency: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
        <XAxis
          dataKey="month"
          tickFormatter={(m: string) => m.slice(5)}
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          width={48}
          tickFormatter={(v: number) =>
            v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)
          }
        />
        <Tooltip
          formatter={(value) => formatMoney(Number(value), currency)}
          labelFormatter={(m) => String(m)}
        />
        <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="income" name="Income" fill="#16a34a" radius={[4, 4, 0, 0]} />
        <Bar
          dataKey="expense"
          name="Expense"
          fill="#e11d48"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
