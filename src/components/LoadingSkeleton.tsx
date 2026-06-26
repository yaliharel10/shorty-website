export function FilmGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div key={i} className="overflow-hidden rounded-xl bg-[#141414] premium-shadow">
          <div className="aspect-[2/3] skeleton-shimmer" />
          <div className="space-y-2 p-3">
            <div className="h-3 rounded skeleton-shimmer" />
            <div className="h-2 w-2/3 rounded skeleton-shimmer" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FilmRowSkeleton() {
  return (
    <div className="mb-8 px-4 md:px-8 lg:px-12">
      <div className="mb-4 h-6 w-40 rounded skeleton-shimmer" />
      <div className="flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-[2/3] w-[160px] shrink-0 rounded-lg skeleton-shimmer sm:w-[180px] md:w-[200px]"
          />
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative h-[55vh] min-h-[400px] max-h-[600px] w-full skeleton-shimmer">
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
        <div className="mb-3 h-3 w-24 rounded bg-[#222]" />
        <div className="mb-4 h-12 w-2/3 max-w-lg rounded bg-[#1a1a1a]" />
        <div className="mb-6 h-16 w-full max-w-xl rounded bg-[#1a1a1a]" />
        <div className="flex gap-3">
          <div className="h-11 w-28 rounded-lg bg-[#222]" />
          <div className="h-11 w-28 rounded-lg bg-[#1a1a1a]" />
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({
  className = "h-24",
}: {
  className?: string;
}) {
  return <div className={`animate-pulse rounded-xl bg-[#141414] ${className}`} />;
}
