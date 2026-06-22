export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { buildFilterMeta } from "@/lib/film-filters";

/** Filter metadata (genres, year/rating/duration ranges) for the browse UI. */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Sign in to browse films", 401);
    }

    const films = await prisma.film.findMany({
      select: {
        id: true,
        title: true,
        description: true,
        category: true,
        rating: true,
        year: true,
        duration: true,
        createdAt: true,
      },
    });

    return NextResponse.json(buildFilterMeta(films));
  } catch (error) {
    return handleApiError(error, "Failed to load filter options");
  }
}
