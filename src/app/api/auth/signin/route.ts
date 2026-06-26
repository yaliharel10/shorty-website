export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createToken, sessionCookieOptions, verifyPassword } from "@/lib/auth";
import { enforceRateLimit } from "@/lib/api-utils";
import { loginSchema } from "@/lib/validation";
import { toPublicUser, userSessionSelect } from "@/lib/user-session";
import { trackEvent } from "@/lib/analytics";

function redirectWithError(request: Request, code: string, redirectTo = "/browse") {
  const base = redirectTo.startsWith("http")
    ? new URL(redirectTo)
    : new URL(redirectTo, request.url);
  base.searchParams.set("signin", "1");
  base.searchParams.set("error", code);
  return NextResponse.redirect(base, 303);
}

/** Browser form POST login — sets cookie and redirects (no fetch/JS required). */
export async function POST(request: Request) {
  const limited = await enforceRateLimit(request, "auth", 10, 15 * 60 * 1000);
  if (limited) {
    return redirectWithError(request, "rate_limit");
  }

  try {
    const form = await request.formData();
    const identifier = String(form.get("identifier") ?? "").trim();
    const password = String(form.get("password") ?? "");
    const redirectTo = String(form.get("redirect") ?? "/browse").trim() || "/browse";

    const data = loginSchema.parse({ identifier, password });

    const user = await prisma.user.findFirst({
      where: data.identifier.includes("@")
        ? { email: data.identifier.toLowerCase() }
        : { username: data.identifier },
      select: { ...userSessionSelect, password: true },
    });

    if (!user || !(await verifyPassword(data.password, user.password))) {
      return redirectWithError(request, "invalid_credentials", redirectTo);
    }

    const { password: _, ...sessionFields } = user;
    const publicUser = toPublicUser(sessionFields);
    const token = await createToken(publicUser);
    trackEvent("login", { userId: user.id }, user.id);

    const destination = redirectTo.startsWith("http")
      ? new URL(redirectTo)
      : new URL(redirectTo, request.url);
    destination.searchParams.delete("signin");
    destination.searchParams.delete("error");

    const response = NextResponse.redirect(destination, 303);
    response.cookies.set(sessionCookieOptions(token));
    return response;
  } catch {
    return redirectWithError(request, "server_error");
  }
}
