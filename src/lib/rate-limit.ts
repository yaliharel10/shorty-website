import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

type Bucket = { count: number; resetAt: number };

const memoryStore = new Map<string, Bucket>();
const upstashLimiters = new Map<string, Ratelimit>();

const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanupMemory() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, bucket] of memoryStore) {
    if (now > bucket.resetAt) memoryStore.delete(key);
  }
}

function memoryRateLimit(
  key: string,
  limit: number,
  windowMs: number
): { ok: true } | { ok: false; retryAfter: number } {
  cleanupMemory();
  const now = Date.now();
  const bucket = memoryStore.get(key);

  if (!bucket || now > bucket.resetAt) {
    memoryStore.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true };
  }

  if (bucket.count >= limit) {
    return {
      ok: false,
      retryAfter: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)),
    };
  }

  bucket.count += 1;
  return { ok: true };
}

function getUpstashLimiter(limit: number, windowMs: number) {
  const windowSec = Math.max(1, Math.ceil(windowMs / 1000));
  const cacheKey = `${limit}:${windowSec}`;
  let limiter = upstashLimiters.get(cacheKey);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: Redis.fromEnv(),
      limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
      prefix: "shorty_rl",
      analytics: true,
    });
    upstashLimiters.set(cacheKey, limiter);
  }
  return limiter;
}

function upstashConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
  );
}

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ ok: true } | { ok: false; retryAfter: number }> {
  if (upstashConfigured()) {
    try {
      const limiter = getUpstashLimiter(limit, windowMs);
      const result = await withTimeout(limiter.limit(key), 1500, {
        success: true,
        reset: Date.now() + windowMs,
      } as Awaited<ReturnType<Ratelimit["limit"]>>);
      if (!result.success) {
        const retryAfter = Math.max(
          1,
          Math.ceil((result.reset - Date.now()) / 1000)
        );
        return { ok: false, retryAfter };
      }
      return { ok: true };
    } catch {
      // Fall through to in-memory if Redis is unreachable
    }
  }

  return memoryRateLimit(key, limit, windowMs);
}

export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") || "unknown";
}
