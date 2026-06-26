export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminCollectionSchema } from "@/lib/admin-validation";

export async function GET() {
  try {
    await requireAdmin();
    const collections = await prisma.collection.findMany({
      include: {
        _count: { select: { films: true } },
        films: {
          take: 3,
          orderBy: { sortOrder: "asc" },
          include: { film: { select: { id: true, title: true, posterUrl: true } } },
        },
      },
      orderBy: [{ featured: "desc" }, { sortOrder: "asc" }],
    });
    return NextResponse.json({ collections });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = adminCollectionSchema.parse(await request.json());

    const collection = await prisma.collection.create({
      data: {
        ...data,
        heroUrl: data.heroUrl ?? null,
        country: data.country ?? null,
        mood: data.mood ?? null,
        featured: data.featured ?? false,
        published: data.published ?? true,
        sortOrder: data.sortOrder ?? 0,
      },
    });
    return NextResponse.json({ collection });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
