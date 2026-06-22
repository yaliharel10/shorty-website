export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

/** Public catalog teaser for landing page — no auth required. */
export async function GET() {
  try {
    const [filmCount, films, categories] = await Promise.all([
      prisma.film.count(),
      prisma.film.findMany({
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
      prisma.film.findMany({ select: { category: true }, distinct: ["category"] }),
    ]);

    return NextResponse.json({
      filmCount,
      genreCount: categories.length,
      featured: films,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load catalog preview");
  }
}
