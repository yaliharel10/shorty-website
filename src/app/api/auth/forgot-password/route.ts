export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { forgotPasswordSchema } from "@/lib/validation";

const GENERIC_MESSAGE =
  "If an account exists for that email, we sent password reset instructions.";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "forgot-password", 5, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const { email } = forgotPasswordSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true, email: true },
    });

    if (user) {
      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetToken: token,
          passwordResetExpiresAt: expiresAt,
        },
      });

      const resetUrl = await sendPasswordResetEmail(user.email, token);

      return NextResponse.json({
        message: GENERIC_MESSAGE,
        ...(process.env.NODE_ENV !== "production" && !process.env.RESEND_API_KEY
          ? { devResetUrl: resetUrl }
          : {}),
      });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (error) {
    return handleApiError(error, "Request failed");
  }
}
