"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type StarRatingProps = {
  value: number;
  hoverValue?: number;
  onChange?: (score: number) => void;
  onHover?: (score: number) => void;
  onHoverEnd?: () => void;
  max?: number;
  readonly?: boolean;
  showScore?: boolean;
  size?: "sm" | "md";
  label?: string;
};

export function StarRating({
  value,
  hoverValue = 0,
  onChange,
  onHover,
  onHoverEnd,
  max = 10,
  readonly = false,
  showScore = true,
  size = "md",
  label = "Your rating",
}: StarRatingProps) {
  const display = hoverValue || value;
  const starSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <div className="rounded-xl border border-[#222] bg-[#111]/80 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[#666]">
          {label}
        </p>
        {showScore && (
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-bold tabular-nums",
              display > 0
                ? "bg-[#ff7a18]/15 text-[#ff7a18]"
                : "bg-[#222] text-[#666]"
            )}
          >
            {display > 0 ? `${display}/${max}` : "—"}
          </span>
        )}
      </div>
      <div
        className="flex flex-wrap gap-1"
        role={readonly ? "img" : "group"}
        aria-label={readonly ? `Rated ${value} out of ${max}` : `Rate from 1 to ${max}`}
        onMouseLeave={readonly ? undefined : onHoverEnd}
      >
        {Array.from({ length: max }, (_, i) => i + 1).map((num) => {
          const active = display >= num;
          const filled = value >= num;

          if (readonly) {
            return (
              <Star
                key={num}
                className={cn(
                  starSize,
                  active
                    ? "fill-amber-400 text-amber-400"
                    : "fill-[#222] text-[#333]"
                )}
                aria-hidden="true"
              />
            );
          }

          return (
            <button
              key={num}
              type="button"
              onClick={() => onChange?.(num)}
              onMouseEnter={() => onHover?.(num)}
              aria-label={`Rate ${num} out of ${max}`}
              aria-pressed={filled}
              className={cn(
                "rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ff7a18]",
                active && "animate-star-pop"
              )}
            >
              <Star
                className={cn(
                  starSize,
                  active
                    ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.35)]"
                    : "fill-[#1a1a1a] text-[#444]"
                )}
                aria-hidden="true"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Compact rating badge for cards and metadata rows. */
export function RatingBadge({
  rating,
  className,
}: {
  rating: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-black/70 px-2.5 py-1 text-xs font-bold text-amber-400 ring-1 ring-amber-400/20",
        className
      )}
    >
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
      {rating.toFixed(1)}
    </span>
  );
}
