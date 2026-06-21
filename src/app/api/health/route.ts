export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 15;
import { NextResponse } from "next/server";

export async function GET() {
  const base = { ts: Date.now() };

  try {
    const { prisma, isTursoConfigured } = await import("@/lib/db");
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      ok: true,
      status: "healthy",
      db: isTursoConfigured() ? "turso" : "local",
      ...base,
    });
  } catch (error) {
    console.error("Health check DB error:", error);
    const missingTurso =
      process.env.VERCEL === "1" &&
      !process.env.TURSO_DATABASE_URL?.trim();
    return NextResponse.json(
      {
        ok: false,
        status: "degraded",
        db: missingTurso ? "missing_turso_env" : "error",
        hint: missingTurso
          ? "Set TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in Vercel → Production"
          : undefined,
        ...base,
      },
      { status: 503 }
    );
  }
}
