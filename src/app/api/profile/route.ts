export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, createToken, sessionCookieOptions } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { profileUpdateSchema } from "@/lib/validation";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";

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
        ...(data.photoUrl !== undefined && {
          photoUrl: data.photoUrl || null,
        }),
      },
      select: userSessionSelect,
    });

    const publicUser = toPublicUser(user);
    const response = NextResponse.json({ user: publicUser });
    const token = await createToken(publicUser);
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    return handleApiError(error, "Update failed");
  }
}
