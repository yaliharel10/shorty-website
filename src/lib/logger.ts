type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

function serialize(level: LogLevel, message: string, context?: LogContext) {
  return JSON.stringify({
    ts: new Date().toISOString(),
    level,
    message,
    env: process.env.NODE_ENV,
    ...context,
  });
}

export const logger = {
  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(serialize("debug", message, context));
    }
  },
  info(message: string, context?: LogContext) {
    console.info(serialize("info", message, context));
  },
  warn(message: string, context?: LogContext) {
    console.warn(serialize("warn", message, context));
  },
  error(message: string, error?: unknown, context?: LogContext) {
    const err =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: error.stack }
        : error;
    console.error(serialize("error", message, { ...context, error: err }));
    // Hook for Sentry/Datadog — set SENTRY_DSN in production
    if (process.env.SENTRY_DSN && typeof globalThis !== "undefined") {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sentry = (globalThis as any).__SENTRY__;
      if (sentry?.captureException) {
        sentry.captureException(error instanceof Error ? error : new Error(message));
      }
    }
  },
};

export async function withApiTiming<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    const ms = Date.now() - start;
    if (ms > 1000) {
      logger.warn("slow_api", { route: name, durationMs: ms });
    }
  }
}
