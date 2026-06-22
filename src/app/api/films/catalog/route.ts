export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { isNewFilm } from "@/lib/recommendations";
import { genreLabel } from "@/lib/film-filters";

const publicFilmSelect = {
  id: true,
  title: true,
  description: true,
  category: true,
  rating: true,
  posterUrl: true,
  duration: true,
  year: true,
  featured: true,
  createdAt: true,
} as const;

/** Public catalog for guest browse — metadata only, no video URLs. */
export async function GET() {
  try {
    const allFilms = await prisma.film.findMany({
      select: publicFilmSelect,
      orderBy: { createdAt: "desc" },
    });

    const featured = allFilms.find((f) => f.featured) || allFilms[0] || null;
    const topRated = [...allFilms].sort((a, b) => b.rating - a.rating).slice(0, 10);
    const newReleases = [...allFilms]
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 12);
    const newFilmIds = allFilms.filter((f) => isNewFilm(f.createdAt)).map((f) => f.id);

    const byCategory = ["drama", "comedy", "animation", "sci-fi"].map((cat) => ({
      category: cat,
      label: genreLabel(cat),
      films: allFilms.filter((f) => f.category === cat).slice(0, 12),
    }));

    return NextResponse.json({
      filmCount: allFilms.length,
      featured,
      topRated,
      newReleases,
      newFilmIds,
      byCategory,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load catalog");
  }
}
