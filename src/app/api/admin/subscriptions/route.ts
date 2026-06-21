export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { getPlan, hasStreamingAccess } from "@/lib/subscription";

export async function GET() {
  try {
    await requireAdmin();

    const users = await prisma.user.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const subscribers = users.filter(
      (u) =>
        u.role !== "admin" &&
        (u.subscriptionStatus === "active" || u.subscriptionStatus === "canceled") &&
        u.subscriptionTier !== "none"
    );

    const trialing = users.filter(
      (u) => u.trialEndsAt && u.trialEndsAt > new Date() && u.role !== "admin"
    );

    const byTier = {
      basic: subscribers.filter((u) => u.subscriptionTier === "basic").length,
      standard: subscribers.filter((u) => u.subscriptionTier === "standard").length,
      premium: subscribers.filter((u) => u.subscriptionTier === "premium").length,
    };

    const mrr = subscribers.reduce((sum, u) => {
      if (u.subscriptionStatus !== "active") return sum;
      const plan = getPlan(u.subscriptionTier);
      return sum + (plan?.price ?? 0);
    }, 0);

    const withAccess = users.filter((u) => hasStreamingAccess(u)).length;

    return NextResponse.json({
      stats: {
        totalUsers: users.length,
        activeSubscribers: subscribers.filter((u) => u.subscriptionStatus === "active").length,
        trialing: trialing.length,
        withStreamingAccess: withAccess,
        mrr: Math.round(mrr * 100) / 100,
        byTier,
      },
      subscribers: subscribers.map((u) => ({
        ...u,
        hasStreamingAccess: hasStreamingAccess(u),
        planPrice: getPlan(u.subscriptionTier)?.price ?? 0,
      })),
      trialing: trialing.map((u) => ({
        id: u.id,
        username: u.username,
        email: u.email,
        trialEndsAt: u.trialEndsAt,
      })),
    });
  } catch (error) {
    return handleApiError(error, "Forbidden");
  }
}
