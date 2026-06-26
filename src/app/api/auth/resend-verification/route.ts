export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireSession } from "@/lib/auth";
import { handleApiError } from "@/lib/api-utils";
import { issueEmailVerification } from "@/lib/email-verification";

export async function POST() {
  try {
    const session = await requireSession();
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      select: { email: true, emailVerified: true },
    });
    if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (user.emailVerified) {
      return NextResponse.json({ message: "Email already verified" });
    }

    await issueEmailVerification(session.id, user.email);
    return NextResponse.json({ message: "Verification email sent" });
  } catch (error) {
    return handleApiError(error, "Failed to send verification email");
  }
}
