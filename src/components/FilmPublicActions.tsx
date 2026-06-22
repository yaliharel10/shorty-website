"use client";

import { useState } from "react";
import Link from "next/link";
import { Share2 } from "lucide-react";

type FilmPublicActionsProps = {
  filmId: string;
  title: string;
  monthlyFree: boolean;
};

export function FilmPublicActions({ filmId, title, monthlyFree }: FilmPublicActionsProps) {
  const [copied, setCopied] = useState(false);

  const share = async () => {
    const url = `${window.location.origin}/films/${filmId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text: `Watch "${title}" on Shorty`, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* user cancelled share */
    }
  };

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <Link
        href={monthlyFree ? "/" : `/browse?watch=${filmId}`}
        className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-[#e6e6e6]"
      >
        {monthlyFree ? "Watch free on homepage" : "Watch now"}
      </Link>
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-2 rounded-lg border border-[#444] px-5 py-3 text-sm font-bold transition hover:bg-white/5"
      >
        <Share2 className="h-4 w-4" />
        {copied ? "Copied!" : "Share"}
      </button>
    </div>
  );
}
