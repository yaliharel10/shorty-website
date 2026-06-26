export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { trackEvent, type AnalyticsEvent } from "@/lib/analytics";
import { enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { getSession } from "@/lib/auth";

const bodySchema = z.object({
  event: z.enum([
    "video_started",
    "video_completed",
    "film_viewed",
    "search_used",
    "signup",
    "login",
    "subscription_started",
  ]),
  props: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
});

export async function POST(request: Request) {
  try {
    const limited = await enforceRateLimit(request, "analytics", 120, 60_000);
    if (limited) return limited;

    const session = await getSession();
    const { event, props } = bodySchema.parse(await request.json());
    trackEvent(event as AnalyticsEvent, props ?? {}, session?.id);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error, "Failed to record event");
  }
}
