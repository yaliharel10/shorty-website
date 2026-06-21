export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { hasStreamingAccess } from "@/lib/subscription";
import { userSessionSelect } from "@/lib/user-session";

const filmListInclude = {
  _count: { select: { ratings: true, favorites: true, views: true } },
} as const;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search")?.trim().slice(0, 100) || "";
    const favoritesOnly = searchParams.get("favorites") === "true";
    const session = await getSession();

    if (!session) {
      return apiError("Sign in to browse films", 401);
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: session.id },
      select: userSessionSelect,
    });
    const streamingAccess = dbUser ? hasStreamingAccess(dbUser) : false;

    const allFilms = await prisma.film.findMany({
      include: filmListInclude,
      orderBy: { createdAt: "desc" },
    });

    let films = allFilms;

    if (search) {
      const q = search.toLowerCase();
      films = films.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q)
      );
    }

    if (category === "top") {
      films = [...films].sort((a, b) => b.rating - a.rating).slice(0, 8);
    } else if (category !== "all") {
      films = films.filter((f) => f.category === category);
    }

    let favoriteIds: string[] = [];
    let userRatings: Record<string, number> = {};

    if (session) {
      const [favorites, ratings] = await Promise.all([
        prisma.favorite.findMany({
          where: { userId: session.id },
          select: { filmId: true },
        }),
        prisma.rating.findMany({
          where: { userId: session.id },
          select: { filmId: true, score: true },
        }),
      ]);
      favoriteIds = favorites.map((f) => f.filmId);
      userRatings = Object.fromEntries(ratings.map((r) => [r.filmId, r.score]));

      if (favoritesOnly) {
        films = films.filter((f) => favoriteIds.includes(f.id));
      }
    } else if (favoritesOnly) {
      films = [];
    }

    const featured = allFilms.find((f) => f.featured) || allFilms[0] || null;

    const topRated = [...allFilms]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    let continueWatching: typeof allFilms = [];
    if (session) {
      const views = await prisma.viewEvent.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        select: { filmId: true },
        take: 50,
      });
      const filmMap = new Map(allFilms.map((f) => [f.id, f]));
      const seen = new Set<string>();
      for (const view of views) {
        if (seen.has(view.filmId)) continue;
        seen.add(view.filmId);
        const film = filmMap.get(view.filmId);
        if (film) continueWatching.push(film);
        if (continueWatching.length >= 8) break;
      }
    }

    const byCategory = ["drama", "comedy", "animation", "sci-fi"].map((cat) => ({
      category: cat,
      films: allFilms.filter((f) => f.category === cat).slice(0, 12),
    }));

    return NextResponse.json(
      {
        films,
        featured,
        topRated,
        continueWatching,
        byCategory,
        favoriteIds,
        userRatings,
        hasStreamingAccess: streamingAccess,
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
