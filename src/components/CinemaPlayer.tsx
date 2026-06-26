"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FastForward,
  PictureInPicture2,
  SkipForward,
  X,
} from "lucide-react";
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

type Prefs = {
  autoplayNext: boolean;
  playbackSpeed: number;
};

type CinemaPlayerProps = {
  filmId: string;
};

const INTRO_SKIP_SEC = 90;
const AUTO_NEXT_SECONDS = 10;

export function CinemaPlayer({ filmId }: CinemaPlayerProps) {
  const router = useRouter();
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const openedAtRef = useRef(Date.now());
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [data, setData] = useState<WatchPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [nextFilm, setNextFilm] = useState<Film | null>(null);
  const [startSeconds, setStartSeconds] = useState(0);
  const [prefs, setPrefs] = useState<Prefs>({ autoplayNext: true, playbackSpeed: 1 });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);

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
        const progress = json.progressPercent ?? 0;
        const resume =
          progress > 0 && progress < 95
            ? Math.floor((progress / 100) * json.film.duration * 60)
            : 0;
        setStartSeconds(resume);
        setData({
          film: json.film,
          similar: json.similar ?? [],
          progressPercent: progress,
        });
        setSubscriptionRequired(false);
        setNextFilm((json.similar ?? [])[0] ?? null);
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
    fetch("/api/profiles")
      .then((r) => (r.ok ? r.json() : null))
      .then((json) => {
        if (json?.preferences) {
          setPrefs({
            autoplayNext: json.preferences.autoplayNext ?? true,
            playbackSpeed: json.preferences.playbackSpeed ?? 1,
          });
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!data?.film || subscriptionRequired) return;
    const tick = setInterval(() => {
      setElapsedSec((Date.now() - openedAtRef.current) / 1000);
    }, 1000);
    return () => clearInterval(tick);
  }, [data, subscriptionRequired]);

  const durationSec = data ? Math.max(data.film.duration * 60, 1) : 1;
  const estimatedProgress = Math.min(
    100,
    Math.max(data?.progressPercent ?? 0, Math.round((elapsedSec / durationSec) * 100))
  );
  const nearEnd = estimatedProgress >= 88;

  useEffect(() => {
    if (!nearEnd || !nextFilm || !prefs.autoplayNext || subscriptionRequired) {
      setCountdown(null);
      return;
    }
    setCountdown(AUTO_NEXT_SECONDS);
  }, [nearEnd, nextFilm, prefs.autoplayNext, subscriptionRequired]);

  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => (c !== null ? c - 1 : null)), 1000);
    if (countdown === 1 && nextFilm) {
      router.push(`/watch/${nextFilm.id}`);
    }
    return () => clearTimeout(t);
  }, [countdown, nextFilm, router]);

  useEffect(() => {
    if (!data?.film || subscriptionRequired) return;

    return () => {
      if (!user) return;
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
  }, [data, filmId, subscriptionRequired, user, elapsedSec, durationSec]);

  const skipIntro = () => {
    const skip = Math.min(INTRO_SKIP_SEC, Math.floor(durationSec * 0.1));
    setStartSeconds((s) => s + skip);
    openedAtRef.current = Date.now() - skip * 1000;
    toast("Skipped intro", "success");
  };

  const tryPiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        return;
      }
      toast("Use the YouTube player controls for Picture-in-Picture", "error");
    } catch {
      toast("Picture-in-Picture not supported", "error");
    }
  };

  const cancelAutoNext = () => setCountdown(null);

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

  const { film } = data;
  const embedSrc = youtubeEmbedUrl(film.videoUrl, true, startSeconds);

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
        <h1 className="max-w-[40%] truncate text-sm font-semibold md:max-w-[50%] md:text-base">
          {film.title}
        </h1>
        <button
          onClick={() => router.push(`/browse/film/${film.id}`)}
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
          <>
            <div className="relative aspect-video w-full max-h-[calc(100vh-8rem)] max-w-[100vw] bg-black lg:max-w-6xl">
              <iframe
                ref={iframeRef}
                key={embedSrc}
                title={film.title}
                src={embedSrc}
                className="absolute inset-0 h-full w-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2 px-4">
              {startSeconds < INTRO_SKIP_SEC && (
                <button
                  type="button"
                  onClick={skipIntro}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-xs font-medium transition hover:border-[#ff7a18]"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                  Skip intro
                </button>
              )}
              <button
                type="button"
                onClick={tryPiP}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-xs font-medium transition hover:border-[#ff7a18]"
              >
                <PictureInPicture2 className="h-3.5 w-3.5" />
                PiP
              </button>
              <label className="inline-flex items-center gap-1.5 rounded-lg border border-[#333] px-3 py-1.5 text-xs">
                <FastForward className="h-3.5 w-3.5" />
                Speed
                <select
                  value={prefs.playbackSpeed}
                  onChange={async (e) => {
                    const speed = parseFloat(e.target.value);
                    setPrefs((p) => ({ ...p, playbackSpeed: speed }));
                    await fetch("/api/profiles", {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ playbackSpeed: speed }),
                    });
                  }}
                  className="bg-transparent text-white outline-none"
                >
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                    <option key={s} value={s} className="bg-[#111]">
                      {s}x
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </>
        )}

        {countdown !== null && nextFilm && !subscriptionRequired && (
          <div className="mt-4 flex items-center gap-4 rounded-xl border border-[#333] bg-[#111]/95 px-5 py-3">
            <div>
              <p className="text-xs uppercase tracking-widest text-[#888]">Up next in {countdown}s</p>
              <p className="font-semibold">{nextFilm.title}</p>
            </div>
            <Link
              href={`/watch/${nextFilm.id}`}
              className="rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold"
            >
              Play now
            </Link>
            <button
              type="button"
              onClick={cancelAutoNext}
              className="text-sm text-[#888] hover:text-white"
            >
              Cancel
            </button>
          </div>
        )}

        {nextFilm && !subscriptionRequired && countdown === null && (
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
