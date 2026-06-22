export const CATEGORIES = [
  { id: "all", label: "All Films" },
  { id: "top", label: "Top Rated" },
  { id: "new", label: "New Releases" },
  { id: "drama", label: "Drama" },
  { id: "comedy", label: "Comedy" },
  { id: "animation", label: "Animation" },
  { id: "sci-fi", label: "Sci-Fi" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];

/** Top nav browse links (no genre categories). */
export const NAV_CATEGORIES = CATEGORIES.slice(0, 3);

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

export function youtubeEmbedUrl(url: string, autoplay = false, startSeconds = 0) {
  const base = url.includes("embed") ? url : url.replace("watch?v=", "embed/");
  const params = new URLSearchParams();
  params.set("rel", "0");
  if (autoplay) params.set("autoplay", "1");
  if (startSeconds > 0) params.set("start", String(Math.floor(startSeconds)));
  const join = base.includes("?") ? "&" : "?";
  return `${base}${join}${params.toString()}`;
}

/** Fetch JSON with a hard timeout (Render free tier can take 30–60s to wake). */
export async function fetchJson<T = Record<string, unknown>>(
  url: string,
  options: RequestInit = {},
  timeoutMs = 60000
): Promise<{ res: Response; data: T }> {
  const controller = new AbortController();
  let hardTimeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    hardTimeout = setTimeout(() => {
      controller.abort();
      reject(new DOMException("Aborted", "AbortError"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([
      (async () => {
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
            if (res.status === 401 || res.status === 403) {
              throw new Error(
                "Site access is blocked — disable Vercel Deployment Protection in project settings"
              );
            }
            if (res.status === 502 || res.status === 503) {
              throw new Error(
                "Server unavailable — confirm you're on the correct site URL from your Vercel dashboard"
              );
            }
            throw new Error(`Server error (${res.status}) — try again or check /api/health`);
          }
          data = {} as T;
        }
        return { res, data };
      })(),
      timeoutPromise,
    ]);
  } finally {
    if (hardTimeout) clearTimeout(hardTimeout);
  }
}
