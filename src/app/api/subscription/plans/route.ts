export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { SUBSCRIPTION_PLANS } from "@/lib/subscription";

export async function GET() {
  return NextResponse.json({ plans: SUBSCRIPTION_PLANS });
}
