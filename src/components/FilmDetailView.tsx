"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, Play, Star } from "lucide-react";
import { FavoriteButton } from "@/components/FavoriteButton";
import { FilmCard } from "@/components/FilmCard";
import { StarRating } from "@/components/StarRating";
import { ShareButton } from "@/components/ShareButton";
import { formatRating } from "@/lib/utils";
import type { Film } from "@/types";

type FilmDetailPayload = {
  film: Film & {
    credits?: {
      person: { id: string; slug: string; name: string; imgUrl: string; primaryRole: string };
      role: string;
      characterName: string | null;
    }[];
    _count?: { ratings: number; favorites: number; views: number };
  };
  similar: Film[];
  userRating?: number | null;
  isFavorite?: boolean;
  progressPercent?: number;
};

type FilmDetailViewProps = {
  filmId: string;
};

export function FilmDetailView({ filmId }: FilmDetailViewProps) {
  const router = useRouter();
  const [data, setData] = useState<FilmDetailPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/films/${filmId}`);
    const json = await res.json();
    if (json.film) setData(json);
    setLoading(false);
  }, [filmId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  if (!data?.film) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808] text-white">
        <p>Film not found</p>
        <Link href="/browse" className="text-[#ff7a18] hover:underline">
          Back to browse
        </Link>
      </div>
    );
  }

  const { film, similar, userRating, isFavorite, progressPercent } = data;
  const cast = film.credits?.filter((c) => c.role === "actor").slice(0, 6) ?? [];

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      <div className="relative h-[40vh] min-h-[280px] w-full overflow-hidden">
        <Image
          src={film.posterUrl}
          alt=""
          fill
          priority
          className="object-cover opacity-40 blur-sm"
          sizes="100vw"
        />
        <div className="hero-mesh absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-transparent" />

        <header className="absolute left-0 right-0 top-0 flex items-center justify-between px-4 py-4 md:px-8">
          <button
            type="button"
            onClick={() => router.push("/browse")}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition hover:bg-white/10"
          >
            <ArrowLeft className="h-5 w-5" />
            Browse
          </button>
          <ShareButton filmId={film.id} title={film.title} />
        </header>

        <div className="absolute bottom-0 left-0 right-0 px-4 pb-8 md:px-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#ff7a18]">
            {film.category}
          </p>
          <h1 className="text-3xl font-extrabold md:text-5xl">{film.title}</h1>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#aaa]">
            <span className="inline-flex items-center gap-1 font-bold text-yellow-400">
              <Star className="h-4 w-4 fill-yellow-400" />
              {formatRating(film.rating)}
            </span>
            <span>{film.year}</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {film.duration} min
            </span>
            {progressPercent != null && progressPercent > 0 && (
              <span className="text-[#ff7a18]">{progressPercent}% watched</span>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-4 py-8 md:px-8">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href={`/watch/${film.id}`}
            className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-[#e6e6e6]"
          >
            <Play className="h-5 w-5 fill-black" />
            {progressPercent && progressPercent > 5 && progressPercent < 95 ? "Resume" : "Play"}
          </Link>
          <FavoriteButton
            variant="pill"
            isFavorite={!!isFavorite}
            onToggle={async () => {
              await fetch(`/api/favorites/${film.id}`, { method: "POST" });
              load();
            }}
          />
        </div>

        <p className="mt-6 max-w-3xl leading-relaxed text-[#bbb]">{film.description}</p>

        <div className="mt-6 max-w-md">
          <StarRating
            value={userRating ?? 0}
            onChange={async (score) => {
              await fetch(`/api/ratings/${film.id}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ score }),
              });
              load();
            }}
          />
        </div>

        {cast.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-4 text-lg font-bold">Cast</h2>
            <div className="flex gap-4 overflow-x-auto pb-2">
              {cast.map((c) => (
                <Link
                  key={c.person.id}
                  href={`/people/${c.person.slug}`}
                  className="flex w-24 shrink-0 flex-col items-center gap-2 text-center"
                >
                  <Image
                    src={c.person.imgUrl}
                    alt={c.person.name}
                    width={72}
                    height={72}
                    className="rounded-full object-cover"
                  />
                  <span className="text-xs font-medium">{c.person.name}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section className="mt-12">
            <h2 className="mb-4 text-lg font-bold">More like this</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {similar.slice(0, 5).map((f) => (
                <FilmCard
                  key={f.id}
                  film={f}
                  onClick={() => router.push(`/browse/film/${f.id}`)}
                  onPlay={() => router.push(`/watch/${f.id}`)}
                  onMoreInfo={() => router.push(`/browse/film/${f.id}`)}
                />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
