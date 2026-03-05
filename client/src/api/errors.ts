// src/api/errors.ts

export type ErrorKind =
  | "AUTH_REQUIRED"
  | "AUTH_EXPIRED"
  | "HTTP_ERROR"
  | "SPOTIFY_ERROR"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN_ERROR";

export type AppError = {
  kind: ErrorKind;
  message: string;
  status?: number;
  retryAfterSec?: number;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export function isAppError(e: unknown): e is AppError {
  return typeof e === "object" && e !== null && "kind" in e && "message" in e;
}

export function toAppError(e: unknown, fallbackMessage = "Something went wrong."): AppError {
  if (isAppError(e)) return e;

  if (e instanceof Error) {
    return {
      kind: "UNKNOWN_ERROR",
      message: e.message || fallbackMessage,
      cause: e,
    };
  }

  return { kind: "UNKNOWN_ERROR", message: fallbackMessage, cause: e };
}

/**
 * Minimal, safe message for end-users (no sensitive details).
 * Hooks/UI can use this directly.
 */
export function userMessage(err: AppError): string {
  switch (err.kind) {
    case "AUTH_REQUIRED":
      return "Please log in to continue.";
    case "AUTH_EXPIRED":
      return "Your session expired. Please log in again.";
    case "RATE_LIMITED":
      return err.retryAfterSec
        ? `Rate limited. Retrying in about ${err.retryAfterSec}s…`
        : "Rate limited. Please try again soon.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    case "SPOTIFY_ERROR":
    case "HTTP_ERROR":
      return err.message || "Request failed. Please try again.";
    default:
// src/api/errors.ts

export type ErrorKind =
  | "AUTH_REQUIRED"
  | "AUTH_EXPIRED"
  | "HTTP_ERROR"
  | "SPOTIFY_ERROR"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN_ERROR";

export type AppError = {
  kind: ErrorKind;
  message: string;
  status?: number;
  retryAfterSec?: number;
  details?: Record<string, unknown>;
  cause?: unknown;
};

export function isAppError(e: unknown): e is AppError {
  return typeof e === "object" && e !== null && "kind" in e && "message" in e;
}

export function toAppError(e: unknown, fallbackMessage = "Something went wrong."): AppError {
  if (isAppError(e)) return e;

  if (e instanceof Error) {
    return {
      kind: "UNKNOWN_ERROR",
      message: e.message || fallbackMessage,
      cause: e,
    };
  }

  return { kind: "UNKNOWN_ERROR", message: fallbackMessage, cause: e };
}

/**
 * Minimal, safe message for end-users (no sensitive details).
 * Hooks/UI can use this directly.
 */
export function userMessage(err: AppError): string {
  switch (err.kind) {
    case "AUTH_REQUIRED":
      return "Please log in to continue.";
    case "AUTH_EXPIRED":
      return "Your session expired. Please log in again.";
    case "RATE_LIMITED":
      return err.retryAfterSec
        ? `Rate limited. Retrying in about ${err.retryAfterSec}s…`
        : "Rate limited. Please try again soon.";
    case "NETWORK_ERROR":
      return "Network error. Check your connection and try again.";
    case "SPOTIFY_ERROR":
    case "HTTP_ERROR":
      return err.message || "Request failed. Please try again.";
    default:
      return err.message || "Something went wrong.";
  }
}

/**
 * Never include access/refresh tokens in error details.
 * Use this helper before attaching details that may include request metadata.
 */
export function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const redactedKeys = new Set([
    "access_token",
    "refresh_token",
    "authorization",
    "Authorization",
    "token",
    "tokens",
  ]);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    if (redactedKeys.has(k)) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = v;
    }
  }
  return out;
}
      return err.message || "Something went wrong.";
  }
}

/**
 * Never include access/refresh tokens in error details.
 * Use this helper before attaching details that may include request metadata.
 */
export function sanitizeDetails(details?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!details) return undefined;

  const redactedKeys = new Set([
    "access_token",
    "refresh_token",
    "authorization",
    "Authorization",
    "token",
    "tokens",
  ]);

  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(details)) {
    if (redactedKeys.has(k)) {
      out[k] = "[REDACTED]";
    } else {
      out[k] = v;
    }
  }
  return out;
}
