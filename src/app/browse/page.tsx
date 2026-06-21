import { Suspense } from "react";
import { HomePage } from "@/components/HomePage";
import { HeroSkeleton, FilmRowSkeleton } from "@/components/LoadingSkeleton";

function BrowseFallback() {
  return (
    <div className="min-h-screen bg-[#080808] pt-20">
      <HeroSkeleton />
      <FilmRowSkeleton />
      <FilmRowSkeleton />
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<BrowseFallback />}>
      <HomePage />
    </Suspense>
  );
}
