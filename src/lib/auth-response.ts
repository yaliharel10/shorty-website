import { NextResponse } from "next/server";
import {
  createToken,
  sessionCookieOptions,
} from "@/lib/auth";
import type { DbUserSession } from "@/lib/user-session";
import { toPublicUser } from "@/lib/user-session";

/** Fast login — JWT cookie only, no session DB write. */
export async function issueAuthResponse(
  user: DbUserSession,
  _request: Request,
  body: Record<string, unknown> = {}
) {
  const publicUser = toPublicUser(user);
  const token = await createToken(publicUser);

  const response = NextResponse.json({ user: publicUser, ...body });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}

export async function reissueAuthResponse(
  user: DbUserSession,
  _request: Request,
  _tokenId: string | null | undefined,
  body: Record<string, unknown> = {}
) {
  const publicUser = toPublicUser(user);
  const token = await createToken(publicUser);
  const response = NextResponse.json({ user: publicUser, ...body });
  response.cookies.set(sessionCookieOptions(token));
  return response;
}
