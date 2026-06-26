"use client";

import Image from "next/image";
import { Heart, Info, Play, Plus } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { cn, formatRating } from "@/lib/utils";
import type { Film } from "@/types";
import { RatingBadge } from "@/components/StarRating";
import { WatchedBadge } from "@/components/WatchedBadge";
import { NewBadge, ProgressBar, RuntimeBadge } from "@/components/FilmBadges";
import { getDurationTier } from "@/lib/film-metadata";
import { cardHover } from "@/lib/motion";

type FilmCardActions = {
  onPlay?: () => void;
  onToggleFavorite?: () => void;
  onMoreInfo?: () => void;
};

type FilmCardBaseProps = {
  film: Film;
  isFavorite?: boolean;
  isWatched?: boolean;
  isContinue?: boolean;
  isNew?: boolean;
  progressPercent?: number;
};

function CardOverlay({
  film,
  isFavorite,
  actions,
}: {
  film: Film;
  isFavorite?: boolean;
  actions?: FilmCardActions;
}) {
  return (
    <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
      <p className="mb-2 truncate text-sm font-bold drop-shadow-lg">{film.title}</p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            actions?.onPlay?.();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-110"
          aria-label={`Play ${film.title}`}
        >
          <Play className="ml-0.5 h-4 w-4 fill-black" />
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            actions?.onToggleFavorite?.();
          }}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur transition hover:border-white/40",
            isFavorite && "border-red-500/50 bg-red-500/20"
          )}
          aria-label={isFavorite ? "Remove from My List" : "Add to My List"}
        >
          {isFavorite ? (
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            actions?.onMoreInfo?.();
          }}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 backdrop-blur transition hover:border-white/40"
          aria-label={`More info about ${film.title}`}
        >
          <Info className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

export function FilmCardInline({
  film,
  isFavorite,
  isWatched,
  isContinue,
  isNew,
  progressPercent = 0,
  actions,
}: FilmCardBaseProps & { actions?: FilmCardActions }) {
  const reduceMotion = useReducedMotion();
  const showProgress = isContinue && progressPercent > 0 && progressPercent < 95;
  const Wrapper = reduceMotion ? "div" : motion.div;
  const wrapperProps = reduceMotion
    ? {}
    : { initial: "rest", whileHover: "hover", variants: cardHover };

  return (
    <Wrapper
      {...wrapperProps}
      className="group relative w-[150px] shrink-0 cursor-pointer overflow-hidden rounded-lg shadow-lg shadow-black/30 scroll-snap-align-start sm:w-[170px] md:w-[190px]"
    >
      <div className="relative aspect-[2/3]">
        <Image
          src={film.posterUrl}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-110"
          sizes="190px"
        />
        <CardOverlay film={film} isFavorite={isFavorite} actions={actions} />
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {isNew && !isWatched && <NewBadge />}
          {isContinue ? <WatchedBadge variant="continue" /> : isWatched ? <WatchedBadge /> : null}
        </div>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          <RuntimeBadge
            minutes={film.duration}
            tier={film.durationTier ?? getDurationTier(film.duration)}
          />
          <RatingBadge rating={film.rating} className="md:hidden" />
        </div>
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
            <ProgressBar percent={progressPercent} />
          </div>
        )}
      </div>
    </Wrapper>
  );
}

type FilmCardProps = FilmCardBaseProps & {
  variant?: "grid" | "row";
  onClick: () => void;
  onPlay?: () => void;
  onToggleFavorite?: () => void;
  onMoreInfo?: () => void;
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
  onPlay,
  onToggleFavorite,
  onMoreInfo,
}: FilmCardProps) {
  const reduceMotion = useReducedMotion();
  const showProgress = isContinue && progressPercent > 0 && progressPercent < 95;
  const Wrapper = reduceMotion ? "article" : motion.article;
  const wrapperProps = reduceMotion
    ? {}
    : { initial: "rest", whileHover: "hover", variants: cardHover };

  const actions: FilmCardActions = {
    onPlay: onPlay ?? onClick,
    onToggleFavorite,
    onMoreInfo: onMoreInfo ?? onClick,
  };

  return (
    <Wrapper
      {...wrapperProps}
      className={cn(
        "group relative shrink-0 cursor-pointer overflow-hidden rounded-xl bg-[#141414] text-left shadow-lg shadow-black/25",
        variant === "grid" ? "w-full" : "w-[180px] sm:w-[200px] md:w-[220px]",
        "scroll-snap-align-start",
        isWatched && !isContinue && "ring-1 ring-emerald-500/25"
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="absolute inset-0 z-0"
        aria-label={`Open ${film.title}, ${film.category}, rated ${formatRating(film.rating)}`}
      />
      <div className="relative aspect-[2/3] w-full overflow-hidden pointer-events-none">
        <Image
          src={film.posterUrl}
          alt=""
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-110",
            isWatched && !isContinue && "opacity-90"
          )}
          sizes="220px"
        />
        <div className="pointer-events-auto">
          <CardOverlay film={film} isFavorite={isFavorite} actions={actions} />
        </div>
        <div className="absolute left-2 top-2 flex flex-col gap-1.5">
          {isNew && !isWatched && <NewBadge />}
          {isContinue ? <WatchedBadge variant="continue" /> : isWatched ? <WatchedBadge /> : null}
        </div>
        <div className="absolute right-2 top-2 flex flex-col items-end gap-1.5">
          <RuntimeBadge
            minutes={film.duration}
            tier={film.durationTier ?? getDurationTier(film.duration)}
            prominent
          />
          <RatingBadge rating={film.rating} />
        </div>
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 px-2 pb-2">
            <ProgressBar percent={progressPercent} />
          </div>
        )}
      </div>
      <div className="relative z-[1] p-3">
        <h4 className="truncate text-sm font-semibold">{film.title}</h4>
        <p className="mt-1 text-xs text-[#888]">
          <span className="font-semibold text-[#ff7a18]">
            {film.runtimeCompact ?? `${film.duration}m`}
          </span>
          {" · "}
          <span className="capitalize">{film.category}</span>
        </p>
      </div>
    </Wrapper>
  );
}
