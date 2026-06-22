"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Info, Play } from "lucide-react";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { Film } from "@/types";
import { FavoriteButton } from "@/components/FavoriteButton";
import { RatingBadge } from "@/components/StarRating";
import { WatchedBadge } from "@/components/WatchedBadge";
import { FilmCardInline } from "@/components/FilmCard";

type HeroProps = {
  film: Film;
  isFavorite?: boolean;
  isWatched?: boolean;
  onPlay: () => void;
  onDetails: () => void;
  onToggleFavorite: () => void | Promise<void>;
};

export function Hero({
  film,
  isFavorite,
  isWatched,
  onPlay,
  onDetails,
  onToggleFavorite,
}: HeroProps) {
  return (
    <section className="relative h-[62vh] min-h-[460px] max-h-[720px] w-full overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src={film.posterUrl}
          alt={film.title}
          fill
          priority
          className="hero-image object-cover object-top"
          sizes="100vw"
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/65 to-black/25" />
      <div className="hero-gradient absolute inset-0" />

      <div className="absolute bottom-0 left-0 right-0 z-20 p-6 pb-10 md:p-10 md:pb-14 lg:p-14 lg:pb-16">
        <div className="mx-auto flex max-w-4xl flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="inline-block rounded-full bg-[#ff7a18]/20 px-3 py-1 text-xs font-bold uppercase tracking-[2px] text-[#ff7a18]">
              ✦ Featured Short
            </p>
            {isWatched && <WatchedBadge />}
          </div>

          <h1 className="max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
            {film.title}
          </h1>

          <p className="max-w-xl text-sm leading-relaxed text-[#ccc] md:text-base line-clamp-2 md:line-clamp-3">
            {film.description}
          </p>

          <div className="flex flex-wrap items-center gap-2 text-sm text-[#aaa]">
            <RatingBadge rating={film.rating} />
            <span className="rounded-full bg-black/40 px-3 py-1 capitalize">{film.category}</span>
            <span className="rounded-full bg-black/40 px-3 py-1">{film.year}</span>
            <span className="rounded-full bg-black/40 px-3 py-1">{film.duration} min</span>
          </div>

          <div className="mt-1 rounded-2xl border border-white/10 bg-black/50 p-4 backdrop-blur-md md:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-stretch">
              <button
                onClick={onPlay}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-black shadow-xl transition hover:bg-[#e6e6e6] sm:flex-none sm:min-w-[160px]"
              >
                <Play className="h-5 w-5 fill-black" />
                Play Now
              </button>
              <div className="flex flex-1 gap-2 sm:justify-end">
                <FavoriteButton
                  isFavorite={!!isFavorite}
                  onToggle={onToggleFavorite}
                  variant="pill"
                  className="flex-1 sm:flex-none"
                />
                <button
                  onClick={onDetails}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-white/10 sm:flex-none"
                >
                  <Info className="h-5 w-5" />
                  Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

type FilmRowProps = {
  title: string;
  films: Film[];
  favoriteIds: string[];
  watchedIds: string[];
  newFilmIds?: string[];
  watchProgress?: Record<string, number>;
  continueIds?: string[];
  onSeeAll?: () => void;
  onFilmClick: (film: Film) => void;
};

export function FilmRow({
  title,
  films,
  favoriteIds,
  watchedIds,
  newFilmIds = [],
  watchProgress = {},
  continueIds = [],
  onSeeAll,
  onFilmClick,
}: FilmRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (!films.length) return null;

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({
      left: dir === "left" ? -600 : 600,
      behavior: "smooth",
    });
  };

  return (
    <section className="group/row mb-12 animate-fade-in pt-2">
      <div className="mb-4 flex items-center justify-between px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold md:text-xl">{title}</h2>
          {onSeeAll && (
            <button
              type="button"
              onClick={onSeeAll}
              className="text-sm font-medium text-[#888] transition hover:text-[#ff7a18]"
            >
              See all →
            </button>
          )}
        </div>
        <div className="flex gap-1 opacity-0 transition group-hover/row:opacity-100">
          <button
            onClick={() => scroll("left")}
            className="rounded-full glass p-2 transition hover:bg-white/10"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll("right")}
            className="rounded-full glass p-2 transition hover:bg-white/10"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div ref={rowRef} className="film-row px-4 md:px-8 lg:px-12">
        {films.map((film) => (
          <div key={film.id} onClick={() => onFilmClick(film)}>
            <FilmCardInline
              film={film}
              isFavorite={favoriteIds.includes(film.id)}
              isWatched={watchedIds.includes(film.id)}
              isContinue={continueIds.includes(film.id)}
              isNew={newFilmIds.includes(film.id)}
              progressPercent={watchProgress[film.id] ?? 0}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
