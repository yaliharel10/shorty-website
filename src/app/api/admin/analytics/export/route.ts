export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import {
  calculateMrr,
  csvEscape,
  getFilmWatchStats,
  getPlatformSettings,
} from "@/lib/payout";

function periodSince(period: string) {
  if (period === "all") return undefined;
  const days = parseInt(period, 10) || 30;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") ?? "summary";
    const period = searchParams.get("period") ?? "30";
    const since = periodSince(period);

    if (type === "raw") {
      const events = await prisma.viewEvent.findMany({
        where: since ? { createdAt: { gte: since } } : undefined,
        include: {
          film: { select: { title: true, duration: true } },
          user: { select: { username: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
      });

      const header = [
        "view_id",
        "film_id",
        "film_title",
        "film_duration_min",
        "user_id",
        "username",
        "email",
        "watch_seconds",
        "watch_minutes",
        "viewed_at",
      ].join(",");

      const rows = events.map((e) =>
        [
          csvEscape(e.id),
          csvEscape(e.filmId),
          csvEscape(e.film.title),
          e.film.duration,
          csvEscape(e.userId),
          csvEscape(e.user?.username),
          csvEscape(e.user?.email),
          e.watchSeconds,
          Math.round((e.watchSeconds / 60) * 100) / 100,
          csvEscape(e.createdAt.toISOString()),
        ].join(",")
      );

      const csv = [header, ...rows].join("\n");
      const filename = `shorty-views-raw-${period}d.csv`;

      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    const [settings, mrr] = await Promise.all([
      getPlatformSettings(),
      calculateMrr(),
    ]);
    const creatorPoolAmount =
      Math.round(mrr * (settings.creatorPoolPercent / 100) * 100) / 100;

    const { films } = await getFilmWatchStats({ since, creatorPoolAmount });

    const header = [
      "film_id",
      "film_title",
      "duration_min",
      "view_count",
      "unique_viewers",
      "total_watch_seconds",
      "total_watch_hours",
      "avg_watch_seconds",
      "watch_share_percent",
      "estimated_payout_usd",
    ].join(",");

    const rows = films.map((f) =>
      [
        csvEscape(f.filmId),
        csvEscape(f.title),
        f.durationMinutes,
        f.viewCount,
        f.uniqueViewers,
        f.totalWatchSeconds,
        Math.round((f.totalWatchSeconds / 3600) * 100) / 100,
        f.avgWatchSeconds,
        f.watchSharePercent,
        f.estimatedPayout,
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");
    const filename = `shorty-views-summary-${period === "all" ? "all" : `${period}d`}.csv`;

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return handleApiError(error, "Export failed");
  }
}
