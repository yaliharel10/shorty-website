export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminFilmSchema, jsonArrayField } from "@/lib/admin-validation";
import { parseJsonArray } from "@/lib/film-metadata";

export async function GET() {
  try {
    await requireAdmin();
    const films = await prisma.film.findMany({
      include: {
        _count: { select: { views: true, favorites: true, ratings: true, credits: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({
      films: films.map((f) => ({
        ...f,
        genres: parseJsonArray(f.genres),
        moods: parseJsonArray(f.moods),
        tags: parseJsonArray(f.tags),
      })),
    });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = adminFilmSchema.parse(await request.json());

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
        published: data.published ?? true,
        genres: jsonArrayField(data.genres),
        moods: jsonArrayField(data.moods),
        tags: jsonArrayField(data.tags),
        language: data.language ?? "en",
        country: data.country ?? null,
        monthlyFreeMonth: data.monthlyFreeMonth ?? null,
        rating: data.rating ?? 0,
      },
    });

    return NextResponse.json({ film });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}

const updateSchema = adminFilmSchema.partial();

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { id, genres, moods, tags, ...rest } = body;
    if (!id) {
      return NextResponse.json({ error: "Film ID required" }, { status: 400 });
    }
    const parsed = updateSchema.parse(rest);
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
