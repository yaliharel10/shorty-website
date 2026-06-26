import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/subscription";

export type FilmWatchStats = {
  filmId: string;
  title: string;
  durationMinutes: number;
  viewCount: number;
  uniqueViewers: number;
  totalWatchSeconds: number;
  avgWatchSeconds: number;
  watchSharePercent: number;
  estimatedPayout: number;
};

export type RevenueSummary = {
  mrr: number;
  activeSubscribers: number;
  creatorPoolPercent: number;
  creatorPoolAmount: number;
  totalWatchSeconds: number;
  totalWatchHours: number;
  totalViews: number;
};

export async function getPlatformSettings() {
  return prisma.platformSettings.upsert({
    where: { id: "default" },
    create: { id: "default", creatorPoolPercent: 50 },
    update: {},
  });
}

export async function calculateMrr() {
  const users = await prisma.user.findMany({
    where: {
      role: { not: "admin" },
      subscriptionStatus: "active",
      subscriptionTier: { not: "none" },
    },
    select: { subscriptionTier: true },
  });

  return users.reduce((sum, u) => sum + (getPlan(u.subscriptionTier)?.price ?? 0), 0);
}

export async function getFilmWatchStats(options?: {
  since?: Date;
  creatorPoolAmount?: number;
}): Promise<{ films: FilmWatchStats[]; totalWatchSeconds: number }> {
  const since = options?.since;
  const where = since ? { createdAt: { gte: since } } : {};

  const [films, viewGroups, uniqueGroups] = await Promise.all([
    prisma.film.findMany({
      select: { id: true, title: true, duration: true },
      orderBy: { title: "asc" },
    }),
    prisma.viewEvent.groupBy({
      by: ["filmId"],
      where,
      _count: { _all: true },
      _sum: { watchSeconds: true },
    }),
    prisma.viewEvent.groupBy({
      by: ["filmId", "userId"],
      where: { ...where, userId: { not: null } },
    }),
  ]);

  const viewMap = new Map(
    viewGroups.map((g) => [
      g.filmId,
      { count: g._count._all, seconds: g._sum.watchSeconds ?? 0 },
    ])
  );

  const uniqueMap = new Map<string, number>();
  for (const row of uniqueGroups) {
    uniqueMap.set(row.filmId, (uniqueMap.get(row.filmId) ?? 0) + 1);
  }

  const totalWatchSeconds = viewGroups.reduce(
    (sum, g) => sum + (g._sum.watchSeconds ?? 0),
    0
  );

  const pool = options?.creatorPoolAmount ?? 0;

  const stats: FilmWatchStats[] = films.map((film) => {
    const views = viewMap.get(film.id);
    const viewCount = views?.count ?? 0;
    const totalWatchSeconds = views?.seconds ?? 0;
    const uniqueViewers = uniqueMap.get(film.id) ?? 0;
    const watchSharePercent =
      totalWatchSeconds > 0
        ? Math.round((totalWatchSeconds / totalWatchSeconds) * 10000) / 100
        : 0;

    return {
      filmId: film.id,
      title: film.title,
      durationMinutes: film.duration,
      viewCount,
      uniqueViewers,
      totalWatchSeconds,
      avgWatchSeconds: viewCount > 0 ? Math.round(totalWatchSeconds / viewCount) : 0,
      watchSharePercent: 0,
      estimatedPayout: 0,
    };
  });

  for (const row of stats) {
    row.watchSharePercent =
      totalWatchSeconds > 0
        ? Math.round((row.totalWatchSeconds / totalWatchSeconds) * 10000) / 100
        : 0;
    row.estimatedPayout =
      totalWatchSeconds > 0
        ? Math.round(((row.totalWatchSeconds / totalWatchSeconds) * pool) * 100) / 100
        : 0;
  }

  stats.sort((a, b) => b.totalWatchSeconds - a.totalWatchSeconds);

  return { films: stats, totalWatchSeconds };
}

export async function getRevenueSummary(periodDays?: number): Promise<RevenueSummary> {
  const [mrr, settings, viewAgg, viewCount] = await Promise.all([
    calculateMrr(),
    getPlatformSettings(),
    getFilmWatchStats(
      periodDays
        ? { since: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) }
        : undefined
    ),
    prisma.viewEvent.count(
      periodDays
        ? { where: { createdAt: { gte: new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000) } } }
        : undefined
    ),
  ]);

  const creatorPoolAmount =
    Math.round(mrr * (settings.creatorPoolPercent / 100) * 100) / 100;

  return {
    mrr: Math.round(mrr * 100) / 100,
    activeSubscribers: await prisma.user.count({
      where: {
        role: { not: "admin" },
        subscriptionStatus: "active",
        subscriptionTier: { not: "none" },
      },
    }),
    creatorPoolPercent: settings.creatorPoolPercent,
    creatorPoolAmount,
    totalWatchSeconds: viewAgg.totalWatchSeconds,
    totalWatchHours: Math.round((viewAgg.totalWatchSeconds / 3600) * 100) / 100,
    totalViews: viewCount,
  };
}

export function csvEscape(value: string | number | null | undefined) {
  const str = value == null ? "" : String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function formatWatchDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}
