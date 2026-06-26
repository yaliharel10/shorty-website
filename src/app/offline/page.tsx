"use client";

import Link from "next/link";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#080808] px-4 text-center text-white">
      <WifiOff className="mb-4 h-12 w-12 text-[#ff7a18]" />
      <h1 className="mb-2 text-2xl font-bold">You&apos;re offline</h1>
      <p className="mb-8 max-w-md text-sm text-[#888]">
        Check your connection and try again.
      </p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="rounded-lg bg-[#ff7a18] px-6 py-3 text-sm font-bold"
      >
        Retry
      </button>
      <Link href="/browse" className="mt-4 text-sm text-[#888] hover:text-[#ff7a18]">
        Back to browse
      </Link>
    </div>
  );
}
