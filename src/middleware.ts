import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const TEST_PATHS = ["/test", "/demo", "/api/test"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (process.env.NODE_ENV === "production" && process.env.ENABLE_TEST_LOGIN !== "true") {
    if (TEST_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      return NextResponse.redirect(new URL("/help?demo=disabled", request.url));
    }
  }

  const response = NextResponse.next();
  response.headers.set("x-request-id", crypto.randomUUID());
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|manifest.webmanifest).*)",
  ],
};
