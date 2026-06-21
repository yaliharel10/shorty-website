export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { reissueAuthResponse } from "@/lib/auth-response";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { getPlan } from "@/lib/subscription";
import { subscribeSchema } from "@/lib/validation";
import { isStripeConfigured, getStripe } from "@/lib/stripe";
import { activateDemoSubscription } from "@/lib/stripe-sync";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "subscribe", 5, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const session = await getSession();
    if (!session) {
      return apiError("Sign in to subscribe", 401);
    }

    const { planId } = subscribeSchema.parse(await request.json());
    const plan = getPlan(planId);
    if (!plan) {
      return apiError("Invalid plan", 400);
    }

    if (isStripeConfigured()) {
      return apiError(
        "Use Stripe checkout — call POST /api/subscription/checkout instead",
        400
      );
    }

    const user = await activateDemoSubscription(session.id, planId);

    return reissueAuthResponse(user, request, session.sessionId, {
      message: `Subscribed to ${plan.name} — $${plan.price.toFixed(2)}/month (demo mode)`,
    });
  } catch (error) {
    return handleApiError(error, "Subscription failed");
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Sign in to manage subscription", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { stripeSubscriptionId: true },
    });

    if (isStripeConfigured() && user?.stripeSubscriptionId) {
      await getStripe().subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });
      const updated = await prisma.user.update({
        where: { id: session.id },
        data: { subscriptionStatus: "canceled" },
        select: userSessionSelect,
      });

      return reissueAuthResponse(updated, request, session.sessionId, {
        message:
          "Subscription will cancel at end of billing period. Manage billing anytime.",
      });
    }

    const updated = await prisma.user.update({
      where: { id: session.id },
      data: { subscriptionStatus: "canceled" },
      select: userSessionSelect,
    });

    return reissueAuthResponse(updated, request, session.sessionId, {
      message:
        "Subscription canceled — access continues until the end of your billing period",
    });
  } catch (error) {
    return handleApiError(error, "Cancel failed");
  }
}
