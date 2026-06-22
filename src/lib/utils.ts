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

/** Fetch JSON with timeout — Render free tier can take 30–60s to wake from sleep. */
export async function fetchJson<T = Record<string, unknown>>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60000
): Promise<{ res: Response; data: T }> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      credentials: "same-origin",
      signal: controller.signal,
    });
    let data: T;
    try {
      data = (await res.json()) as T;
    } catch {
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          res.status === 401 || res.status === 403
            ? "Site access is blocked — disable Vercel Deployment Protection in project settings"
            : `Server error (${res.status}) — try again or check /api/health`
        );
      }
      data = {} as T;
    }
    return { res, data };
  } finally {
    clearTimeout(timeout);
  }
}
