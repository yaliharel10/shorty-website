import type Stripe from "stripe";
import { prisma } from "@/lib/db";
import {
  mapStripeStatus,
  tierFromSubscription,
  getSubscriptionPeriodEnd,
} from "@/lib/stripe";
import type { PlanId } from "@/lib/subscription";
import { userSessionSelect } from "@/lib/user-session";

export async function syncUserSubscription(
  userId: string,
  subscription: Stripe.Subscription
) {
  const periodEnd = getSubscriptionPeriodEnd(subscription);
  const tier = tierFromSubscription(subscription);
  const mappedStatus = mapStripeStatus(subscription.status);

  let finalTier: PlanId | "none" = "none";
  if (tier !== "none") {
    if (subscription.status === "active" || subscription.status === "trialing") {
      finalTier = tier;
    } else if (subscription.status === "canceled" && periodEnd > new Date()) {
      finalTier = tier;
    }
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      stripeCustomerId:
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id,
      subscriptionTier: finalTier,
      subscriptionStatus: mappedStatus,
      subscriptionEndsAt: periodEnd,
      ...(subscription.status === "active" || subscription.status === "trialing"
        ? { trialEndsAt: null }
        : {}),
    },
  });
}

export async function clearUserSubscription(userId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      subscriptionTier: "none",
      subscriptionStatus: null,
      subscriptionEndsAt: null,
    },
  });
}

export async function syncUserByStripeSubscriptionId(
  subscriptionId: string,
  subscription: Stripe.Subscription
) {
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { stripeSubscriptionId: subscriptionId },
        { id: subscription.metadata?.userId },
      ],
    },
  });

  if (!user) return null;
  await syncUserSubscription(user.id, subscription);
  return user.id;
}

export async function activateDemoSubscription(userId: string, planId: PlanId) {
  const subscriptionEndsAt = new Date();
  subscriptionEndsAt.setDate(subscriptionEndsAt.getDate() + 30);

  return prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: planId,
      subscriptionStatus: "active",
      subscriptionEndsAt,
      trialEndsAt: null,
    },
    select: userSessionSelect,
  });
}
