import { prisma } from "@/lib/db";
import { enrichFilmMetadata, filmGenres, filmMoods, filmTags } from "@/lib/film-metadata";
import {
  applyFilmFilters,
  hasActiveFilmFilters,
  parseFilmFilters,
  sortFilms,
  type FilmFilterState,
} from "@/lib/film-filters";
import { getRecommendedForUser, isNewFilm } from "@/lib/recommendations";
import type { Prisma } from "@prisma/client";

export const filmListInclude = {
  _count: { select: { ratings: true, favorites: true, views: true } },
  credits: { select: { personId: true, role: true } },
} as const;

type FilmWithInclude = Prisma.FilmGetPayload<{ include: typeof filmListInclude }>;

export function enrichList<T extends Parameters<typeof enrichFilmMetadata>[0]>(
  films: T[]
) {
  return films.map((f) => enrichFilmMetadata(f));
}

const CATEGORY_ROWS = ["drama", "comedy", "animation", "sci-fi"] as const;

export async function loadCuratedBrowseRows() {
  const [featured, topRated, newReleases, ...categoryResults] = await Promise.all([
    prisma.film.findFirst({
      where: { published: true, featured: true },
      include: filmListInclude,
    }),
    prisma.film.findMany({
      where: { published: true },
      orderBy: { rating: "desc" },
      take: 10,
      include: filmListInclude,
    }),
    prisma.film.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 12,
      include: filmListInclude,
    }),
    ...CATEGORY_ROWS.map((category) =>
      prisma.film.findMany({
        where: { published: true, category },
        orderBy: { rating: "desc" },
        take: 12,
        include: filmListInclude,
      })
    ),
  ]);

  const newFilmRows = await prisma.film.findMany({
    where: { published: true },
    select: { id: true, createdAt: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const newFilmIds = newFilmRows.filter((f) => isNewFilm(f.createdAt)).map((f) => f.id);

  const byCategory = CATEGORY_ROWS.map((category, index) => ({
    category,
    films: enrichList(categoryResults[index] ?? []),
  }));

  return {
    featured: featured ? enrichFilmMetadata(featured) : null,
    topRated: enrichList(topRated),
    newReleases: enrichList(newReleases),
    newFilmIds,
    byCategory,
  };
}

export async function loadRecommendationPool(userSignals: {
  favoriteIds: string[];
  ratings: Record<string, number>;
  watchProgress: Record<string, number>;
  watchedIds: string[];
}) {
  const candidatePool = await prisma.film.findMany({
    where: { published: true },
    orderBy: [{ rating: "desc" }, { createdAt: "desc" }],
    take: 80,
    include: filmListInclude,
  });

  const candidateIds = candidatePool.map((f) => f.id);
  const globalRatings = candidateIds.length
    ? await prisma.rating.findMany({
        where: { filmId: { in: candidateIds } },
        select: { userId: true, filmId: true, score: true },
      })
    : [];

  const filmsForRecs = candidatePool.map((f) => ({
    ...f,
    moods: filmMoods(f),
    genres: filmGenres(f),
    tags: filmTags(f),
  }));

  return getRecommendedForUser(filmsForRecs, userSignals, {
    limit: 12,
    globalRatings,
  });
}

export async function loadContinueWatching(
  progressRows: { filmId: string; progressPercent: number }[],
  viewEvents: { filmId: string }[]
) {
  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const row of progressRows) {
    if (seen.has(row.filmId)) continue;
    if (row.progressPercent >= 95) continue;
    orderedIds.push(row.filmId);
    seen.add(row.filmId);
    if (orderedIds.length >= 8) break;
  }

  if (orderedIds.length < 8) {
    for (const view of viewEvents) {
      if (seen.has(view.filmId)) continue;
      orderedIds.push(view.filmId);
      seen.add(view.filmId);
      if (orderedIds.length >= 8) break;
    }
  }

  if (orderedIds.length === 0) return [];

  const films = await prisma.film.findMany({
    where: { id: { in: orderedIds }, published: true },
    include: filmListInclude,
  });
  const byId = new Map(films.map((f) => [f.id, f]));
  return orderedIds
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((f) => enrichFilmMetadata(f!));
}

function buildPrismaWhere(
  filters: FilmFilterState,
  category: string,
  creditFilmIds: Set<string>,
  search: string
): Prisma.FilmWhereInput {
  const where: Prisma.FilmWhereInput = { published: true };

  if (category !== "all" && category !== "top" && category !== "new") {
    where.category = category;
  }

  if (filters.languages.length === 1) {
    where.language = filters.languages[0];
  } else if (filters.languages.length > 1) {
    where.language = { in: filters.languages };
  }

  if (filters.countries.length === 1) {
    where.country = filters.countries[0];
  } else if (filters.countries.length > 1) {
    where.country = { in: filters.countries };
  }

  if (filters.yearFrom != null || filters.yearTo != null) {
    where.year = {
      ...(filters.yearFrom != null ? { gte: filters.yearFrom } : {}),
      ...(filters.yearTo != null ? { lte: filters.yearTo } : {}),
    };
  }

  if (filters.minRating != null) {
    where.rating = { gte: filters.minRating };
  }

  if (filters.minDuration != null || filters.maxDuration != null) {
    where.duration = {
      ...(filters.minDuration != null ? { gte: filters.minDuration } : {}),
      ...(filters.maxDuration != null ? { lte: filters.maxDuration } : {}),
    };
  }

  if (filters.quickWatch) {
    where.duration = { ...(where.duration as object), lte: 10 };
  }

  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      ...(creditFilmIds.size > 0
        ? [{ id: { in: [...creditFilmIds] } }]
        : []),
    ];
  }

  return where;
}

export async function loadPaginatedFilms(options: {
  category: string;
  search: string;
  filters: FilmFilterState;
  favoritesOnly: boolean;
  favoriteIds: string[];
  cursor?: string | null;
  limit?: number;
}) {
  const {
    category,
    search,
    filters,
    favoritesOnly,
    favoriteIds,
    cursor,
    limit = 24,
  } = options;

  const pageSize = Math.min(48, Math.max(1, limit));
  const advancedFilters = hasActiveFilmFilters(filters);
  const useAdvancedBrowse = advancedFilters || Boolean(search);

  let creditFilmIds = new Set<string>();
  if (search) {
    const creditMatches = await prisma.filmCredit.findMany({
      where: { person: { name: { contains: search } } },
      select: { filmId: true },
    });
    creditFilmIds = new Set(creditMatches.map((c) => c.filmId));
  }

  if (favoritesOnly) {
    if (favoriteIds.length === 0) {
      return { films: [], nextCursor: null, resultCount: 0 };
    }
    const films = await prisma.film.findMany({
      where: { id: { in: favoriteIds }, published: true },
      include: filmListInclude,
      orderBy: { createdAt: "desc" },
    });
    return {
      films: enrichList(films),
      nextCursor: null,
      resultCount: films.length,
    };
  }

  if (category === "top" && !useAdvancedBrowse) {
    const films = await prisma.film.findMany({
      where: { published: true },
      orderBy: { rating: "desc" },
      take: 8,
      include: filmListInclude,
    });
    return { films: enrichList(films), nextCursor: null, resultCount: films.length };
  }

  if (category === "new" && !useAdvancedBrowse) {
    const films = await prisma.film.findMany({
      where: { published: true },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: filmListInclude,
    });
    return { films: enrichList(films), nextCursor: null, resultCount: films.length };
  }

  if (!useAdvancedBrowse && category !== "all") {
    const films = await prisma.film.findMany({
      where: { published: true, category },
      orderBy: { rating: "desc" },
      include: filmListInclude,
    });
    return {
      films: enrichList(films),
      nextCursor: null,
      resultCount: films.length,
    };
  }

  if (!useAdvancedBrowse && category === "all") {
    return { films: [], nextCursor: null, resultCount: 0 };
  }

  const where = buildPrismaWhere(filters, category, creditFilmIds, search);
  const batch = await prisma.film.findMany({
    where,
    include: filmListInclude,
    orderBy: { createdAt: "desc" },
    take: Math.min(200, pageSize * 4),
  });

  let films: FilmWithInclude[] = batch;
  if (advancedFilters || search) {
    films = applyFilmFilters(films, filters, creditFilmIds, search);
    const defaultSort = search
      ? filters.sort
      : filters.sort === "relevance"
        ? "rating"
        : filters.sort;
    films = sortFilms(films, defaultSort, search);
  }

  const resultCount = films.length;
  let startIndex = 0;
  if (cursor) {
    const cursorIndex = films.findIndex((f) => f.id === cursor);
    startIndex = cursorIndex >= 0 ? cursorIndex + 1 : 0;
  }

  const page = films.slice(startIndex, startIndex + pageSize);
  const hasMore = startIndex + pageSize < films.length;
  const nextCursor = hasMore ? page[page.length - 1]?.id ?? null : null;

  return {
    films: enrichList(page),
    nextCursor,
    resultCount,
  };
}
