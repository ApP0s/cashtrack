"use client";

import { useState } from "react";

// Current rates under พ.ร.บ. กยศ. 2566. These can change by official
// announcement, so each line links to the latest news for verification.
const INTEREST_RATE = 0.01; // ดอกเบี้ย 1% ต่อปี
const PENALTY_RATE = 0.005; // เบี้ยปรับ 0.5% ต่อปี

// "ข่าวล่าสุด" links — Google News (always latest) + official source note.
const NEWS = {
  interest: "https://news.google.com/search?q=กยศ%20ดอกเบี้ย&hl=th&gl=TH",
  penalty: "https://news.google.com/search?q=กยศ%20เบี้ยปรับ&hl=th&gl=TH",
  official: "https://www.studentloan.or.th/th/news/1757399548",
};

const baht = (n: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 2,
  }).format(n);

export default function LoanCalculatorPage() {
  const [principalInput, setPrincipalInput] = useState("");

  const principal = Math.max(0, parseFloat(principalInput) || 0);
  const interest = principal * INTEREST_RATE;
  const penalty = principal * PENALTY_RATE;
  const total = principal + interest + penalty;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">คำนวณหนี้ กยศ.</h1>
        <p className="text-sm text-muted">
          กรอกเฉพาะเงินต้น — ดอกเบี้ยและเบี้ยปรับคำนวณตามอัตราล่าสุด
        </p>
      </header>

      {/* Principal entry */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <label htmlFor="principal" className="text-sm font-medium">
          เงินต้น (บาท)
        </label>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-lg text-muted">฿</span>
          <input
            id="principal"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={principalInput}
            onChange={(e) => setPrincipalInput(e.target.value)}
            placeholder="0.00"
            className="w-full rounded-lg border border-border px-3 py-2 text-lg outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>
      </div>

      {/* Breakdown */}
      <div className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-sm">
        <Row label="เงินต้น" value={baht(principal)} />

        <Row
          label="ดอกเบี้ย"
          rate={`${(INTEREST_RATE * 100).toFixed(2)}% ต่อปี`}
          value={baht(interest)}
          newsHref={NEWS.interest}
        />

        <Row
          label="เบี้ยปรับ"
          rate={`${(PENALTY_RATE * 100).toFixed(2)}% ต่อปี`}
          value={baht(penalty)}
          newsHref={NEWS.penalty}
        />

        <div className="mt-2 flex items-center justify-between border-t border-border pt-3">
          <span className="font-semibold">รวมต่อปี</span>
          <span className="text-xl font-bold text-brand">{baht(total)}</span>
        </div>
      </div>

      {/* Source note */}
      <p className="text-xs text-muted">
        อัตราอ้างอิงตาม พ.ร.บ. กยศ. ปี 2566 (ดอกเบี้ย 1% ต่อปี, เบี้ยปรับ 0.5%
        ต่อปี) ซึ่งอาจเปลี่ยนแปลงได้ ตรวจสอบอัตราปัจจุบันจากแหล่งข้อมูลทางการที่{" "}
        <a
          href={NEWS.official}
          target="_blank"
          rel="noopener noreferrer"
          className="font-medium text-brand hover:underline"
        >
          studentloan.or.th
        </a>
        . การคำนวณนี้เป็นการประมาณการเบื้องต้นเท่านั้น
      </p>
    </div>
  );
}

function Row({
  label,
  rate,
  value,
  newsHref,
}: {
  label: string;
  rate?: string;
  value: string;
  newsHref?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{label}</span>
        {rate && <span className="text-xs text-muted">({rate})</span>}
        {newsHref && (
          <a
            href={newsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-brand hover:underline"
          >
            ข่าวล่าสุด →
          </a>
        )}
      </div>
      <span className="tabular-nums">{value}</span>
    </div>
  );
}
