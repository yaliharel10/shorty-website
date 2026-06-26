import {
  filmGenres,
  filmMoods,
  genreLabel,
  moodLabel,
  QUICK_WATCH_MAX_MINUTES,
} from "@/lib/film-metadata";

export type FilmSort =
  | "relevance"
  | "rating"
  | "year"
  | "duration"
  | "title"
  | "newest";

export type FilmFilterState = {
  genres: string[];
  moods: string[];
  languages: string[];
  countries: string[];
  yearFrom: number | null;
  yearTo: number | null;
  minRating: number | null;
  minDuration: number | null;
  maxDuration: number | null;
  quickWatch: boolean;
  sort: FilmSort;
};

export const DEFAULT_FILM_FILTERS: FilmFilterState = {
  genres: [],
  moods: [],
  languages: [],
  countries: [],
  yearFrom: null,
  yearTo: null,
  minRating: null,
  minDuration: null,
  maxDuration: null,
  quickWatch: false,
  sort: "relevance",
};

export type FilmFilterMeta = {
  genres: { id: string; label: string; count: number }[];
  moods: { id: string; label: string; count: number }[];
  languages: { id: string; label: string; count: number }[];
  countries: { id: string; label: string; count: number }[];
  years: { min: number; max: number };
  rating: { min: number; max: number };
  duration: { min: number; max: number };
};

type FilmRow = {
  id: string;
  title: string;
  description: string;
  category: string;
  genres?: string | null;
  moods?: string | null;
  language?: string | null;
  country?: string | null;
  rating: number;
  year: number;
  duration: number;
  createdAt: Date | string;
};

function parseIntParam(value: string | null, min: number, max: number) {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

function parseFloatParam(value: string | null, min: number, max: number) {
  if (!value) return null;
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return null;
  return Math.min(max, Math.max(min, n));
}

export function parseFilmFilters(searchParams: URLSearchParams): FilmFilterState {
  const genres = (searchParams.get("genres") || "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean);
  const moods = (searchParams.get("moods") || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  const languages = (searchParams.get("languages") || "")
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  const countries = (searchParams.get("countries") || "")
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean);

  const sort = searchParams.get("sort");
  const validSort: FilmSort[] = [
    "relevance",
    "rating",
    "year",
    "duration",
    "title",
    "newest",
  ];

  return {
    genres,
    moods,
    languages,
    countries,
    yearFrom: parseIntParam(searchParams.get("yearFrom"), 1900, 2100),
    yearTo: parseIntParam(searchParams.get("yearTo"), 1900, 2100),
    minRating: parseFloatParam(searchParams.get("minRating"), 0, 10),
    minDuration: parseIntParam(searchParams.get("minDuration"), 1, 300),
    maxDuration: parseIntParam(searchParams.get("maxDuration"), 1, 300),
    quickWatch: searchParams.get("quickWatch") === "true",
    sort: validSort.includes(sort as FilmSort) ? (sort as FilmSort) : "relevance",
  };
}

export function hasActiveFilmFilters(filters: FilmFilterState) {
  return (
    filters.genres.length > 0 ||
    filters.moods.length > 0 ||
    filters.languages.length > 0 ||
    filters.countries.length > 0 ||
    filters.yearFrom != null ||
    filters.yearTo != null ||
    filters.minRating != null ||
    filters.minDuration != null ||
    filters.maxDuration != null ||
    filters.quickWatch ||
    filters.sort !== "relevance"
  );
}

export function filmFiltersToSearchParams(
  filters: FilmFilterState,
  base = new URLSearchParams()
) {
  const params = new URLSearchParams(base);
  if (filters.genres.length) params.set("genres", filters.genres.join(","));
  else params.delete("genres");
  if (filters.moods.length) params.set("moods", filters.moods.join(","));
  else params.delete("moods");
  if (filters.languages.length) params.set("languages", filters.languages.join(","));
  else params.delete("languages");
  if (filters.countries.length) params.set("countries", filters.countries.join(","));
  else params.delete("countries");
  if (filters.yearFrom != null) params.set("yearFrom", String(filters.yearFrom));
  else params.delete("yearFrom");
  if (filters.yearTo != null) params.set("yearTo", String(filters.yearTo));
  else params.delete("yearTo");
  if (filters.minRating != null) params.set("minRating", String(filters.minRating));
  else params.delete("minRating");
  if (filters.minDuration != null) params.set("minDuration", String(filters.minDuration));
  else params.delete("minDuration");
  if (filters.maxDuration != null) params.set("maxDuration", String(filters.maxDuration));
  else params.delete("maxDuration");
  if (filters.quickWatch) params.set("quickWatch", "true");
  else params.delete("quickWatch");
  if (filters.sort !== "relevance") params.set("sort", filters.sort);
  else params.delete("sort");
  return params;
}

export function applyFilmFilters<T extends FilmRow>(
  films: T[],
  filters: FilmFilterState,
  creditFilmIds?: Set<string>,
  search?: string
): T[] {
  let result = films;

  if (search) {
    const q = search.toLowerCase();
    result = result.filter(
      (f) =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q) ||
        creditFilmIds?.has(f.id)
    );
  }

  if (filters.genres.length) {
    const genreSet = new Set(filters.genres);
    result = result.filter((f) => filmGenres(f).some((g) => genreSet.has(g)));
  }

  if (filters.moods.length) {
    const moodSet = new Set(filters.moods);
    result = result.filter((f) => filmMoods(f).some((m) => moodSet.has(m)));
  }

  if (filters.languages.length) {
    const langSet = new Set(filters.languages);
    result = result.filter((f) => f.language && langSet.has(f.language));
  }

  if (filters.countries.length) {
    const countrySet = new Set(filters.countries);
    result = result.filter((f) => f.country && countrySet.has(f.country));
  }

  if (filters.quickWatch) {
    result = result.filter((f) => f.duration <= QUICK_WATCH_MAX_MINUTES);
  }

  if (filters.yearFrom != null) {
    result = result.filter((f) => f.year >= filters.yearFrom!);
  }
  if (filters.yearTo != null) {
    result = result.filter((f) => f.year <= filters.yearTo!);
  }
  if (filters.minRating != null) {
    result = result.filter((f) => f.rating >= filters.minRating!);
  }
  if (filters.minDuration != null) {
    result = result.filter((f) => f.duration >= filters.minDuration!);
  }
  if (filters.maxDuration != null) {
    result = result.filter((f) => f.duration <= filters.maxDuration!);
  }

  return result;
}

function relevanceScore(film: FilmRow, query: string) {
  const q = query.toLowerCase();
  const title = film.title.toLowerCase();
  if (title === q) return 100;
  if (title.startsWith(q)) return 80;
  if (title.includes(q)) return 60;
  if (film.description.toLowerCase().includes(q)) return 30;
  if (film.category.toLowerCase().includes(q)) return 20;
  return 10;
}

export function sortFilms<T extends FilmRow>(
  films: T[],
  sort: FilmSort,
  search?: string
): T[] {
  const sorted = [...films];

  switch (sort) {
    case "relevance":
      if (search) {
        return sorted.sort(
          (a, b) => relevanceScore(b, search) - relevanceScore(a, search)
        );
      }
      return sorted.sort((a, b) => b.rating - a.rating);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "year":
      return sorted.sort((a, b) => b.year - a.year);
    case "duration":
      return sorted.sort((a, b) => a.duration - b.duration);
    case "title":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "newest":
      return sorted.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    default:
      return sorted;
  }
}

export function buildFilterMeta(films: FilmRow[]): FilmFilterMeta {
  const genreCounts = new Map<string, number>();
  const moodCounts = new Map<string, number>();
  const languageCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  let minYear = Infinity;
  let maxYear = -Infinity;
  let minRating = Infinity;
  let maxRating = -Infinity;
  let minDuration = Infinity;
  let maxDuration = -Infinity;

  for (const film of films) {
    for (const genre of filmGenres(film)) {
      genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
    }
    for (const mood of filmMoods(film)) {
      moodCounts.set(mood, (moodCounts.get(mood) ?? 0) + 1);
    }
    if (film.language) {
      languageCounts.set(film.language, (languageCounts.get(film.language) ?? 0) + 1);
    }
    if (film.country) {
      countryCounts.set(film.country, (countryCounts.get(film.country) ?? 0) + 1);
    }
    minYear = Math.min(minYear, film.year);
    maxYear = Math.max(maxYear, film.year);
    minRating = Math.min(minRating, film.rating);
    maxRating = Math.max(maxRating, film.rating);
    minDuration = Math.min(minDuration, film.duration);
    maxDuration = Math.max(maxDuration, film.duration);
  }

  const genres = [...genreCounts.entries()]
    .map(([id, count]) => ({ id, label: genreLabel(id), count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const moods = [...moodCounts.entries()]
    .map(([id, count]) => ({ id, label: moodLabel(id), count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const languages = [...languageCounts.entries()]
    .map(([id, count]) => ({ id, label: id.toUpperCase(), count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const countries = [...countryCounts.entries()]
    .map(([id, count]) => ({ id, label: id, count }))
    .sort((a, b) => a.label.localeCompare(b.label));

  return {
    genres,
    moods,
    languages,
    countries,
    years: {
      min: Number.isFinite(minYear) ? minYear : 2020,
      max: Number.isFinite(maxYear) ? maxYear : new Date().getFullYear(),
    },
    rating: {
      min: Number.isFinite(minRating) ? minRating : 0,
      max: Number.isFinite(maxRating) ? maxRating : 10,
    },
    duration: {
      min: Number.isFinite(minDuration) ? minDuration : 1,
      max: Number.isFinite(maxDuration) ? maxDuration : 30,
    },
  };
}

export function activeFilterCount(filters: FilmFilterState) {
  let count = 0;
  if (filters.genres.length) count += filters.genres.length;
  if (filters.moods.length) count += filters.moods.length;
  if (filters.languages.length) count += filters.languages.length;
  if (filters.countries.length) count += filters.countries.length;
  if (filters.yearFrom != null || filters.yearTo != null) count += 1;
  if (filters.minRating != null) count += 1;
  if (filters.minDuration != null || filters.maxDuration != null) count += 1;
  if (filters.quickWatch) count += 1;
  if (filters.sort !== "relevance") count += 1;
  return count;
}
