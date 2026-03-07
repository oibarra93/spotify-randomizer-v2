// src/features/shuffle/types.ts

export type shuffleSource =
  | { kind: "playList"; playListId: string; playListName?: string }
  | { kind: "Liked" };

export type UriFetchStage = "init" | "fetching" | "done";

export type UriFetchProgress = {
  source: shuffleSource;
  stage: UriFetchStage;
  fetched: number;
  collected: number;
  total?: number;
  skippedLocal: number;
  skippedNull: number;
};

export type UriFetchResult = {
  uris: string[];
  total?: number;
  fetched: number;
  collected: number;
  skippedLocal: number;
  skippedNull: number;
};
