import { cookies } from "next/headers";
import { prisma } from "@/lib/db";

export const PROFILE_COOKIE = "shorty_profile";

export async function getActiveProfileId(userId: string): Promise<string | null> {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(PROFILE_COOKIE)?.value;
  if (!profileId) return null;

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId },
    select: { id: true },
  });
  return profile?.id ?? null;
}

export async function getActiveProfile(userId: string) {
  const cookieStore = await cookies();
  const profileId = cookieStore.get(PROFILE_COOKIE)?.value;

  if (profileId) {
    const profile = await prisma.profile.findFirst({
      where: { id: profileId, userId },
      select: { id: true, name: true, isKids: true, pinHash: true },
    });
    if (profile) return profile;
  }

  return prisma.profile.findFirst({
    where: { userId, isDefault: true },
    select: { id: true, name: true, isKids: true, pinHash: true },
  });
}

export function kidsProfileFilter(isKids: boolean) {
  if (!isKids) return {};
  return { kidsFriendly: true };
}
