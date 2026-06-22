export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, sessionCookieOptions } from "@/lib/auth";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";
import {
  defaultRedirectForUser,
  isAllowedTestUsername,
  isTestLoginEnabled,
} from "@/lib/test-login";

/** One-click demo login — share this link with testers. Requires ENABLE_TEST_LOGIN=true in production. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const username = (url.searchParams.get("user") || "demo").trim();
  const next = url.searchParams.get("next")?.trim() || "";

  if (!isTestLoginEnabled()) {
    return NextResponse.redirect(`${origin}/help?demo=disabled`);
  }

  if (!isAllowedTestUsername(username)) {
    return NextResponse.redirect(`${origin}/help?demo=invalid`);
  }

  const user = await prisma.user.findUnique({
    where: { username },
    select: userSessionSelect,
  });

  if (!user) {
    return NextResponse.redirect(`${origin}/help?demo=missing`);
  }

  const publicUser = toPublicUser(user);
  const token = await createToken(publicUser);

  let destination = defaultRedirectForUser(username, user.role);
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    destination = next;
  }

  const response = NextResponse.redirect(`${origin}${destination}`);
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
