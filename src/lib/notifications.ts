import { prisma } from "@/lib/db";
import { ensureDefaultProfile } from "@/lib/profiles";

export async function listNotifications(userId: string, limit = 20) {
  await ensureDefaultProfile(userId);
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function createNotification(
  userId: string,
  data: { type: string; title: string; body: string; href?: string }
) {
  return prisma.notification.create({
    data: { userId, ...data },
  });
}

export async function markNotificationRead(userId: string, id: string) {
  return prisma.notification.updateMany({
    where: { id, userId },
    data: { read: true },
  });
}

export async function markAllNotificationsRead(userId: string) {
  return prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
}

export async function unreadNotificationCount(userId: string) {
  return prisma.notification.count({ where: { userId, read: false } });
}

/** Seed welcome + recommendation notifications for new activity. */
export async function notifyRecommendation(userId: string, filmTitle: string, filmId: string) {
  const existing = await prisma.notification.findFirst({
    where: { userId, type: "recommendation", body: { contains: filmId } },
  });
  if (existing) return;
  return createNotification(userId, {
    type: "recommendation",
    title: "Recommended for you",
    body: `Based on your taste — try "${filmTitle}"`,
    href: `/watch/${filmId}`,
  });
}
