export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await requireSession();

    const views = await prisma.viewEvent.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        film: {
          select: {
            id: true,
            title: true,
            posterUrl: true,
            category: true,
            rating: true,
            duration: true,
            year: true,
          },
        },
      },
    });

    const seen = new Set<string>();
    const history = [];
    for (const view of views) {
      if (seen.has(view.filmId)) continue;
      seen.add(view.filmId);
      history.push({
        film: view.film,
        watchedAt: view.createdAt.toISOString(),
      });
      if (history.length >= 24) break;
    }

    const progress = await prisma.watchProgress.findMany({
      where: { userId: session.id },
      select: { filmId: true, progressPercent: true },
    });

    return NextResponse.json({
      history,
      progress: Object.fromEntries(progress.map((p) => [p.filmId, p.progressPercent])),
    });
  } catch (error) {
    return handleApiError(error, "Failed to load watch history");
  }
}
