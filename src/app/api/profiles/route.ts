export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { createProfile, listProfiles } from "@/lib/profiles";

export async function GET() {
  try {
    const session = await requireSession();
    const [profiles, user] = await Promise.all([
      listProfiles(session.id),
      prisma.user.findUnique({
        where: { id: session.id },
        select: {
          autoplayNext: true,
          playbackSpeed: true,
          subtitleLanguage: true,
          reduceMotionPref: true,
        },
      }),
    ]);
    return NextResponse.json({ profiles, preferences: user });
  } catch (error) {
    return handleApiError(error, "Failed to load profiles");
  }
}

const createSchema = z.object({
  name: z.string().min(1).max(30),
  isKids: z.boolean().optional(),
  pin: z.string().min(4).max(8).optional(),
});

export async function POST(request: Request) {
  try {
    const session = await requireSession();
    const data = createSchema.parse(await request.json());
    const profile = await createProfile(session.id, data);
    return NextResponse.json({ profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return apiError(error.errors[0]?.message ?? "Invalid input", 400);
    }
    if (error instanceof Error && error.message.includes("Maximum")) {
      return apiError(error.message, 400);
    }
    return handleApiError(error, "Failed to create profile");
  }
}

const prefsSchema = z.object({
  autoplayNext: z.boolean().optional(),
  playbackSpeed: z.number().min(0.5).max(2).optional(),
  subtitleLanguage: z.string().max(10).optional(),
  reduceMotionPref: z.boolean().optional(),
});

export async function PATCH(request: Request) {
  try {
    const session = await requireSession();
    const data = prefsSchema.parse(await request.json());

    const user = await prisma.user.update({
      where: { id: session.id },
      data,
      select: {
        autoplayNext: true,
        playbackSpeed: true,
        subtitleLanguage: true,
        reduceMotionPref: true,
      },
    });

    return NextResponse.json({ preferences: user });
  } catch (error) {
    return handleApiError(error, "Failed to save preferences");
  }
}
