"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, Plus, Info, Star } from "lucide-react";
import { useRef } from "react";
import { cn, formatRating } from "@/lib/utils";
import type { Film } from "@/types";

type HeroProps = {
  film: Film;
  isFavorite?: boolean;
  onPlay: () => void;
  onToggleFavorite: () => void;
};

export function Hero({ film, isFavorite, onPlay, onToggleFavorite }: HeroProps) {
  return (
    <section className="relative h-[60vh] min-h-[420px] max-h-[680px] w-full overflow-hidden">
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
      <div className="absolute inset-0 bg-gradient-to-r from-black/95 via-black/60 to-black/20" />
      <div className="hero-gradient absolute inset-0" />
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 lg:p-14">
        <p className="mb-2 inline-block rounded-full bg-[#ff7a18]/20 px-3 py-1 text-xs font-bold uppercase tracking-[2px] text-[#ff7a18]">
          ✦ Featured Short
        </p>
        <h1 className="mb-3 max-w-3xl text-3xl font-extrabold leading-tight md:text-5xl lg:text-6xl">
          {film.title}
        </h1>
        <p className="mb-4 max-w-xl text-sm leading-relaxed text-[#ccc] md:text-base line-clamp-3">
          {film.description}
        </p>
        <div className="mb-6 flex flex-wrap items-center gap-3 text-sm text-[#aaa]">
          <span className="flex items-center gap-1 rounded-full bg-black/50 px-3 py-1 font-bold text-yellow-400">
            <Star className="h-3.5 w-3.5 fill-yellow-400" />
            {formatRating(film.rating)}
          </span>
          <span className="capitalize">{film.category}</span>
          <span>{film.year}</span>
          <span>{film.duration} min</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onPlay}
            className="flex items-center gap-2 rounded-lg bg-white px-7 py-3 text-sm font-bold text-black shadow-xl transition hover:scale-105 hover:bg-[#e6e6e6]"
          >
            <Play className="h-5 w-5 fill-black" />
            Play Now
          </button>
          <button
            onClick={onToggleFavorite}
            className={cn(
              "flex items-center gap-2 rounded-lg px-7 py-3 text-sm font-bold transition hover:scale-105",
              isFavorite
                ? "bg-[#ff7a18] text-white shadow-lg shadow-[#ff7a18]/30"
                : "glass text-white hover:bg-white/10"
            )}
          >
            <Plus className={cn("h-5 w-5 transition", isFavorite && "rotate-45")} />
            {isFavorite ? "In My List" : "My List"}
          </button>
          <button
            onClick={onPlay}
            className="flex items-center gap-2 rounded-lg glass px-7 py-3 text-sm font-bold text-white transition hover:bg-white/10"
          >
            <Info className="h-5 w-5" />
            Details
          </button>
        </div>
      </div>
    </section>
  );
}

type FilmRowProps = {
  title: string;
  films: Film[];
  favoriteIds: string[];
  onFilmClick: (film: Film) => void;
};

export function FilmRow({ title, films, favoriteIds, onFilmClick }: FilmRowProps) {
  const rowRef = useRef<HTMLDivElement>(null);

  if (!films.length) return null;

  const scroll = (dir: "left" | "right") => {
    rowRef.current?.scrollBy({
      left: dir === "left" ? -600 : 600,
      behavior: "smooth",
    });
  };

  return (
    <section className="group/row mb-10 animate-fade-in">
      <div className="mb-3 flex items-center justify-between px-4 md:px-8 lg:px-12">
        <h2 className="text-lg font-bold md:text-xl">{title}</h2>
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
            />
          </div>
        ))}
      </div>
    </section>
  );
}

function FilmCardInline({
  film,
  isFavorite,
}: {
  film: Film;
  isFavorite: boolean;
}) {
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
          <p className="text-xs text-[#ff7a18]">⭐ {formatRating(film.rating)}</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition group-hover:opacity-100">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#ff7a18] shadow-lg">
            <Play className="ml-0.5 h-5 w-5 fill-white text-white" />
          </div>
        </div>
        {isFavorite && (
          <span className="absolute right-2 top-2 text-sm drop-shadow">❤️</span>
        )}
      </div>
    </div>
  );
}
