"use client";

import { cn } from "@/lib/utils";

const GENRES = [
  { id: "drama", label: "Drama" },
  { id: "comedy", label: "Comedy" },
  { id: "animation", label: "Animation" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "top", label: "Top Rated" },
  { id: "new", label: "New" },
] as const;

type GenreChipsProps = {
  active: string;
  onSelect: (id: string) => void;
  className?: string;
};

export function GenreChips({ active, onSelect, className }: GenreChipsProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 scrollbar-hide", className)}>
      {GENRES.map((g) => (
        <button
          key={g.id}
          type="button"
          onClick={() => onSelect(g.id)}
          className={cn(
            "shrink-0 rounded-full border px-4 py-1.5 text-sm font-medium transition",
            active === g.id
              ? "border-[#ff7a18] bg-[#ff7a18]/15 text-[#ff7a18]"
              : "border-[#333] bg-[#1a1a1a] text-[#aaa] hover:border-[#444] hover:text-white"
          )}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
