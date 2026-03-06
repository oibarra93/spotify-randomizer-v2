// src/auth/refresh.ts

import { sanitizeDetails, type AppError } from "../api/errors";
import { computeExpiresAtMs, loadTokens, saveTokens, clearTokens } from "./tokenStore";

 type RefreshResponse = {
  access_token: string;
  token_type?: string;
  scope?: string;
  expires_in: number; // seconds
  // Some implementations might return refresh_token; if yours does, we can store it.
  refresh_token?: string;
};

const REFRESH_ENDPOINT = "/api/spotify-randomizer/refresh";

/**
 * Single-flight mutex:
 * If multiple requests trigger refresh at once, they will all await the same promise.
 */
let refreshInFlight: Promise<string> | null = null;

export function isRefreshInFlight(): boolean {
  return refreshInFlight !== null;
}

/**
 * Performs one refresh request (no retries here).
 * Never logs tokens.
 */
async function performRefresh(signal?: AbortSignal): Promise<string> {
  const existing = loadTokens();
  if (!existing) {
    const err: AppError = {
      kind: "AUTH_REQUIRED",
      message: "No stored session. Please log in.",
    };
    throw err;
  }

  // If you store refreshToken client-side and your backend requires it:
  // include it here. If your backend uses server-side storage or cookies, omit it.
  const body: Record<string, unknown> = {};
  if (existing.refreshToken) body.refresh_token = existing.refreshToken;

  let res: Response;
  try {
    res = await fetch(REFRESH_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      credentials: "same-origin",
      signal,
    });
  } catch (cause) {
    const err: AppError = {
      kind: "NETWORK_ERROR",
      message: "Failed to reach refresh endpoint.",
      cause,
    };
    throw err;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  const payload = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    // If refresh fails, treat as session expired (UI will redirect to /login).
    const err: AppError = {
      kind: "AUTH_EXPIRED",
      status: res.status,
      message: "Session refresh failed. Please log in again.",
      details: sanitizeDetails({
        endpoint: REFRESH_ENDPOINT,
        status: res.status,
        payloadType: isJson ? "json" : "text",
      }),
    };

    // Clear tokens if refresh is not authorized — avoid stuck/broken state.
    if (res.status === 401 || res.status === 400) {
      clearTokens();
    }

    throw err;
  }

  const data = payload as RefreshResponse | null;
  if (!data || typeof data.access_token !== "string" || typeof data.expires_in !== "number") {
    const err: AppError = {
      kind: "PARSE_ERROR",
      message: "Invalid refresh response format.",
      details: sanitizeDetails({ endpoint: REFRESH_ENDPOINT, status: res.status }),
    };
    throw err;
  }

  // Update stored tokens
  saveTokens({
    accessToken: data.access_token,
    expiresAtMs: computeExpiresAtMs(data.expires_in),
    tokenType: data.token_type,
    scope: data.scope,
    refreshToken: typeof data.refresh_token === "string" ? data.refresh_token : existing.refreshToken,
  });

  return data.access_token;
}

/**
 * Public refresh API with single-flight behavior.
 * Everyone awaits the same in-flight promise.
 */
export async function refreshAccessTokenSingleFlight(options?: { signal?: AbortSignal }): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = performRefresh(options?.signal).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/**
 * Convenience: get a valid access token, refreshing if needed.
 * Preemptive refresh avoids edge-of-expiry 401s and reduces duplicate retries.
 */
export async function getValidAccessToken(options?: { skewMs?: number; signal?: AbortSignal }): Promise<string> {
  const skewMs = options?.skewMs ?? 60_000;
  const tokens = loadTokens();

  if (!tokens) {
    const err: AppError = { kind: "AUTH_REQUIRED", message: "Not logged in." };
    throw err;
  }

  const now = Date.now();
  const fresh = tokens.expiresAtMs - now > skewMs;

  if (fresh) return tokens.accessToken;

  return refreshAccessTokenSingleFlight({ signal: options?.signal });
}
