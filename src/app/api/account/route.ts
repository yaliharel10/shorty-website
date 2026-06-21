export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { reissueAuthResponse } from "@/lib/auth-response";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import {
  changeEmailSchema,
  changePasswordSchema,
} from "@/lib/validation";
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
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { favorites: true, ratings: true, views: true } },
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const {
      _count,
      stripeCustomerId,
      stripeSubscriptionId,
      createdAt,
      updatedAt,
      ...profile
    } = user;
    return NextResponse.json({
      user: toPublicUser(profile),
      stats: _count,
      memberSince: createdAt,
      hasBillingAccount: Boolean(stripeCustomerId),
      hasStripeSubscription: Boolean(stripeSubscriptionId),
    });
  } catch (error) {
    return handleApiError(error, "Failed to load account");
  }
}

export async function PATCH(request: Request) {
  const limited = enforceRateLimit(request, "account-update", 10, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const body = await request.json();

    if (body.email !== undefined) {
      const { email, currentPassword } = changeEmailSchema.parse(body);

      const user = await prisma.user.findUnique({
        where: { id: session.id },
        select: { id: true, password: true, email: true },
      });

      if (!user || !(await verifyPassword(currentPassword, user.password))) {
        return apiError("Current password is incorrect", 400);
      }

      const normalized = email.toLowerCase();
      if (normalized !== user.email) {
        const taken = await prisma.user.findUnique({ where: { email: normalized } });
        if (taken) {
          return apiError("Email is already in use", 400);
        }
      }

      const updated = await prisma.user.update({
        where: { id: user.id },
        data: { email: normalized },
        select: userSessionSelect,
      });

      return reissueAuthResponse(updated, request, session.sessionId, {
        message: "Email updated successfully",
      });
    }

    const { currentPassword, newPassword } = changePasswordSchema.parse(body);

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

    return reissueAuthResponse(updated, request, session.sessionId, {
      message: "Password updated successfully",
    });
  } catch (error) {
    return handleApiError(error, "Account update failed");
  }
}
