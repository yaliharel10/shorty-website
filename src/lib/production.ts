/** Production deployment checks and environment helpers. */

export function isProductionDeploy() {
  return (
    process.env.NODE_ENV === "production" &&
    (process.env.VERCEL === "1" || process.env.RENDER === "true")
  );
}

const PROD_REQUIRED = [
  "JWT_SECRET",
  "NEXT_PUBLIC_SITE_URL",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY",
  "RESEND_API_KEY",
  "EMAIL_FROM",
] as const;

export function getMissingProductionEnv(): string[] {
  if (!isProductionDeploy()) return [];
  return PROD_REQUIRED.filter((key) => !process.env[key]?.trim());
}

export function assertProductionEnv() {
  const missing = getMissingProductionEnv();
  if (missing.length > 0) {
    throw new Error(
      `Missing required production environment variables: ${missing.join(", ")}`
    );
  }
}

export function isDemoFeaturesEnabled() {
  return (
    process.env.NODE_ENV !== "production" &&
    process.env.ENABLE_TEST_LOGIN === "true"
  );
}

export function shouldSeedDemoUsers() {
  return process.env.SEED_DEMO_USERS === "true";
}
