"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Stores the browser's timezone in a `tz` cookie so the server can work out
 * "today" and "this month" in the user's local time. Refreshes once when the
 * stored value was missing or different.
 */
export function TimezoneSync() {
  const router = useRouter();

  useEffect(() => {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz) return;
    const stored = document.cookie
      .split("; ")
      .find((c) => c.startsWith("tz="))
      ?.slice(3);
    if (stored && decodeURIComponent(stored) === tz) return;
    document.cookie = `tz=${encodeURIComponent(tz)}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    router.refresh();
  }, [router]);

  return null;
}
