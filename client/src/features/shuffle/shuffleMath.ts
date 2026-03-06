// src/features/shuffle/shuffleMath.ts

/**
 * Fisher–Yates shuffle with two modes:
 * - crypto-random (default): non-deterministic, high quality randomness
 * - seeded: deterministic shuffle for reproducibility
 */

function hashStringToUint32(input: string): number {
  // FNV-1a 32-bit
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  // Deterministic PRNG returning [0, 1)
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
 test };
}

function cryptoRandomFloat(): number {
  // [0, 1)
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 4294967296;
}

export type ShuffleOptions = {
  seed?: string; // if present -> deterministic shuffle
};

export function shuffleInPlace<T>(arr: T[], opts?: ShuffleOptions): T[] {
  const rand = opts?.seed ? mulberry32(hashStringToUint32(opts.seed)) : cryptoRandomFloat;

  // Fisher–Yates
  for (let i = arr.length - 1; i > 0; i--) {
    const r = rand();
    const j = Math.floor(r * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function shuffledCopy<T>(arr: T[], opts?: ShuffleOptions): T[] {
  const copy = arr.slice();
  return shuffleInPlace(copy, opts);
}
