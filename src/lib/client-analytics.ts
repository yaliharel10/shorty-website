"use client";

import type { AnalyticsEvent } from "@/lib/analytics";

type EventProps = Record<string, string | number | boolean | null | undefined>;

/** Browser-side analytics — forwards to API route for warehouse pipelines. */
export function trackClientEvent(
  event: AnalyticsEvent,
  props: EventProps = {}
) {
  if (typeof window === "undefined") return;

  void fetch("/api/analytics", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, props }),
    keepalive: true,
  }).catch(() => {});
}
