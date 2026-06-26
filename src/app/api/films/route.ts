export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { trackEvent } from "@/lib/analytics";
import {
  getFeaturedCollections,
  getQuickWatchFilms,
  getTrendingFilms,
  serializeCollection,
} from "@/lib/collections";
import { sanitizeFilmForClient, sanitizeFilmsForClient } from "@/lib/film-access";
import {
  loadContinueWatching,
  loadCuratedBrowseRows,
  loadPaginatedFilms,
  loadRecommendationPool,
} from "@/lib/films-browse";
import { parseFilmFilters } from "@/lib/film-filters";
import { getMonthlyFreeFilm } from "@/lib/monthly-free";
import { hasStreamingAccess } from "@/lib/subscription";
import { userSessionSelect } from "@/lib/user-session";
import { getActiveProfile } from "@/lib/active-profile";

export async function GET(request: Request) {
  try {
    const limited = await enforceRateLimit(request, "films-browse", 180, 60_000);
    if (limited) return limited;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search")?.trim().slice(0, 100) || "";
    const favoritesOnly = searchParams.get("favorites") === "true";
    const cursor = searchParams.get("cursor");
    const limit = Number.parseInt(searchParams.get("limit") || "24", 10);
    const filters = parseFilmFilters(searchParams);
    const session = await getSession();

    if (!session) {
      return apiError("Sign in to browse films", 401);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: userSessionSelect,
    });

    if (!dbUser) {
      return apiError("Your session expired — please sign in again", 401);
    }

    const streamingAccess = hasStreamingAccess(dbUser);
    const profile = await getActiveProfile(session.id);
    const kidsOnly = profile?.isKids ?? false;
    const monthlyFree = await getMonthlyFreeFilm();
    const accessOptions = {
      hasStreamingAccess: streamingAccess,
      monthlyFreeFilmId: monthlyFree?.film.id ?? null,
    };

    if (search) {
      trackEvent("search_used", { query: search }, session.id);
    }

    const [
      favorites,
      ratings,
      views,
      progressRows,
      curated,
      trending,
      quickWatch,
      featuredCollections,
    ] = await Promise.all([
      prisma.favorite.findMany({
        where: { userId: session.id },
        select: { filmId: true },
      }),
      prisma.rating.findMany({
        where: { userId: session.id },
        select: { filmId: true, score: true },
      }),
      prisma.viewEvent.findMany({
        where: { userId: session.id },
        select: { filmId: true },
        orderBy: { createdAt: "desc" },
      }),
      prisma.watchProgress.findMany({
        where: { userId: session.id },
        select: { filmId: true, progressPercent: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
      }),
      loadCuratedBrowseRows(),
      getTrendingFilms(10),
      getQuickWatchFilms(12),
      getFeaturedCollections(4),
    ]);

    const favoriteIds = favorites.map((f) => f.filmId);
    const watchedIds = [...new Set(views.map((v) => v.filmId))];
    const userRatings = Object.fromEntries(ratings.map((r) => [r.filmId, r.score]));
    const watchProgress = Object.fromEntries(
      progressRows.map((p) => [p.filmId, p.progressPercent])
    );

    const [paginatedResult, continueWatching, recommendedForYou] = await Promise.all([
      loadPaginatedFilms({
        category,
        search,
        filters,
        favoritesOnly,
        favoriteIds,
        cursor,
        limit,
        kidsOnly,
      }),
      loadContinueWatching(progressRows, views),
      loadRecommendationPool({
        favoriteIds,
        ratings: userRatings,
        watchProgress,
        watchedIds,
      }),
    ]);

    const sanitize = <T extends { id: string; videoUrl: string }>(items: T[]) =>
      sanitizeFilmsForClient(items, accessOptions);

    const collections = featuredCollections.map((collection) => {
      const serialized = serializeCollection(collection);
      return {
        ...serialized,
        films: sanitize(serialized.films),
      };
    });

    return NextResponse.json(
      {
        films: sanitize(paginatedResult.films),
        nextCursor: paginatedResult.nextCursor,
        featured: curated.featured
          ? sanitizeFilmForClient(curated.featured, accessOptions)
          : null,
        topRated: sanitize(curated.topRated),
        newReleases: sanitize(curated.newReleases),
        recommendedForYou: sanitize(recommendedForYou),
        continueWatching: sanitize(continueWatching),
        trending: sanitize(trending),
        quickWatch: sanitize(quickWatch),
        collections,
        byCategory: curated.byCategory.map((row) => ({
          ...row,
          films: sanitize(row.films),
        })),
        favoriteIds,
        watchedIds,
        newFilmIds: curated.newFilmIds,
        watchProgress,
        userRatings,
        hasStreamingAccess: streamingAccess,
        resultCount: paginatedResult.resultCount,
      },
      {
        headers: {
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
        },
      }
    );
  } catch (error) {
    return handleApiError(error, "Failed to load films");
  }
}
