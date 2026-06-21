export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import {
  createToken,
  getSession,
  sessionCookieOptions,
} from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import { syncUserSubscription } from "@/lib/stripe-sync";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";

export async function POST() {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Sign in required", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { stripeSubscriptionId: true },
    });

    if (!isStripeConfigured() || !user?.stripeSubscriptionId) {
      const fresh = await prisma.user.findUnique({
        where: { id: session.id },
        select: userSessionSelect,
      });
      if (!fresh) return apiError("User not found", 404);
      const publicUser = toPublicUser(fresh);
      return NextResponse.json({ user: publicUser });
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(
      user.stripeSubscriptionId
    );
    await syncUserSubscription(session.id, subscription);

    const updated = await prisma.user.findUnique({
      where: { id: session.id },
      select: userSessionSelect,
    });
    if (!updated) return apiError("User not found", 404);

    const publicUser = toPublicUser(updated);
    const token = await createToken(publicUser);
    const response = NextResponse.json({ user: publicUser });
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch (error) {
    return handleApiError(error, "Sync failed");
  }
}
