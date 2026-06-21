export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { getPlan } from "@/lib/subscription";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return apiError("Unauthorized", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: {
        stripeCustomerId: true,
        stripeSubscriptionId: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionEndsAt: true,
        trialEndsAt: true,
      },
    });

    if (!user) {
      return apiError("User not found", 404);
    }

    const plan = getPlan(user.subscriptionTier);
    const stripeEnabled = isStripeConfigured();

    let paymentMethod: {
      brand: string;
      last4: string;
      expMonth: number;
      expYear: number;
    } | null = null;

    let nextBillingDate: string | null = user.subscriptionEndsAt?.toISOString() ?? null;
    let cancelAtPeriodEnd = user.subscriptionStatus === "canceled";

    if (stripeEnabled && user.stripeCustomerId) {
      const stripe = getStripe();

      const methods = await stripe.paymentMethods.list({
        customer: user.stripeCustomerId,
        type: "card",
        limit: 1,
      });

      const card = methods.data[0]?.card;
      if (card) {
        paymentMethod = {
          brand: card.brand,
          last4: card.last4,
          expMonth: card.exp_month,
          expYear: card.exp_year,
        };
      }

      if (user.stripeSubscriptionId) {
        const sub = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
        cancelAtPeriodEnd = sub.cancel_at_period_end;
        const periodEnd = sub.items.data[0]?.current_period_end;
        if (periodEnd) {
          nextBillingDate = new Date(periodEnd * 1000).toISOString();
        }
      }
    }

    return NextResponse.json({
      stripeEnabled,
      hasBillingAccount: Boolean(user.stripeCustomerId),
      paymentMethod,
      subscription: {
        tier: user.subscriptionTier,
        planName: plan?.name ?? null,
        planPrice: plan?.price ?? null,
        status: user.subscriptionStatus,
        nextBillingDate,
        cancelAtPeriodEnd,
        trialEndsAt: user.trialEndsAt?.toISOString() ?? null,
        screens: plan?.screens ?? 1,
      },
    });
  } catch (error) {
    return handleApiError(error, "Failed to load billing info");
  }
}
