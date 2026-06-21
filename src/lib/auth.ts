import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  touchUserSession,
  validateUserSession,
} from "@/lib/sessions";

function getJwtSecretKey() {
  const secret = process.env.JWT_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    throw new Error("JWT_SECRET environment variable is required in production");
  }
  return new TextEncoder().encode(secret || "shorty-dev-secret");
}

export const COOKIE_NAME = "shorty_session";

export type SessionUser = {
  id: string;
  username: string;
  displayName: string | null;
  email: string;
  role: string;
  photoUrl: string | null;
  subscriptionTier: string;
  subscriptionStatus: string | null;
  subscriptionEndsAt: string | null;
  trialEndsAt: string | null;
  hasStreamingAccess: boolean;
  accessLabel: string;
  sessionId?: string | null;
};

export async function hashPassword(password: string) {
  const rounds = process.env.NODE_ENV === "production" ? 10 : 12;
  return bcrypt.hash(password, rounds);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createToken(user: SessionUser, sessionId?: string) {
  return new SignJWT({
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
    photoUrl: user.photoUrl,
    subscriptionTier: user.subscriptionTier,
    subscriptionStatus: user.subscriptionStatus,
    subscriptionEndsAt: user.subscriptionEndsAt,
    trialEndsAt: user.trialEndsAt,
    hasStreamingAccess: user.hasStreamingAccess,
    accessLabel: user.accessLabel,
    ...(sessionId ? { sessionId } : {}),
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecretKey());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecretKey());
    const sessionId = (payload.sessionId as string) || null;

    if (!(await validateUserSession(sessionId))) {
      return null;
    }

    if (sessionId) {
      await touchUserSession(sessionId);
    }

    return {
      id: payload.id as string,
      username: payload.username as string,
      displayName: (payload.displayName as string) || null,
      email: payload.email as string,
      role: payload.role as string,
      photoUrl: (payload.photoUrl as string) || null,
      subscriptionTier: (payload.subscriptionTier as string) || "none",
      subscriptionStatus: (payload.subscriptionStatus as string) || null,
      subscriptionEndsAt: (payload.subscriptionEndsAt as string) || null,
      trialEndsAt: (payload.trialEndsAt as string) || null,
      hasStreamingAccess: Boolean(payload.hasStreamingAccess),
      accessLabel: (payload.accessLabel as string) || "No active plan",
      sessionId,
    };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.role !== "admin") throw new Error("Forbidden");
  return session;
}

export function sessionCookieOptions(token: string) {
  return {
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export function clearSessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 0,
  };
}
