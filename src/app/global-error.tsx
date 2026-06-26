"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#080808] text-white antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#ff7a18]">
            Application error
          </p>
          <h1 className="mb-3 text-3xl font-bold">Shorty encountered a problem</h1>
          <p className="mb-8 max-w-md text-sm text-[#888]">
            A critical error prevented the page from loading. Please try again.
          </p>
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="rounded-lg bg-[#ff7a18] px-5 py-2.5 text-sm font-bold"
            >
              Try again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-[#333] px-5 py-2.5 text-sm font-bold"
            >
              Go home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
