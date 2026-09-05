import "server-only";
import { sql } from "./db";

export type Method = "cash" | "online";

export type Transaction = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string | null;
  note: string | null;
  method: Method;
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
    select id, type, amount, category, note, method, occurred_on
    from transactions
    where ${where}
    order by occurred_on desc, created_at desc
  `;
  return rows.map((r) => ({ ...r, amount: toNum(r.amount) }));
}

export type MethodBalances = { cash: number; online: number };

// Net balance held as cash vs online (income minus expense per method).
export async function getBalancesByMethod(
  userId: string,
): Promise<MethodBalances> {
  const rows = await sql<{ method: string; balance: string }[]>`
    select method,
           coalesce(sum(case when type = 'income' then amount else -amount end), 0)
             as balance
    from transactions
    where user_id = ${userId}
    group by method
  `;
  const out: MethodBalances = { cash: 0, online: 0 };
  for (const r of rows) {
    if (r.method === "cash") out.cash = toNum(r.balance);
    if (r.method === "online") out.online = toNum(r.balance);
  }
  return out;
}

export type DayBreakdown = {
  day: string;
  got: number;
  spent: number;
  net: number;
};

// Per-day got (income) / spent (expense) for the last `days` days, newest first.
export async function getDailyBreakdown(
  userId: string,
  days = 7,
): Promise<DayBreakdown[]> {
  const rows = await sql<{ day: string; type: string; total: string }[]>`
    select to_char(occurred_on, 'YYYY-MM-DD') as day, type, sum(amount) as total
    from transactions
    where user_id = ${userId}
      and occurred_on >= current_date - ${`${days - 1} days`}::interval
    group by 1, 2
  `;

  const map = new Map<string, DayBreakdown>();
  for (let i = 0; i < days; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    map.set(key, { day: key, got: 0, spent: 0, net: 0 });
  }
  for (const r of rows) {
    const entry = map.get(r.day);
    if (!entry) continue;
    if (r.type === "income") entry.got = toNum(r.total);
    if (r.type === "expense") entry.spent = toNum(r.total);
    entry.net = entry.got - entry.spent;
  }
  return Array.from(map.values()).sort((a, b) => b.day.localeCompare(a.day));
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

export type BudgetProgress = {
  id: string;
  category: string;
  amount: number;
  spent: number;
  color: string;
};

export async function getBudgets(userId: string): Promise<BudgetProgress[]> {
  const rows = await sql<
    { id: string; category: string; amount: string; spent: string; color: string | null }[]
  >`
    select b.id,
           b.category,
           b.amount,
           coalesce(s.total, 0) as spent,
           max(c.color) as color
    from budgets b
    left join (
      select category, sum(amount) as total
      from transactions
      where user_id = ${userId}
        and type = 'expense'
        and occurred_on >= date_trunc('month', current_date)
        and occurred_on < date_trunc('month', current_date) + interval '1 month'
      group by category
    ) s on s.category = b.category
    left join categories c
      on c.user_id = ${userId} and c.name = b.category and c.type = 'expense'
    where b.user_id = ${userId}
    group by b.id, b.category, b.amount, s.total
    order by b.category
  `;
  return rows.map((r) => ({
    id: r.id,
    category: r.category,
    amount: toNum(r.amount),
    spent: toNum(r.spent),
    color: r.color ?? "#64748b",
  }));
}

export type Recurring = {
  id: string;
  type: "income" | "expense";
  amount: number;
  category: string | null;
  note: string | null;
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  method: Method;
  next_run: string;
  active: boolean;
};

export async function getRecurring(userId: string): Promise<Recurring[]> {
  const rows = await sql<Recurring[]>`
    select id, type, amount, category, note, frequency, method,
           to_char(next_run, 'YYYY-MM-DD') as next_run, active
    from recurring
    where user_id = ${userId}
    order by active desc, next_run
  `;
  return rows.map((r) => ({ ...r, amount: toNum(r.amount) }));
}

export type SplitBucket = {
  id: string;
  name: string;
  percent: number;
  color: string;
};

export async function getSplitBuckets(userId: string): Promise<SplitBucket[]> {
  try {
    const rows = await sql<
      { id: string; name: string; percent: string; color: string }[]
    >`
      select id, name, percent, color
      from split_buckets
      where user_id = ${userId}
      order by sort_order, created_at
    `;
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      percent: toNum(r.percent),
      color: r.color,
    }));
  } catch {
    // Table may not exist yet (schema not applied). Treat as "no plan yet".
    return [];
  }
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
