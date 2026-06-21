export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("search")?.trim().slice(0, 100) || "";
    const role = searchParams.get("role") || "";

    let people = await prisma.person.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: { select: { credits: true } },
      },
    });

    if (role) {
      people = people.filter((p) => p.primaryRole === role);
    }

    if (q) {
      const lower = q.toLowerCase();
      people = people.filter(
        (p) =>
          p.name.toLowerCase().includes(lower) ||
          p.bio.toLowerCase().includes(lower) ||
          p.longBio.toLowerCase().includes(lower) ||
          p.primaryRole.toLowerCase().includes(lower) ||
          (p.birthplace?.toLowerCase().includes(lower) ?? false)
      );
    }

    return NextResponse.json({ people });
  } catch (error) {
    return handleApiError(error, "Failed to search people");
  }
}
