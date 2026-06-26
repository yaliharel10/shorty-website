export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { trackEvent } from "@/lib/analytics";
import { getSimilarFilms } from "@/lib/recommendations";
import { enrichFilmMetadata, filmGenres, filmMoods, filmTags } from "@/lib/film-metadata";
import { isFilmMonthlyFree } from "@/lib/monthly-free";
import { hasStreamingAccess } from "@/lib/subscription";
import { userSessionSelect } from "@/lib/user-session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = await enforceRateLimit(_request, "film-detail", 120, 60_000);
    if (limited) return limited;

    const { id } = await params;
    const session = await getSession();

    const film = await prisma.film.findUnique({
      where: { id },
      include: {
        credits: {
          include: {
            person: {
              select: {
                id: true,
                slug: true,
                name: true,
                bio: true,
                imgUrl: true,
                primaryRole: true,
              },
            },
          },
        },
        _count: { select: { ratings: true, favorites: true, views: true } },
      },
    });

    if (!film) {
      return apiError("Film not found", 404);
    }

    if (!film.published && session?.role !== "admin") {
      return apiError("Film not found", 404);
    }

    const monthlyFree = await isFilmMonthlyFree(id);
    if (!session && !monthlyFree) {
      return apiError("Sign in to watch this film", 401);
    }

    let canWatch = monthlyFree;
    if (session) {
      const dbUser = await prisma.user.findUnique({
        where: { id: session.id },
        select: userSessionSelect,
      });

      if (!dbUser) {
        return apiError("Your session expired — please sign in again", 401);
      }

      canWatch = canWatch || hasStreamingAccess(dbUser);
    }

    if (!canWatch) {
      const { videoUrl: _, ...filmPreview } = film;
      return NextResponse.json(
        {
          error: "Subscribe to watch this film",
          code: "SUBSCRIPTION_REQUIRED",
          film: filmPreview,
        },
        { status: 403 }
      );
    }

    let isFavorite = false;
    let userRating: number | null = null;
    let hasWatched = false;
    let progressPercent = 0;

    if (session) {
      const [favorite, rating, priorView, progress] = await Promise.all([
        prisma.favorite.findUnique({
          where: { userId_filmId: { userId: session.id, filmId: id } },
        }),
        prisma.rating.findUnique({
          where: { userId_filmId: { userId: session.id, filmId: id } },
        }),
        prisma.viewEvent.findFirst({
          where: { userId: session.id, filmId: id },
          select: { id: true },
        }),
        prisma.watchProgress.findUnique({
          where: { userId_filmId: { userId: session.id, filmId: id } },
          select: { progressPercent: true },
        }),
      ]);
      isFavorite = !!favorite;
      userRating = rating?.score ?? null;
      hasWatched = !!priorView;
      progressPercent = progress?.progressPercent ?? 0;

      await prisma.viewEvent.create({
        data: { filmId: id, userId: session.id },
      });
      trackEvent("film_viewed", { filmId: id, title: film.title }, session.id);
    } else {
      await prisma.viewEvent.create({
        data: { filmId: id, userId: null },
      });
      trackEvent("film_viewed", { filmId: id, title: film.title });
    }

    const candidates = await prisma.film.findMany({
      where: {
        published: true,
        id: { not: id },
        OR: [{ category: film.category }, { rating: { gte: film.rating - 1 } }],
      },
      take: 50,
      orderBy: { rating: "desc" },
      include: {
        _count: { select: { ratings: true, favorites: true, views: true } },
        credits: { select: { personId: true, role: true } },
      },
    });

    const candidateIds = candidates.map((f) => f.id);
    const globalRatings = candidateIds.length
      ? await prisma.rating.findMany({
          where: { filmId: { in: candidateIds } },
          select: { userId: true, filmId: true, score: true },
        })
      : [];

    const filmForRec = {
      ...film,
      credits: film.credits.map((c) => ({
        personId: c.personId,
        role: c.role,
      })),
      moods: filmMoods(film),
      genres: filmGenres(film),
      tags: filmTags(film),
    };

    const similar = getSimilarFilms(
      filmForRec,
      candidates.map((f) => ({
        ...f,
        credits: f.credits,
        moods: filmMoods(f),
        genres: filmGenres(f),
        tags: filmTags(f),
      })),
      6,
      globalRatings
    );

    return NextResponse.json({
      film: enrichFilmMetadata(film),
      isFavorite,
      userRating,
      hasWatched,
      progressPercent,
      similar: similar.map((s) => enrichFilmMetadata(s)),
    });
  } catch (error) {
    return handleApiError(error, "Failed to load film");
  }
}
