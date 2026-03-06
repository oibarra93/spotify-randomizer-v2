// src/features/shuffle/types.ts

export type ShuffleSource =
  | { kind: "playlist"; playlistId: string; playlistName?: string }
  | { kind: "liked" };
