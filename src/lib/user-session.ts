import type { User } from "@prisma/client";
import type { SessionUser } from "@/lib/auth";
import { getAccessLabel, hasStreamingAccess } from "@/lib/subscription";

export const userSessionSelect = {
  id: true,
  username: true,
  displayName: true,
  email: true,
  role: true,
  photoUrl: true,
  subscriptionTier: true,
  subscriptionStatus: true,
  subscriptionEndsAt: true,
  trialEndsAt: true,
} as const;

export type DbUserSession = Pick<User, keyof typeof userSessionSelect>;

export function toSessionUser(user: DbUserSession): SessionUser {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt?.toISOString() ?? null,
    trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
    hasStreamingAccess: hasStreamingAccess(user),
    accessLabel: getAccessLabel(user),
  };
}

export function toPublicUser(user: DbUserSession) {
  return toSessionUser(user);
}
