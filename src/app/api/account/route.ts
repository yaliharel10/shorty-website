export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createToken,
  getSession,
  hashPassword,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { changePasswordSchema } from "@/lib/validation";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        ...userSessionSelect,
        createdAt: true,
        updatedAt: true,
        _count: { select: { favorites: true, ratings: true, views: true } },
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const { _count, ...profile } = user;
    return NextResponse.json({
      user: toPublicUser(profile),
      stats: _count,
      memberSince: user.createdAt,
    });
  } catch (error) {
    return handleApiError(error, "Failed to load account");
  }
}

export async function PATCH(request: Request) {
  const limited = enforceRateLimit(request, "change-password", 5, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(
      await request.json()
    );

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { id: true, password: true },
    });

    if (!user || !(await verifyPassword(currentPassword, user.password))) {
      return apiError("Current password is incorrect", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { password: await hashPassword(newPassword) },
    });

    const updated = await prisma.user.findUnique({
      where: { id: user.id },
      select: userSessionSelect,
    });

    if (!updated) {
      return apiError("User not found", 404);
    }

    const publicUser = toPublicUser(updated);
    const token = await createToken(publicUser);
    const response = NextResponse.json({
      user: publicUser,
      message: "Password updated successfully",
    });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    return handleApiError(error, "Password update failed");
  }
}
