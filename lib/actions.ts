"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { sql } from "./db";
import {
  createSession,
  destroySession,
  hashPassword,
  requireUser,
  verifyPassword,
} from "./auth";
import { CURRENCIES } from "./format";
import { getLocale } from "./locale";
import { t } from "./i18n";

const DEFAULT_CATEGORIES: { name: string; type: "income" | "expense"; color: string }[] = [
  { name: "Salary", type: "income", color: "#16a34a" },
  { name: "Business", type: "income", color: "#0d9488" },
  { name: "Gifts", type: "income", color: "#7c3aed" },
  { name: "Other income", type: "income", color: "#64748b" },
  { name: "Food", type: "expense", color: "#ef4444" },
  { name: "Transport", type: "expense", color: "#f59e0b" },
  { name: "Housing", type: "expense", color: "#3b82f6" },
  { name: "Shopping", type: "expense", color: "#ec4899" },
  { name: "Bills", type: "expense", color: "#8b5cf6" },
  { name: "Health", type: "expense", color: "#10b981" },
  { name: "Entertainment", type: "expense", color: "#06b6d4" },
  { name: "Other expense", type: "expense", color: "#64748b" },
];

export type ActionState = { error?: string; ok?: boolean } | undefined;

// ---------- Auth ----------

export async function registerAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const locale = await getLocale();

  if (!email || !password)
    return { error: t(locale, "err.emailPasswordRequired") };
  if (password.length < 6) return { error: t(locale, "err.passwordMin") };

  const existing = await sql`select id from users where email = ${email}`;
  if (existing.length > 0) return { error: t(locale, "err.emailTaken") };

  const hash = await hashPassword(password);
  const rows = await sql<{ id: string }[]>`
    insert into users (email, name, password_hash)
    values (${email}, ${name || null}, ${hash})
    returning id
  `;
  const userId = rows[0].id;

  // Seed default categories for the new account.
  for (const c of DEFAULT_CATEGORIES) {
    await sql`
      insert into categories (user_id, name, type, color)
      values (${userId}, ${c.name}, ${c.type}, ${c.color})
      on conflict do nothing
    `;
  }

  await createSession(userId);
  redirect("/dashboard");
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const locale = await getLocale();

  if (!email || !password)
    return { error: t(locale, "err.emailPasswordRequired") };

  const rows = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash from users where email = ${email}
  `;
  const user = rows[0];
  if (!user || !(await verifyPassword(password, user.password_hash))) {
    return { error: t(locale, "err.invalidCredentials") };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}

// ---------- Transactions ----------

export async function saveTransactionAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const id = String(formData.get("id") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const methodRaw = String(formData.get("method") ?? "cash");
  const method = methodRaw === "online" ? "online" : "cash";
  const occurredOn = String(formData.get("occurred_on") ?? "").trim();
  const locale = await getLocale();

  if (type !== "income" && type !== "expense")
    return { error: t(locale, "err.chooseType") };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: t(locale, "err.amountPositive") };
  if (!occurredOn) return { error: t(locale, "err.pickDate") };

  if (id) {
    await sql`
      update transactions
      set type = ${type}, amount = ${amount}, category = ${category},
          note = ${note}, method = ${method}, occurred_on = ${occurredOn}
      where id = ${id} and user_id = ${user.id}
    `;
  } else {
    await sql`
      insert into transactions (user_id, type, amount, category, note, method, occurred_on)
      values (${user.id}, ${type}, ${amount}, ${category}, ${note}, ${method}, ${occurredOn})
    `;
  }

  revalidatePath("/dashboard");
  revalidatePath("/transactions");
  revalidatePath("/daily");
  return { ok: true };
}

export async function deleteTransactionAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await sql`delete from transactions where id = ${id} and user_id = ${user.id}`;
  }
  revalidatePath("/dashboard");
  revalidatePath("/transactions");
}

// ---------- Categories ----------

export async function saveCategoryAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const color = String(formData.get("color") ?? "#64748b").trim();
  const locale = await getLocale();

  if (!name) return { error: t(locale, "err.categoryRequired") };
  if (type !== "income" && type !== "expense")
    return { error: t(locale, "err.chooseType") };

  try {
    await sql`
      insert into categories (user_id, name, type, color)
      values (${user.id}, ${name}, ${type}, ${color})
    `;
  } catch {
    return { error: t(locale, "err.categoryExists") };
  }

  revalidatePath("/categories");
  return { ok: true };
}

export async function deleteCategoryAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await sql`delete from categories where id = ${id} and user_id = ${user.id}`;
  }
  revalidatePath("/categories");
}

// ---------- Settings ----------

export async function updateSettingsAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim() || null;
  const currency = String(formData.get("currency") ?? "THB");
  const locale = await getLocale();

  if (!CURRENCIES.includes(currency))
    return { error: t(locale, "err.unsupportedCurrency") };

  await sql`
    update users set name = ${name}, currency = ${currency} where id = ${user.id}
  `;

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const locale = await getLocale();
  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("new") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (next.length < 6) return { error: t(locale, "err.passwordMin") };
  if (next !== confirm) return { error: t(locale, "err.passwordMismatch") };

  const rows = await sql<{ password_hash: string }[]>`
    select password_hash from users where id = ${user.id}
  `;
  const hash = rows[0]?.password_hash;
  if (!hash || !(await verifyPassword(current, hash)))
    return { error: t(locale, "err.currentWrong") };

  const newHash = await hashPassword(next);
  await sql`update users set password_hash = ${newHash} where id = ${user.id}`;

  return { ok: true };
}

// ---------- Budgets ----------

export async function saveBudgetAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const category = String(formData.get("category") ?? "").trim();
  const amount = Number(formData.get("amount"));
  const locale = await getLocale();

  if (!category) return { error: t(locale, "err.pickCategory") };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: t(locale, "err.budgetPositive") };

  await sql`
    insert into budgets (user_id, category, amount)
    values (${user.id}, ${category}, ${amount})
    on conflict (user_id, category) do update set amount = ${amount}
  `;

  revalidatePath("/budgets");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteBudgetAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await sql`delete from budgets where id = ${id} and user_id = ${user.id}`;
  }
  revalidatePath("/budgets");
  revalidatePath("/dashboard");
}

// ---------- Recurring ----------

export async function saveRecurringAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  const type = String(formData.get("type") ?? "");
  const amount = Number(formData.get("amount"));
  const category = String(formData.get("category") ?? "").trim() || null;
  const note = String(formData.get("note") ?? "").trim() || null;
  const frequency = String(formData.get("frequency") ?? "");
  const methodRaw = String(formData.get("method") ?? "cash");
  const method = methodRaw === "online" ? "online" : "cash";
  const nextRun = String(formData.get("next_run") ?? "").trim();
  const locale = await getLocale();

  if (type !== "income" && type !== "expense")
    return { error: t(locale, "err.chooseType") };
  if (!Number.isFinite(amount) || amount <= 0)
    return { error: t(locale, "err.amountPositive") };
  if (!["daily", "weekly", "monthly", "yearly"].includes(frequency))
    return { error: t(locale, "err.chooseFrequency") };
  if (!nextRun) return { error: t(locale, "err.pickStartDate") };

  if (id) {
    await sql`
      update recurring
      set type = ${type}, amount = ${amount}, category = ${category},
          note = ${note}, frequency = ${frequency}, method = ${method},
          next_run = ${nextRun}
      where id = ${id} and user_id = ${user.id}
    `;
  } else {
    await sql`
      insert into recurring (user_id, type, amount, category, note, frequency, method, next_run)
      values (${user.id}, ${type}, ${amount}, ${category}, ${note}, ${frequency}, ${method}, ${nextRun})
    `;
  }

  revalidatePath("/recurring");
  return { ok: true };
}

export async function deleteRecurringAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await sql`delete from recurring where id = ${id} and user_id = ${user.id}`;
  }
  revalidatePath("/recurring");
}

export async function toggleRecurringAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "").trim();
  if (id) {
    await sql`
      update recurring set active = not active
      where id = ${id} and user_id = ${user.id}
    `;
  }
  revalidatePath("/recurring");
}

// ---------- Money split ----------

export async function saveSplitAction(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();
  const locale = await getLocale();

  let raw: unknown;
  try {
    raw = JSON.parse(String(formData.get("buckets") ?? "[]"));
  } catch {
    return { error: t(locale, "err.splitInvalid") };
  }

  if (!Array.isArray(raw) || raw.length === 0)
    return { error: t(locale, "err.splitEmpty") };

  const buckets = raw.map((b) => ({
    name: String((b as { name?: unknown }).name ?? "").trim(),
    percent: Number((b as { percent?: unknown }).percent),
    color: String((b as { color?: unknown }).color ?? "#4f46e5"),
  }));

  for (const b of buckets) {
    if (!b.name) return { error: t(locale, "err.splitName") };
    if (!Number.isFinite(b.percent) || b.percent < 0 || b.percent > 100)
      return { error: t(locale, "err.splitPercent") };
  }

  // Replace the user's whole plan atomically.
  await sql.begin(async (tx) => {
    await tx`delete from split_buckets where user_id = ${user.id}`;
    for (let i = 0; i < buckets.length; i++) {
      const b = buckets[i];
      await tx`
        insert into split_buckets (user_id, name, percent, color, sort_order)
        values (${user.id}, ${b.name}, ${b.percent}, ${b.color}, ${i})
      `;
    }
  });

  revalidatePath("/split");
  return { ok: true };
}
