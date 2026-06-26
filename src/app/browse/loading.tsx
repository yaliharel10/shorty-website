import { FilmRowSkeleton, HeroSkeleton } from "@/components/LoadingSkeleton";

export default function BrowseLoading() {
  return (
    <div className="min-h-screen bg-[#080808]">
      <HeroSkeleton />
      <FilmRowSkeleton />
      <FilmRowSkeleton />
    </div>
  );
}
