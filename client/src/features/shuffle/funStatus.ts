// src/features/shuffle/funStatus.ts

import type { ShuffleJobProgress } from "./jobTypes";

function pickByPercent(pct: number, list: string[]): string {
  const idx = Math.min(list.length - 1, Math.max(0, Math.floor((pct / 100) * list.length)));
  return list[idx];
}

export function getFunStatus(progress: ShuffleJobProgress, progressRatio: number | null): string {
  // progressRatio is [0..1] when known; convert to pct
  const pct = typeof progressRatio === "number" ? Math.round(progressRatio * 100) : null;

  if (progress.stage === "init") {
    return "Warming up the turntables…";
  }

  if (progress.stage === "fetching_uris") {
    // If total unknown, keep it vague + fun
    if (pct === null) return "Digging through crates…";
    return pickByPercent(pct, [
      "Finding the vibes…",
      "Scanning your library…",
      "Dusting off the hidden gems…",
      "Counting beats per minute…",
      "Interviewing the tracks…",
      "Collecting certified bangers…",
    ]);
  }

  if (progress.stage === "shuffling") {
    return "Shuffling like a DJ with a vendetta against predictability…";
  }

  if (progress.stage === "creating_playlist") {
    return "Naming it something legendary…";
  }

  if (progress.stage === "adding_items") {
    if (pct === null) return "Stacking tracks carefully…";

    return pickByPercent(pct, [
      "Loading the first wave…",
      "Dropping tracks into place…",
      "This playlist is becoming self-aware…",
      "Sprinkling chaos (the good kind)…",
      "Almost done—tightening the mix…",
      "Finishing touches… give it a shine…",
    ]);
  }

  if (progress.stage === "done") {
    return "Done! Your randomized masterpiece is ready.";
  }

  return "Working…";
}
