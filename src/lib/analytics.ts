import { logger } from "@/lib/logger";

export type AnalyticsEvent =
  | "video_started"
  | "video_completed"
  | "film_viewed"
  | "search_used"
  | "signup"
  | "login"
  | "subscription_started";

type EventProps = Record<string, string | number | boolean | null | undefined>;

async function sendToPostHog(
  event: AnalyticsEvent,
  props: EventProps,
  userId?: string | null
) {
  const apiKey = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST || "https://us.i.posthog.com";
  if (!apiKey) return;

  await fetch(`${host}/capture/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      event,
      distinct_id: userId || "anonymous",
      properties: { ...props, source: "server" },
    }),
  }).catch(() => {});
}

async function sendToMixpanel(
  event: AnalyticsEvent,
  props: EventProps,
  userId?: string | null
) {
  const token = process.env.MIXPANEL_TOKEN;
  if (!token) return;

  const payload = [
    {
      event,
      properties: {
        token,
        distinct_id: userId || "anonymous",
        ...props,
        source: "server",
      },
    },
  ];

  await fetch("https://api.mixpanel.com/track", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "text/plain" },
    body: JSON.stringify(payload),
  }).catch(() => {});
}

/** Server-side product analytics — logs + optional PostHog/Mixpanel forwarding. */
export function trackEvent(
  event: AnalyticsEvent,
  props: EventProps = {},
  userId?: string | null
) {
  logger.info("analytics_event", {
    event,
    userId: userId ?? null,
    ...props,
  });

  void sendToPostHog(event, props, userId);
  void sendToMixpanel(event, props, userId);
}
