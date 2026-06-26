export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { issueAuthResponse } from "@/lib/auth-response";
import { apiError, enforceRateLimit, handleApiError } from "@/lib/api-utils";
import { TRIAL_DAYS } from "@/lib/subscription";
import { loginSchema, registerSchema } from "@/lib/validation";
import { userSessionSelect } from "@/lib/user-session";
import { ensureDefaultProfile } from "@/lib/profiles";
import { createNotification } from "@/lib/notifications";
import { isProductionDeploy } from "@/lib/production";
import {
  issueEmailVerification,
  sendWelcomeEmail,
} from "@/lib/email-verification";

export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth", 10, 15 * 60 * 1000);
  if (limited) return limited;

  try {
    const body = await request.json();
    const action = body.action as string;

    if (action === "register") {
      const data = registerSchema.parse(body);
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.email.toLowerCase() }, { username: data.username }],
        },
      });
      if (existing) {
        return apiError("Username or email already exists", 400);
      }

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);
      const autoVerify = !isProductionDeploy() || !process.env.RESEND_API_KEY;

      const user = await prisma.user.create({
        data: {
          username: data.username,
          email: data.email.toLowerCase(),
          password: await hashPassword(data.password),
          trialEndsAt,
          emailVerified: autoVerify,
        },
        select: userSessionSelect,
      });

      void ensureDefaultProfile(user.id).catch(() => {});
      void createNotification(user.id, {
        type: "welcome",
        title: "Welcome to Shorty",
        body: autoVerify
          ? "Your 7-day free trial is active — start watching curated short films."
          : "Verify your email to unlock your 7-day free trial.",
        href: "/browse",
      }).catch(() => {});

      if (!autoVerify) {
        void issueEmailVerification(user.id, user.email).catch(() => {});
      } else {
        void sendWelcomeEmail(user.email, user.username).catch(() => {});
      }

      return issueAuthResponse(user, request, {
        emailVerificationRequired: !autoVerify,
      }, "signup");
    }

    if (action === "login") {
      const data = loginSchema.parse(body);
      const user = await prisma.user.findFirst({
        where: data.identifier.includes("@")
          ? { email: data.identifier.toLowerCase() }
          : { username: data.identifier },
        select: {
          ...userSessionSelect,
          password: true,
        },
      });

      if (!user || !user.password || !(await verifyPassword(data.password, user.password))) {
        return apiError("Invalid credentials", 401);
      }

      const { password: _, ...sessionFields } = user;
      return issueAuthResponse(sessionFields, request, {}, "login", { fast: true });
    }

    return apiError("Invalid action", 400);
  } catch (error) {
    return handleApiError(error);
  }
}
