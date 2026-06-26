"use client";

import Image from "next/image";
import { Heart, Play } from "lucide-react";
import { cn, formatRating } from "@/lib/utils";
import type { Film } from "@/types";
import { RatingBadge } from "@/components/StarRating";
import { WatchedBadge } from "@/components/WatchedBadge";
import { NewBadge, ProgressBar, RuntimeBadge } from "@/components/FilmBadges";
import { getDurationTier } from "@/lib/film-metadata";

type FilmCardInlineProps = {
  film: Film;
  isFavorite?: boolean;
  isWatched?: boolean;
  isContinue?: boolean;
  isNew?: boolean;
  progressPercent?: number;
};

export function FilmCardInline({
  film,
  isFavorite,
  isWatched,
  isContinue,
  isNew,
  progressPercent = 0,
}: FilmCardInlineProps) {
  const showProgress = isContinue && progressPercent > 0 && progressPercent < 95;

  return (
    <div className="group relative w-[150px] shrink-0 cursor-pointer overflow-hidden rounded-lg sm:w-[170px] md:w-[190px] card-hover scroll-snap-align-start">
      <div className="relative aspect-[2/3]">
        <Image
          src={film.posterUrl}
          alt={film.title}
          fill
          className="object-cover transition duration-500 group-hover:scale-110"
          sizes="190px"
        />
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/20 to-transparent p-3 opacity-0 transition group-hover:opacity-100">
          <p className="truncate text-sm font-bold">{film.title}</p>
          <RatingBadge rating={film.rating} className="mt-1 bg-transparent ring-0" />
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff7a18] shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
          </div>
        </div>
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {isNew && !isWatched && <NewBadge />}
          {isContinue ? (
            <WatchedBadge variant="continue" />
          ) : isWatched ? (
            <WatchedBadge />
          ) : null}
        </div>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          <RuntimeBadge
            minutes={film.duration}
            tier={film.durationTier ?? getDurationTier(film.duration)}
          />
          <RatingBadge rating={film.rating} className="md:hidden" />
          {isFavorite && (
            <Heart className="h-4 w-4 fill-red-500 text-red-500 drop-shadow" aria-hidden="true" />
          )}
        </div>
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
            <ProgressBar percent={progressPercent} />
          </div>
        )}
      </div>
    </div>
  );
}

type FilmCardProps = {
  film: Film;
  isFavorite?: boolean;
  isWatched?: boolean;
  isContinue?: boolean;
  isNew?: boolean;
  progressPercent?: number;
  variant?: "grid" | "row";
  onClick: () => void;
};

export function FilmCard({
  film,
  isFavorite,
  isWatched,
  isContinue,
  isNew,
  progressPercent = 0,
  variant = "grid",
  onClick,
}: FilmCardProps) {
  const showProgress = isContinue && progressPercent > 0 && progressPercent < 95;

  return (
    <button
      onClick={onClick}
      aria-label={`Play ${film.title}, ${film.category}, rated ${formatRating(film.rating)}${isWatched ? ", watched" : ""}`}
      className={cn(
        "group relative shrink-0 cursor-pointer overflow-hidden rounded-xl bg-[#141414] text-left card-hover",
        variant === "grid" ? "w-full" : "w-[180px] sm:w-[200px] md:w-[220px]",
        "scroll-snap-align-start",
        isWatched && !isContinue && "ring-1 ring-emerald-500/30"
      )}
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden">
        <Image
          src={film.posterUrl}
          alt={film.title}
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-110",
            isWatched && !isContinue && "opacity-90"
          )}
          sizes="220px"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#ff7a18] shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
          </div>
        </div>
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {isNew && !isWatched && <NewBadge />}
          {isContinue ? (
            <WatchedBadge variant="continue" />
          ) : isWatched ? (
            <WatchedBadge />
          ) : null}
        </div>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          <RuntimeBadge
            minutes={film.duration}
            tier={film.durationTier ?? getDurationTier(film.duration)}
            prominent
          />
          <RatingBadge rating={film.rating} />
          {isFavorite && (
            <Heart className="h-4 w-4 fill-red-500 text-red-500 drop-shadow" aria-hidden="true" />
          )}
        </div>
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
            <ProgressBar percent={progressPercent} />
          </div>
        )}
      </div>
      <div className="p-3">
        <h4 className="truncate text-sm font-semibold">{film.title}</h4>
        <p className="mt-1 text-xs text-[#888]">
          <span className="font-semibold text-[#ff7a18]">{film.runtimeCompact ?? `${film.duration}m`}</span>
          {" · "}
          <span className="capitalize">{film.category}</span>
          {showProgress && (
            <span className="text-[#ff7a18]"> · {progressPercent}% watched</span>
          )}
          {isWatched && !isContinue && !showProgress && (
            <span className="text-emerald-500"> · Watched</span>
          )}
        </p>
      </div>
    </button>
  );
}
