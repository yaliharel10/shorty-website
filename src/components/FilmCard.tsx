"use client";

import Image from "next/image";
import { Heart, Play, Star } from "lucide-react";
import { cn, formatRating } from "@/lib/utils";
import type { Film } from "@/types";

type FilmCardProps = {
  film: Film;
  isFavorite?: boolean;
  variant?: "grid" | "row";
  onClick: () => void;
};

export function FilmCard({
  film,
  isFavorite,
  variant = "grid",
  onClick,
}: FilmCardProps) {
  return (
    <button
      onClick={onClick}
      aria-label={`Play ${film.title}, ${film.category}, rated ${formatRating(film.rating)}`}
      className={cn(
        "group relative shrink-0 cursor-pointer overflow-hidden rounded-xl bg-[#141414] text-left card-hover",
        variant === "grid" ? "w-full" : "w-[180px] sm:w-[200px] md:w-[220px]",
        "scroll-snap-align-start"
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={film.posterUrl}
          alt={film.title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          sizes="220px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff7a18] shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
          </div>
        </div>
        <div className="absolute left-2 top-2 flex w-[calc(100%-16px)] items-center justify-between">
          <span className="flex items-center gap-1 rounded-full bg-black/70 px-2 py-1 text-xs font-bold text-yellow-400">
            <Star className="h-3 w-3 fill-yellow-400" />
            {formatRating(film.rating)}
          </span>
          {isFavorite && (
            <Heart className="h-4 w-4 fill-red-500 text-red-500 drop-shadow" />
          )}
        </div>
      </div>
      <div className="p-3">
        <h4 className="truncate text-sm font-semibold">{film.title}</h4>
        <p className="mt-1 text-xs capitalize text-[#888]">
          {film.category} · {film.duration}m
        </p>
      </div>
    </button>
  );
}
