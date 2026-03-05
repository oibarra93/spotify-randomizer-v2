import { type AppError, sanitizeDetails } from "../errors";
import { getValidAccessToken, refreshAccessTokenSingleFlight } from "../../auth/refresh";

const SPOTIFY_API_BASE = "https://api.spotify.com/v1";

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export type SpotifyRequestInit = {
  path: string; // e.g. "/me"
  method?: HttpMethod;
  query?: Record<string, string | number | boolean | undefined | null>;
  body?: unknown;
  headers?: Record<string, string>;
  signal?: AbortSignal;

  /**
   * Defaults to true. Wrapper will do at most:
   * - preemptive refresh if near expiry
   * - retry exactly once after a 401 by forcing refresh
   */
  retryOn401?: boolean;
};

function buildUrl(path: string, query?: SpotifyRequestInit["query"]): string {
  const url = new URL(SPOTIFY_API_BASE + path);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

async function safeParseResponse(res: Response): Promise<unknown> {
  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return res.json().catch(() => null);
  }
  return res.text().catch(() => null);
}

function retryAfterSeconds(res: Response): number | undefined {
  const raw = res.headers.get("retry-after");
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

function makeSpotifyError(params: {
  status: number;
  message: string;
  retryAfterSec?: number;
  details?: Record<string, unknown>;
  spotifyPayload?: unknown;
}): AppError {
  const { status, message, retryAfterSec, details, spotifyPayload } = params;

  // Spotify errors are often: { error: { status, message } }
  let spotifyMessage: string | undefined;
  if (
    spotifyPayload &&
    typeof spotifyPayload === "object" &&
    "error" in (spotifyPayload as any)
  ) {
    const errObj = (spotifyPayload as any).error;
    if (errObj && typeof errObj.message === "string") {
      spotifyMessage = errObj.message;
    }
  }

  const kind: AppError["kind"] =
    status === 429 ? "RATE_LIMITED" : status === 401 ? "AUTH_EXPIRED" : "SPOTIFY_ERROR";

  return {
    kind,
    status,
    retryAfterSec,
    message: spotifyMessage || message,
    details: sanitizeDetails(details),
  };
}

/**
 * Core request wrapper for Spotify Web API.
 * - Attaches Authorization header
 * - Parses JSON safely
 * - Preemptive refresh near expiry (skew)
 * - Retry exactly once on 401 (force refresh then retry)
 */
export async function spotifyRequest<T>(init: SpotifyRequestInit): Promise<T> {
  const {
    path,
    method = "GET",
    query,
    body,
    headers,
    signal,
    retryOn401 = true,
  } = init;

  const url = buildUrl(path, query);

  // Preemptive refresh reduces edge-of-expiry 401s.
  const accessToken = await getValidAccessToken({ skewMs: 60_000, signal });

  const doFetch = async (token: string): Promise<Response> => {
    return fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        Authorization: `Bearer ${token}`,
        ...(headers ?? {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  };

  let res: Response;
  try {
    res = await doFetch(accessToken);
  } catch (cause) {
    const err: AppError = {
      kind: "NETWORK_ERROR",
      message: "Network error calling Spotify.",
      cause,
      details: sanitizeDetails({ method, path }),
    };
    throw err;
  }

  // Retry-once 401: force refresh and retry exactly once.
  if (res.status === 401 && retryOn401) {
    const newToken = await refreshAccessTokenSingleFlight({ signal });
    try {
      res = await doFetch(newToken);
    } catch (cause) {
      const err: AppError = {
        kind: "NETWORK_ERROR",
        message: "Network error calling Spotify after refresh.",
        cause,
        details: sanitizeDetails({ method, path }),
      };
      throw err;
    }

    if (res.status === 401) {
      const payload = await safeParseResponse(res);
      throw makeSpotifyError({
        status: 401,
        message: "Session expired. Please log in again.",
        details: { method, path },
        spotifyPayload: payload,
      });
    }
  }

  const payload = await safeParseResponse(res);

  if (!res.ok) {
    throw makeSpotifyError({
      status: res.status,
      message: "Spotify request failed.",
      retryAfterSec: res.status === 429 ? retryAfterSeconds(res) : undefined,
      details: { method, path },
      spotifyPayload: payload,
    });
  }

  return payload as T;
}
