export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import {
  getRecommendedForUser,
  isNewFilm,
} from "@/lib/recommendations";
import { hasStreamingAccess } from "@/lib/subscription";
import { userSessionSelect } from "@/lib/user-session";

const filmListInclude = {
  _count: { select: { ratings: true, favorites: true, views: true } },
  credits: { select: { personId: true } },
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
      const creditMatches = await prisma.filmCredit.findMany({
        where: { person: { name: { contains: search } } },
        select: { filmId: true },
      });
      const creditFilmIds = new Set(creditMatches.map((c) => c.filmId));
      films = films.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.category.toLowerCase().includes(q) ||
          creditFilmIds.has(f.id)
      );
    }

    if (category === "top") {
      films = [...films].sort((a, b) => b.rating - a.rating).slice(0, 8);
    } else if (category === "new") {
      films = [...films]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        .slice(0, 20);
    } else if (category !== "all") {
      films = films.filter((f) => f.category === category);
    }

    let favoriteIds: string[] = [];
    let watchedIds: string[] = [];
    let userRatings: Record<string, number> = {};
    let watchProgress: Record<string, number> = {};
    let viewEvents: { filmId: string }[] = [];

    const [favorites, ratings, views, progressRows] = await Promise.all([
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
    ]);

    viewEvents = views;
    favoriteIds = favorites.map((f) => f.filmId);
    watchedIds = [...new Set(views.map((v) => v.filmId))];
    userRatings = Object.fromEntries(ratings.map((r) => [r.filmId, r.score]));
    watchProgress = Object.fromEntries(
      progressRows.map((p) => [p.filmId, p.progressPercent])
    );

    if (favoritesOnly) {
      films = films.filter((f) => favoriteIds.includes(f.id));
    }

    const featured = allFilms.find((f) => f.featured) || allFilms[0] || null;

    const topRated = [...allFilms]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 10);

    const newReleases = [...allFilms]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 12);

    const newFilmIds = allFilms
      .filter((f) => isNewFilm(f.createdAt))
      .map((f) => f.id);

    const recommendedForYou = getRecommendedForUser(
      allFilms,
      watchedIds,
      favoriteIds,
      userRatings
    );

    const filmMap = new Map(allFilms.map((f) => [f.id, f]));
    const continueWatching: typeof allFilms = [];
    const seenContinue = new Set<string>();

    for (const row of progressRows) {
      if (seenContinue.has(row.filmId)) continue;
      if (row.progressPercent >= 95) continue;
      const film = filmMap.get(row.filmId);
      if (film) {
        continueWatching.push(film);
        seenContinue.add(row.filmId);
      }
      if (continueWatching.length >= 8) break;
    }

    if (continueWatching.length < 8) {
      for (const view of viewEvents) {
        if (seenContinue.has(view.filmId)) continue;
        const film = filmMap.get(view.filmId);
        if (film) {
          continueWatching.push(film);
          seenContinue.add(view.filmId);
        }
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
        newReleases,
        recommendedForYou,
        continueWatching,
        byCategory,
        favoriteIds,
        watchedIds,
        newFilmIds,
        watchProgress,
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
