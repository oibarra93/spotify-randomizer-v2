import type { shuffleSource as ShuffleSource, UriFetchProgress } from "./types";

// Define the possible stages a shuffle job can be in.
export type ShuffleJobStage =
  | "init"
  | "fetching_uris"
  | "shuffling"
  | "creating_playlist"
  | "adding_items"
  | "done";

// Union type describing the progress of a shuffle job. Each stage carries the
// data relevant for that phase of the workflow. Note that playlist identifiers
// and URLs use `playListId` and `playListUrl` to match the naming in
// `shuffleSource` and the rest of the shuffle logic.
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
      playListId: string;
      playListUrl?: string;
      added: number;
      total: number;
      batchSize: number;
      batchIndex: number;
      batchesTotal: number;
    }
  | {
      stage: "done";
      source: ShuffleSource;
      playListId: string;
      playListUrl?: string;
      totalAdded: number;
    };

// The result of a completed shuffle job. Mirrors the "done" stage of
// ShuffleJobProgress but omits the source.
export type ShuffleJobResult = {
  playListId: string;
  playListUrl?: string;
  totalAdded: number;
};
