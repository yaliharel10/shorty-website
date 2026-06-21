/** True on Render free tier — server sleeps and needs wake-up retries. */
export function isSlowHost() {
  return process.env.NEXT_PUBLIC_SLOW_HOST === "true";
}

export function defaultFetchTimeoutMs() {
  return isSlowHost() ? 90000 : 15000;
}

export function defaultMaxAttempts() {
  return isSlowHost() ? 4 : 1;
}
