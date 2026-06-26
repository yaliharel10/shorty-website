export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession, verifyPassword } from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { deleteAccountSchema } from "@/lib/validation";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { clearSessionCookieOptions } from "@/lib/auth";
import { revokeAllUserSessions } from "@/lib/sessions";

export async function DELETE(request: Request) {
  const limited = await enforceRateLimit(request, "delete-account", 3, 60 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const { currentPassword } = deleteAccountSchema.parse(await request.json());

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        id: true,
        password: true,
        role: true,
        stripeSubscriptionId: true,
      },
    });

    if (!user || !user.password || !(await verifyPassword(currentPassword, user.password))) {
      return apiError("Current password is incorrect", 400);
    }

    if (user.role === "admin") {
      const adminCount = await prisma.user.count({ where: { role: "admin" } });
      if (adminCount <= 1) {
        return apiError("Cannot delete the last admin account", 400);
      }
    }

    if (isStripeConfigured() && user.stripeSubscriptionId) {
      try {
        await getStripe().subscriptions.cancel(user.stripeSubscriptionId);
      } catch {
        // Continue deletion even if Stripe cancel fails
      }
    }

    await revokeAllUserSessions(user.id);
    await prisma.user.delete({ where: { id: user.id } });

    const response = NextResponse.json({
      message: "Your account has been permanently deleted",
    });
    response.cookies.set(clearSessionCookieOptions());
    return response;
  } catch (error) {
    return handleApiError(error, "Account deletion failed");
  }
}
