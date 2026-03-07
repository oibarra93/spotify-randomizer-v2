import { spotifyClient } from "../../api/spotify/client";
import type { shuffleSource } from "./types";
import { fetchAllLikedTrackUris, fetchAllPlaylistTrackUris } from "./fetchUris";
import { shuffledCopy } from "./shuffleMath";
import type { ShuffleJobProgress, ShuffleJobResult } from "./jobTypes";

/**
 * Spotify batch limits:
 * - Add items to playlist: max 100 URIs per request
 * - Replace items in playlist: max 100 URIs per request
 */
const MAX_URIS_PER_WRITE = 100;

export type CreateRandomizedOptions = {
  source: shuffleSource;
  // Playlist naming
  name: string;
  description?: string;
  public?: boolean;
  // Shuffle behavior
  seed?: string;
  // Optional market for fetch consistency
  market?: string;
  // Cancellation
  signal?: AbortSignal;
  // Progress events
  onProgress?: (p: ShuffleJobProgress) => void;
};

function emit(onProgress: CreateRandomizedOptions["onProgress"], p: ShuffleJobProgress) {
  onProgress?.(p);
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export async function createRandomizedPlaylist(opts: CreateRandomizedOptions): Promise<ShuffleJobResult> {
  const {
    source,
    name,
    description,
    public: isPublic,
    seed,
    market,
    signal,
    onProgress,
  } = opts;

  if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");

  emit(onProgress, { stage: "init", source });

  // 1) Fetch URIs
  let fetchResult;
  if (source.kind === "Liked") {
    fetchResult = await fetchAllLikedTrackUris({
      signal,
      market,
      onProgress: (f) => emit(onProgress, { stage: "fetching_uris", source, fetch: f }),
    });
  } else {
    fetchResult = await fetchAllPlaylistTrackUris({
      playListId: source.playListId,
      playListName: source.playListName,
      signal,
      market,
      onProgress: (f) => emit(onProgress, { stage: "fetching_uris", source, fetch: f }),
    });
  }

  const uris = fetchResult.uris;
  if (uris.length === 0) {
    // Keep it explicit; UI can show a friendly message.
    throw new Error("No playable track URIs found to shuffle.");
  }

  // 2) Shuffle
  emit(onProgress, { stage: "shuffling", source, totalUris: uris.length, seed });
  const shuffled = shuffledCopy(uris, seed ? { seed } : undefined);

  if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");

  // 3) Create target playlist
  emit(onProgress, { stage: "creating_playlist", source, name });
  const created = await spotifyClient.createPlaylist({
    name,
    description: description ?? "",
    public: isPublic ?? false,
    signal,
  });

  const playListId = created.id;
  const playListUrl = created.external_urls?.spotify;

  // 4) Add items in batches of 100
  const batches = chunk(shuffled, MAX_URIS_PER_WRITE);
  let added = 0;

  for (let i = 0; i < batches.length; i++) {
    if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");
    const batch = batches[i];
    // Add batch
    await spotifyClient.addPlaylistItems({
      playlistId: playListId,
      uris: batch,
      signal,
    });
    added += batch.length;
    emit(onProgress, {
      stage: "adding_items",
      source,
      playListId,
      playListUrl,
      added,
      total: shuffled.length,
      batchSize: batch.length,
      batchIndex: i + 1,
      batchesTotal: batches.length,
    });
  }

  emit(onProgress, { stage: "done", source, playListId, playListUrl, totalAdded: added });
  return { playListId, playListUrl, totalAdded: added };
}
