import { prisma } from "@/lib/db";
import { enrichFilmMetadata } from "@/lib/film-metadata";

const filmSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  genres: true,
  moods: true,
  tags: true,
  language: true,
  country: true,
  rating: true,
  posterUrl: true,
  videoUrl: true,
  featured: true,
  published: true,
  duration: true,
  year: true,
  monthlyFreeMonth: true,
  trendingScore: true,
  createdAt: true,
} as const;

export async function getFeaturedCollections(limit = 6) {
  return prisma.collection.findMany({
    where: { published: true, featured: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
    include: {
      films: {
        orderBy: { sortOrder: "asc" },
        take: 12,
        include: { film: { select: filmSelect } },
      },
    },
  });
}

export async function getCollectionBySlug(slug: string) {
  return prisma.collection.findFirst({
    where: { slug, published: true },
    include: {
      films: {
        orderBy: { sortOrder: "asc" },
        include: { film: { select: filmSelect } },
      },
    },
  });
}

export function serializeCollection(
  collection: NonNullable<Awaited<ReturnType<typeof getCollectionBySlug>>>
) {
  return {
    id: collection.id,
    slug: collection.slug,
    title: collection.title,
    description: collection.description,
    heroUrl: collection.heroUrl,
    featured: collection.featured,
    country: collection.country,
    mood: collection.mood,
    films: collection.films
      .filter((entry) => entry.film.published)
      .map((entry) => enrichFilmMetadata(entry.film)),
  };
}

export async function getTrendingFilms(limit = 10, country?: string | null) {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const viewCounts = await prisma.viewEvent.groupBy({
    by: ["filmId"],
    where: {
      createdAt: { gte: since },
      film: {
        published: true,
        ...(country ? { country } : {}),
      },
    },
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: limit,
  });

  if (viewCounts.length === 0) {
    const fallback = await prisma.film.findMany({
      where: { published: true, ...(country ? { country } : {}) },
      orderBy: [{ trendingScore: "desc" }, { rating: "desc" }],
      take: limit,
      select: filmSelect,
    });
    return fallback.map(enrichFilmMetadata);
  }

  const ids = viewCounts.map((v) => v.filmId);
  const films = await prisma.film.findMany({
    where: { id: { in: ids }, published: true },
    select: filmSelect,
  });

  const byId = new Map(films.map((f) => [f.id, f]));
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((f) => enrichFilmMetadata(f!));
}

export async function getQuickWatchFilms(limit = 12) {
  const films = await prisma.film.findMany({
    where: { published: true, duration: { lte: 10 } },
    orderBy: [{ rating: "desc" }, { duration: "asc" }],
    take: limit,
    select: filmSelect,
  });
  return films.map(enrichFilmMetadata);
}

export async function getFilmsByMood(mood: string, limit = 12) {
  const films = await prisma.film.findMany({
    where: {
      published: true,
      moods: { contains: `"${mood}"` },
    },
    orderBy: { rating: "desc" },
    take: limit,
    select: filmSelect,
  });
  return films.map(enrichFilmMetadata);
}
