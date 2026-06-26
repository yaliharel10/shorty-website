export const MOODS = [
  { id: "emotional", label: "Emotional" },
  { id: "dark", label: "Dark" },
  { id: "uplifting", label: "Uplifting" },
  { id: "surreal", label: "Surreal" },
  { id: "experimental", label: "Experimental" },
  { id: "sci-fi", label: "Sci-Fi Mood" },
  { id: "documentary", label: "Documentary" },
  { id: "funny", label: "Funny" },
  { id: "tense", label: "Tense" },
  { id: "romantic", label: "Romantic" },
] as const;

export type MoodId = (typeof MOODS)[number]["id"];

export const GENRES = [
  { id: "drama", label: "Drama" },
  { id: "comedy", label: "Comedy" },
  { id: "animation", label: "Animation" },
  { id: "sci-fi", label: "Sci-Fi" },
  { id: "horror", label: "Horror" },
  { id: "documentary", label: "Documentary" },
  { id: "experimental", label: "Experimental" },
  { id: "romance", label: "Romance" },
] as const;

export type GenreId = (typeof GENRES)[number]["id"];

export type DurationTier = "micro" | "short" | "extended";

export const DURATION_TIERS = {
  micro: { id: "micro" as const, label: "Micro film", max: 4, description: "Under 5 min" },
  short: { id: "short" as const, label: "Short film", min: 5, max: 10, description: "5–10 min" },
  extended: { id: "extended" as const, label: "Extended short", min: 10, max: 30, description: "10–30 min" },
} as const;

export const MAX_SHORT_FILM_MINUTES = 30;
export const QUICK_WATCH_MAX_MINUTES = 10;

export function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

export function stringifyJsonArray(values: string[]): string {
  return JSON.stringify([...new Set(values.filter(Boolean))]);
}

export function getDurationTier(minutes: number): DurationTier {
  if (minutes < 5) return "micro";
  if (minutes <= 10) return "short";
  return "extended";
}

export function durationTierLabel(minutes: number) {
  return DURATION_TIERS[getDurationTier(minutes)].label;
}

export function formatRuntime(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatRuntimeCompact(minutes: number) {
  return `${minutes}m`;
}

export function moodLabel(id: string) {
  return MOODS.find((m) => m.id === id)?.label ?? id.replace(/-/g, " ");
}

export function genreLabel(id: string) {
  return GENRES.find((g) => g.id === id)?.label ?? id.replace(/-/g, " ");
}

export function filmGenres(film: { category: string; genres?: string | string[] | null }) {
  if (Array.isArray(film.genres)) return film.genres;
  const parsed = parseJsonArray(film.genres);
  if (parsed.length) return parsed;
  return film.category ? [film.category] : [];
}

export function filmMoods(film: { moods?: string | string[] | null }) {
  if (Array.isArray(film.moods)) return film.moods;
  return parseJsonArray(film.moods);
}

export function filmTags(film: { tags?: string | string[] | null }) {
  if (Array.isArray(film.tags)) return film.tags;
  return parseJsonArray(film.tags);
}

export function isQuickWatch(minutes: number) {
  return minutes <= QUICK_WATCH_MAX_MINUTES;
}

export function enrichFilmMetadata<T extends {
  category: string;
  genres?: string | string[] | null;
  moods?: string | string[] | null;
  tags?: string | string[] | null;
  duration: number;
  language?: string | null;
  country?: string | null;
}>(film: T) {
  const genres = filmGenres(film);
  const moods = filmMoods(film);
  const tags = filmTags(film);
  const durationTier = getDurationTier(film.duration);

  return {
    ...film,
    genres,
    moods,
    tags,
    durationTier,
    durationTierLabel: DURATION_TIERS[durationTier].label,
    runtimeLabel: formatRuntime(film.duration),
    runtimeCompact: formatRuntimeCompact(film.duration),
    quickWatch: isQuickWatch(film.duration),
    language: film.language ?? "en",
    country: film.country ?? null,
  };
}
