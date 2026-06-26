# Shorty — Architecture Audit & Upgrade Plan

> Netflix-style short-film streaming platform (films under ~30 minutes)
> Generated: 2026-06-22

---

## 1. Executive summary

**Shorty** is already a short-film streaming MVP (Next.js 15, Prisma/SQLite-Turso, JWT auth, Stripe). It is **not** a generic video site, but it falls short of Netflix-level UX in the player, discovery, collections, and film metadata depth.

This document maps the current state, gaps, proposed schema, and a phased implementation roadmap.

**Note:** A URL-shortening module (`/dashboard`, `/r/[slug]`, Link models) was added in a prior session. It is **orthogonal** to streaming and should be removed or isolated in a separate repo before a public streaming launch.

---

## 2. Current architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js 15 App Router (React 19, Tailwind 4)               │
├─────────────────────────────────────────────────────────────┤
│  Pages: /, /browse, /films/[id], /people/[slug], /admin     │
│  Client: HomePage, FilmModal (player), GuestBrowsePage      │
├─────────────────────────────────────────────────────────────┤
│  API: /api/films, /api/films/[id], /api/favorites, ratings  │
│       /api/subscription/*, /api/admin/*                     │
├─────────────────────────────────────────────────────────────┤
│  Auth: JWT (jose) httpOnly cookie, bcrypt                   │
│  Billing: Stripe Checkout + webhooks + demo mode            │
├─────────────────────────────────────────────────────────────┤
│  Database: SQLite (dev) / Turso libSQL (Vercel prod)        │
│  ORM: Prisma (db push, no migration history)                │
└─────────────────────────────────────────────────────────────┘
```

### Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, Tailwind 4, lucide-react |
| Backend | Next.js Route Handlers (36+ API routes) |
| Database | SQLite / Turso via Prisma 6 |
| Auth | Custom JWT + bcrypt |
| Payments | Stripe |
| Video | YouTube iframe embeds (not self-hosted HLS) |

---

## 3. Current features (what works)

| Feature | Status | Location |
|---------|--------|----------|
| Browse home with hero + rows | ✅ | `HomePage.tsx`, `Hero.tsx` |
| Guest catalog browse | ✅ | `GuestBrowsePage.tsx` |
| Film modal player | ✅ | `FilmModal.tsx` |
| Continue watching | ✅ | `WatchProgress` model |
| My List (favorites) | ✅ | `Favorite` model |
| 1–10 star ratings | ✅ | `Rating` model |
| Basic recommendations | ✅ | `recommendations.ts` |
| Similar films | ✅ | Same file |
| Advanced search/filters | ✅ | `film-filters.ts` |
| People/cast directory | ✅ | `Person`, `FilmCredit` |
| Public film pages (SEO) | ✅ | `/films/[id]` |
| Subscriptions + trial | ✅ | Stripe + `subscription.ts` |
| Admin CRUD | ✅ | `/admin/*` |
| Keyboard shortcuts (partial) | ✅ | Search focus, Esc, ? |
| Watch progress save | ⚠️ Estimated from time open | Not YouTube API |

---

## 4. Gaps vs product vision

### Critical (P0)

| Gap | Impact |
|-----|--------|
| YouTube iframe player | No quality selector, no true resume, no preload, no cinema mode |
| Single `category` field | No moods, no multi-genre, no country/language |
| No collections system | Missing key differentiator vs Netflix rows |
| Runtime not prominent enough | Short-form UX requires duration-first design |
| No `/watch/:id` dedicated route | Player buried in modal |
| No autoplay-next toggle | Core short-form binge behavior missing |
| Progress tracking is estimated | Inaccurate resume playback |

### High (P1)

| Gap | Impact |
|-----|--------|
| No mood-based discovery | emotional, dark, surreal, etc. |
| No trending / country trending | Localization missing |
| No quick-watch filter (<10 min) | Short-form optimization incomplete |
| Film detail page not cinematic | Poster layout, no hero video |
| No search autocomplete | Required in spec |
| No dedicated `/search` route | Filters live on browse only |
| URL shortener module in repo | Product confusion, schema bloat |

### Medium (P2)

| Gap | Impact |
|-----|--------|
| No HLS/adaptive streaming | Requires Mux/Cloudflare Stream |
| No comments | Optional social layer |
| No follow directors | Phase 2 social |
| No AI mood tagging | High value optional |
| No automated tests | Regression risk |
| In-memory rate limiting | Broken on serverless scale |
| Admin: no collection manager | Needed for curation |

### Low (P3)

| Gap | Impact |
|-----|--------|
| Light mode | Spec says dark cinematic only |
| Public user profiles | Optional |
| Simultaneous stream limits | Advertised but not enforced |

---

## 5. UI/UX inconsistencies

1. **Player is a modal**, not full-screen cinematic — Netflix uses dedicated watch experience
2. **Duration shown in detail** but not as primary badge on posters in all contexts
3. **Genre nav** uses drama/comedy/animation/sci-fi — spec wants mood + duration tiers
4. **Guest vs subscriber browse** share `/browse` with different components — good, but routing is confusing
5. **Film public page** is marketing-oriented, not cinematic hero
6. **Link dashboard** (`/dashboard`) conflicts with streaming brand
7. **Loading states** exist (skeletons) but player has spinner only
8. **Keyboard shortcuts** don't include space/arrows/fullscreen in player

---

## 6. Performance issues

| Issue | Severity |
|-------|----------|
| Full film list loaded on every browse request | Medium |
| No ISR/cache for public film metadata | Medium |
| YouTube iframe lazy-loads but no next-film preload | High for binge UX |
| No image priority strategy on rows | Low |
| `db push` + full seed on every Vercel deploy | Medium |
| SQLite for analytics-heavy view events | High at scale |

---

## 7. Scalability issues

| Component | Current | At scale |
|-----------|---------|----------|
| Database | SQLite/Turso | PostgreSQL + read replicas |
| Video | YouTube embeds | Mux / Cloudflare Stream + HLS |
| View/click events | Sync inserts | Event queue + aggregation |
| Rate limiting | In-memory Map | Redis / Upstash |
| Search | Client-side filter | Postgres full-text / Typesense |
| Recommendations | In-memory scoring | Offline ML pipeline |

---

## 8. Current data models

### Streaming (core)

- **User** — auth, subscription, Stripe IDs
- **Film** — title, description, category (single), duration, year, poster, videoUrl, rating, featured
- **Person** + **FilmCredit** — cast/crew
- **Favorite**, **Rating**, **ViewEvent**, **WatchProgress** — engagement
- **UserSession** — device sessions (partially wired)

### Non-streaming (should remove)

- **Workspace**, **Link**, **ClickEvent**, **Folder**, **Tag** — URL shortener

---

## 9. Proposed database schema

### Film (extended)

```prisma
model Film {
  id               String   @id @default(cuid())
  title            String
  description      String
  category         String   // primary genre (backward compat)
  genres           String   @default("[]")  // JSON: ["drama","sci-fi"]
  moods            String   @default("[]")  // JSON: ["emotional","dark"]
  tags             String   @default("[]")  // freeform JSON
  language         String   @default("en")
  country          String?
  duration         Int      // minutes, max 30 enforced in validation
  year             Int
  posterUrl        String
  videoUrl         String
  rating           Float    @default(0)
  featured         Boolean  @default(false)
  published        Boolean  @default(true)
  monthlyFreeMonth String?
  trendingScore    Float    @default(0)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  // relations unchanged
}
```

### Collection (new)

```prisma
model Collection {
  id          String   @id @default(cuid())
  slug        String   @unique
  title       String
  description String
  heroUrl     String?
  featured    Boolean  @default(false)
  country     String?
  mood        String?
  sortOrder   Int      @default(0)
  published   Boolean  @default(true)
  films       CollectionFilm[]
}

model CollectionFilm {
  collectionId String
  filmId       String
  sortOrder    Int @default(0)
  @@id([collectionId, filmId])
}
```

### Duration tiers (computed, not stored)

| Tier | Range | Label |
|------|-------|-------|
| micro | < 5 min | Micro film |
| short | 5–10 min | Short film |
| extended | 10–30 min | Extended short |

---

## 10. Target routing

| Route | Purpose | Current |
|-------|---------|---------|
| `/` | Home feed | ✅ |
| `/browse` | Authenticated catalog | ✅ |
| `/film/[id]` | Film detail (premium) | `/films/[id]` — add alias |
| `/watch/[id]` | Full-screen player | ❌ modal only |
| `/collections/[slug]` | Curated collection | ❌ |
| `/search` | Advanced search + autocomplete | ❌ inline on browse |
| `/profile/[user]` | Public profile | ❌ |
| `/admin` | Admin panel | ✅ |

---

## 11. Phased implementation roadmap

### Phase 1 — Foundation (Week 1) ← **START HERE**

- [x] Architecture audit (this document)
- [ ] Extend Film schema: moods, genres, language, country, tags, published
- [ ] Add Collection + CollectionFilm models
- [ ] `film-metadata.ts`: duration tiers, mood constants, formatters
- [ ] Prominent runtime badges on all film cards
- [ ] Quick watch filter (<10 min)
- [ ] Mood filter + mood browse rows
- [ ] Collections API + featured rows on home
- [ ] Seed curated collections
- [ ] `/collections/[slug]` page

### Phase 2 — Cinematic player (Week 2)

- [ ] `/watch/[id]` full-screen route
- [ ] Cinema mode (black immersive UI)
- [ ] Autoplay-next toggle + queue
- [ ] Player keyboard shortcuts (space, arrows, f)
- [ ] Preload next film metadata
- [ ] YouTube IFrame API for accurate progress

### Phase 3 — Discovery engine (Week 3)

- [ ] Trending films (7-day view velocity)
- [ ] Country-based trending rows
- [ ] "Because you watched X" personalized row
- [ ] Improved recommendation scoring (mood + genre + director)
- [ ] `/search` page with autocomplete API

### Phase 4 — Film detail redesign (Week 4)

- [ ] Cinematic hero on `/film/[id]`
- [ ] Director spotlight, cast grid
- [ ] Related films + "Watch next" CTA
- [ ] Route aliases `/film/` → `/films/`

### Phase 5 — Admin & creator tools (Week 5)

- [ ] Collection manager in admin
- [ ] Mood/genre tag editor on films
- [ ] Publish/unpublish workflow
- [ ] Featured collection picker

### Phase 6 — Streaming infrastructure (Week 6+)

- [ ] Mux or Cloudflare Stream integration
- [ ] HLS adaptive bitrate
- [ ] Quality selector (720p/1080p/4K)

### Phase 7 — AI & social (optional)

- [ ] AI mood auto-tagging
- [ ] AI synopsis generation
- [ ] Comments (lightweight)
- [ ] Follow directors

### Phase 8 — Production hardening

- [ ] Remove URL shortener module
- [ ] Prisma migrations (PostgreSQL target)
- [ ] Vitest + Playwright
- [ ] Upstash rate limiting
- [ ] Metadata caching (unstable_cache)

---

## 12. Module structure (target)

```
src/
├── app/
│   ├── (streaming)/
│   │   ├── page.tsx              # home
│   │   ├── browse/
│   │   ├── watch/[id]/
│   │   ├── film/[id]/
│   │   ├── collections/[slug]/
│   │   └── search/
│   └── api/
│       ├── films/
│       └── collections/
├── components/
│   ├── player/                   # CinemaPlayer, WatchQueue
│   ├── discovery/                # FilmRow, CollectionRow, MoodPills
│   └── film/                     # FilmCard, RuntimeBadge, MoodTags
└── lib/
    ├── film-metadata.ts
    ├── recommendations.ts
    └── collections.ts
```

---

## 13. Success metrics

| Metric | Target |
|--------|--------|
| Time to first film play | < 2s (Vercel) |
| Films under 30 min | 100% enforced |
| Runtime visible on cards | 100% |
| Collections on home | ≥ 3 featured rows |
| Resume accuracy | ±5% (after YouTube API) |
| Lighthouse performance | 90+ |

---

## 14. Immediate next actions

1. Implement Phase 1 schema + metadata + collections
2. Remove or flag URL shortener routes for later deletion
3. Add runtime-first UI across FilmCard, Hero, public pages
4. Ship `/collections/[slug]` and mood/quick-watch filters
