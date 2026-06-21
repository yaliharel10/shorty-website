import { NextResponse } from "next/server";
import { z } from "zod";
import { getClientIp, rateLimit } from "./rate-limit";

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(error: unknown, fallback = "Something went wrong") {
  if (error instanceof z.ZodError) {
    return apiError(error.errors[0]?.message ?? "Invalid input", 400);
  }
  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return apiError("Unauthorized", 401);
    }
    if (error.message === "Forbidden") {
      return apiError("Forbidden", 403);
    }
  }
  console.error("[api]", error);
  return apiError(fallback, 500);
}

export function enforceRateLimit(
  request: Request,
  name: string,
  limit: number,
  windowMs: number
) {
  const ip = getClientIp(request);
  const result = rateLimit(`${name}:${ip}`, limit, windowMs);
  if (!result.ok) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(result.retryAfter) },
      }
    );
  }
  return null;
}
