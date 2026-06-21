import { NextResponse } from "next/server";
import {
  createToken,
  sessionCookieOptions,
} from "@/lib/auth";
import { createUserSession } from "@/lib/sessions";
import type { DbUserSession } from "@/lib/user-session";
import { toPublicUser } from "@/lib/user-session";

export async function issueAuthResponse(
  user: DbUserSession,
  request: Request,
  body: Record<string, unknown> = {}
) {
  const publicUser = toPublicUser(user);
  const tokenId = await createUserSession(user.id, request);
  const token = await createToken(publicUser, tokenId);

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
  let activeTokenId = tokenId;

  if (!activeTokenId) {
    activeTokenId = await createUserSession(user.id, request);
  }

  const token = await createToken(publicUser, activeTokenId);
  const response = NextResponse.json({ user: publicUser, ...body });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
