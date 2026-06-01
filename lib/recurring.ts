import "server-only";
import { sql } from "./db";

type Freq = "daily" | "weekly" | "monthly" | "yearly";

// Advance a YYYY-MM-DD date string by one period. Uses UTC to avoid TZ drift.
function advance(dateStr: string, freq: Freq): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  switch (freq) {
    case "daily":
      date.setUTCDate(date.getUTCDate() + 1);
      break;
    case "weekly":
      date.setUTCDate(date.getUTCDate() + 7);
      break;
    case "monthly":
      date.setUTCMonth(date.getUTCMonth() + 1);
      break;
    case "yearly":
      date.setUTCFullYear(date.getUTCFullYear() + 1);
      break;
  }
  return date.toISOString().slice(0, 10);
}

/**
 * Materializes any active recurring rules whose next_run date has arrived
 * (or passed) into real transactions, advancing next_run as it goes.
 * Safe to call on every page load — it's a no-op when nothing is due.
 * Returns the number of transactions created.
 */
export async function generateDueRecurring(userId: string): Promise<number> {
  const [{ today }] = await sql<{ today: string }[]>`
    select to_char(current_date, 'YYYY-MM-DD') as today
  `;

  const due = await sql<
    {
      id: string;
      type: "income" | "expense";
      amount: string;
      category: string | null;
      note: string | null;
      frequency: Freq;
      next_run: string;
    }[]
  >`
    select id, type, amount, category, note, frequency,
           to_char(next_run, 'YYYY-MM-DD') as next_run
    from recurring
    where user_id = ${userId} and active = true and next_run <= current_date
  `;

  if (due.length === 0) return 0;

  let created = 0;
  await sql.begin(async (tx) => {
    for (const rule of due) {
      let runDate = rule.next_run;
      // Cap iterations to avoid a runaway loop on stale daily rules.
      for (let i = 0; i < 1000 && runDate <= today; i++) {
        await tx`
          insert into transactions (user_id, type, amount, category, note, occurred_on)
          values (${userId}, ${rule.type}, ${rule.amount}, ${rule.category}, ${rule.note}, ${runDate})
        `;
        created++;
        runDate = advance(runDate, rule.frequency);
      }
      await tx`update recurring set next_run = ${runDate} where id = ${rule.id}`;
    }
  });

  return created;
}
