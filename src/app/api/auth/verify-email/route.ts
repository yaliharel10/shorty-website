export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { verifyEmailToken } from "@/lib/email-verification";
import { getSiteUrl } from "@/lib/email";

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${getSiteUrl()}/?verify=missing`);
  }

  const ok = await verifyEmailToken(token);
  return NextResponse.redirect(
    `${getSiteUrl()}/${ok ? "?verify=success" : "?verify=invalid"}`
  );
}
