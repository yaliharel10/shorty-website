export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { hasStreamingAccess } from "@/lib/subscription";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";
import { adminUserUpdateSchema } from "@/lib/validation";

const userListSelect = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  photoUrl: true,
  role: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  trialEndsAt: true,
  createdAt: true,
  _count: { select: { favorites: true, ratings: true, views: true } },
} as const;

export async function GET() {
  try {
    await requireAdmin();
    const users = await prisma.user.findMany({
      select: userListSelect,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      users: users.map((u) => ({
        ...u,
        hasStreamingAccess: hasStreamingAccess(u),
      })),
    });
  } catch (error) {
    return handleApiError(error, "Forbidden");
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin();
    const data = adminUserUpdateSchema.parse(await request.json());
    const { id, extendTrialDays, clearSubscription, ...updates } = data;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return apiError("User not found", 404);
    }

    if (updates.role === "user" && id === admin.id) {
      return apiError("You cannot demote your own account", 400);
    }

    if (updates.role === "user" && existing.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return apiError("Cannot remove the last admin account", 400);
      }
    }

    const patch: Record<string, unknown> = {};

    if (updates.role) patch.role = updates.role;
    if (updates.username !== undefined) patch.username = updates.username;
    if (updates.email !== undefined) patch.email = updates.email.toLowerCase();
    if (updates.displayName !== undefined) patch.displayName = updates.displayName;
    if (updates.photoUrl !== undefined) patch.photoUrl = updates.photoUrl;

    if (clearSubscription) {
      patch.subscriptionTier = "none";
      patch.subscriptionStatus = null;
      patch.subscriptionEndsAt = null;
      patch.trialEndsAt = null;
    } else {
      if (updates.subscriptionTier !== undefined) {
        patch.subscriptionTier = updates.subscriptionTier;
      }
      if (updates.subscriptionStatus !== undefined) {
        patch.subscriptionStatus = updates.subscriptionStatus;
      }
      if (updates.subscriptionEndsAt !== undefined) {
        patch.subscriptionEndsAt = updates.subscriptionEndsAt
          ? new Date(updates.subscriptionEndsAt)
          : null;
      }
      if (updates.trialEndsAt !== undefined) {
        patch.trialEndsAt = updates.trialEndsAt ? new Date(updates.trialEndsAt) : null;
      }
      if (extendTrialDays) {
        const base =
          existing.trialEndsAt && existing.trialEndsAt > new Date()
            ? existing.trialEndsAt
            : new Date();
        const trialEndsAt = new Date(base);
        trialEndsAt.setDate(trialEndsAt.getDate() + extendTrialDays);
        patch.trialEndsAt = trialEndsAt;
      }
    }

    if (Object.keys(patch).length === 0) {
      return apiError("No updates provided", 400);
    }

    const user = await prisma.user.update({
      where: { id },
      data: patch,
      select: userListSelect,
    });

    return NextResponse.json({
      user: {
        ...user,
        hasStreamingAccess: hasStreamingAccess(user),
        public: toPublicUser(user),
      },
    });
  } catch (error) {
    return handleApiError(error, "Update failed");
  }
}

export async function DELETE(request: Request) {
  try {
    const admin = await requireAdmin();
    const { id } = await request.json();
    if (!id) {
      return apiError("User ID required", 400);
    }
    if (id === admin.id) {
      return apiError("You cannot delete your own account", 400);
    }
    const target = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    });
    if (!target) {
      return apiError("User not found", 404);
    }
    if (target.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return apiError("Cannot delete the last admin account", 400);
      }
    }
    await prisma.user.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "Delete failed");
  }
}
