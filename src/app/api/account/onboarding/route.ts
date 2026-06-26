export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { reissueAuthResponse } from "@/lib/auth-response";
import { handleApiError } from "@/lib/api-utils";
import { userSessionSelect } from "@/lib/user-session";

const schema = z.object({
  favoriteIds: z.array(z.string()).max(20).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    schema.parse(await request.json().catch(() => ({})));

    const user = await prisma.user.update({
      where: { id: session.id },
      data: { onboardingCompleted: true },
      select: userSessionSelect,
    });

    return reissueAuthResponse(user, request, session.sessionId, {
      message: "Welcome to Shorty!",
    });
  } catch (error) {
    return handleApiError(error, "Onboarding failed");
  }
}
