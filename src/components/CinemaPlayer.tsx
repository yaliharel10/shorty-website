"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/utils";
import { trackClientEvent } from "@/lib/client-analytics";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/Toast";
import type { Film } from "@/types";

type WatchPayload = {
  film: Film;
  similar: Film[];
  progressPercent: number;
  subscriptionRequired?: boolean;
};

type CinemaPlayerProps = {
  filmId: string;
};

export function CinemaPlayer({ filmId }: CinemaPlayerProps) {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const openedAtRef = useRef(Date.now());
  const [data, setData] = useState<WatchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [nextFilm, setNextFilm] = useState<Film | null>(null);

  const loadFilm = useCallback(
    async (retry = false) => {
      setLoading(true);
      const res = await fetch(`/api/films/${filmId}`, { credentials: "same-origin" });
      const json = await res.json();

      if (res.status === 401) {
        if (!retry) {
          await refresh();
          return loadFilm(true);
        }
        router.push("/browse");
        return;
      }

      if (res.status === 403 && json.code === "SUBSCRIPTION_REQUIRED" && json.film) {
        setData({ film: json.film, similar: [], progressPercent: 0 });
        setSubscriptionRequired(true);
        setLoading(false);
        return;
      }

      if (json.film) {
        setData({
          film: json.film,
          similar: json.similar ?? [],
          progressPercent: json.progressPercent ?? 0,
        });
        setSubscriptionRequired(false);
        const upNext = (json.similar ?? [])[0] ?? null;
        setNextFilm(upNext);
        trackClientEvent("video_started", { filmId, title: json.film.title });
      }
      setLoading(false);
    },
    [filmId, refresh, router]
  );

  useEffect(() => {
    openedAtRef.current = Date.now();
    loadFilm().catch(() => toast("Failed to load film", "error"));
  }, [loadFilm, toast]);

  useEffect(() => {
    if (!nextFilm?.videoUrl) return;
    const link = document.createElement("link");
    link.rel = "preconnect";
    link.href = "https://www.youtube.com";
    document.head.appendChild(link);
    return () => {
      document.head.removeChild(link);
    };
  }, [nextFilm]);

  useEffect(() => {
    if (!data?.film || subscriptionRequired) return;

    return () => {
      if (!user) return;
      const elapsedSec = (Date.now() - openedAtRef.current) / 1000;
      const durationSec = Math.max(data.film.duration * 60, 1);
      const estimated = Math.min(
        95,
        Math.max(
          data.progressPercent,
          Math.round((elapsedSec / durationSec) * 100)
        )
      );
      if (estimated >= 5) {
        fetch(`/api/films/${filmId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progressPercent: estimated }),
        }).catch(() => {});
        if (estimated >= 95) {
          trackClientEvent("video_completed", { filmId });
        }
      }
    };
  }, [data, filmId, subscriptionRequired, user]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  if (!data?.film) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white">
        <p>Film not found</p>
        <Link href="/browse" className="text-[#ff7a18] hover:underline">
          Back to browse
        </Link>
      </div>
    );
  }

  const { film, progressPercent } = data;
  const startSeconds =
    progressPercent > 0 && progressPercent < 95
      ? Math.floor((progressPercent / 100) * film.duration * 60)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 py-4 md:px-8">
        <button
          onClick={() => router.push("/browse")}
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-white/10"
          aria-label="Back to browse"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="hidden sm:inline">Back</span>
        </button>
        <h1 className="max-w-[50%] truncate text-sm font-semibold md:text-base">
          {film.title}
        </h1>
        <button
          onClick={() => router.push(`/films/${film.id}`)}
          className="rounded-lg p-2 transition hover:bg-white/10"
          aria-label="Film details"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-0 pt-14">
        {subscriptionRequired || !film.videoUrl ? (
          <div className="max-w-md px-6 text-center">
            <p className="text-lg font-semibold">Subscribe to watch</p>
            <p className="mt-2 text-sm text-[#aaa]">
              Plans start at $1.99/mo for full access to the short film library.
            </p>
            <Link
              href="/subscription"
              className="mt-6 inline-block rounded-lg bg-[#ff7a18] px-6 py-3 text-sm font-bold"
            >
              View plans
            </Link>
          </div>
        ) : (
          <div className="relative aspect-video w-full max-h-[calc(100vh-8rem)] max-w-[100vw] bg-black lg:max-w-6xl">
            <iframe
              title={film.title}
              src={youtubeEmbedUrl(film.videoUrl, true, startSeconds)}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {nextFilm && !subscriptionRequired && (
          <div className="mt-4 flex w-full max-w-6xl items-center justify-between gap-4 px-4 md:px-8">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-widest text-[#888]">Up next</p>
              <p className="truncate font-semibold">{nextFilm.title}</p>
            </div>
            <Link
              href={`/watch/${nextFilm.id}`}
              className="flex shrink-0 items-center gap-1 rounded-lg border border-[#333] px-4 py-2 text-sm font-medium transition hover:border-[#ff7a18] hover:text-[#ff7a18]"
              prefetch
            >
              Play next
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
