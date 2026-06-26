export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminPersonSchema } from "@/lib/admin-validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        credits: {
          include: { film: { select: { id: true, title: true, posterUrl: true, year: true } } },
          orderBy: { film: { year: "desc" } },
        },
        _count: { select: { credits: true } },
      },
    });
    if (!person) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ person });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const data = adminPersonSchema.partial().parse(await request.json());

    const person = await prisma.person.update({
      where: { id },
      data: {
        ...data,
        birthplace: data.birthplace === undefined ? undefined : data.birthplace,
        bornYear: data.bornYear === undefined ? undefined : data.bornYear,
      },
    });
    return NextResponse.json({ person });
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
    await prisma.person.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
