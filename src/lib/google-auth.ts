import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { ensureDefaultProfile } from "@/lib/profiles";
import { TRIAL_DAYS } from "@/lib/subscription";
import { userSessionSelect } from "@/lib/user-session";
import { isProductionDeploy } from "@/lib/production";

function slugFromEmail(email: string) {
  const base = email.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase().slice(0, 12);
  return base || "user";
}

async function uniqueUsername(base: string) {
  let username = base.slice(0, 20);
  let n = 0;
  while (await prisma.user.findUnique({ where: { username } })) {
    n += 1;
    username = `${base.slice(0, 16)}${n}`;
  }
  return username;
}

export function isGoogleAuthConfigured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function getGoogleAuthUrl(state: string) {
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000"}/api/auth/google/callback`;
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    access_type: "online",
    prompt: "select_account",
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function exchangeGoogleCode(code: string) {
  const redirectUri = `${process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000"}/api/auth/google/callback`;
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!res.ok) throw new Error("Google token exchange failed");
  const tokens = await res.json();

  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!profileRes.ok) throw new Error("Google profile fetch failed");
  return profileRes.json() as Promise<{
    id: string;
    email: string;
    name?: string;
    picture?: string;
  }>;
}

export async function findOrCreateGoogleUser(profile: {
  id: string;
  email: string;
  name?: string;
  picture?: string;
}) {
  const email = profile.email.toLowerCase();

  const byGoogle = await prisma.user.findUnique({
    where: { googleId: profile.id },
    select: userSessionSelect,
  });
  if (byGoogle) return byGoogle;

  const byEmail = await prisma.user.findUnique({
    where: { email },
    select: { ...userSessionSelect, googleId: true },
  });

  if (byEmail) {
    return prisma.user.update({
      where: { id: byEmail.id },
      data: {
        googleId: profile.id,
        emailVerified: true,
        photoUrl: byEmail.photoUrl || profile.picture || null,
        displayName: byEmail.displayName || profile.name || null,
      },
      select: userSessionSelect,
    });
  }

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

  const username = await uniqueUsername(slugFromEmail(email));
  const user = await prisma.user.create({
    data: {
      username,
      email,
      googleId: profile.id,
      password: await hashPassword(randomBytes(32).toString("hex")),
      displayName: profile.name || username,
      photoUrl: profile.picture || null,
      emailVerified: true,
      trialEndsAt,
    },
    select: userSessionSelect,
  });

  await ensureDefaultProfile(user.id);
  return user;
}

export function googleStateCookie(state: string) {
  return {
    name: "shorty_google_state",
    value: state,
    httpOnly: true,
    secure: isProductionDeploy(),
    sameSite: "lax" as const,
    path: "/",
    maxAge: 600,
  };
}
