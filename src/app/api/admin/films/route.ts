export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  try {
    await requireAdmin();
    const films = await prisma.film.findMany({
      include: {
        _count: { select: { views: true, favorites: true, ratings: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ films });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  posterUrl: z.string().url().optional(),
  videoUrl: z.string().url().optional(),
  duration: z.number().int().positive().optional(),
  year: z.number().int().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: "Film ID required" }, { status: 400 });
    }
    const parsed = updateSchema.parse(data);

    const film = await prisma.film.update({
      where: { id },
      data: parsed,
    });
    return NextResponse.json({ film });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ error: "Film ID required" }, { status: 400 });
    }
    await prisma.film.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
