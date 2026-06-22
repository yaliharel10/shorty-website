export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { getSimilarFilms, type FilmWithPeople } from "@/lib/recommendations";
import { isFilmMonthlyFree } from "@/lib/monthly-free";
import { hasStreamingAccess } from "@/lib/subscription";
import { userSessionSelect } from "@/lib/user-session";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
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
    } else {
      await prisma.viewEvent.create({
        data: { filmId: id, userId: null },
      });
    }

    const allFilms = await prisma.film.findMany({
      include: {
        _count: { select: { ratings: true, favorites: true, views: true } },
        credits: { select: { personId: true } },
      },
    });

    const similar = getSimilarFilms(
      {
        ...film,
        credits: film.credits.map((c) => ({ personId: c.personId })),
      } satisfies FilmWithPeople,
      allFilms.map((f) => ({
        ...f,
        credits: f.credits,
      })),
      6
    );

    return NextResponse.json({
      film,
      isFavorite,
      userRating,
      hasWatched,
      progressPercent,
      similar,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load film");
  }
}
