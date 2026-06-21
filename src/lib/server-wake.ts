import {
  defaultFetchTimeoutMs,
  defaultMaxAttempts,
  isSlowHost,
} from "@/lib/hosting";

const AWAKE_TTL_MS = 5 * 60 * 1000;
const HEALTH_PATHS = ["/api/health", "/health"];

let lastAwakeAt = 0;
let wakeInFlight: Promise<boolean> | null = null;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetriableResponse(status: number) {
  return status === 408 || status === 429 || status >= 500;
}

export function isRetriableError(err: unknown) {
  if (err instanceof DOMException && err.name === "AbortError") return true;
  if (err instanceof TypeError) return true;
  return false;
}

async function pingHealth(timeoutMs: number, path = HEALTH_PATHS[0]) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      credentials: "same-origin",
      cache: "no-store",
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

/** Poll health until the server responds or attempts are exhausted. */
export async function ensureServerAwake(
  onProgress?: (message: string) => void
): Promise<boolean> {
  if (!isSlowHost()) {
    for (const path of HEALTH_PATHS) {
      if (await pingHealth(8000, path)) {
        lastAwakeAt = Date.now();
        return true;
      }
    }
    return false;
  }

  if (Date.now() - lastAwakeAt < AWAKE_TTL_MS) {
    return true;
  }

  if (wakeInFlight) {
    return wakeInFlight;
  }

  wakeInFlight = (async () => {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (attempt === 0) {
        onProgress?.("Connecting to server...");
      } else {
        onProgress?.(`Waking server automatically (${attempt + 1}/${maxAttempts})...`);
      }

      for (const path of HEALTH_PATHS) {
        if (await pingHealth(45000, path)) {
          lastAwakeAt = Date.now();
          return true;
        }
      }

      if (attempt < maxAttempts - 1) {
        await sleep(Math.min(3000 + attempt * 1500, 8000));
      }
    }

    return false;
  })();

  try {
    return await wakeInFlight;
  } finally {
    wakeInFlight = null;
  }
}

export type FetchJsonWithRetryOptions = {
  maxAttempts?: number;
  timeoutMs?: number;
  onProgress?: (message: string) => void;
};

/** Fetch JSON, automatically waking the server and retrying on cold-start failures. */
export async function fetchJsonWithRetry<T = Record<string, unknown>>(
  url: string,
  options: RequestInit = {},
  {
    maxAttempts = defaultMaxAttempts(),
    timeoutMs = defaultFetchTimeoutMs(),
    onProgress,
  }: FetchJsonWithRetryOptions = {}
): Promise<{ res: Response; data: T }> {
  const { fetchJson } = await import("@/lib/utils");

  if (!isSlowHost()) {
    return fetchJson<T>(url, options, timeoutMs);
  }

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) {
      onProgress?.(`Retrying automatically (${attempt + 1}/${maxAttempts})...`);
      await ensureServerAwake(onProgress);
    }

    try {
      const { res, data } = await fetchJson<T>(url, options, timeoutMs);

      if (res.ok) {
        lastAwakeAt = Date.now();
        return { res, data };
      }

      if (!isRetriableResponse(res.status) || attempt === maxAttempts - 1) {
        return { res, data };
      }

      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err;
      if (!isRetriableError(err) || attempt === maxAttempts - 1) {
        throw err;
      }
    }

    if (attempt < maxAttempts - 1) {
      await sleep(2000);
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Request failed");
}

/** Fire-and-forget wake on page load — only on slow hosts (Render free tier). */
export function wakeServerInBackground() {
  if (!isSlowHost()) return;
  void ensureServerAwake();
}
