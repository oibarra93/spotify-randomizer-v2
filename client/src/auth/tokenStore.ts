// src/auth/tokenStore.ts

/**
 * Keep token handling small and isolated.
 * No Spotify API calls here.
 *
 * This file supports:
 * - New storage format (spotify_randomizer_tokens_v1)
 * - Legacy storage format (sr_v2_auth) from the existing auth flow
 *
 * If legacy is found, we auto-migrate it into the new format.
 */

export type StoredTokens = {
  accessToken: string;
  refreshToken?: string;
  expiresAtMs: number;
  tokenType?: string; // usually "Bearer"
  scope?: string;
};

type LegacyAuthState = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
  scope?: string;
  token_type?: string;
};

const TOKEN_STORAGE_KEY_V1 = "spotify_randomizer_tokens_v1";
const LEGACY_KEY = "sr_v2_auth";

// Default to localStorage. You can swap to sessionStorage by calling setTokenStorage().
let storage: Pick<Storage, "getItem" | "setItem" | "removeItem"> = window.localStorage;

export function setTokenStorage(next: "localStorage" | "sessionStorage"): void {
  storage = next === "sessionStorage" ? window.sessionStorage : window.localStorage;
}

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function isFiniteNumber(n: unknown): n is number {
  return typeof n === "number" && Number.isFinite(n);
}

function migrateLegacyIfPresent(): StoredTokens | null {
  const rawLegacy = storage.getItem(LEGACY_KEY);
  if (!rawLegacy) return null;

  const legacy = safeJsonParse<Partial<LegacyAuthState>>(rawLegacy);
  if (!legacy || typeof legacy !== "object") return null;

  if (typeof legacy.access_token !== "string" || legacy.access_token.length < 10) return null;
  if (typeof legacy.refresh_token !== "string" || legacy.refresh_token.length < 10) return null;
  if (!isFiniteNumber(legacy.expires_at)) return null;

  const migrated: StoredTokens = {
    accessToken: legacy.access_token,
    refreshToken: legacy.refresh_token,
    expiresAtMs: legacy.expires_at,
    tokenType: typeof legacy.token_type === "string" ? legacy.token_type : undefined,
    scope: typeof legacy.scope === "string" ? legacy.scope : undefined,
  };

  // Write new format so the new API layer can read it.
  saveTokens(migrated);

  return migrated;
}

export function loadTokens(): StoredTokens | null {
  // 1) Try new format first
  const raw = storage.getItem(TOKEN_STORAGE_KEY_V1);
  if (raw) {
    const parsed = safeJsonParse<Partial<StoredTokens>>(raw);
    if (!parsed || typeof parsed !== "object") return null;

    if (typeof parsed.accessToken !== "string" || parsed.accessToken.length < 10) return null;
    if (!isFiniteNumber(parsed.expiresAtMs)) return null;

    return {
      accessToken: parsed.accessToken,
      expiresAtMs: parsed.expiresAtMs,
      refreshToken: typeof parsed.refreshToken === "string" ? parsed.refreshToken : undefined,
      tokenType: typeof parsed.tokenType === "string" ? parsed.tokenType : undefined,
      scope: typeof parsed.scope === "string" ? parsed.scope : undefined,
    };
  }

  // 2) Fall back to legacy + auto-migrate
  return migrateLegacyIfPresent();
}

export function saveTokens(tokens: StoredTokens): void {
  const payload: StoredTokens = {
    accessToken: tokens.accessToken,
    expiresAtMs: tokens.expiresAtMs,
    refreshToken: tokens.refreshToken,
    tokenType: tokens.tokenType,
    scope: tokens.scope,
  };
  storage.setItem(TOKEN_STORAGE_KEY_V1, JSON.stringify(payload));
}

export function clearTokens(): void {
  storage.removeItem(TOKEN_STORAGE_KEY_V1);
  storage.removeItem(LEGACY_KEY);
}

export function getAccessToken(): string | null {
  return loadTokens()?.accessToken ?? null;
}

export function getExpiresAtMs(): number | null {
  return loadTokens()?.expiresAtMs ?? null;
}

export function isAccessTokenFresh(options?: { skewMs?: number }): boolean {
  const skewMs = options?.skewMs ?? 60_000;
  const tokens = loadTokens();
  if (!tokens) return false;

  const now = Date.now();
  return tokens.expiresAtMs - now > skewMs;
}

/**
 * Helper to compute expiresAtMs from expires_in seconds
 */
export function computeExpiresAtMs(expiresInSec: number): number {
  const safetyMs = 5_000;
  return Date.now() + Math.max(0, expiresInSec * 1000 - safetyMs);
}
