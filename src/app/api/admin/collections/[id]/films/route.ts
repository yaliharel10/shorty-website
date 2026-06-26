export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

const filmsSchema = z.object({
  filmIds: z.array(z.string()).min(1),
});

export async function PUT(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id: collectionId } = await params;
    const { filmIds } = filmsSchema.parse(await request.json());

    await prisma.$transaction([
      prisma.collectionFilm.deleteMany({ where: { collectionId } }),
      ...filmIds.map((filmId, sortOrder) =>
        prisma.collectionFilm.create({
          data: { collectionId, filmId, sortOrder },
        })
      ),
    ]);

    const films = await prisma.collectionFilm.findMany({
      where: { collectionId },
      orderBy: { sortOrder: "asc" },
      include: { film: true },
    });
    return NextResponse.json({ films });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id: collectionId } = await params;
    const { filmId } = await request.json();
    if (!filmId) return NextResponse.json({ error: "filmId required" }, { status: 400 });

    const max = await prisma.collectionFilm.aggregate({
      where: { collectionId },
      _max: { sortOrder: true },
    });

    await prisma.collectionFilm.create({
      data: { collectionId, filmId, sortOrder: (max._max.sortOrder ?? -1) + 1 },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Add failed" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id: collectionId } = await params;
    const { filmId } = await request.json();
    await prisma.collectionFilm.delete({
      where: { collectionId_filmId: { collectionId, filmId } },
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Remove failed" }, { status: 400 });
  }
}
