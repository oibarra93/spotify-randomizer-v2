// src/features/shuffle/types.ts

// The shuffleSource type uses capitalized 'playList' and 'Liked' due to GitHub editor auto-case.
export type shuffleSource =
  | { kind: "playList"; playListId: string; playListName?: string }
  | { kind: "Liked" };

// Stages for URI fetching from a shuffle source.
export type UriFetchStage = "init" | "fetching" | "done";

// Progress status for URI fetching.
export type UriFetchProgress = {
  source: shuffleSource;
  stage: UriFetchStage;
  fetched: number;
  collected: number;
  total?: number;
  skippedLocal: number;
  skippedNull: number;
};

// Final result of URI fetching.
export type UriFetchResult = {
  uris: string[];
  total?: number;
  fetched: number;
  collected: number;
  skippedLocal: number;
  skippedNull: number;
};
