export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiError, handleApiError } from "@/lib/api-utils";
import { getSiteUrl, getStripe, isStripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    if (!isStripeConfigured()) {
      return apiError("Stripe is not configured", 503);
    }

    const session = await getSession();
    if (!session) {
      return apiError("Sign in to manage billing", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { stripeCustomerId: true },
    });

    if (!user?.stripeCustomerId) {
      return apiError("No billing account found — subscribe first", 400);
    }

    const body = await request.json().catch(() => ({}));
    const returnPath =
      typeof body.returnUrl === "string" && body.returnUrl.startsWith("/")
        ? body.returnUrl
        : "/subscription";

    const stripe = getStripe();
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${getSiteUrl()}${returnPath}`,
    });

    return NextResponse.json({ url: portal.url });
  } catch (error) {
    return handleApiError(error, "Billing portal failed");
  }
}
