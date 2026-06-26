export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { subscribeSchema } from "@/lib/validation";
import { getSiteUrl, getStripe, isStripeConfigured, planToLineItem } from "@/lib/stripe";

async function getOrCreateCustomer(userId: string, email: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { stripeCustomerId: true },
  });

  if (user?.stripeCustomerId) return user.stripeCustomerId;

  const stripe = getStripe();
  const customer = await stripe.customers.create({
    email,
    metadata: { userId },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
}

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "checkout", 10, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    if (!isStripeConfigured()) {
      return apiError("Stripe is not configured on this server", 503);
    }

    const session = await getSession();
    if (!session) {
      return apiError("Sign in to subscribe", 401);
    }

    const { planId } = subscribeSchema.parse(await request.json());
    const stripe = getStripe();
    const siteUrl = getSiteUrl();
    const customerId = await getOrCreateCustomer(session.id, session.email);

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [planToLineItem(planId)],
      success_url: `${siteUrl}/subscription?success=1`,
      cancel_url: `${siteUrl}/subscription?canceled=1`,
      client_reference_id: session.id,
      metadata: { userId: session.id, planId },
      subscription_data: {
        metadata: { userId: session.id, planId },
      },
      allow_promotion_codes: true,
    });

    if (!checkoutSession.url) {
      return apiError("Could not create checkout session", 500);
    }

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error) {
    return handleApiError(error, "Checkout failed");
  }
}
