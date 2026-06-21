import type { SessionUser } from "@/lib/auth";

/** Map JWT session to client user shape (no DB query). */
export function sessionToClientUser(session: SessionUser) {
  return {
    id: session.id,
    username: session.username,
    displayName: session.displayName,
    email: session.email,
    role: session.role,
    photoUrl: session.photoUrl,
    subscriptionTier: session.subscriptionTier,
    subscriptionStatus: session.subscriptionStatus,
    subscriptionEndsAt: session.subscriptionEndsAt,
    trialEndsAt: session.trialEndsAt,
    hasStreamingAccess: session.hasStreamingAccess,
    accessLabel: session.accessLabel,
  };
}
