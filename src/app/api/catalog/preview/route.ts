export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError, enforceRateLimit, PUBLIC_CACHE_HEADERS } from "@/lib/api-utils";

/** Public catalog teaser for landing page — no auth required. */
export async function GET(request: Request) {
  try {
    const limited = await enforceRateLimit(request, "catalog-preview", 120, 60_000);
    if (limited) return limited;

    const publishedWhere = { published: true };

    const [filmCount, films, categories] = await Promise.all([
      prisma.film.count({ where: publishedWhere }),
      prisma.film.findMany({
        where: publishedWhere,
        orderBy: { rating: "desc" },
        take: 8,
        select: {
          id: true,
          title: true,
          posterUrl: true,
          category: true,
          rating: true,
          duration: true,
        },
      }),
      prisma.film.findMany({
        where: publishedWhere,
        select: { category: true },
        distinct: ["category"],
      }),
    ]);

    return NextResponse.json(
      {
        filmCount,
        genreCount: categories.length,
        featured: films,
      },
      { headers: PUBLIC_CACHE_HEADERS }
    );
  } catch (error) {
    return handleApiError(error, "Failed to load catalog preview");
  }
}
