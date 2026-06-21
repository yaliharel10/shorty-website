export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      status: "healthy",
      db: "connected",
      ts: Date.now(),
    });
  } catch (error) {
    console.error("Health check DB error:", error);
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        db: "error",
        ts: Date.now(),
      },
      { status: 503 }
    );
  }
}
