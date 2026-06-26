# Shorty — Production Launch Checklist

Use this before going live at your custom domain.

## Required Vercel environment variables

| Variable | Notes |
|----------|--------|
| `JWT_SECRET` | 32+ random characters |
| `NEXT_PUBLIC_SITE_URL` | `https://yourdomain.com` |
| `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` | Production database |
| `STRIPE_SECRET_KEY` | Live key for production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Live publishable key |
| `STRIPE_WEBHOOK_SECRET` | From Stripe webhook → `/api/webhooks/stripe` |
| `RESEND_API_KEY` | Email verification & password reset |
| `EMAIL_FROM` | Verified sender domain in Resend |
| `ADMIN_INITIAL_PASSWORD` | First deploy only — rotate after login |

## Recommended

| Variable | Notes |
|----------|--------|
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | Google sign-in |
| `SENTRY_DSN` | Error monitoring |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | Rate limits across instances |

## Must NOT be set in production

- `ENABLE_TEST_LOGIN` — test/demo routes blocked automatically
- `SEED_DEMO_USERS` — no demo accounts in production
- `RUN_DB_SEED` — never force full re-seed on production

## Stripe setup

1. Create products/prices for Basic, Standard, Premium (or use dynamic checkout — already supported)
2. Add webhook endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Enable Customer Portal in Stripe Dashboard
4. Test checkout → webhook → streaming access

## First deploy

1. Set all required env vars in Vercel
2. Deploy — Turso patches run automatically
3. Empty DB seeds content + admin from `ADMIN_INITIAL_PASSWORD`
4. Sign in at `/admin`, change admin password via Account settings
5. Remove `ADMIN_INITIAL_PASSWORD` from env after first login (optional)

## Post-launch

- Verify email flow (register → verify → browse)
- Test subscription checkout and cancel
- Confirm `/admin/revenue` CSV export
- Add real film content via admin panel
