"use client";

import { useEffect, useRef, useState } from "react";
import { X, Lock, SkipForward } from "lucide-react";
import { youtubeEmbedUrl } from "@/lib/utils";
import { useBodyScrollLock, useFocusTrap } from "@/hooks/useUI";
import type { Film } from "@/types";
import { CreditsRow } from "@/components/PersonCard";
import { useAuth } from "./AuthProvider";
import { useToast } from "./Toast";
import { FavoriteButton } from "@/components/FavoriteButton";
import { RatingBadge, StarRating } from "@/components/StarRating";
import { WatchedBadge } from "@/components/WatchedBadge";
import { ShareButton } from "@/components/ShareButton";
import { FilmCardInline } from "@/components/FilmCard";

type FilmModalProps = {
  filmId: string | null;
  onClose: () => void;
  onFavoriteChange: () => void;
  onOpenFilm?: (id: string) => void;
  guestPreview?: boolean;
  onUpgrade?: () => void;
  autoplayVideo?: boolean;
  scrollToDetails?: boolean;
};

export function FilmModal({
  filmId,
  onClose,
  onFavoriteChange,
  onOpenFilm,
  guestPreview = false,
  onUpgrade,
  autoplayVideo = true,
  scrollToDetails = false,
}: FilmModalProps) {
  const { user, refresh } = useAuth();
  const { toast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef<number>(0);
  const [film, setFilm] = useState<Film | null>(null);
  const [similar, setSimilar] = useState<Film[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [hasWatched, setHasWatched] = useState(false);
  const [progressPercent, setProgressPercent] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  useBodyScrollLock(!!filmId);
  useFocusTrap(panelRef, !!filmId, onClose);

  useEffect(() => {
    if (!filmId) {
      setFilm(null);
      setSimilar([]);
      return;
    }

    setLoading(true);
    setSubscriptionRequired(false);
    openedAtRef.current = Date.now();

    let cancelled = false;

    const loadFilm = async (retryAfterRefresh = false) => {
      const res = await fetch(`/api/films/${filmId}`, { credentials: "same-origin" });
      const data = await res.json();

      if (cancelled) return;

      if (res.status === 401) {
        await refresh();
        if (!retryAfterRefresh) {
          return loadFilm(true);
        }
        toast("Please sign in again to watch", "info");
        return;
      }

      if (res.status === 403 && data.code === "SUBSCRIPTION_REQUIRED" && data.film) {
        if (!retryAfterRefresh && user?.hasStreamingAccess) {
          await refresh();
          return loadFilm(true);
        }
        setFilm(data.film);
        setSubscriptionRequired(true);
        return;
      }

      if (data.film) {
        setFilm(data.film);
        setIsFavorite(data.isFavorite);
        setHasWatched(Boolean(data.hasWatched));
        setProgressPercent(data.progressPercent ?? 0);
        setUserRating(data.userRating || 0);
        setSimilar(data.similar ?? []);
        setSubscriptionRequired(false);
      }
    };

    loadFilm()
      .catch(() => toast("Failed to load film", "error"))
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [filmId, toast, refresh, user?.hasStreamingAccess]);

  useEffect(() => {
    if (!loading && scrollToDetails && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [loading, scrollToDetails]);

  useEffect(() => {
    if (!filmId || !film || guestPreview) return;

    return () => {
      if (!user) return;
      const elapsedSec = (Date.now() - openedAtRef.current) / 1000;
      const durationSec = Math.max(film.duration * 60, 1);
      const estimated = Math.min(
        95,
        Math.max(progressPercent, Math.round((elapsedSec / durationSec) * 100))
      );
      if (estimated >= 5) {
        fetch(`/api/films/${filmId}/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ progressPercent: estimated }),
        }).catch(() => {});
        onFavoriteChange();
      }
    };
  }, [filmId, film, user, guestPreview, progressPercent, onFavoriteChange]);

  if (!filmId) return null;

  const toggleFavorite = async () => {
    if (!user) {
      toast("Sign in to save films to your list", "info");
      return;
    }
    const res = await fetch(`/api/favorites/${filmId}`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setIsFavorite(data.isFavorite);
      toast(
        data.isFavorite ? "Added to My List" : "Removed from My List",
        "success"
      );
      onFavoriteChange();
    }
  };

  const saveRating = async (score: number) => {
    if (!user) {
      toast("Sign in to rate films", "info");
      return;
    }
    const res = await fetch(`/api/ratings/${filmId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score }),
    });
    if (res.ok) {
      setUserRating(score);
      toast(`Rated ${score}/10`, "success");
      onFavoriteChange();
    }
  };

  const startSeconds =
    film && progressPercent > 0 && progressPercent < 95
      ? Math.floor((progressPercent / 100) * film.duration * 60)
      : 0;

  return (
    <div
      className="modal-backdrop fixed inset-0 z-[90] overflow-y-auto"
      onClick={onClose}
      role="presentation"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={film?.title ?? "Film player"}
        className="relative mx-auto my-4 w-[95%] max-w-5xl animate-fade-in overflow-hidden rounded-2xl border border-[#222] bg-[#0a0a0a] shadow-2xl md:my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-black/60 p-2 transition hover:bg-black/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a18]"
          aria-label="Close player"
        >
          <X className="h-6 w-6" aria-hidden="true" />
        </button>

        {loading || !film ? (
          <div className="flex aspect-video items-center justify-center" role="status">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
            <span className="sr-only">Loading film</span>
          </div>
        ) : (
          <>
            <div className="relative aspect-video w-full bg-black">
              {subscriptionRequired ? (
                <div className="flex h-full flex-col items-center justify-center gap-4 bg-gradient-to-b from-[#111] to-black p-8 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#ff7a18]/15">
                    <Lock className="h-8 w-8 text-[#ff7a18]" />
                  </div>
                  <h3 className="text-xl font-bold">Subscribe to watch</h3>
                  <p className="max-w-sm text-sm text-[#888]">
                    Plans start at $1.99/month. New members get a 7-day free trial.
                  </p>
                  <button
                    onClick={() => onUpgrade?.()}
                    className="rounded-lg bg-[#ff7a18] px-6 py-3 text-sm font-bold transition hover:bg-[#ff9533]"
                  >
                    View plans
                  </button>
                </div>
              ) : (
                <iframe
                  src={youtubeEmbedUrl(film.videoUrl, autoplayVideo, startSeconds)}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                  title={`${film.title} — video player`}
                  loading="lazy"
                />
              )}
            </div>

            <div ref={detailsRef} className="p-6 md:p-10">
              {guestPreview ? (
                <>
                  <div className="mb-6 rounded-xl border border-[#ff7a18]/30 bg-[#ff7a18]/10 p-4 text-center">
                    <p className="text-sm text-[#ccc]">
                      Enjoying the free preview?{" "}
                      <a href="/?signin=1" className="font-bold text-[#ff7a18] hover:underline">
                        Sign up free
                      </a>{" "}
                      to unlock the full library.
                    </p>
                  </div>
                  <h2 className="text-2xl font-bold md:text-3xl">{film.title}</h2>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <RatingBadge rating={film.rating} />
                    <span className="text-sm capitalize text-[#888]">{film.category}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="mb-8 flex flex-col gap-4 border-b border-[#222] pb-8 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        {hasWatched && <WatchedBadge />}
                        {progressPercent > 0 && progressPercent < 95 && (
                          <span className="rounded-full bg-[#ff7a18]/15 px-2.5 py-0.5 text-xs font-bold text-[#ff7a18]">
                            {progressPercent}% watched
                          </span>
                        )}
                      </div>
                      <h2 className="text-2xl font-bold md:text-3xl">{film.title}</h2>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <RatingBadge rating={film.rating} className="text-sm" />
                        <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-sm capitalize text-[#aaa]">
                          {film.category}
                        </span>
                        <span className="rounded-full bg-[#1a1a1a] px-3 py-1 text-sm text-[#aaa]">
                          {film.year} · {film.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <ShareButton filmId={film.id} title={film.title} />
                      <FavoriteButton
                        isFavorite={isFavorite}
                        onToggle={toggleFavorite}
                        size="lg"
                      />
                    </div>
                  </div>

                  <div className="mb-8">
                    <StarRating
                      value={userRating}
                      hoverValue={hoverRating}
                      onChange={saveRating}
                      onHover={setHoverRating}
                      onHoverEnd={() => setHoverRating(0)}
                      label={user ? "Your rating" : "Your rating (sign in required)"}
                    />
                  </div>
                </>
              )}

              <p className="mb-8 leading-relaxed text-[#bbb]">{film.description}</p>

              {film.credits && film.credits.length > 0 && (
                <CreditsRow credits={film.credits} title="Cast & Crew" />
              )}

              {!guestPreview && similar.length > 0 && onOpenFilm && (
                <section className="mt-10 border-t border-[#222] pt-8">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-lg font-bold">More like this</h3>
                    {!subscriptionRequired && (
                      <button
                        type="button"
                        onClick={() => onOpenFilm(similar[0].id)}
                        className="inline-flex items-center gap-2 rounded-lg border border-[#444] px-4 py-2 text-sm font-bold transition hover:bg-white/5"
                      >
                        <SkipForward className="h-4 w-4" />
                        Watch next: {similar[0].title}
                      </button>
                    )}
                  </div>
                  <div className="film-row pb-2">
                    {similar.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onOpenFilm(item.id)}
                        className="shrink-0 border-0 bg-transparent p-0"
                        aria-label={`Open ${item.title}`}
                      >
                        <FilmCardInline film={item} />
                      </button>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
