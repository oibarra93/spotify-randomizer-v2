// Centralised error definitions and utilities for the client API layer.
//
// These types and helpers wrap errors thrown from the server or network
// layer into a uniform structure that the UI can inspect and display
// safely.  By funnelling all error creation through these functions we
// ensure that user‑facing error messages never leak sensitive details
// such as OAuth tokens.

/**
 * Discriminated union of well‑known error identifiers.  Use one of
 * these strings when constructing an AppError to communicate the
 * category of failure to the UI.  Additional fields on the error may
 * carry extra context such as HTTP status codes or retry hints.
 */
export type ErrorKind =
  | "AUTH_REQUIRED"
  | "AUTH_EXPIRED"
  | "HTTP_ERROR"
  | "SPOTIFY_ERROR"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "PARSE_ERROR"
  | "UNKNOWN_ERROR";

/**
 * Normalised error shape used throughout the application.  All
 * user‑visible errors should conform to this interface.  Unknown
 * exceptions thrown from lower layers will be converted using
 * `toAppError`.
 */
export type AppError = {
  /**
   * Category of error; see {@link ErrorKind} for options.
   */
  kind: ErrorKind;
  /**
   * Human‑readable description.  This may be surfaced directly to the
   * user or logged for debugging.
   */
  message: string;
  /**
   * HTTP status associated with the error, if any.  Not all errors
   * originate from HTTP requests so this field is optional.
   */
  status?: number;
  /**
   * Seconds until a retry may succeed.  Used primarily with
   * {@link ErrorKind.RATE_LIMITED}.
   */
  retryAfterSec?: number;
  /**
   * Arbitrary metadata.  Never include secrets or tokens here; see
   * {@link sanitizeDetails}.
   */
  details?: Record<string, unknown>;
  /**
   * Underlying cause of the error, if it wraps another exception.  This
   * field is not intended for end users.
   */
  cause?: unknown;
};

/**
 * Type predicate to check if an unknown value already conforms to
 * {@link AppError}.
 */
export function isAppError(e: unknown): e is AppError {
  return typeof e === "object" && e !== null && "kind" in e && "message" in e;
}

/**
 * Convert an arbitrary exception into an {@link AppError}.  If the
 * incoming value already satisfies the interface it is returned
 * unchanged.  Otherwise, the error is wrapped with a fallback message
 * and categorised as {@link ErrorKind.UNKNOWN_ERROR}.
 */
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
 * Produce a minimal message suitable for display in the UI.  This
 * helper hides implementation details and focuses on actionable
 * guidance for end users.  It should never expose sensitive
 * information contained in the error details.
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
 * Remove sensitive keys from an arbitrary details object.  Use this
 * helper before attaching request metadata to an {@link AppError} to
 * ensure that tokens or authentication headers are never leaked to
 * logs or clients.
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
