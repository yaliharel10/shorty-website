export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const limited = await enforceRateLimit(request, "favorites", 30, 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getSession();
    if (!session) {
      return apiError("Login required", 401);
    }

    const { id } = await params;

    const film = await prisma.film.findUnique({ where: { id }, select: { id: true } });
    if (!film) {
      return apiError("Film not found", 404);
    }

    const existing = await prisma.favorite.findUnique({
      where: { userId_filmId: { userId: session.id, filmId: id } },
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      return NextResponse.json({ isFavorite: false });
    }

    await prisma.favorite.create({
      data: { userId: session.id, filmId: id },
    });

    return NextResponse.json({ isFavorite: true });
  } catch (error) {
    return handleApiError(error, "Failed to update favorites");
  }
}
