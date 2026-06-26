export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { verifyProfilePin } from "@/lib/profiles";
import { PROFILE_COOKIE } from "@/lib/active-profile";

const schema = z.object({
  pin: z.string().min(4).max(8),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireSession();
    const { id } = await params;
    const { pin } = schema.parse(await request.json());

    const ok = await verifyProfilePin(id, session.id, pin);
    if (!ok) {
      return NextResponse.json({ error: "Incorrect PIN" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set({
      name: PROFILE_COOKIE,
      value: id,
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    return response;
  } catch (error) {
    return handleApiError(error, "PIN verification failed");
  }
}
