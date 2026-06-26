"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4 text-center">
      <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#ff7a18]">
        Something went wrong
      </p>
      <h1 className="mb-3 text-3xl font-bold">We hit a snag</h1>
      <p className="mb-8 max-w-md text-sm text-[#888]">
        An unexpected error occurred. You can try again or return to browsing films.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="rounded-lg bg-[#ff7a18] px-5 py-2.5 text-sm font-bold transition hover:bg-[#ff9533]"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-[#333] px-5 py-2.5 text-sm font-bold transition hover:bg-[#1a1a1a]"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
