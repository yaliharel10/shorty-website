export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { z } from "zod";

const progressSchema = z.object({
  progressPercent: z.number().int().min(0).max(100),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id: filmId } = await params;
    const { progressPercent } = progressSchema.parse(await request.json());

    const film = await prisma.film.findUnique({ where: { id: filmId }, select: { id: true } });
    if (!film) return apiError("Film not found", 404);

    const progress = await prisma.watchProgress.upsert({
      where: { userId_filmId: { userId: session.id, filmId } },
      create: { userId: session.id, filmId, progressPercent },
      update: { progressPercent },
    });

    return NextResponse.json({ progressPercent: progress.progressPercent });
  } catch (error) {
    return handleApiError(error, "Failed to save progress");
  }
}
