import "server-only";
import { sql } from "./db";

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string | null;
  note: string | null;
  occurred_on: string;
};

export type Category = {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string;
};

export type TxFilters = {
  type?: "income" | "expense" | "all";
  category?: string;
  from?: string;
  to?: string;
  q?: string;
};

function toNum(v: unknown): number {
  return typeof v === "string" ? parseFloat(v) : Number(v ?? 0);
}

export async function getCategories(userId: string): Promise<Category[]> {
  const rows = await sql<Category[]>`
    select id, name, type, color from categories
    where user_id = ${userId}
    order by type, name
  `;
  return rows;
}

export async function getTransactions(
  userId: string,
  filters: TxFilters = {},
): Promise<Transaction[]> {
  const conds = [sql`user_id = ${userId}`];
  if (filters.type && filters.type !== "all")
    conds.push(sql`type = ${filters.type}`);
  if (filters.category) conds.push(sql`category = ${filters.category}`);
  if (filters.from) conds.push(sql`occurred_on >= ${filters.from}`);
  if (filters.to) conds.push(sql`occurred_on <= ${filters.to}`);
  if (filters.q) conds.push(sql`(note ilike ${"%" + filters.q + "%"} or category ilike ${"%" + filters.q + "%"})`);

  const where = conds.reduce((acc, c, i) =>
    i === 0 ? c : sql`${acc} and ${c}`,
  );

  const rows = await sql<Transaction[]>`
    select id, type, amount, category, note, occurred_on
    from transactions
    where ${where}
    order by occurred_on desc, created_at desc
  `;
  return rows.map((r) => ({ ...r, amount: toNum(r.amount) }));
}

export type Totals = { income: number; expense: number; balance: number };

export async function getTotals(
  userId: string,
  filters: TxFilters = {},
): Promise<Totals> {
  const conds = [sql`user_id = ${userId}`];
  if (filters.from) conds.push(sql`occurred_on >= ${filters.from}`);
  if (filters.to) conds.push(sql`occurred_on <= ${filters.to}`);
  const where = conds.reduce((acc, c, i) => (i === 0 ? c : sql`${acc} and ${c}`));

  const rows = await sql<{ type: string; total: string }[]>`
    select type, coalesce(sum(amount), 0) as total
    from transactions
    where ${where}
    group by type
  `;
  let income = 0;
  let expense = 0;
  for (const r of rows) {
    if (r.type === "income") income = toNum(r.total);
    if (r.type === "expense") expense = toNum(r.total);
  }
  return { income, expense, balance: income - expense };
}

export type CategorySlice = { category: string; total: number; color: string };

export async function getExpenseByCategory(
  userId: string,
  filters: TxFilters = {},
): Promise<CategorySlice[]> {
  const conds = [sql`t.user_id = ${userId}`, sql`t.type = 'expense'`];
  if (filters.from) conds.push(sql`t.occurred_on >= ${filters.from}`);
  if (filters.to) conds.push(sql`t.occurred_on <= ${filters.to}`);
  const where = conds.reduce((acc, c, i) => (i === 0 ? c : sql`${acc} and ${c}`));

  const rows = await sql<{ category: string; total: string; color: string | null }[]>`
    select coalesce(t.category, 'Uncategorized') as category,
           sum(t.amount) as total,
           max(c.color) as color
    from transactions t
    left join categories c on c.user_id = t.user_id and c.name = t.category and c.type = 'expense'
    where ${where}
    group by coalesce(t.category, 'Uncategorized')
    order by sum(t.amount) desc
  `;
  return rows.map((r) => ({
    category: r.category,
    total: toNum(r.total),
    color: r.color ?? "#64748b",
  }));
}

export type MonthlyPoint = { month: string; income: number; expense: number };

export async function getMonthlyTrend(
  userId: string,
  months = 6,
): Promise<MonthlyPoint[]> {
  const rows = await sql<{ month: string; type: string; total: string }[]>`
    select to_char(date_trunc('month', occurred_on), 'YYYY-MM') as month,
           type, sum(amount) as total
    from transactions
    where user_id = ${userId}
      and occurred_on >= (date_trunc('month', current_date) - ${`${months - 1} months`}::interval)
    group by 1, 2
    order by 1
  `;

  const map = new Map<string, MonthlyPoint>();
  // Pre-fill the last `months` buckets so the chart is continuous.
  const now = new Date();
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(key, { month: key, income: 0, expense: 0 });
  }
  for (const r of rows) {
    const point = map.get(r.month) ?? { month: r.month, income: 0, expense: 0 };
    if (r.type === "income") point.income = toNum(r.total);
    if (r.type === "expense") point.expense = toNum(r.total);
    map.set(r.month, point);
  }
  return Array.from(map.values());
}
