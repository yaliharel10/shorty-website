export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminCreditSchema } from "@/lib/admin-validation";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id } = await params;
    const credits = await prisma.filmCredit.findMany({
      where: { filmId: id },
      include: { person: true },
      orderBy: { role: "asc" },
    });
    return NextResponse.json({ credits });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id: filmId } = await params;
    const data = adminCreditSchema.parse(await request.json());

    const credit = await prisma.filmCredit.create({
      data: {
        filmId,
        personId: data.personId,
        role: data.role,
        characterName: data.characterName ?? null,
      },
      include: { person: true },
    });
    return NextResponse.json({ credit });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Could not add credit" }, { status: 400 });
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    await requireAdmin();
    const { id: filmId } = await params;
    const { creditId } = await request.json();
    if (!creditId) {
      return NextResponse.json({ error: "creditId required" }, { status: 400 });
    }
    await prisma.filmCredit.deleteMany({ where: { id: creditId, filmId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
