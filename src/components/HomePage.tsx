"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
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
import { PageTransition } from "@/components/PageTransition";
import { OfflineBanner } from "@/components/OfflineBanner";
import { GenreChips } from "@/components/GenreChips";
import { SurpriseMeButton } from "@/components/SurpriseMeButton";
import { ProfilesPicker } from "@/components/ProfilesPicker";
import {
  activeFilterCount,
  DEFAULT_FILM_FILTERS,
  filmFiltersToSearchParams,
  hasActiveFilmFilters,
  type FilmFilterMeta,
  type FilmFilterState,
} from "@/lib/film-filters";
import { trialDaysRemaining } from "@/lib/subscription";
import { GuestBrowseContent } from "@/components/GuestBrowsePage";
import { SiteFooter } from "@/components/SiteFooter";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { useInfiniteScroll } from "@/hooks/useInfiniteScroll";
import type { Film, FilmsResponse, PersonSummary } from "@/types";

const ActivityFeed = dynamic(
  () => import("@/components/ActivityFeed").then((m) => m.ActivityFeed),
  { ssr: false }
);

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchPeople, setSearchPeople] = useState<PersonSummary[]>([]);
  const [filters, setFilters] = useState<FilmFilterState>(DEFAULT_FILM_FILTERS);
  const [filterMeta, setFilterMeta] = useState<FilmFilterMeta | null>(null);
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const fetchFilms = useCallback(async (cursor?: string | null) => {
    if (cursor) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }
    const params = new URLSearchParams();
    if (showFavorites) {
      params.set("favorites", "true");
    } else {
      params.set("category", category);
    }
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (cursor) params.set("cursor", cursor);
    filmFiltersToSearchParams(filters, params);

    try {
      const res = await fetch(`/api/films?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const json = await res.json();
      if (cursor) {
        setData((prev) =>
          prev
            ? {
                ...json,
                films: [...prev.films, ...json.films],
              }
            : json
        );
      } else {
        setData(json);
      }
    } catch {
      toast("Failed to load films", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
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
    if (searchParams.get("favorites") === "1") setShowFavorites(true);
    if (searchParams.get("search") === "1") {
      requestAnimationFrame(() => {
        document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
      });
    }
  }, [searchParams]);

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
    if (mode === "play") {
      router.push(`/watch/${id}`);
      return;
    }
    setModalAutoplay(false);
    setModalDetails(true);
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

  const toggleFavoriteForFilm = async (film: Film) => {
    if (!user) {
      setAuthOpen(true);
      return;
    }
    const res = await fetch(`/api/favorites/${film.id}`, { method: "POST" });
    const result = await res.json();
    if (res.ok) {
      toast(
        result.isFavorite ? "Added to My List" : "Removed from My List",
        "success"
      );
      fetchFilms();
    }
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

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === "INPUT") return;
      if (e.key === "f" || e.key === "/") {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[placeholder*="Search"]')?.focus();
      }
      if (e.key === "h" && e.metaKey) {
        e.preventDefault();
        goHome();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

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

  const loadMore = useCallback(() => {
    if (data?.nextCursor && !loadingMore && !loading) {
      fetchFilms(data.nextCursor);
    }
  }, [data?.nextCursor, loadingMore, loading, fetchFilms]);

  useInfiniteScroll(loadMoreRef, loadMore, {
    enabled: Boolean(isFilteredBrowse && data?.nextCursor),
  });

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#080808]">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <GuestBrowseContent />;
  }

  return (
    <PageTransition>
    <div className="min-h-screen bg-[#080808]">
      <OfflineBanner />
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
        onPickFilm={(id) => router.push(`/browse/film/${id}`)}
        onPickPerson={(slug) => router.push(`/people/${slug}`)}
      />

      <div className="border-b border-[#222] px-4 py-2 md:px-8 lg:px-12">
        <ProfilesPicker />
      </div>

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
        className={showHero && !loading ? "relative z-0 pb-24 pt-10 md:pb-16 md:pt-12" : "pb-24 pt-20 md:pb-16"}
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
                    onPlay={() => openFilm(film, "play")}
                    onMoreInfo={() => openFilm(film, "details")}
                    onToggleFavorite={() => toggleFavoriteForFilm(film)}
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
                    onPlay={() => openFilm(film, "play")}
                    onMoreInfo={() => openFilm(film, "details")}
                    onToggleFavorite={() => toggleFavoriteForFilm(film)}
                  />
                ))}
              </div>
            )}
            {data?.nextCursor && (
              <div ref={loadMoreRef} className="mt-10 flex justify-center py-6">
                {loadingMore && (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#ff7a18] border-t-transparent" />
                )}
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <GenreChips
                  active={category}
                  onSelect={(cat) => {
                    setShowFavorites(false);
                    setCategory(cat);
                    setFilters(DEFAULT_FILM_FILTERS);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                />
                <SurpriseMeButton onNeedAuth={() => setAuthOpen(true)} />
              </div>
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
            {isBrowseHome && <ActivityFeed />}
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
                onFilmPlay={(f) => openFilm(f, "play")}
                onFilmDetails={(f) => openFilm(f, "details")}
                onFilmFavorite={toggleFavoriteForFilm}
              />
            )}
            {data?.quickWatch && data.quickWatch.length > 0 && (
              <FilmRow
                title="Quick Watch — Under 10 Minutes"
                films={data.quickWatch}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                onFilmClick={(f) => openFilm(f, "play")}
                onFilmPlay={(f) => openFilm(f, "play")}
                onFilmDetails={(f) => openFilm(f, "details")}
                onFilmFavorite={toggleFavoriteForFilm}
              />
            )}
            {data?.trending && data.trending.length > 0 && (
              <FilmRow
                title="Trending This Week"
                films={data.trending}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                onFilmClick={(f) => openFilm(f)}
                onFilmPlay={(f) => openFilm(f, "play")}
                onFilmDetails={(f) => openFilm(f, "details")}
                onFilmFavorite={toggleFavoriteForFilm}
              />
            )}
            {data?.collections?.map((collection) => (
              <FilmRow
                key={collection.id}
                title={collection.title}
                films={collection.films}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                seeAllHref={`/collections/${collection.slug}`}
                onFilmClick={(f) => openFilm(f)}
                onFilmPlay={(f) => openFilm(f, "play")}
                onFilmDetails={(f) => openFilm(f, "details")}
                onFilmFavorite={toggleFavoriteForFilm}
              />
            ))}
            {data?.recommendedForYou && data.recommendedForYou.length > 0 && (
              <FilmRow
                title="Because you watched…"
                films={data.recommendedForYou}
                favoriteIds={data.favoriteIds}
                watchedIds={data.watchedIds}
                newFilmIds={data.newFilmIds}
                watchProgress={data.watchProgress}
                onFilmClick={(f) => openFilm(f)}
                onFilmPlay={(f) => openFilm(f, "play")}
                onFilmDetails={(f) => openFilm(f, "details")}
                onFilmFavorite={toggleFavoriteForFilm}
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
                onFilmPlay={(f) => openFilm(f, "play")}
                onFilmDetails={(f) => openFilm(f, "details")}
                onFilmFavorite={toggleFavoriteForFilm}
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
                onFilmPlay={(f) => openFilm(f, "play")}
                onFilmDetails={(f) => openFilm(f, "details")}
                onFilmFavorite={toggleFavoriteForFilm}
              />
            )}
            {data?.byCategory?.map((row) => (
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
                onFilmPlay={(f) => openFilm(f, "play")}
                onFilmDetails={(f) => openFilm(f, "details")}
                onFilmFavorite={toggleFavoriteForFilm}
              />
            ))}
          </>
        )}
      </main>

      <div className="border-t border-[#222] px-4 py-4 text-center text-xs text-[#444] md:px-8">
        Press{" "}
        <kbd className="rounded border border-[#333] px-1.5 py-0.5 font-mono text-[#888]">
          F
        </kbd>{" "}
        or{" "}
        <kbd className="rounded border border-[#333] px-1.5 py-0.5 font-mono text-[#888]">
          /
        </kbd>{" "}
        to search ·{" "}
        <kbd className="rounded border border-[#333] px-1.5 py-0.5 font-mono text-[#888]">
          ?
        </kbd>{" "}
        for shortcuts
      </div>
      <SiteFooter />

      <MobileBottomNav
        onSearchFocus={() => {
          document.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
          window.scrollTo({ top: 0, behavior: "smooth" });
        }}
      />

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
    </PageTransition>
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
