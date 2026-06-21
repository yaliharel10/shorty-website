/** Render free tier sleeps — only enable wake-up retries on Render hosts. */
export function isSlowHost() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("onrender.com")) return true;
    if (host.endsWith(".vercel.app") || host.includes("vercel.app")) return false;
  }
  return process.env.NEXT_PUBLIC_SLOW_HOST === "true";
}

export function defaultFetchTimeoutMs() {
  return isSlowHost() ? 90000 : 30000;
}

export function defaultMaxAttempts() {
  return isSlowHost() ? 4 : 1;
}
