export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
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

const filmSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  category: z.string().min(1),
  posterUrl: z.string().url(),
  videoUrl: z.string().url(),
  duration: z.number().int().positive().optional(),
  year: z.number().int().optional(),
  featured: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = filmSchema.parse(await request.json());

    const film = await prisma.film.create({
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        posterUrl: data.posterUrl,
        videoUrl: data.videoUrl,
        duration: data.duration ?? 15,
        year: data.year ?? new Date().getFullYear(),
        featured: data.featured ?? false,
      },
    });

    return NextResponse.json({ film });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
