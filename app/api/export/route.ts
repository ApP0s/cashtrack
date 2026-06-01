import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getTransactions, type TxFilters } from "@/lib/queries";

function csvField(value: string | number | null): string {
  const s = value == null ? "" : String(value);
  return `"${s.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const sp = req.nextUrl.searchParams;
  const filters: TxFilters = {
    type:
      sp.get("type") === "income" || sp.get("type") === "expense"
        ? (sp.get("type") as "income" | "expense")
        : "all",
    category: sp.get("category") || undefined,
    from: sp.get("from") || undefined,
    to: sp.get("to") || undefined,
    q: sp.get("q") || undefined,
  };

  const rows = await getTransactions(user.id, filters);

  const header = ["Date", "Type", "Category", "Note", "Amount"];
  const lines = [header.map(csvField).join(",")];
  for (const r of rows) {
    lines.push(
      [
        csvField(r.occurred_on),
        csvField(r.type),
        csvField(r.category),
        csvField(r.note),
        csvField(r.amount),
      ].join(","),
    );
  }
  const csv = "﻿" + lines.join("\r\n"); // BOM for Excel/UTF-8

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cashtrack-export-${new Date()
        .toISOString()
        .slice(0, 10)}.csv"`,
    },
  });
}
