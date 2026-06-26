export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { ratingSchema } from "@/lib/validation";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforceRateLimit(request, "ratings", 30, 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getSession();
    if (!session) {
      return apiError("Login required", 401);
    }

    const { id } = await params;
    const { score } = ratingSchema.parse(await request.json());

    const film = await prisma.film.findUnique({ where: { id }, select: { id: true } });
    if (!film) {
      return apiError("Film not found", 404);
    }

    await prisma.rating.upsert({
      where: { userId_filmId: { userId: session.id, filmId: id } },
      create: { userId: session.id, filmId: id, score },
      update: { score },
    });

    const avg = await prisma.rating.aggregate({
      where: { filmId: id },
      _avg: { score: true },
    });

    if (avg._avg.score) {
      await prisma.film.update({
        where: { id },
        data: { rating: avg._avg.score },
      });
    }

    return NextResponse.json({ score, avgRating: avg._avg.score });
  } catch (error) {
    return handleApiError(error, "Failed to save rating");
  }
}
