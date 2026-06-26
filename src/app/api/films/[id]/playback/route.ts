export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import {
  canStartPlayback,
  endPlaybackSession,
  registerPlaybackSession,
} from "@/lib/playback-sessions";
import { refreshUserSession } from "@/lib/session-refresh";

const schema = z.object({
  action: z.enum(["start", "heartbeat", "end"]),
  sessionToken: z.string().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const fresh = await refreshUserSession(session.id);
    if (!fresh) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id: filmId } = await params;
    const body = schema.parse(await request.json());

    const film = await prisma.film.findUnique({
      where: { id: filmId },
      select: { id: true, published: true },
    });
    if (!film?.published) {
      return NextResponse.json({ error: "Film not found" }, { status: 404 });
    }

    if (body.action === "end" && body.sessionToken) {
      await endPlaybackSession(body.sessionToken, session.id);
      return NextResponse.json({ ok: true });
    }

    if (body.action === "start") {
      const allowed = await canStartPlayback(session.id, fresh.subscriptionTier);
      if (!allowed) {
        return NextResponse.json(
          {
            error: "Screen limit reached for your plan. Stop playback on another device first.",
            code: "SCREEN_LIMIT",
          },
          { status: 403 }
        );
      }
    }

    const playback = await registerPlaybackSession(
      session.id,
      filmId,
      body.sessionToken
    );

    return NextResponse.json({
      sessionToken: playback.sessionToken,
      expiresAt: playback.expiresAt.toISOString(),
    });
  } catch (error) {
    return handleApiError(error, "Playback session failed");
  }
}
