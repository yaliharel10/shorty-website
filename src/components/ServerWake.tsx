"use client";

import { useEffect } from "react";
import { isSlowHost } from "@/lib/hosting";
import { wakeServerInBackground } from "@/lib/server-wake";

/** Proactively pings the server on Render free tier cold starts only. */
export function ServerWake() {
  useEffect(() => {
    if (isSlowHost()) {
      wakeServerInBackground();
    }
  }, []);

  return null;
}
