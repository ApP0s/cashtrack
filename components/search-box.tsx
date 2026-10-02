"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/components/i18n-provider";

export function SearchBox({ onDone }: { onDone?: () => void }) {
  const t = useT();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = inputRef.current?.value.trim() ?? "";
    router.push(q ? `/transactions?q=${encodeURIComponent(q)}` : "/transactions");
    onDone?.();
  };

  return (
    <form onSubmit={submit} role="search" className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </span>
      <input
        ref={inputRef}
        type="search"
        name="q"
        aria-label={t("search.placeholder")}
        placeholder={t("search.placeholder")}
        className="w-full rounded-lg border border-border bg-subtle py-2 pl-9 pr-3 text-sm outline-none focus:border-brand focus:bg-surface focus:ring-2 focus:ring-brand/20"
      />
    </form>
  );
}
