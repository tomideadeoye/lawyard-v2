/**
 * One error-reporting call for every surface: client boundaries, uncaught
 * exceptions and server helpers. Never throws — reporting must not become a
 * second failure.
 */
export interface ErrorPayload {
  message: string;
  stack?: string;
  path?: string;
  method?: string;
  status?: number;
  digest?: string;
  level?: "error" | "warning";
  source?: "client" | "server";
  context?: Record<string, unknown>;
}

export function reportError(payload: ErrorPayload): void {
  try {
    const body = JSON.stringify({
      level: "error",
      source: "client",
      ...payload,
      path: payload.path ?? (typeof window !== "undefined" ? window.location.pathname : undefined),
    });

    // keepalive so a report survives a navigation that follows the error
    void fetch("/api/errors", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => undefined);
  } catch {
    // swallow: never let telemetry throw
  }
}
