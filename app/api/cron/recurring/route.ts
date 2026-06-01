import { NextRequest, NextResponse } from "next/server";
import { generateAllDueRecurring } from "@/lib/recurring";

// Materializes due recurring transactions for all users.
// Invoked daily by Vercel Cron (see vercel.json). Vercel automatically sends
// `Authorization: Bearer ${CRON_SECRET}` when the CRON_SECRET env var is set,
// which guards this endpoint against arbitrary public calls.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const created = await generateAllDueRecurring();
  return NextResponse.json({ ok: true, created });
}
