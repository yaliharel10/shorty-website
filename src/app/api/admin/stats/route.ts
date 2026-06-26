export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();

    const [
      userCount,
      filmCount,
      viewCount,
      favoriteCount,
      ratingCount,
      activeSubscribers,
      trialingUsers,
      recentViews,
      topFilms,
      recentUsers,
      viewsByDay,
      personCount,
      collectionCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.film.count(),
      prisma.viewEvent.count(),
      prisma.favorite.count(),
      prisma.rating.count(),
      prisma.user.count({
        where: {
          subscriptionStatus: "active",
          subscriptionTier: { not: "none" },
        },
      }),
      prisma.user.count({
        where: {
          trialEndsAt: { gt: new Date() },
          OR: [{ subscriptionStatus: null }, { subscriptionStatus: { not: "active" } }],
        },
      }),
      prisma.viewEvent.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        include: {
          film: { select: { title: true } },
          user: { select: { username: true } },
        },
      }),
      prisma.film.findMany({
        take: 5,
        orderBy: { rating: "desc" },
        include: { _count: { select: { views: true } } },
      }),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),
      prisma.viewEvent.findMany({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
        select: { createdAt: true },
      }),
      prisma.person.count(),
      prisma.collection.count(),
    ]);

    const dayMap: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dayMap[d.toISOString().slice(0, 10)] = 0;
    }
    viewsByDay.forEach((v) => {
      const key = v.createdAt.toISOString().slice(0, 10);
      if (key in dayMap) dayMap[key]++;
    });

    return NextResponse.json({
      stats: {
        userCount,
        filmCount,
        viewCount,
        favoriteCount,
        ratingCount,
        activeSubscribers,
        trialingUsers,
        estimatedMrr: activeSubscribers * 4.99,
        personCount,
        collectionCount,
      },
      recentViews,
      topFilms,
      recentUsers,
      viewsChart: Object.entries(dayMap).map(([date, count]) => ({
        date,
        count,
      })),
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
