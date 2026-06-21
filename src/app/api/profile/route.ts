export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { reissueAuthResponse } from "@/lib/auth-response";
import { handleApiError } from "@/lib/api-utils";
import { profileUpdateSchema } from "@/lib/validation";
import { userSessionSelect } from "@/lib/user-session";

export async function PATCH(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = profileUpdateSchema.parse(await request.json());

    if (data.username && data.username !== session.username) {
      const taken = await prisma.user.findUnique({
        where: { username: data.username },
      });
      if (taken) {
        return NextResponse.json({ error: "Username taken" }, { status: 400 });
      }
    }

    const user = await prisma.user.update({
      where: { id: session.id },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.displayName !== undefined && {
          displayName: data.displayName || null,
        }),
        ...(data.photoUrl !== undefined && {
          photoUrl: data.photoUrl || null,
        }),
      },
      select: userSessionSelect,
    });

    return reissueAuthResponse(user, request, session.sessionId);
  } catch (error) {
    return handleApiError(error, "Update failed");
  }
}
