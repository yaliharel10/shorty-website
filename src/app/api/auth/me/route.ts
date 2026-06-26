export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import {
  clearSessionCookieOptions,
  createToken,
  getSession,
  sessionCookieOptions,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sessionToClientUser } from "@/lib/client-user";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";
import { touchUserSession, validateUserSession } from "@/lib/sessions";

function subscriptionFieldsChanged(
  jwt: Awaited<ReturnType<typeof getSession>>,
  fresh: ReturnType<typeof toPublicUser>
) {
  if (!jwt) return false;
  return (
    fresh.hasStreamingAccess !== jwt.hasStreamingAccess ||
    fresh.subscriptionTier !== jwt.subscriptionTier ||
    fresh.subscriptionStatus !== jwt.subscriptionStatus ||
    fresh.subscriptionEndsAt !== jwt.subscriptionEndsAt ||
    fresh.trialEndsAt !== jwt.trialEndsAt ||
    fresh.emailVerified !== jwt.emailVerified ||
    fresh.onboardingCompleted !== jwt.onboardingCompleted ||
    fresh.role !== jwt.role ||
    fresh.accessLabel !== jwt.accessLabel
  );
}

/** Returns user from DB (source of truth) and refreshes JWT when subscription state changes. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.id },
    select: userSessionSelect,
  });

  if (!dbUser) {
    const response = NextResponse.json({ user: null, code: "SESSION_EXPIRED" });
    response.cookies.set(clearSessionCookieOptions());
    return response;
  }

  if (session.sessionId) {
    const valid = await validateUserSession(session.sessionId);
    if (!valid) {
      const response = NextResponse.json({ user: null, code: "SESSION_REVOKED" });
      response.cookies.set(clearSessionCookieOptions());
      return response;
    }
    await touchUserSession(session.sessionId);
  }

  const freshUser = toPublicUser(dbUser);
  const response = NextResponse.json({ user: sessionToClientUser(freshUser) });

  if (subscriptionFieldsChanged(session, freshUser)) {
    const token = await createToken({
      ...freshUser,
      sessionId: session.sessionId ?? undefined,
    });
    response.cookies.set(sessionCookieOptions(token));
  }

  return response;
}
