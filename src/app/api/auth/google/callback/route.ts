export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createToken, sessionCookieOptions } from "@/lib/auth";
import { createUserSession } from "@/lib/sessions";
import { toPublicUser } from "@/lib/user-session";
import { getSiteUrl } from "@/lib/email";
import {
  exchangeGoogleCode,
  findOrCreateGoogleUser,
} from "@/lib/google-auth";
import { trackEvent } from "@/lib/analytics";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookieStore = await cookies();
  const savedState = cookieStore.get("shorty_google_state")?.value;

  cookieStore.set({
    name: "shorty_google_state",
    value: "",
    maxAge: 0,
    path: "/",
  });

  if (!code || !state || !savedState || state !== savedState) {
    return NextResponse.redirect(`${getSiteUrl()}/?signin=1&error=google`);
  }

  try {
    const profile = await exchangeGoogleCode(code);
    const user = await findOrCreateGoogleUser(profile);
    const publicUser = toPublicUser(user);
    const sessionId = await createUserSession(user.id, request);
    const token = await createToken(publicUser, sessionId);
    trackEvent("login", { userId: user.id, provider: "google" }, user.id);

    const redirect = user.onboardingCompleted ? "/browse" : "/onboarding";
    const response = NextResponse.redirect(`${getSiteUrl()}${redirect}`);
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch {
    return NextResponse.redirect(`${getSiteUrl()}/?signin=1&error=google`);
  }
}
