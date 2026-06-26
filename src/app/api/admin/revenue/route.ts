export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { getPlan, hasStreamingAccess } from "@/lib/subscription";
import {
  calculateMrr,
  getFilmWatchStats,
  getPlatformSettings,
  getRevenueSummary,
} from "@/lib/payout";

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") ?? "30";
    const periodDays = period === "all" ? undefined : parseInt(period, 10) || 30;
    const since = periodDays
      ? new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000)
      : undefined;

    const [summary, settings, mrr, users] = await Promise.all([
      getRevenueSummary(periodDays),
      getPlatformSettings(),
      calculateMrr(),
      prisma.user.findMany({
        where: { role: { not: "admin" } },
        select: {
          id: true,
          username: true,
          email: true,
          role: true,
          emailVerified: true,
          subscriptionTier: true,
          subscriptionStatus: true,
          subscriptionEndsAt: true,
          trialEndsAt: true,
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const creatorPoolAmount =
      Math.round(mrr * (settings.creatorPoolPercent / 100) * 100) / 100;

    const { films } = await getFilmWatchStats({
      since,
      creatorPoolAmount,
    });

    const subscribers = users.filter(
      (u) =>
        u.subscriptionStatus === "active" &&
        u.subscriptionTier !== "none"
    );

    const byTier = {
      basic: subscribers.filter((u) => u.subscriptionTier === "basic").length,
      standard: subscribers.filter((u) => u.subscriptionTier === "standard").length,
      premium: subscribers.filter((u) => u.subscriptionTier === "premium").length,
    };

    return NextResponse.json({
      period: periodDays ?? "all",
      summary: {
        ...summary,
        creatorPoolPercent: settings.creatorPoolPercent,
        creatorPoolAmount,
        byTier,
      },
      films,
      subscribers: subscribers.map((u) => ({
        ...u,
        hasStreamingAccess: hasStreamingAccess(u),
        planPrice: getPlan(u.subscriptionTier)?.price ?? 0,
        monthlyRevenue:
          u.subscriptionStatus === "active"
            ? getPlan(u.subscriptionTier)?.price ?? 0
            : 0,
      })),
    });
  } catch (error) {
    return handleApiError(error, "Forbidden");
  }
}

const settingsSchema = z.object({
  creatorPoolPercent: z.number().min(0).max(100),
});

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { creatorPoolPercent } = settingsSchema.parse(await request.json());

    const settings = await prisma.platformSettings.upsert({
      where: { id: "default" },
      create: { id: "default", creatorPoolPercent },
      update: { creatorPoolPercent },
    });

    return NextResponse.json({ settings });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }
    return handleApiError(error, "Update failed");
  }
}
