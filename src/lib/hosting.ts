/** Render free tier sleeps — only enable wake-up retries on Render hosts. */
export function isSlowHost() {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("onrender.com")) return true;
    if (host.endsWith(".vercel.app") || host.includes("vercel.app")) return false;
  }
  return process.env.NEXT_PUBLIC_SLOW_HOST === "true";
}

/** Initial auth check on page load — keep short so the UI appears quickly. */
export function authCheckTimeoutMs() {
  return isSlowHost() ? 30000 : 5000;
}

/** Login / register submit. */
export function loginTimeoutMs() {
  return isSlowHost() ? 90000 : 15000;
}

export function defaultFetchTimeoutMs() {
  return loginTimeoutMs();
}

export function defaultMaxAttempts() {
  return isSlowHost() ? 4 : 1;
}
