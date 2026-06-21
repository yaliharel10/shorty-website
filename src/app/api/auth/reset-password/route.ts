export const dynamic = "force-dynamic";
export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { resetPasswordSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const limited = enforceRateLimit(request, "reset-password", 5, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const { token, password } = resetPasswordSchema.parse(await request.json());

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiresAt: { gt: new Date() },
      },
      select: { id: true },
    });

    if (!user) {
      return apiError("Invalid or expired reset link", 400);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: await hashPassword(password),
        passwordResetToken: null,
        passwordResetExpiresAt: null,
      },
    });

    return NextResponse.json({
      message: "Password updated. You can sign in with your new password.",
    });
  } catch (error) {
    return handleApiError(error, "Reset failed");
  }
}
