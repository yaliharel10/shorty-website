import { hashPassword, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function ensureDefaultProfile(userId: string) {
  const existing = await prisma.profile.findFirst({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { username: true, displayName: true, photoUrl: true },
  });
  if (!user) return null;

  return prisma.profile.create({
    data: {
      userId,
      name: user.displayName || user.username,
      avatarUrl: user.photoUrl,
      isDefault: true,
    },
  });
}

export async function listProfiles(userId: string) {
  await ensureDefaultProfile(userId);
  const profiles = await prisma.profile.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      isKids: true,
      isDefault: true,
      createdAt: true,
      pinHash: true,
    },
  });
  return profiles.map(({ pinHash, ...p }) => ({ ...p, hasPin: Boolean(pinHash) }));
}

export async function createProfile(
  userId: string,
  data: { name: string; isKids?: boolean; pin?: string; avatarUrl?: string }
) {
  const count = await prisma.profile.count({ where: { userId } });
  if (count >= 5) throw new Error("Maximum 5 profiles per account");

  return prisma.profile.create({
    data: {
      userId,
      name: data.name.slice(0, 30),
      isKids: data.isKids ?? false,
      avatarUrl: data.avatarUrl,
      pinHash: data.pin ? await hashPassword(data.pin) : null,
    },
  });
}

export async function verifyProfilePin(profileId: string, userId: string, pin: string) {
  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId },
    select: { pinHash: true },
  });
  if (!profile?.pinHash) return true;
  return verifyPassword(pin, profile.pinHash);
}
