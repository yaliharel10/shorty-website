export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { isStripeConfigured } from "@/lib/stripe";

export async function GET() {
  return NextResponse.json({
    stripeEnabled: isStripeConfigured(),
    publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || null,
  });
}
