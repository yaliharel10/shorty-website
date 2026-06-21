"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { X, Heart, Lock } from "lucide-react";
import { cn, formatRating, youtubeEmbedUrl } from "@/lib/utils";
import { useBodyScrollLock, useFocusTrap } from "@/hooks/useUI";
import type { Film } from "@/types";
import { CreditsRow } from "@/components/PersonCard";
import { useAuth } from "./AuthProvider";
import { useToast } from "./Toast";

type FilmModalProps = {
  filmId: string | null;
  onClose: () => void;
  onFavoriteChange: () => void;
  guestPreview?: boolean;
  onUpgrade?: () => void;
};

export function FilmModal({
  filmId,
  onClose,
  onFavoriteChange,
  guestPreview = false,
  onUpgrade,
}: FilmModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const [film, setFilm] = useState<Film | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [loading, setLoading] = useState(false);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);

  useBodyScrollLock(!!filmId);
  useFocusTrap(panelRef, !!filmId, onClose);

  useEffect(() => {
    if (!filmId) {
      setFilm(null);
      return;
    }

    setLoading(true);
    setSubscriptionRequired(false);
    fetch(`/api/films/${filmId}`)
      .then(async (r) => {
        const data = await r.json();
        if (r.status === 403 && data.code === "SUBSCRIPTION_REQUIRED" && data.film) {
          setFilm(data.film);
          setSubscriptionRequired(true);
          return;
        }
        if (data.film) {
          setFilm(data.film);
          setIsFavorite(data.isFavorite);
          setUserRating(data.userRating || 0);
        }
      })
      .catch(() => toast("Failed to load film", "error"))
      .finally(() => setLoading(false));
  }, [filmId, toast]);

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
                    Plans start at $1.99/month — much cheaper than Netflix.
                    New members get a 7-day free trial.
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
                  src={youtubeEmbedUrl(film.videoUrl, true)}
                  className="h-full w-full"
                  allow="autoplay; fullscreen; encrypted-media"
                  allowFullScreen
                  title={`${film.title} — video player`}
                  loading="lazy"
                />
              )}
            </div>
            <div className="p-6 md:p-10">
              {guestPreview ? (
                <div className="mb-6 rounded-xl border border-[#ff7a18]/30 bg-[#ff7a18]/10 p-4 text-center">
                  <p className="text-sm text-[#ccc]">
                    Enjoying the free preview?{" "}
                    <a href="/?signin=1" className="font-bold text-[#ff7a18] hover:underline">
                      Sign up free
                    </a>{" "}
                    to unlock the full library, save favorites, and rate films.
                  </p>
                </div>
              ) : (
                <>
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold md:text-3xl">{film.title}</h2>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#888]">
                        <span className="font-bold text-yellow-400">
                          ⭐ {formatRating(film.rating)}
                        </span>
                        <span className="capitalize">{film.category}</span>
                        <span>{film.year}</span>
                        <span>{film.duration} min</span>
                        {film._count && <span>{film._count.views} views</span>}
                      </div>
                    </div>
                    <button
                      onClick={toggleFavorite}
                      aria-label={isFavorite ? "Remove from My List" : "Add to My List"}
                      aria-pressed={isFavorite}
                      className={cn(
                        "rounded-full p-2 transition hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ff7a18]",
                        isFavorite ? "text-red-500" : "text-[#555] hover:text-red-400"
                      )}
                    >
                      <Heart
                        className={cn("h-8 w-8", isFavorite && "fill-red-500")}
                        aria-hidden="true"
                      />
                    </button>
                  </div>

                  <fieldset className="mb-6 border-none p-0">
                    <legend className="mb-2 text-xs font-bold uppercase tracking-widest text-[#555]">
                      Your rating {!user && "(sign in required)"}
                    </legend>
                    <div className="flex flex-wrap gap-1" role="group" aria-label="Rate this film from 1 to 10">
                      {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => saveRating(num)}
                          onMouseEnter={() => setHoverRating(num)}
                          onMouseLeave={() => setHoverRating(0)}
                          aria-label={`Rate ${num} out of 10`}
                          aria-pressed={(hoverRating || userRating) >= num}
                          className={cn(
                            "star-btn h-7 w-7 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[#ff7a18]",
                            (hoverRating || userRating) >= num && "active"
                          )}
                        >
                          <svg viewBox="0 0 24 24" className="h-full w-full" aria-hidden="true">
                            <path
                              strokeWidth="1.5"
                              d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"
                            />
                          </svg>
                        </button>
                      ))}
                    </div>
                  </fieldset>
                </>
              )}

              {guestPreview && (
                <div className="mb-4">
                  <h2 className="text-2xl font-bold md:text-3xl">{film.title}</h2>
                  <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#888]">
                    <span className="font-bold text-yellow-400">
                      ⭐ {formatRating(film.rating)}
                    </span>
                    <span className="capitalize">{film.category}</span>
                    <span>{film.duration} min</span>
                  </div>
                </div>
              )}

              <p className="mb-8 leading-relaxed text-[#bbb]">{film.description}</p>

              {film.credits && film.credits.length > 0 && (
                <CreditsRow credits={film.credits} title="Cast & Crew" />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
