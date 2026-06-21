export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSession, clearSessionCookieOptions } from "@/lib/auth";
import { revokeUserSession } from "@/lib/sessions";

export async function POST() {
  const session = await getSession();
  if (session?.sessionId) {
    await revokeUserSession(session.sessionId);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(clearSessionCookieOptions());
  return response;
}
