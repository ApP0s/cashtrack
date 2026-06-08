import type { Recurring } from "./queries";

// Convert one rule's amount to its average monthly cost.
export function monthlyEquivalent(
  amount: number,
  freq: Recurring["frequency"],
): number {
  switch (freq) {
    case "daily":
      return (amount * 365) / 12;
    case "weekly":
      return (amount * 52) / 12;
    case "monthly":
      return amount;
    case "yearly":
      return amount / 12;
  }
}

export type RecurringSummary = {
  monthlyIncome: number;
  monthlyExpense: number;
  net: number;
  perDay: number;
  perYear: number;
};

// Monthly-equivalent totals across active rules only.
export function recurringSummary(rules: Recurring[]): RecurringSummary {
  const active = rules.filter((r) => r.active);
  const monthlyIncome = active
    .filter((r) => r.type === "income")
    .reduce((sum, r) => sum + monthlyEquivalent(r.amount, r.frequency), 0);
  const monthlyExpense = active
    .filter((r) => r.type === "expense")
    .reduce((sum, r) => sum + monthlyEquivalent(r.amount, r.frequency), 0);
  return {
    monthlyIncome,
    monthlyExpense,
    net: monthlyIncome - monthlyExpense,
    perDay: (monthlyExpense * 12) / 365,
    perYear: monthlyExpense * 12,
  };
}
