export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import {
  getGoogleAuthUrl,
  googleStateCookie,
  isGoogleAuthConfigured,
} from "@/lib/google-auth";

export async function GET() {
  if (!isGoogleAuthConfigured()) {
    return NextResponse.json({ error: "Google sign-in is not configured" }, { status: 503 });
  }

  const state = randomBytes(16).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set(googleStateCookie(state));

  return NextResponse.redirect(getGoogleAuthUrl(state));
}
