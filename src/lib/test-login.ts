const ALLOWED = new Set([
  "admin",
  "demo",
  "trialuser",
  "basicuser",
  "premiumuser",
  "expireduser",
  "guestplus",
]);

export function isTestLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_TEST_LOGIN === "true"
  );
}

export function isAllowedTestUsername(username: string) {
  return ALLOWED.has(username);
}

export function defaultRedirectForUser(username: string, role: string) {
  if (username === "admin" || role === "admin") return "/admin";
  return "/browse";
}
