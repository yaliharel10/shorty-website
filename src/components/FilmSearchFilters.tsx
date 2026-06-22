"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  activeFilterCount,
  DEFAULT_FILM_FILTERS,
  type FilmFilterMeta,
  type FilmFilterState,
  type FilmSort,
} from "@/lib/film-filters";

type FilmSearchFiltersProps = {
  filters: FilmFilterState;
  onChange: (filters: FilmFilterState) => void;
  meta: FilmFilterMeta | null;
  resultCount?: number;
  hasSearch?: boolean;
  expanded: boolean;
  onToggleExpanded: () => void;
};

const RATING_PRESETS = [
  { label: "Any", value: null },
  { label: "7+", value: 7 },
  { label: "8+", value: 8 },
  { label: "9+", value: 9 },
] as const;

const DURATION_PRESETS = [
  { label: "Any length", min: null, max: null },
  { label: "Under 15m", min: null, max: 14 },
  { label: "15–20m", min: 15, max: 20 },
  { label: "Over 20m", min: 21, max: null },
] as const;

const SORT_OPTIONS: { value: FilmSort; label: string }[] = [
  { value: "relevance", label: "Relevance" },
  { value: "rating", label: "Highest rated" },
  { value: "newest", label: "Newest added" },
  { value: "year", label: "Release year" },
  { value: "duration", label: "Shortest first" },
  { value: "title", label: "A → Z" },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition",
        active
          ? "border-[#ff7a18] bg-[#ff7a18]/15 text-[#ff7a18]"
          : "border-[#333] bg-[#111] text-[#aaa] hover:border-[#444] hover:text-white"
      )}
    >
      {children}
    </button>
  );
}

export function FilmSearchFilters({
  filters,
  onChange,
  meta,
  resultCount,
  hasSearch,
  expanded,
  onToggleExpanded,
}: FilmSearchFiltersProps) {
  const count = activeFilterCount(filters);

  const patch = (partial: Partial<FilmFilterState>) =>
    onChange({ ...filters, ...partial });

  const toggleGenre = (id: string) => {
    const genres = filters.genres.includes(id)
      ? filters.genres.filter((g) => g !== id)
      : [...filters.genres, id];
    patch({ genres });
  };

  const clearAll = () => onChange({ ...DEFAULT_FILM_FILTERS });

  const years = meta
    ? Array.from(
        { length: meta.years.max - meta.years.min + 1 },
        (_, i) => meta.years.max - i
      )
    : [];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onToggleExpanded}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition",
            expanded || count > 0
              ? "border-[#ff7a18]/50 bg-[#ff7a18]/10 text-[#ff7a18]"
              : "border-[#333] bg-[#111] text-[#ccc] hover:border-[#444]"
          )}
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
          {count > 0 && (
            <span className="rounded-full bg-[#ff7a18] px-1.5 py-0.5 text-[10px] font-bold text-white">
              {count}
            </span>
          )}
        </button>

        {resultCount != null && (
          <span className="text-sm text-[#666]">
            {resultCount} film{resultCount !== 1 ? "s" : ""}
          </span>
        )}

        {count > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="inline-flex items-center gap-1 text-sm text-[#888] transition hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
            Clear filters
          </button>
        )}
      </div>

      {expanded && (
        <div className="mt-4 rounded-2xl border border-[#222] bg-[#111] p-5 md:p-6">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {/* Genres */}
            <div className="md:col-span-2 xl:col-span-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#666]">
                Genre
              </p>
              <div className="flex flex-wrap gap-2">
                {(meta?.genres ?? []).map(({ id, label, count: genreCount }) => (
                  <Chip
                    key={id}
                    active={filters.genres.includes(id)}
                    onClick={() => toggleGenre(id)}
                  >
                    {label}
                    <span className="ml-1 text-[#666]">({genreCount})</span>
                  </Chip>
                ))}
              </div>
            </div>

            {/* Rating */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#666]">
                Minimum rating
              </p>
              <div className="flex flex-wrap gap-2">
                {RATING_PRESETS.map(({ label, value }) => (
                  <Chip
                    key={label}
                    active={filters.minRating === value}
                    onClick={() => patch({ minRating: value })}
                  >
                    {label === "Any" ? label : `⭐ ${label}`}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#666]">
                Duration
              </p>
              <div className="flex flex-wrap gap-2">
                {DURATION_PRESETS.map(({ label, min, max }) => (
                  <Chip
                    key={label}
                    active={
                      filters.minDuration === min && filters.maxDuration === max
                    }
                    onClick={() => patch({ minDuration: min, maxDuration: max })}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Year range */}
            <div>
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#666]">
                Release year
              </p>
              <div className="flex items-center gap-2">
                <select
                  value={filters.yearFrom ?? ""}
                  onChange={(e) =>
                    patch({
                      yearFrom: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="flex-1 rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm outline-none focus:border-[#ff7a18]"
                >
                  <option value="">From any</option>
                  {years.map((y) => (
                    <option key={`from-${y}`} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <span className="text-[#555]">–</span>
                <select
                  value={filters.yearTo ?? ""}
                  onChange={(e) =>
                    patch({
                      yearTo: e.target.value ? Number(e.target.value) : null,
                    })
                  }
                  className="flex-1 rounded-lg border border-[#333] bg-[#0a0a0a] px-3 py-2 text-sm outline-none focus:border-[#ff7a18]"
                >
                  <option value="">To any</option>
                  {years.map((y) => (
                    <option key={`to-${y}`} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort */}
            <div className="md:col-span-2 xl:col-span-3">
              <p className="mb-3 text-xs font-bold uppercase tracking-widest text-[#666]">
                Sort by
              </p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.filter(
                  (o) => o.value !== "relevance" || hasSearch
                ).map(({ value, label }) => (
                  <Chip
                    key={value}
                    active={filters.sort === value}
                    onClick={() => patch({ sort: value })}
                  >
                    {label}
                  </Chip>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
