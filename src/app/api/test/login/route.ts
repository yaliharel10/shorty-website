export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  clearSessionCookieOptions,
  getSession,
} from "@/lib/auth";
import { issueAuthResponse } from "@/lib/auth-response";
import { apiError, handleApiError } from "@/lib/api-utils";
import { revokeUserSession } from "@/lib/sessions";
import { userSessionSelect } from "@/lib/user-session";

const ALLOWED = new Set([
  "admin",
  "demo",
  "trialuser",
  "basicuser",
  "premiumuser",
  "expireduser",
  "guestplus",
]);

function testLoginEnabled() {
  return (
    process.env.NODE_ENV !== "production" ||
    process.env.ENABLE_TEST_LOGIN === "true"
  );
}

export async function GET() {
  return NextResponse.json({
    enabled: testLoginEnabled(),
    siteUrl:
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000",
  });
}

export async function POST(request: Request) {
  try {
    if (!testLoginEnabled()) {
      return apiError("Test login is disabled on this server", 403);
    }

    const { username } = await request.json();
    if (!username || !ALLOWED.has(username)) {
      return apiError("Invalid test username", 400);
    }

    const user = await prisma.user.findUnique({
      where: { username },
      select: userSessionSelect,
    });

    if (!user) {
      return apiError("Test user not found — run db:seed", 404);
    }

    return issueAuthResponse(user, request, {
      redirect: user.role === "admin" ? "/admin" : "/browse",
    });
  } catch (error) {
    return handleApiError(error, "Test login failed");
  }
}

export async function DELETE() {
  try {
    if (!testLoginEnabled()) {
      return apiError("Test login is disabled", 403);
    }
    const session = await getSession();
    if (session?.sessionId) {
      await revokeUserSession(session.sessionId);
    }
    const response = NextResponse.json({ ok: true });
    response.cookies.set(clearSessionCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error, "Logout failed");
  }
}
