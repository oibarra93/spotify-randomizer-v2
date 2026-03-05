// src/api/spotify/queue.ts

import type { AppError } from "../errors";
import { spotifyRequest, type SpotifyRequestInit } from "./http";

/**
 * A tiny single-concurrency queue for Spotify API calls.
 * Designed for long-running operations (shuffle/create playlist, batch adds)
 * while respecting Spotify rate limits and transient failures.
 *
 * Policy:
 * - Concurrency: 1 (serialize calls)
 * - Pacing: minDelayMs between *all* queued calls
 * - 429: wait Retry-After (sec) then retry (with jitter)
 * - 5xx/Network: exponential backoff retry
 */

type QueueConfig = {
  minDelayMs: number;
  maxRetries429: number;
  maxRetriesTransient: number;
  baseBackoffMs: number;
  maxBackoffMs: number;
  jitterMs: number;
};

function envNumber(key: string, fallback: number): number {
  const raw = (import.meta as any)?.env?.[key];
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

function getDefaultConfig(): QueueConfig {
  return {
    // Conservative defaults that keep you out of trouble in prod.
    // You can tune via env without code changes.
    minDelayMs: envNumber("VITE_SPOTIFY_QUEUE_MIN_DELAY_MS", 200),
    maxRetries429: envNumber("VITE_SPOTIFY_QUEUE_MAX_RETRIES_429", 8),
    maxRetriesTransient: envNumber("VITE_SPOTIFY_QUEUE_MAX_RETRIES_TRANSIENT", 4),
    baseBackoffMs: envNumber("VITE_SPOTIFY_QUEUE_BASE_BACKOFF_MS", 500),
    maxBackoffMs: envNumber("VITE_SPOTIFY_QUEUE_MAX_BACKOFF_MS", 15000),
    jitterMs: envNumber("VITE_SPOTIFY_QUEUE_JITTER_MS", 120),
  };
}

function jitter(ms: number): number {
  const j = Math.floor(Math.random() * ms);
  return j;
}

function sleep(ms: number, signal?: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();

  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason ?? new DOMException("Aborted", "AbortError"));
      return;
    }

    const id = setTimeout(() => {
      cleanup();
      resolve();
    }, ms);

    const onAbort = () => {
      cleanup();
      reject(signal?.reason ?? new DOMException("Aborted", "AbortError"));
    };

    const cleanup = () => {
      clearTimeout(id);
      signal?.removeEventListener("abort", onAbort);
    };

    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

function isAppError(e: unknown): e is AppError {
  return typeof e === "object" && e !== null && "kind" in e && "message" in e;
}

function isTransient(err: AppError): boolean {
  // Network errors are transient. Spotify 5xx are transient.
  if (err.kind === "NETWORK_ERROR") return true;
  if (typeof err.status === "number" && err.status >= 500) return true;
  return false;
}

export class SpotifyQueue {
  private config: QueueConfig;
  private chain: Promise<void> = Promise.resolve();
  private lastRunAt = 0;

  constructor(config?: Partial<QueueConfig>) {
    this.config = { ...getDefaultConfig(), ...(config ?? {}) };
  }

  /**
   * Enqueue an arbitrary async function.
   */
  enqueue<T>(fn: () => Promise<T>, signal?: AbortSignal): Promise<T> {
    // Ensure tasks execute sequentially by chaining them.
    const run = async (): Promise<T> => {
      // Pacing: enforce min delay since last start.
      const now = Date.now();
      const nextAllowed = this.lastRunAt + this.config.minDelayMs;
      const waitMs = Math.max(0, nextAllowed - now);
      if (waitMs > 0) await sleep(waitMs, signal);

      this.lastRunAt = Date.now();
      return fn();
    };

    const resultPromise = this.chain.then(run, run);

    // Keep the chain alive even if a task fails (so future tasks still run).
    this.chain = resultPromise.then(
      () => undefined,
      () => undefined
    );

    return resultPromise;
  }

  /**
   * Enqueue a Spotify request with rate-limit + transient retries.
   */
  request<T>(init: SpotifyRequestInit): Promise<T> {
    const signal = init.signal;

    return this.enqueue(async () => {
      // Retry loop for a single queued request.
      let tries429 = 0;
      let triesTransient = 0;

      // eslint-disable-next-line no-constant-condition
      while (true) {
        if (signal?.aborted) {
          throw signal.reason ?? new DOMException("Aborted", "AbortError");
        }

        try {
          return await spotifyRequest<T>(init);
        } catch (e) {
          if (!isAppError(e)) throw e;

          // 429 rate limit: obey Retry-After if present.
          if (e.kind === "RATE_LIMITED") {
            if (tries429 >= this.config.maxRetries429) throw e;
            tries429 += 1;

            const retrySec = e.retryAfterSec;
            // Fallback if header missing: small escalating wait
            const baseMs = retrySec ? retrySec * 1000 : 1000 * tries429;
            const waitMs = baseMs + jitter(this.config.jitterMs);
            await sleep(waitMs, signal);
            continue;
          }

          // Transient errors: exponential backoff
          if (isTransient(e)) {
            if (triesTransient >= this.config.maxRetriesTransient) throw e;
            triesTransient += 1;

            const exp = Math.min(
              this.config.maxBackoffMs,
              this.config.baseBackoffMs * 2 ** (triesTransient - 1)
            );
            const waitMs = exp + jitter(this.config.jitterMs);
            await sleep(waitMs, signal);
            continue;
          }

          // Non-retryable (4xx other than 429, etc.)
          throw e;
        }
      }
    }, signal);
  }
}

/**
 * Singleton queue instance (use this everywhere).
 */
export const spotifyQueue = new SpotifyQueue();
