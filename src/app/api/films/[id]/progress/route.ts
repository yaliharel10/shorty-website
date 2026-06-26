export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { trackEvent } from "@/lib/analytics";
import { z } from "zod";

const progressSchema = z.object({
  progressPercent: z.number().int().min(0).max(100).optional(),
  watchSeconds: z.number().int().min(0).max(7200).optional(),
  viewEventId: z.string().min(1).optional(),
});

async function recordWatchDuration(
  filmId: string,
  viewEventId: string,
  watchSeconds: number
) {
  const [event, film] = await Promise.all([
    prisma.viewEvent.findUnique({
      where: { id: viewEventId },
      select: { id: true, filmId: true, watchSeconds: true },
    }),
    prisma.film.findUnique({
      where: { id: filmId },
      select: { duration: true },
    }),
  ]);

  if (!event || event.filmId !== filmId || !film) return;

  const maxSeconds = film.duration * 60;
  const capped = Math.min(Math.max(watchSeconds, 0), maxSeconds);
  if (capped <= event.watchSeconds) return;

  await prisma.viewEvent.update({
    where: { id: viewEventId },
    data: { watchSeconds: capped },
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const limited = await enforceRateLimit(request, "film-progress", 60, 60_000);
    if (limited) return limited;

    const { id: filmId } = await params;
    const body = progressSchema.parse(await request.json());
    const { progressPercent, watchSeconds, viewEventId } = body;

    if (viewEventId && watchSeconds !== undefined) {
      await recordWatchDuration(filmId, viewEventId, watchSeconds);
    }

    if (progressPercent === undefined) {
      return NextResponse.json({ ok: true });
    }

    const session = await requireSession();

    const film = await prisma.film.findUnique({
      where: { id: filmId },
      select: { id: true, published: true },
    });
    if (!film) return apiError("Film not found", 404);
    if (!film.published) return apiError("Film not found", 404);

    const progress = await prisma.watchProgress.upsert({
      where: { userId_filmId: { userId: session.id, filmId } },
      create: { userId: session.id, filmId, progressPercent },
      update: { progressPercent },
    });

    if (progressPercent >= 95) {
      trackEvent("video_completed", { filmId, progressPercent }, session.id);
    } else if (progressPercent >= 5) {
      trackEvent("video_started", { filmId, progressPercent }, session.id);
    }

    return NextResponse.json({ progressPercent: progress.progressPercent });
  } catch (error) {
    return handleApiError(error, "Failed to save progress");
  }
}
