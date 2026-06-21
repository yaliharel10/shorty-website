export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { sessionToClientUser } from "@/lib/client-user";

/** Returns user from JWT cookie — no database query. */
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({ user: sessionToClientUser(session) });
}
