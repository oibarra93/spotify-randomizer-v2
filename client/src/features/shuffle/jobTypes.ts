// src/features/shuffle/jobTypes.ts

import type { ShuffleSource, UriFetchProgress } from "./types";

export type ShuffleJobStage =
  | "init"
  | "fetching_uris"
  | "shuffling"
  | "creating_playlist"
  | "adding_items"
  | "done";

export type ShuffleJobProgress =
  | {
      stage: "init";
      source: ShuffleSource;
    }
  | {
      stage: "fetching_uris";
      source: ShuffleSource;
      fetch: UriFetchProgress;
    }
  | {
      stage: "shuffling";
      source: ShuffleSource;
      totalUris: number;
      seed?: string;
    }
  | {
      stage: "creating_playlist";
      source: ShuffleSource;
      name: string;
    }
  | {
      stage: "adding_items";
      source: ShuffleSource;
      playlistId: string;
      playlistUrl?: string;
      added: number;
      total: number;
      batchSize: number;
      batchIndex: number;
      batchesTotal: number;
    }
  | {
      stage: "done";
      source: ShuffleSource;
      playlistId: string;
      playlistUrl?: string;
      totalAdded: number;
    };

export type ShuffleJobResult = {
  playlistId: string;
  playlistUrl?: string;
  totalAdded: number;
};
