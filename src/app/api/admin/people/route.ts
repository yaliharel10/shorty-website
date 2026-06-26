export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { adminPersonSchema } from "@/lib/admin-validation";
import { slugifyName } from "@/lib/person-utils";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search")?.trim();

    const people = await prisma.person.findMany({
      where: search
        ? { name: { contains: search } }
        : undefined,
      include: { _count: { select: { credits: true } } },
      orderBy: { name: "asc" },
      take: 100,
    });
    return NextResponse.json({ people });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const data = adminPersonSchema.parse(await request.json());
    let slug = slugifyName(data.name);
    const existing = await prisma.person.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now().toString(36)}`;

    const person = await prisma.person.create({
      data: { ...data, slug, birthplace: data.birthplace ?? null, bornYear: data.bornYear ?? null },
    });
    return NextResponse.json({ person });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Create failed" }, { status: 500 });
  }
}
