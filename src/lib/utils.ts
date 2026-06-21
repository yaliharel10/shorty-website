export const CATEGORIES = [
  { id: "all", label: "All Films" },
  { id: "top", label: "Top Rated" },
  { id: "drama", label: "Drama" },
  { id: "comedy", label: "Comedy" },
  { id: "animation", label: "Animation" },
  { id: "sci-fi", label: "Sci-Fi" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

export function formatRating(rating: number) {
  return rating.toFixed(1);
}

export function avatarUrl(username: string, photoUrl?: string | null) {
  if (photoUrl) return photoUrl;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=ff7a18&color=fff&bold=true`;
}

export function youtubeEmbedUrl(url: string, autoplay = false) {
  const base = url.includes("embed") ? url : url.replace("watch?v=", "embed/");
  return autoplay ? `${base}?autoplay=1&rel=0` : base;
}
