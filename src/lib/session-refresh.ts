import { prisma } from "@/lib/db";
import { toSessionUser, userSessionSelect } from "@/lib/user-session";

export async function refreshUserSession(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: userSessionSelect,
  });
  return user ? toSessionUser(user) : null;
}
