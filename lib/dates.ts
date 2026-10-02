// Calendar-date helpers working on "YYYY-MM-DD" strings, so "today" and
// "this month" follow the user's timezone instead of the server's (UTC).

const pad = (n: number) => String(n).padStart(2, "0");

/** Today's date (YYYY-MM-DD) in an IANA timezone, e.g. "Asia/Bangkok". */
export function todayIn(timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)?.value;
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Today's date in the browser's own timezone (for client components). */
export function localTodayISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Shift a YYYY-MM-DD date by `n` days. */
export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

/** First and last day of the month containing `date`. */
export function monthRangeOf(date: string): { from: string; to: string } {
  const [y, m] = date.split("-").map(Number);
  const lastDay = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { from: `${y}-${pad(m)}-01`, to: `${y}-${pad(m)}-${pad(lastDay)}` };
}
