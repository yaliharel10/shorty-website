"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthProvider, useAuth } from "@/components/AuthProvider";
import { ToastProvider, useToast } from "@/components/Toast";
import { AuthModal } from "@/components/AuthModal";
import { ProfileModal } from "@/components/ProfileModal";
import { FilmModal } from "@/components/FilmModal";
import { Navbar } from "@/components/Navbar";
import { Hero, FilmRow } from "@/components/Hero";
import { FilmCard } from "@/components/FilmCard";
import { EmptyState } from "@/components/EmptyState";
import {
  FilmGridSkeleton,
  FilmRowSkeleton,
  HeroSkeleton,
} from "@/components/LoadingSkeleton";
import { PersonCard } from "@/components/PersonCard";
import { useDebouncedValue } from "@/hooks/useUI";
import { SubscribeModal } from "@/components/SubscribeModal";
import { BackToTop } from "@/components/BackToTop";
import { FilmSearchFilters } from "@/components/FilmSearchFilters";
import { KeyboardShortcuts, useKeyboardShortcuts } from "@/components/KeyboardShortcuts";
import {
  activeFilterCount,
  DEFAULT_FILM_FILTERS,
  filmFiltersToSearchParams,
  hasActiveFilmFilters,
  type FilmFilterMeta,
  type FilmFilterState,
} from "@/lib/film-filters";
import { trialDaysRemaining } from "@/lib/subscription";
import type { Film, FilmsResponse, PersonSummary } from "@/types";

function HomeContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const [data, setData] = useState<FilmsResponse | null>(null);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 350);
  const [showFavorites, setShowFavorites] = useState(false);
  const [selectedFilmId, setSelectedFilmId] = useState<string | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [modalAutoplay, setModalAutoplay] = useState(true);
  const [modalDetails, setModalDetails] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchPeople, setSearchPeople] = useState<PersonSummary[]>([]);
  const [filters, setFilters] = useState<FilmFilterState>(DEFAULT_FILM_FILTERS);
  const [filterMeta, setFilterMeta] = useState<FilmFilterMeta | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const fetchFilms = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (showFavorites) {
      params.set("favorites", "true");
    } else {
      params.set("category", category);
    }
    if (debouncedSearch) params.set("search", debouncedSearch);
    filmFiltersToSearchParams(filters, params);

    try {
      const res = await fetch(`/api/films?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      setData(json);
    } catch {
      toast("Failed to load films", "error");
    } finally {
      setLoading(false);
    }
  }, [category, debouncedSearch, showFavorites, filters, toast]);

  useEffect(() => {
    fetch("/api/films/filters")
      .then((r) => r.json())
      .then((json) => setFilterMeta(json))
      .catch(() => setFilterMeta(null));
  }, []);

  useEffect(() => {
    if (!debouncedSearch) {
      setSearchPeople([]);
      return;
    }
    fetch(`/api/people?search=${encodeURIComponent(debouncedSearch)}`)
      .then((r) => r.json())
      .then((json) => setSearchPeople(json.people || []))
      .catch(() => setSearchPeople([]));
  }, [debouncedSearch]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/?signin=1");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (searchParams.get("signin") === "1" && !user) {
      setAuthOpen(true);
    }
  }, [searchParams, user]);

  useEffect(() => {
    if (searchParams.get("subscribe") === "1") {
      setSubscribeOpen(true);
    }
  }, [searchParams]);

  useEffect(() => {
    const watch = searchParams.get("watch");
    if (watch && user) {
      setSelectedFilmId(watch);
    }
  }, [searchParams, user]);

  useKeyboardShortcuts(() => setShortcutsOpen(true));

  useEffect(() => {
    fetchFilms();
  }, [fetchFilms]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "f" && document.activeElement?.tagName !== "INPUT") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const goHome = () => {
    setShowFavorites(false);
    setCategory("all");
    setSearch("");
    setFilters(DEFAULT_FILM_FILTERS);
    setFiltersExpanded(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openFilm = (film: Film | string, mode: "play" | "details" = "play") => {
    const id = typeof film === "string" ? film : film.id;
    setModalAutoplay(mode === "play");
    setModalDetails(mode === "details");
    setSelectedFilmId(id);
    router.replace(`/browse?watch=${id}`, { scroll: false });
  };

  const closeFilm = () => {
    setSelectedFilmId(null);
    setModalDetails(false);
    router.replace("/browse", { scroll: false });
  };

  const browseCategory = (cat: string) => {
    setShowFavorites(false);
    setCategory(cat);
    setFilters(DEFAULT_FILM_FILTERS);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const toggleFavoriteForFeatured = async () => {
    if (!user || !data?.featured) {
      setAuthOpen(true);
      return;
    }
    const res = await fetch(`/api/favorites/${data.featured.id}`, { method: "POST" });
    const result = await res.json();
    if (res.ok) {
      toast(
        result.isFavorite ? "Added to My List" : "Removed from My List",
        "success"
      );
      fetchFilms();
    }
  };

  const categoryLabels: Record<string, string> = {
    all: "All Films",
    top: "Top Rated",
    new: "New Releases",
    drama: "Drama",
    comedy: "Comedy",
    animation: "Animation",
    "sci-fi": "Sci-Fi",
  };

  const filtersActive = hasActiveFilmFilters(filters);
  const isFilteredBrowse =
    debouncedSearch || category !== "all" || filtersActive;

  const browseTitle = debouncedSearch
    ? `Results for "${debouncedSearch}"`
    : filtersActive && category === "all"
      ? "Filtered films"
      : categoryLabels[category];

  const showHero =
    !showFavorites &&
    !debouncedSearch &&
    !filtersActive &&
    category === "all" &&
    data?.featured;

  const isBrowseHome =
    !showFavorites && !debouncedSearch && !filtersActive && category === "all";

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080808]">
      <Navbar
        activeCategory={category}
        onCategoryChange={(cat) => {
          setShowFavorites(false);
          setCategory(cat);
          setFilters(DEFAULT_FILM_FILTERS);
        }}
        search={search}
        onSearchChange={setSearch}
        filterCount={activeFilterCount(filters)}
        onOpenFilters={() => {
          setShowFavorites(false);
          setFiltersExpanded(true);
          window.scrollTo({ top: 0, behavior: "smooth" });
          if (category !== "all" || debouncedSearch) return;
          setCategory("all");
        }}
        onShowFavorites={() => {
          if (!user) {
            setAuthOpen(true);
            return;
          }
          setShowFavorites(true);
        }}
        onOpenAuth={() => setAuthOpen(true)}
        onGoHome={goHome}
        showingFavorites={showFavorites}
        onOpenSubscribe={() => setSubscribeOpen(true)}
        favoriteCount={data?.favoriteIds.length ?? 0}
      />

      {user && !user.hasStreamingAccess && (
        <div className="border-b border-[#ff7a18]/20 bg-[#ff7a18]/10 px-4 py-3 text-center text-sm md:px-8">
          <span className="text-[#ccc]">
            Your trial has ended. Subscribe from $1.99/mo to keep watching.
          </span>{" "}
          <button
            onClick={() => setSubscribeOpen(true)}
            className="font-bold text-[#ff7a18] hover:underline"
          >
            Choose a plan
          </button>
        </div>
      )}

      {user?.hasStreamingAccess && user.trialEndsAt && trialDaysRemaining(new Date(user.trialEndsAt)) > 0 && (
        <div className="border-b border-[#222] bg-[#111] px-4 py-2.5 text-center text-xs text-[#888] md:px-8">
          Free trial — {trialDaysRemaining(new Date(user.trialEndsAt))} day
          {trialDaysRemaining(new Date(user.trialEndsAt)) !== 1 ? "s" : ""} left.{" "}
          <button
            onClick={() => setSubscribeOpen(true)}
            className="text-[#ff7a18] hover:underline"
          >
            Subscribe early
          </button>
        </div>
      )}

      {loading && isBrowseHome ? (
        <HeroSkeleton />
      ) : (
        showHero &&
        data?.featured && (
          <Hero
            film={data.featured}
            isFavorite={data.favoriteIds.includes(data.featured.id)}
            isWatched={data.watchedIds.includes(data.featured.id)}
            onPlay={() => openFilm(data.featured!, "play")}
            onDetails={() => openFilm(data.featured!, "details")}
            onToggleFavorite={toggleFavoriteForFeatured}
          />
        )
      )}

      <main
        id="main-content"
        className={showHero && !loading ? "relative z-0 pb-16 pt-10 md:pt-12" : "pt-20 pb-16"}
      >
        {loading ? (
          isBrowseHome ? (
            <>
              <FilmRowSkeleton />
              <FilmRowSkeleton />
            </>
          ) : (
            <section className="px-4 md:px-8 lg:px-12">
              <FilmGridSkeleton />
            </section>
          )
        ) : showFavorites ? (
          <section className="px-4 md:px-8 lg:px-12">
            <h2 className="mb-6 text-2xl font-bold">My List</h2>
            {data?.films.length === 0 ? (
              <EmptyState variant="favorites" />
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data?.films.map((film) => (
                  <FilmCard
                    key={film.id}
                    film={film}
                    isFavorite
                    isWatched={data.watchedIds.includes(film.id)}
                    progressPercent={data.watchProgress[film.id]}
                    onClick={() => openFilm(film)}
                  />
                ))}
              </div>
            )}
          </section>
        ) : isFilteredBrowse ? (
          <section className="px-4 md:px-8 lg:px-12">
            <h2 className="mb-2 text-2xl font-bold">{browseTitle}</h2>

            <FilmSearchFilters
              filters={filters}
              onChange={setFilters}
              meta={filterMeta}
              resultCount={data?.resultCount ?? data?.films.length}
              hasSearch={Boolean(debouncedSearch)}
              expanded={filtersExpanded}
              onToggleExpanded={() => setFiltersExpanded((v) => !v)}
            />

            {debouncedSearch && searchPeople.length > 0 && (
              <div className="mb-10">
                <h3 className="mb-4 text-lg font-semibold text-[#ccc]">People</h3>
                <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
                  {searchPeople.map((person) => (
                    <PersonCard key={person.id} person={person} />
                  ))}
                </div>
              </div>
            )}
            {debouncedSearch && (
              <h3 className="mb-4 text-lg font-semibold text-[#ccc]">Films</h3>
            )}
            {data?.films.length === 0 ? (
              debouncedSearch && searchPeople.length > 0 ? null : (
                <EmptyState
                  variant="search"
                  query={debouncedSearch || "your filters"}
                />
              )
            ) : (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {data?.films.map((film) => (
                  <FilmCard
                    key={film.id}
                    film={film}
                    isFavorite={data.favoriteIds.includes(film.id)}
                    isWatched={data.watchedIds.includes(film.id)}
                    isNew={data.newFilmIds.includes(film.id)}
                    onClick={() => openFilm(film)}
                  />
                ))}
              </div>
            )}
            {(debouncedSearch || filtersActive) &&
              data?.films.length === 0 &&
              searchPeople.length === 0 && (
                <EmptyState
                  variant="search"
                  query={debouncedSearch || "your filters"}
                />
              )}
          </section>
        ) : (
          <>
            <section className="px-4 pb-4 pt-2 md:px-8 lg:px-12">
              <FilmSearchFilters
                filters={filters}
                onChange={(next) => {
                  setFilters(next);
                  if (hasActiveFilmFilters(next)) {
                    setFiltersExpanded(true);
                  }
                }}
                meta={filterMeta}
                expanded={filtersExpanded}
                onToggleExpanded={() => setFiltersExpanded((v) => !v)}
              />
            </section>
            {data?.continueWatching && data.continueWatching.length > 0 && (
              <FilmRow
                title="Continue Watching"
                films={data.continueWatching}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                continueIds={data.continueWatching.map((f) => f.id)}
                onFilmClick={(f) => openFilm(f, "play")}
              />
            )}
            {data?.recommendedForYou && data.recommendedForYou.length > 0 && (
              <FilmRow
                title="Recommended for You"
                films={data.recommendedForYou}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                onFilmClick={(f) => openFilm(f)}
              />
            )}
            {data?.newReleases && data.newReleases.length > 0 && (
              <FilmRow
                title="New Releases"
                films={data.newReleases}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                onSeeAll={() => browseCategory("new")}
                onFilmClick={(f) => openFilm(f)}
              />
            )}
            {data?.topRated && data.topRated.length > 0 && (
              <FilmRow
                title="Top Rated"
                films={data.topRated}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                onSeeAll={() => browseCategory("top")}
                onFilmClick={(f) => openFilm(f)}
              />
            )}
            {data?.byCategory.map((row) => (
              <FilmRow
                key={row.category}
                title={categoryLabels[row.category] || row.category}
                films={row.films}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                onSeeAll={() => browseCategory(row.category)}
                onFilmClick={(f) => openFilm(f)}
              />
            ))}
          </>
        )}
      </main>

      <footer className="border-t border-[#222] px-4 py-10 text-center md:px-8">
        <p className="text-sm text-[#666]">
          Shorty<span className="text-[#ff7a18]">.</span> — Premium short films,
          curated for you.
        </p>
        <p className="mt-2 text-xs text-[#444]">
          Press{" "}
          <kbd className="rounded border border-[#333] px-1.5 py-0.5 font-mono text-[#888]">
            F
          </kbd>{" "}
          to search ·{" "}
          <kbd className="rounded border border-[#333] px-1.5 py-0.5 font-mono text-[#888]">
            Esc
          </kbd>{" "}
          to close player ·{" "}
          <kbd className="rounded border border-[#333] px-1.5 py-0.5 font-mono text-[#888]">
            ?
          </kbd>{" "}
          for shortcuts
        </p>
      </footer>

      <BackToTop />

      <FilmModal
        filmId={selectedFilmId}
        onClose={closeFilm}
        onFavoriteChange={fetchFilms}
        onOpenFilm={(id) => openFilm(id, "play")}
        onUpgrade={() => setSubscribeOpen(true)}
        autoplayVideo={modalAutoplay}
        scrollToDetails={modalDetails}
      />
      <KeyboardShortcuts open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
      />
      <ProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        onSuccess={() => {
          toast("Profile updated", "success");
          fetchFilms();
        }}
      />
      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        onSuccess={() => {
          fetchFilms();
          toast("You're all set — happy watching!", "success");
        }}
      />
    </div>
  );
}

export function HomePage() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HomeContent />
      </ToastProvider>
    </AuthProvider>
  );
}
