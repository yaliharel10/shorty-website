export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await requireSession();

    const [views, favorites, ratings] = await Promise.all([
      prisma.viewEvent.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: { film: { select: { id: true, title: true } } },
      }),
      prisma.favorite.findMany({
        where: { userId: session.id },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { film: { select: { id: true, title: true } } },
      }),
      prisma.rating.findMany({
        where: { userId: session.id },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { film: { select: { id: true, title: true } } },
      }),
    ]);

    const activity = [
      ...views.map((v) => ({
        id: `view-${v.id}`,
        type: "view",
        label: `Watched ${v.film.title}`,
        href: `/watch/${v.film.id}`,
        at: v.createdAt.toISOString(),
      })),
      ...favorites.map((f) => ({
        id: `fav-${f.id}`,
        type: "favorite",
        label: `Added ${f.film.title} to My List`,
        href: `/browse/film/${f.film.id}`,
        at: f.createdAt.toISOString(),
      })),
      ...ratings.map((r) => ({
        id: `rate-${r.id}`,
        type: "rating",
        label: `Rated ${r.film.title} ${r.score}/10`,
        href: `/browse/film/${r.film.id}`,
        at: r.updatedAt.toISOString(),
      })),
    ]
      .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
      .slice(0, 12);

    return NextResponse.json({ activity });
  } catch (error) {
    return handleApiError(error, "Failed to load activity");
  }
}
