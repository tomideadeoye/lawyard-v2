"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/observability/report";

/**
 * Catches what React boundaries miss: exceptions thrown outside render, and
 * promise rejections nobody awaited. Mounted once in the root layout.
 */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportError({
        message: event.message || "Uncaught error",
        stack: event.error?.stack,
        path: window.location.pathname,
        context: { filename: event.filename, line: event.lineno, column: event.colno },
      });
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason = event.reason;
      reportError({
        message:
          reason instanceof Error ? reason.message : typeof reason === "string" ? reason : "Unhandled promise rejection",
        stack: reason instanceof Error ? reason.stack : undefined,
        path: window.location.pathname,
        context: { kind: "unhandledrejection" },
      });
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
