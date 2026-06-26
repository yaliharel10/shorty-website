export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";

export async function GET() {
  try {
    const session = await requireSession();

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        username: true,
        email: true,
        displayName: true,
        photoUrl: true,
        role: true,
        emailVerified: true,
        onboardingCompleted: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
        createdAt: true,
        favorites: {
          include: { film: { select: { id: true, title: true } } },
        },
        ratings: {
          include: { film: { select: { id: true, title: true } } },
        },
        views: {
          take: 500,
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            filmId: true,
            watchSeconds: true,
            createdAt: true,
            film: { select: { title: true } },
          },
        },
        watchProgress: {
          select: { filmId: true, progressPercent: true, updatedAt: true },
        },
        profiles: {
          select: { id: true, name: true, isKids: true, isDefault: true },
        },
      },
    });

    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json({
      exportedAt: new Date().toISOString(),
      user,
    });
  } catch (error) {
    return handleApiError(error, "Export failed");
  }
}
