export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";

/** Returns a random published film id for "Surprise Me". */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) return apiError("Sign in to use Surprise Me", 401);

    const count = await prisma.film.count({ where: { published: true } });
    if (count === 0) return apiError("No films available", 404);

    const skip = Math.floor(Math.random() * count);
    const film = await prisma.film.findMany({
      where: { published: true },
      select: { id: true, title: true, posterUrl: true, category: true },
      skip,
      take: 1,
    });

    const pick = film[0];
    if (!pick) return apiError("No films available", 404);

    return NextResponse.json({ film: pick });
  } catch (error) {
    return handleApiError(error, "Surprise pick failed");
  }
}
