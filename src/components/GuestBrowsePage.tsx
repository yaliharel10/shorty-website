"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { AuthModal, authErrorMessage } from "@/components/AuthModal";
import { Hero, FilmRow } from "@/components/Hero";
import { FilmCard } from "@/components/FilmCard";
import { DemoAccessBar } from "@/components/DemoAccessBar";
import { SiteFooter } from "@/components/SiteFooter";
import { HeroSkeleton, FilmRowSkeleton } from "@/components/LoadingSkeleton";
import type { Film } from "@/types";

type CatalogData = {
  filmCount: number;
  featured: Film | null;
  topRated: Film[];
  newReleases: Film[];
  newFilmIds: string[];
  byCategory: { category: string; label: string; films: Film[] }[];
};

export function GuestBrowseContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<CatalogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      router.replace("/browse");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (searchParams.get("signin") === "1") setAuthOpen(true);
    const watch = searchParams.get("watch");
    if (watch) router.replace(`/films/${watch}`);
  }, [searchParams, router]);

  useEffect(() => {
    fetch("/api/films/catalog")
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setData(null);
          return;
        }
        setData(json);
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  const promptSignIn = () => setAuthOpen(true);

  if (authLoading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#080808] text-white">
      <header className="fixed top-0 z-50 w-full border-b border-[#222]/80 bg-[#080808]/90 px-4 py-3 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-xl font-extrabold">
            Shorty<span className="text-[#ff7a18]">.</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link href="/subscription" className="hidden text-sm text-[#888] hover:text-white sm:block">
              Plans
            </Link>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="rounded-lg px-3 py-2 text-sm text-[#ccc] hover:bg-white/5"
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthOpen(true)}
              className="rounded-lg bg-[#ff7a18] px-4 py-2 text-sm font-bold hover:bg-[#ff9533]"
            >
              Start free trial
            </button>
          </div>
        </div>
      </header>

      <DemoAccessBar />

      <div className="border-b border-[#ff7a18]/20 bg-[#ff7a18]/10 px-4 py-3 text-center text-sm md:px-8">
        <span className="text-[#ccc]">
          Browsing as guest — sign in to watch films and save your list.
        </span>{" "}
        <button
          type="button"
          onClick={promptSignIn}
          className="font-bold text-[#ff7a18] hover:underline"
        >
          Sign in free
        </button>
      </div>

      {loading ? (
        <div className="pt-20">
          <HeroSkeleton />
          <FilmRowSkeleton />
        </div>
      ) : (
        <>
          {data?.featured && (
            <div className="pt-16">
              <Hero
                film={data.featured}
                onPlay={promptSignIn}
                onDetails={() => router.push(`/films/${data.featured!.id}`)}
                onToggleFavorite={promptSignIn}
              />
            </div>
          )}

          <main id="main-content" className="relative z-0 pb-16 pt-8">
            {data?.newReleases && data.newReleases.length > 0 && (
              <FilmRow
                title="New Releases"
                films={data.newReleases}
                favoriteIds={[]}
                watchedIds={[]}
                newFilmIds={data.newFilmIds}
                onFilmClick={(f) => router.push(`/films/${f.id}`)}
              />
            )}
            {data?.topRated && data.topRated.length > 0 && (
              <FilmRow
                title="Top Rated"
                films={data.topRated}
                favoriteIds={[]}
                watchedIds={[]}
                onFilmClick={(f) => router.push(`/films/${f.id}`)}
              />
            )}
            {data?.byCategory?.map((row) => (
              <FilmRow
                key={row.category}
                title={row.label}
                films={row.films}
                favoriteIds={[]}
                watchedIds={[]}
                onFilmClick={(f) => router.push(`/films/${f.id}`)}
              />
            ))}

            <section className="px-4 md:px-8 lg:px-12">
              <h2 className="mb-6 text-2xl font-bold">All films</h2>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {[...(data?.topRated ?? []), ...(data?.newReleases ?? [])]
                  .filter(
                    (film, index, arr) =>
                      arr.findIndex((f) => f.id === film.id) === index
                  )
                  .map((film) => (
                    <FilmCard
                      key={film.id}
                      film={film}
                      isNew={data?.newFilmIds.includes(film.id)}
                      onClick={() => router.push(`/films/${film.id}`)}
                    />
                  ))}
              </div>
            </section>

            <section className="mx-4 mt-16 rounded-2xl border border-[#222] bg-[#111] p-8 text-center md:mx-8 lg:mx-12">
              {!data ? (
                <>
                  <h2 className="text-2xl font-bold">Catalog temporarily unavailable</h2>
                  <p className="mx-auto mt-2 max-w-md text-[#888]">
                    We&apos;re updating the film library. Please try again in a moment.
                  </p>
                  <button
                    type="button"
                    onClick={() => window.location.reload()}
                    className="mt-6 rounded-lg border border-[#333] px-8 py-3 text-sm font-bold hover:border-[#ff7a18]"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
              <h2 className="text-2xl font-bold">Unlock the full library</h2>
              <p className="mx-auto mt-2 max-w-md text-[#888]">
                {data.filmCount}+ curated shorts. 7-day free trial, plans from $1.99/mo.
              </p>
              <button
                type="button"
                onClick={promptSignIn}
                className="mt-6 rounded-lg bg-[#ff7a18] px-8 py-3 text-sm font-bold hover:bg-[#ff9533]"
              >
                Get started
              </button>
                </>
              )}
            </section>
          </main>
        </>
      )}

      <SiteFooter />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        defaultMode={searchParams.get("signin") === "1" ? "login" : "register"}
        redirectTo="/browse"
        initialError={authErrorMessage(searchParams.get("error"))}
      />
    </div>
  );
}
