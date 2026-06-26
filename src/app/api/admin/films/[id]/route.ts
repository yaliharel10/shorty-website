export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminFilmSchema, jsonArrayField } from "@/lib/admin-validation";
import { parseJsonArray } from "@/lib/film-metadata";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const film = await prisma.film.findUnique({
      where: { id },
      include: {
        credits: {
          include: { person: { select: { id: true, name: true, slug: true, imgUrl: true, primaryRole: true } } },
        },
        _count: { select: { views: true, favorites: true, ratings: true } },
      },
    });
    if (!film) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      film: {
        ...film,
        genres: parseJsonArray(film.genres),
        moods: parseJsonArray(film.moods),
        tags: parseJsonArray(film.tags),
      },
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { genres, moods, tags, ...rest } = body;
    const parsed = adminFilmSchema.partial().parse(rest);
    const { genres: _g, moods: _m, tags: _t, ...filmData } = parsed;

    const film = await prisma.film.update({
      where: { id },
      data: {
        ...filmData,
        ...(genres !== undefined ? { genres: jsonArrayField(genres) } : {}),
        ...(moods !== undefined ? { moods: jsonArrayField(moods) } : {}),
        ...(tags !== undefined ? { tags: jsonArrayField(tags) } : {}),
      },
    });
    return NextResponse.json({ film });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    await prisma.film.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
