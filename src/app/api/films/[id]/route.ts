export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
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
      canWatch = canWatch || (dbUser ? hasStreamingAccess(dbUser) : false);
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

    if (session) {
      const [favorite, rating] = await Promise.all([
        prisma.favorite.findUnique({
          where: { userId_filmId: { userId: session.id, filmId: id } },
        }),
        prisma.rating.findUnique({
          where: { userId_filmId: { userId: session.id, filmId: id } },
        }),
      ]);
      isFavorite = !!favorite;
      userRating = rating?.score ?? null;

      await prisma.viewEvent.create({
        data: { filmId: id, userId: session.id },
      });
    } else {
      await prisma.viewEvent.create({
        data: { filmId: id, userId: null },
      });
    }

    return NextResponse.json({ film, isFavorite, userRating });
  } catch (error) {
    return handleApiError(error, "Failed to load film");
  }
}
