import { randomBytes } from "crypto";
import { prisma } from "@/lib/db";
import { getPlan } from "@/lib/subscription";

const SESSION_TTL_MS = 3 * 60 * 1000;

export async function cleanupStalePlaybackSessions(userId: string) {
  await prisma.playbackSession.deleteMany({
    where: {
      OR: [
        { userId, expiresAt: { lt: new Date() } },
        { userId, lastActiveAt: { lt: new Date(Date.now() - SESSION_TTL_MS) } },
      ],
    },
  });
}

export async function countActivePlaybackSessions(userId: string) {
  await cleanupStalePlaybackSessions(userId);
  return prisma.playbackSession.count({ where: { userId } });
}

export function getScreenLimit(tier: string) {
  return getPlan(tier)?.screens ?? 1;
}

export async function canStartPlayback(userId: string, tier: string) {
  const limit = getScreenLimit(tier);
  const active = await countActivePlaybackSessions(userId);
  return active < limit;
}

export async function registerPlaybackSession(
  userId: string,
  filmId: string,
  existingToken?: string | null
) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  if (existingToken) {
    const existing = await prisma.playbackSession.findFirst({
      where: { sessionToken: existingToken, userId, filmId },
    });
    if (existing) {
      return prisma.playbackSession.update({
        where: { id: existing.id },
        data: { lastActiveAt: new Date(), expiresAt },
      });
    }
  }

  return prisma.playbackSession.create({
    data: {
      userId,
      filmId,
      sessionToken: randomBytes(16).toString("hex"),
      expiresAt,
    },
  });
}

export async function endPlaybackSession(sessionToken: string, userId: string) {
  await prisma.playbackSession.deleteMany({
    where: { sessionToken, userId },
  });
}
