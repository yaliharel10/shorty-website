"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  createToken,
  hashPassword,
  sessionCookieOptions,
  verifyPassword,
} from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { TRIAL_DAYS } from "@/lib/subscription";
import { loginSchema, registerSchema } from "@/lib/validation";
import { userSessionSelect, toPublicUser } from "@/lib/user-session";

export type AuthActionState = {
  error?: string;
};

function safeRedirectPath(value: FormDataEntryValue | null) {
  const path = typeof value === "string" ? value.trim() : "";
  if (path.startsWith("/") && !path.startsWith("//")) return path;
  return "/browse";
}

async function enforceAuthRateLimit() {
  const headerStore = await headers();
  const ip =
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerStore.get("x-real-ip") ||
    "unknown";
  const result = rateLimit(`auth:${ip}`, 10, 15 * 60 * 1000);
  if (!result.ok) {
    throw new Error("Too many attempts. Please wait a few minutes and try again.");
  }
}

async function setSessionCookie(user: Parameters<typeof toPublicUser>[0]) {
  const publicUser = toPublicUser(user);
  const token = await createToken(publicUser);
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieOptions(token));
}

export async function loginAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    await enforceAuthRateLimit();

    const data = loginSchema.parse({
      identifier: formData.get("identifier"),
      password: formData.get("password"),
    });

    const user = await prisma.user.findFirst({
      where: data.identifier.includes("@")
        ? { email: data.identifier.toLowerCase() }
        : { username: data.identifier },
      select: {
        ...userSessionSelect,
        password: true,
      },
    });

    if (!user || !(await verifyPassword(data.password, user.password))) {
      return { error: "Invalid credentials" };
    }

    const { password: _, ...sessionFields } = user;
    await setSessionCookie(sessionFields);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Invalid input" };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Something went wrong" };
  }

  redirect(safeRedirectPath(formData.get("redirectTo")));
}

export async function registerAction(
  _prev: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  try {
    await enforceAuthRateLimit();

    const data = registerSchema.parse({
      username: formData.get("identifier"),
      email: formData.get("email"),
      password: formData.get("password"),
    });

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email: data.email.toLowerCase() }, { username: data.username }],
      },
    });
    if (existing) {
      return { error: "Username or email already exists" };
    }

    const trialEndsAt = new Date();
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    const user = await prisma.user.create({
      data: {
        username: data.username,
        email: data.email.toLowerCase(),
        password: await hashPassword(data.password),
        trialEndsAt,
      },
      select: userSessionSelect,
    });

    await setSessionCookie(user);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0]?.message ?? "Invalid input" };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Something went wrong" };
  }

  redirect(safeRedirectPath(formData.get("redirectTo")));
}
