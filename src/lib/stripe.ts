import Stripe from "stripe";
import { getPlan, type PlanId } from "@/lib/subscription";

let stripeClient: Stripe | null = null;

export function isStripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("Stripe is not configured");
  }
  if (!stripeClient) {
    stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return stripeClient;
}

export function getSiteUrl() {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "http://localhost:3000"
  );
}

export function planToLineItem(planId: PlanId): Stripe.Checkout.SessionCreateParams.LineItem {
  const plan = getPlan(planId);
  if (!plan) throw new Error("Invalid plan");

  return {
    price_data: {
      currency: "usd",
      product_data: {
        name: `Shorty ${plan.name}`,
        description: plan.tagline,
        metadata: { planId },
      },
      unit_amount: Math.round(plan.price * 100),
      recurring: { interval: "month" },
    },
    quantity: 1,
  };
}

export function tierFromSubscription(sub: Stripe.Subscription): PlanId | "none" {
  const meta = sub.metadata?.planId as PlanId | undefined;
  if (meta && getPlan(meta)) return meta;

  const priceId = sub.items.data[0]?.price?.id;
  const product = sub.items.data[0]?.price?.product;
  const productMeta =
    typeof product === "object" && product && "metadata" in product
      ? (product.metadata?.planId as PlanId | undefined)
      : undefined;
  if (productMeta && getPlan(productMeta)) return productMeta;

  if (priceId && process.env[`STRIPE_PRICE_${priceId}`]) {
    return process.env[`STRIPE_PRICE_${priceId}`] as PlanId;
  }

  return "none";
}

export function mapStripeStatus(
  status: Stripe.Subscription.Status
): string {
  switch (status) {
    case "active":
    case "trialing":
      return "active";
    case "canceled":
      return "canceled";
    case "past_due":
      return "past_due";
    case "unpaid":
      return "unpaid";
    case "incomplete":
    case "incomplete_expired":
      return "incomplete";
    default:
      return status;
  }
}

export function getSubscriptionPeriodEnd(sub: Stripe.Subscription): Date {
  const itemEnd = sub.items.data[0]?.current_period_end;
  if (itemEnd) return new Date(itemEnd * 1000);
  const legacy = (sub as Stripe.Subscription & { current_period_end?: number })
    .current_period_end;
  if (legacy) return new Date(legacy * 1000);
  return new Date();
}

export function stripeStatusGrantsAccess(
  status: Stripe.Subscription.Status,
  periodEnd: Date
): boolean {
  if (status === "active" || status === "trialing") return true;
  if (status === "canceled" && periodEnd > new Date()) return true;
  return false;
}
