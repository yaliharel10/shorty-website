import { randomUUID } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_DAYS = 7;

export function parseDeviceLabel(userAgent: string | null): string {
  if (!userAgent) return "Unknown device";

  const ua = userAgent.toLowerCase();
  let browser = "Browser";
  if (ua.includes("edg/")) browser = "Edge";
  else if (ua.includes("chrome/") && !ua.includes("edg")) browser = "Chrome";
  else if (ua.includes("firefox/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome")) browser = "Safari";

  let os = "";
  if (ua.includes("iphone")) os = "iPhone";
  else if (ua.includes("ipad")) os = "iPad";
  else if (ua.includes("android")) os = "Android";
  else if (ua.includes("mac os") || ua.includes("macintosh")) os = "Mac";
  else if (ua.includes("windows")) os = "Windows";
  else if (ua.includes("linux")) os = "Linux";

  return os ? `${browser} on ${os}` : browser;
}

export function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || null;
  return request.headers.get("x-real-ip");
}

export function sessionExpiresAt() {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_DAYS);
  return expiresAt;
}

export async function createUserSession(userId: string, request: Request) {
  const tokenId = randomUUID();
  const userAgent = request.headers.get("user-agent");
  const expiresAt = sessionExpiresAt();

  await prisma.userSession.create({
    data: {
      userId,
      tokenId,
      deviceLabel: parseDeviceLabel(userAgent),
      userAgent,
      ipAddress: getClientIp(request),
      expiresAt,
    },
  });

  return tokenId;
}

export async function validateUserSession(tokenId: string | null | undefined) {
  if (!tokenId) return true;

  const session = await prisma.userSession.findUnique({
    where: { tokenId },
    select: { id: true, expiresAt: true },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) {
      await prisma.userSession.delete({ where: { tokenId } }).catch(() => {});
    }
    return false;
  }

  return true;
}

let lastTouch = new Map<string, number>();

export async function touchUserSession(tokenId: string | null | undefined) {
  if (!tokenId) return;

  const now = Date.now();
  const prev = lastTouch.get(tokenId) ?? 0;
  if (now - prev < 5 * 60 * 1000) return;

  lastTouch.set(tokenId, now);
  await prisma.userSession
    .update({
      where: { tokenId },
      data: { lastActiveAt: new Date() },
    })
    .catch(() => {});
}

export async function revokeUserSession(tokenId: string) {
  await prisma.userSession.deleteMany({ where: { tokenId } });
}

export async function revokeSessionById(sessionId: string, userId: string) {
  return prisma.userSession.deleteMany({
    where: { id: sessionId, userId },
  });
}

export async function revokeOtherSessions(userId: string, currentTokenId: string) {
  return prisma.userSession.deleteMany({
    where: { userId, NOT: { tokenId: currentTokenId } },
  });
}

export async function revokeAllUserSessions(userId: string) {
  return prisma.userSession.deleteMany({ where: { userId } });
}

export async function listUserSessions(userId: string, currentTokenId?: string | null) {
  await prisma.userSession.deleteMany({
    where: { userId, expiresAt: { lt: new Date() } },
  });

  const sessions = await prisma.userSession.findMany({
    where: { userId },
    orderBy: { lastActiveAt: "desc" },
    select: {
      id: true,
      deviceLabel: true,
      ipAddress: true,
      lastActiveAt: true,
      createdAt: true,
      tokenId: true,
    },
  });

  return sessions.map((s) => ({
    id: s.id,
    deviceLabel: s.deviceLabel,
    ipAddress: s.ipAddress,
    lastActiveAt: s.lastActiveAt.toISOString(),
    createdAt: s.createdAt.toISOString(),
    isCurrent: Boolean(currentTokenId && s.tokenId === currentTokenId),
  }));
}
