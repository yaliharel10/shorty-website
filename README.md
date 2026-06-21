# Shorty

A Netflix-style streaming platform for premium short films. Built with Next.js, SQLite, and Prisma.

## Features

- **Browse & stream** — Featured hero, category rows, search, full-screen player
- **People** — Cast & crew profile pages with bios and filmography; search filmmakers, actors, and crew from the navbar or `/browse/people`
- **Subscriptions** — Stripe-powered monthly plans (Basic $1.99, Standard $3.99, Premium $5.99) with 7-day signup trial
- **Continue watching** — Pick up where you left off (signed-in users)
- **Accounts** — Register, sign in, edit profile
- **My List & ratings** — Favorites and 1–10 star ratings
- **Admin panel** — Analytics, film management, user management
- **Production-ready basics** — Security headers, rate limiting, accessibility, SEO metadata

## Quick start

Run **one command at a time** (no inline `#` comments):

```bash
cd "/Users/yali/Personal folder/Side Projects/Shorty Website"
npm install
cp .env.example .env
npm run db:setup
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Demo accounts

All test users share the password **`demo1234`** except admin.

| Username | Password | What it tests |
|----------|----------|---------------|
| `admin` | `admin123` | **Admin panel** — full site management |
| `demo` | `demo1234` | Standard plan subscriber (full library access) |
| `trialuser` | `demo1234` | Active 7-day free trial |
| `basicuser` | `demo1234` | Basic plan ($1.99/mo) |
| `premiumuser` | `demo1234` | Premium plan ($5.99/mo) |
| `expireduser` | `demo1234` | Expired trial — sees subscribe paywall |
| `guestplus` | `demo1234` | Canceled subscription — access until period ends |

Password rules for **new** accounts: 8+ characters, at least one letter and one number.

## Test hub (`/test`)

**Live:** [https://shorty-hhgo.onrender.com/test](https://shorty-hhgo.onrender.com/test)  
**Local:** [http://localhost:3000/test](http://localhost:3000/test)

- Server health check
- One-click login for every demo account
- Links to all test URLs and credentials table

One-click login requires `ENABLE_TEST_LOGIN=true` (already set in `render.yaml` for Render).

## Admin panel

**URL:** sign in as `admin`, then go to:

| Page | URL |
|------|-----|
| Dashboard | `/admin` |
| Manage films | `/admin/films` |
| Users & accounts | `/admin/users` |
| Subscriptions | `/admin/subscriptions` |

**Credentials:** `admin` / `admin123`

Locally: [http://localhost:3000/admin](http://localhost:3000/admin)

After deploying, use `https://your-domain.com/admin`.

## Host online for free (Render)

**Repo:** [github.com/yaliharel10/shorty-website](https://github.com/yaliharel10/shorty-website)

1. Sign up at [render.com](https://render.com) (GitHub login works).
2. **New → Blueprint** → connect **`yaliharel10/shorty-website`**.
3. Render reads `render.yaml` automatically. Confirm env vars:
   - **DATABASE_URL:** `file:./prisma/render.db`
   - **JWT_SECRET:** auto-generated (or set your own)
   - **NEXT_PUBLIC_SITE_URL:** your Render URL (e.g. `https://shorty.onrender.com`)
4. Deploy.

**Free tier notes:**
- **No persistent disk** on Render free — do not add a disk in settings.
- Demo accounts are **re-created on every deploy** (build runs `db:seed`).
- New user signups work at runtime but may be **lost on redeploy** or container restart.
- App **sleeps after ~15 min idle**; first visit after sleep takes ~30–50s.

For permanent data storage, upgrade to a paid Render plan with a disk, or switch to PostgreSQL (Neon/Supabase free tier).

## Production build

```bash
npm run clean
npm run build
npm run start
```

## Environment variables

Copy `.env.example` to `.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | SQLite path (default `file:./dev.db`) |
| `JWT_SECRET` | **Yes in production** | Long random secret (32+ chars) |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Public URL for sitemap/metadata and password reset links |

## Subscriptions (Stripe)

**Live site:** [https://shorty-hhgo.onrender.com](https://shorty-hhgo.onrender.com)

New accounts get a **7-day free trial** (no card). After that, subscribe at `/subscription` via **Stripe Checkout**.

| Plan | Price |
|------|-------|
| Basic | $1.99/mo |
| Standard | $3.99/mo |
| Premium | $5.99/mo |

### Enable Stripe on Render

1. Create a free account at [stripe.com](https://stripe.com) (use **Test mode** first).
2. **Developers → API keys** — copy:
   - Secret key → `STRIPE_SECRET_KEY`
   - Publishable key → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
3. **Developers → Webhooks → Add endpoint**
   - URL: `https://shorty-hhgo.onrender.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy signing secret → `STRIPE_WEBHOOK_SECRET`
4. **Settings → Billing → Customer portal** — click **Activate** (lets users cancel/update cards).
5. In Render → **Shorty** → **Environment**, add the three Stripe vars + redeploy.

Without Stripe keys, the app falls back to **demo mode** (instant fake subscribe, local dev only).

### Test card (Stripe test mode)

Use `4242 4242 4242 4242`, any future expiry, any CVC.

## Account & password

- **`/account`** — profile, password change, membership status
- **Forgot password** — link on the sign-in modal; reset at `/reset-password?token=...`
- In development (without `RESEND_API_KEY`), reset links are printed to the server console

## API routes (account & admin)

| Route | Purpose |
|-------|---------|
| `GET/PATCH /api/account` | Account info & change password |
| `POST /api/auth/forgot-password` | Request password reset email |
| `POST /api/auth/reset-password` | Set new password with token |
| `GET /api/admin/subscriptions` | Subscription stats & subscriber list |
| `PATCH /api/admin/users` | Update role, plan, trial, subscription dates |

## Release checklist

Before deploying:

- [ ] Set a strong `JWT_SECRET` in production
- [ ] Set `NEXT_PUBLIC_SITE_URL` to your domain
- [ ] Remove or change demo accounts in production
- [ ] Consider PostgreSQL instead of SQLite for multi-instance hosting
- [ ] Run `npm run build` successfully
- [ ] Test on mobile, tablet, and desktop

## Tech stack

- Next.js 15, React 19, Tailwind CSS 4
- SQLite + Prisma ORM
- JWT sessions (httpOnly cookies) + bcrypt

## Keyboard shortcuts

- `F` — Focus search
- `Esc` — Close player / dialog

## Troubleshooting

**Build fails with "Cannot find module for page"**
→ Run `npm run clean` then `npm run build`. Don't run `db:setup` and `build` simultaneously.

**Dev server invalid directory `#`**
→ You pasted a shell comment after the command. Run `npm run dev` alone.

**429 Too many requests**
→ Auth is rate-limited to 10 attempts per 15 minutes per IP.
