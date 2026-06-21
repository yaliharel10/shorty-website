export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";

/** Public health check — also used by Render (see render.yaml). */
export async function GET() {
  return NextResponse.json({
    ok: true,
    status: "healthy",
    ts: Date.now(),
  });
}
