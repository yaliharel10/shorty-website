import Link from "next/link";
import { Film, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-[#080808] px-4 text-center text-white">
      <div className="hero-mesh pointer-events-none absolute inset-0" aria-hidden />
      <p className="relative mb-2 text-8xl font-extrabold tracking-tighter text-[#ff7a18]/90">
        404
      </p>
      <h1 className="relative mb-3 text-2xl font-bold md:text-3xl">Lost in the credits</h1>
      <p className="relative mb-10 max-w-md text-sm leading-relaxed text-[#888] md:text-base">
        This page doesn&apos;t exist or may have been moved. Let&apos;s get you back to something
        worth watching.
      </p>
      <div className="relative flex flex-wrap justify-center gap-3">
        <Link
          href="/browse"
          className="inline-flex items-center gap-2 rounded-xl bg-[#ff7a18] px-6 py-3 text-sm font-bold shadow-lg shadow-[#ff7a18]/20 transition hover:bg-[#ff9533]"
        >
          <Film className="h-4 w-4" />
          Browse films
        </Link>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl border border-[#444] px-6 py-3 text-sm font-bold transition hover:bg-white/5"
        >
          <Home className="h-4 w-4" />
          Home
        </Link>
        <Link
          href="/browse?search=1"
          className="inline-flex items-center gap-2 rounded-xl border border-[#444] px-6 py-3 text-sm font-bold transition hover:bg-white/5"
        >
          <Search className="h-4 w-4" />
          Search
        </Link>
      </div>
    </div>
  );
}
