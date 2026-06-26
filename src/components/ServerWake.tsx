"use client";

import { useEffect } from "react";
import { isSlowHost } from "@/lib/hosting";
import { wakeServerInBackground } from "@/lib/server-wake";

/** Proactively warms the API + database on page load. */
export function ServerWake() {
  useEffect(() => {
    void fetch("/api/health", { cache: "no-store" }).catch(() => {});
    if (isSlowHost()) {
      wakeServerInBackground();
    }
  }, []);

  return null;
}
