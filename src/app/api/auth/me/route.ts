export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ user: null });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: userSessionSelect,
    });

    if (!user) {
      return NextResponse.json({ user: null });
    }

    return NextResponse.json({ user: toPublicUser(user) });
  } catch (error) {
    return handleApiError(error, "Failed to load subscription");
  }
}
