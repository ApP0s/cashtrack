"use client";

import { useSyncExternalStore } from "react";
import { useLocale } from "@/components/i18n-provider";

const noopSubscribe = () => () => {};

/**
 * Renders a timestamp in the viewer's own timezone. The server runs in UTC,
 * so the server (and hydration) render a date-only fallback; once hydrated the
 * browser shows the local value. useSyncExternalStore gives us that
 * "hydrated?" flag without a setState-in-effect.
 */
export function LocalTime({
  iso,
  mode = "datetime",
}: {
  iso: string;
  mode?: "date" | "datetime";
}) {
  const locale = useLocale();
  const hydrated = useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );

  if (!hydrated) return <time dateTime={iso}>{iso.slice(0, 10)}</time>;

  const tag = locale === "th" ? "th-TH" : "en-US";
  const d = new Date(iso);
  const text =
    mode === "date"
      ? d.toLocaleDateString(tag, { dateStyle: "medium" })
      : d.toLocaleString(tag, { dateStyle: "medium", timeStyle: "short" });

  return <time dateTime={iso}>{text}</time>;
}
