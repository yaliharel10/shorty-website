import { NextResponse } from "next/server";
import {
  createToken,
  sessionCookieOptions,
} from "@/lib/auth";
import type { DbUserSession } from "@/lib/user-session";
import { toPublicUser } from "@/lib/user-session";
import { createUserSession } from "@/lib/sessions";
import { trackEvent } from "@/lib/analytics";

export async function issueAuthResponse(
  user: DbUserSession,
  request: Request,
  body: Record<string, unknown> = {},
  analyticsEvent?: "login" | "signup"
) {
  const publicUser = toPublicUser(user);
  const sessionId = await createUserSession(user.id, request);
  const token = await createToken(publicUser, sessionId);

  if (analyticsEvent) {
    trackEvent(analyticsEvent, { userId: user.id }, user.id);
  }

  const response = NextResponse.json({ user: publicUser, ...body });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}

export async function reissueAuthResponse(
  user: DbUserSession,
  request: Request,
  tokenId: string | null | undefined,
  body: Record<string, unknown> = {}
) {
  const publicUser = toPublicUser(user);
  const sessionId = tokenId ?? (await createUserSession(user.id, request));
  const token = await createToken(publicUser, sessionId);
  const response = NextResponse.json({ user: publicUser, ...body });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
