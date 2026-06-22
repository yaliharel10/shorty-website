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
import {
  defaultRedirectForUser,
  isAllowedTestUsername,
  isTestLoginEnabled,
} from "@/lib/test-login";

export async function GET() {
  return NextResponse.json({
    enabled: isTestLoginEnabled(),
    siteUrl:
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      "http://localhost:3000",
    demoLoginUrl:
      (process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
        "http://localhost:3000") + "/demo",
  });
}

export async function POST(request: Request) {
  try {
    if (!isTestLoginEnabled()) {
      return apiError("Test login is disabled on this server", 403);
    }

    const { username } = await request.json();
    if (!username || !isAllowedTestUsername(username)) {
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
      redirect: defaultRedirectForUser(username, user.role),
    });
  } catch (error) {
    return handleApiError(error, "Test login failed");
  }
}

export async function DELETE() {
  try {
    if (!isTestLoginEnabled()) {
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
