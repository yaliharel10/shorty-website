export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

/** Public search suggestions for films and people. */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim().slice(0, 80) || "";

    if (q.length < 2) {
      const [trendingFilms, popularPeople] = await Promise.all([
        prisma.film.findMany({
          where: { published: true },
          orderBy: { rating: "desc" },
          take: 6,
          select: { id: true, title: true, category: true, posterUrl: true },
        }),
        prisma.person.findMany({
          orderBy: { name: "asc" },
          take: 4,
          select: { id: true, slug: true, name: true, primaryRole: true, imgUrl: true },
        }),
      ]);
      return NextResponse.json({
        films: trendingFilms,
        people: popularPeople,
        trending: ["drama", "animation", "sci-fi", "quick watch", "top rated"],
      });
    }

    const [films, people] = await Promise.all([
      prisma.film.findMany({
        where: {
          published: true,
          OR: [{ title: { contains: q } }, { description: { contains: q } }],
        },
        take: 8,
        select: { id: true, title: true, category: true, posterUrl: true },
      }),
      prisma.person.findMany({
        where: { name: { contains: q } },
        take: 6,
        select: { id: true, slug: true, name: true, primaryRole: true, imgUrl: true },
      }),
    ]);

    return NextResponse.json({ films, people, query: q });
  } catch (error) {
    return handleApiError(error, "Search suggestions failed");
  }
}
