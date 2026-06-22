"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  Play,
  Sparkles,
  Clock,
  Star,
  Film,
  Heart,
  ChevronRight,
} from "lucide-react";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider, useToast } from "@/components/Toast";
import { AuthModal } from "@/components/AuthModal";
import { FilmModal } from "@/components/FilmModal";
import { PricingPlans } from "@/components/PricingPlans";
import { formatRating } from "@/lib/utils";
import { TRIAL_DAYS, SUBSCRIPTION_PLANS } from "@/lib/subscription";
import type { Film as FilmType } from "@/types";

type MonthlyFreeData = {
  film: FilmType;
  monthKey: string;
  monthLabel: string;
};

function LandingContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [monthlyFree, setMonthlyFree] = useState<MonthlyFreeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register">("register");
  const [previewFilmId, setPreviewFilmId] = useState<string | null>(null);
  const [catalogPreview, setCatalogPreview] = useState<{
    filmCount: number;
    genreCount: number;
    featured: Pick<FilmType, "id" | "title" | "posterUrl" | "category" | "rating" | "duration">[];
  } | null>(null);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/browse");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams.get("signin") === "1") {
      setAuthMode("login");
      setAuthOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    fetch("/api/catalog/preview")
      .then((r) => r.json())
      .then((data) => {
        if (data.featured) setCatalogPreview(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/monthly-free")
      .then((r) => r.json())
      .then((data) => {
        if (data.film) setMonthlyFree(data);
      })
      .catch(() => toast("Could not load free preview", "error"))
      .finally(() => setLoading(false));
  }, [toast]);

  const openSignup = () => {
    setAuthMode("register");
    setAuthOpen(true);
  };

  const openLogin = () => {
    setAuthMode("login");
    setAuthOpen(true);
  };

  // Don't block the landing page on auth check — redirect logged-in users in useEffect above.

  if (user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
        <p className="text-sm text-[#888]">Taking you to Shorty...</p>
      </div>
    );
  }

  const film = monthlyFree?.film;

  return (
    <div className="min-h-screen bg-[#080808] text-white">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-gradient-to-b from-black/90 to-transparent px-6 py-5 md:px-12">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-2xl font-extrabold tracking-tight">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/subscription"
              className="hidden rounded-lg px-4 py-2 text-sm font-medium text-[#aaa] transition hover:text-white sm:block"
            >
              Plans
            </Link>
            <button
              onClick={openLogin}
              className="rounded-lg px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
            >
              Sign In
            </button>
            <button
              onClick={openSignup}
              className="rounded-lg bg-[#ff7a18] px-5 py-2 text-sm font-bold shadow-lg shadow-[#ff7a18]/25 transition hover:bg-[#ff9533]"
            >
              Get Started
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden">
        <div className="absolute inset-0">
          {film && (
            <Image
              src={film.posterUrl}
              alt=""
              fill
              priority
              className="object-cover opacity-30 blur-sm"
              sizes="100vw"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808] via-[#080808]/95 to-[#080808]/70" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-transparent to-[#080808]/50" />
        </div>

        <div className="relative mx-auto max-w-6xl px-6 pt-28 pb-20 md:px-12">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#ff7a18]/30 bg-[#ff7a18]/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-[#ff7a18]">
            <Sparkles className="h-3.5 w-3.5" />
            Premium short films
          </p>
          <h1 className="max-w-3xl text-4xl font-extrabold leading-tight md:text-6xl lg:text-7xl">
            Big stories.
            <br />
            <span className="text-[#ff7a18]">Small runtime.</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-[#aaa] md:text-xl">
            Netflix-style streaming for short films — TikTok-length stories with
            cinema-quality curation. Plans from $
            {Math.min(...SUBSCRIPTION_PLANS.map((p) => p.price)).toFixed(2)}/month.
          </p>
          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              onClick={openSignup}
              className="flex items-center justify-center gap-2 rounded-lg bg-[#ff7a18] px-8 py-4 text-base font-bold shadow-xl shadow-[#ff7a18]/30 transition hover:scale-105 hover:bg-[#ff9533]"
            >
              Start {TRIAL_DAYS}-Day Free Trial
              <ChevronRight className="h-5 w-5" />
            </button>
            <button
              onClick={openLogin}
              className="rounded-lg border border-[#444] px-8 py-4 text-base font-bold transition hover:bg-white/5"
            >
              I already have an account
            </button>
          </div>
          <p className="mt-4 text-sm text-[#666]">
            {TRIAL_DAYS}-day free trial · Cancel anytime · No card required for trial
          </p>
        </div>
      </section>

      {/* Monthly free sample */}
      <section className="border-y border-[#222] bg-[#0a0a0a] px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#ff7a18]">
              Free this month
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">
              {monthlyFree?.monthLabel ?? "This Month"}&apos;s Free Pick
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[#888]">
              Watch one full short film every month — no account needed.
              A new title rotates on the 1st.
            </p>
          </div>

          {loading ? (
            <div className="mx-auto h-80 max-w-4xl animate-pulse rounded-2xl bg-[#1a1a1a]" />
          ) : film ? (
            <div className="mx-auto grid max-w-4xl overflow-hidden rounded-2xl border border-[#222] bg-[#111] md:grid-cols-5">
              <div className="relative aspect-[2/3] md:col-span-2 md:aspect-auto md:min-h-[360px]">
                <Image
                  src={film.posterUrl}
                  alt={film.title}
                  fill
                  className="object-cover"
                  sizes="400px"
                />
                <div className="absolute left-3 top-3 rounded-full bg-[#ff7a18] px-3 py-1 text-xs font-bold">
                  FREE
                </div>
              </div>
              <div className="flex flex-col justify-center p-8 md:col-span-3">
                <h3 className="text-2xl font-bold md:text-3xl">{film.title}</h3>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-[#888]">
                  <span className="flex items-center gap-1 font-bold text-yellow-400">
                    <Star className="h-4 w-4 fill-yellow-400" />
                    {formatRating(film.rating)}
                  </span>
                  <span className="capitalize">{film.category}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {film.duration} min
                  </span>
                  <span>{film.year}</span>
                </div>
                <p className="mt-4 leading-relaxed text-[#bbb]">{film.description}</p>
                <button
                  onClick={() => setPreviewFilmId(film.id)}
                  className="mt-8 flex w-fit items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-black transition hover:bg-[#e6e6e6]"
                >
                  <Play className="h-5 w-5 fill-black" />
                  Watch Free Preview
                </button>
                <p className="mt-4 text-xs text-[#555]">
                  Want unlimited access?{" "}
                  <Link href="/subscription" className="font-bold text-[#ff7a18] hover:underline">
                    See plans from $1.99/mo
                  </Link>
                </p>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {/* Catalog preview */}
      {catalogPreview && catalogPreview.featured.length > 0 && (
        <section className="px-6 py-20 md:px-12">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#ff7a18]">
                Inside the library
              </p>
              <h2 className="text-3xl font-bold md:text-4xl">
                {catalogPreview.filmCount}+ curated short films
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-[#888]">
                {catalogPreview.genreCount} genres · Top-rated picks from our catalog.
                Sign up to unlock the full library.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
              {catalogPreview.featured.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={openSignup}
                  className="group relative aspect-[2/3] overflow-hidden rounded-lg border border-[#222] bg-[#111] transition hover:scale-105 hover:border-[#ff7a18]/40"
                  title={f.title}
                >
                  <Image
                    src={f.posterUrl}
                    alt={f.title}
                    fill
                    className="object-cover transition group-hover:brightness-75"
                    sizes="150px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 transition group-hover:opacity-100" />
                  <div className="absolute bottom-0 left-0 right-0 p-2 opacity-0 transition group-hover:opacity-100">
                    <p className="truncate text-xs font-bold">{f.title}</p>
                    <p className="text-[10px] text-[#aaa]">
                      ⭐ {formatRating(f.rating)} · {f.duration}m
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-10 text-center">
              <button
                onClick={openSignup}
                className="inline-flex items-center gap-2 rounded-lg border border-[#444] px-6 py-3 text-sm font-bold transition hover:bg-white/5"
              >
                Unlock full catalog
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Pricing */}
      <section id="pricing" className="border-y border-[#222] bg-[#0a0a0a] px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <div className="mb-12 text-center">
            <p className="mb-2 text-xs font-bold uppercase tracking-[3px] text-[#ff7a18]">
              Simple pricing
            </p>
            <h2 className="text-3xl font-bold md:text-4xl">
              Cheaper than Netflix. Built for short films.
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[#888]">
              Pick a plan after your {TRIAL_DAYS}-day trial. All plans include the full library.
            </p>
          </div>
          <PricingPlans
            onSelectPlan={() => openSignup()}
          />
          <p className="mt-8 text-center text-xs text-[#555]">
            Compare-at prices are approximate US Netflix tiers. Demo billing — no real charges.
          </p>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 md:px-12">
        <div className="mx-auto max-w-6xl">
          <h2 className="mb-12 text-center text-3xl font-bold">
            Why Shorty?
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Film,
                title: "Curated catalog",
                desc: "Every film hand-selected. No filler, only standout shorts.",
              },
              {
                icon: Clock,
                title: "Under 25 minutes",
                desc: "Perfect for a commute, lunch break, or before bed.",
              },
              {
                icon: Heart,
                title: "Your list",
                desc: "Save favorites and build a personal watchlist.",
              },
              {
                icon: Star,
                title: "Rate & discover",
                desc: "Rate films and find top picks across every genre.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-[#222] bg-[#111] p-6 transition hover:border-[#ff7a18]/30"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#ff7a18]/15">
                  <Icon className="h-5 w-5 text-[#ff7a18]" />
                </div>
                <h3 className="font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#888]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="border-t border-[#222] px-6 py-24 md:px-12">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold md:text-4xl">
            Ready to start watching?
          </h2>
          <p className="mt-4 text-[#888]">
            Start your {TRIAL_DAYS}-day free trial, then keep watching from just $1.99/month.
          </p>
          <button
            onClick={openSignup}
            className="mt-8 rounded-lg bg-[#ff7a18] px-10 py-4 text-base font-bold shadow-xl shadow-[#ff7a18]/30 transition hover:bg-[#ff9533]"
          >
            Start Free Trial
          </button>
          <Link
            href="/subscription"
            className="mt-4 block text-sm text-[#ff7a18] hover:underline"
          >
            Compare all plans
          </Link>
        </div>
      </section>

      <footer className="border-t border-[#222] px-6 py-8 text-center text-sm text-[#555]">
        Shorty<span className="text-[#ff7a18]">.</span> — Premium short films
      </footer>

      <FilmModal
        filmId={previewFilmId}
        onClose={() => setPreviewFilmId(null)}
        onFavoriteChange={() => {}}
        guestPreview
      />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={authMode}
      />
    </div>
  );
}

export function LandingPage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <LandingContent />
      </ToastProvider>
    </AuthProvider>
  );
}
