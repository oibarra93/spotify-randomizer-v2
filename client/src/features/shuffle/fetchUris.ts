// src/features/shuffle/fetchUris.ts

import { spotifyClient } from "../../api/spotify/client";
import type { shuffleSource as ShuffleSource, UriFetchProgress, UriFetchResult } from "./types";

type CommonOpts = {
  signal?: AbortSignal;
  onProgress?: (p: UriFetchProgress) => void;
  // Optional: pass a market if you want consistent availability filtering
  market?: string;
};

function emit(onProgress: CommonOpts["onProgress"], p: UriFetchProgress) {
  onProgress?.(p);
}

function isSpotifyTrackUri(uri: string): boolean {
  // Spotify track URIs look like: spotify:track:<id>
  return uri.startsWith("spotify:track:");
}

export async function fetchAllPlaylistTrackUris(opts: {
  playlistId: string;
  playlistName?: string;
} & CommonOpts): Promise<UriFetchResult> {
  const { playlistId, playlistName, signal, onProgress, market } = opts;

  const source: ShuffleSource = { kind: "playList", playListId: playlistId, playListName: playlistName };

  let offset = 0;
  const limit = 50; // docs for Get Playlist Items specify max 50

  let total: number | undefined = undefined;
  let fetched = 0;
  let collected = 0;
  let skippedLocal = 0;
  let skippedNull = 0;

  const uris: string[] = [];

  emit(onProgress, { source, stage: "init", fetched, collected, total, skippedLocal, skippedNull });

  // Minimize payload: only grab what we need.
  const fields = "total,limit,offset,next,items(track(uri,is_local))";

  while (true) {
    if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");

    const page = await spotifyClient.getPlaylistItems({
      playlistId,
      limit,
      offset,
      fields,
      additional_types: "track",
      market,
      signal,
    });

    if (total === undefined) total = page.total;

    for (const item of page.items) {
      fetched += 1;

      const t = item.track;
      if (!t || !t.uri) {
        skippedNull += 1;
        continue;
      }

      if (t.is_local) {
        skippedLocal += 1;
        continue;
      }

      if (!isSpotifyTrackUri(t.uri)) {
        skippedNull += 1;
        continue;
      }

      uris.push(t.uri);
      collected += 1;
    }

    emit(onProgress, { source, stage: "fetching", fetched, collected, total, skippedLocal, skippedNull });

    if (!page.next || page.items.length === 0) break;

    offset += page.items.length;
  }

  emit(onProgress, { source, stage: "done", fetched, collected, total, skippedLocal, skippedNull });

  return { uris, total, fetched, collected, skippedLocal, skippedNull };
}

export async function fetchAllLikedTrackUris(opts: CommonOpts): Promise<UriFetchResult> {
  const { signal, onProgress, market } = opts;

  const source: ShuffleSource = { kind: "Liked" };

  let offset = 0;
  const limit = 50; // /me/tracks has historically been max 50; keep safe.
  let total: number | undefined = undefined;

  let fetched = 0;
  let collected = 0;
  let skippedLocal = 0; // liked tracks typically aren't local, but keep counters consistent
  let skippedNull = 0;

  const uris: string[] = [];

  emit(onProgress, { source, stage: "init", fetched, collected, total, skippedLocal, skippedNull });

  while (true) {
    if (signal?.aborted) throw signal.reason ?? new DOMException("Aborted", "AbortError");

    const page = await spotifyClient.getLikedTracksPage({ limit, offset, market, signal });
    if (total === undefined) total = page.total;

    for (const item of page.items) {
      fetched += 1;

      const t = item.track;
      if (!t || !t.uri) {
        skippedNull += 1;
        continue;
      }

      if ((t as any).is_local) {
        skippedLocal += 1;
        continue;
      }

      if (!isSpotifyTrackUri(t.uri)) {
        skippedNull += 1;
        continue;
      }

      uris.push(t.uri);
      collected += 1;
    }

    emit(onProgress, { source, stage: "fetching", fetched, collected, total, skippedLocal, skippedNull });

    if (!page.next || page.items.length === 0) break;

    offset += page.items.length;
  }

  emit(onProgress, { source, stage: "done", fetched, collected, total, skippedLocal, skippedNull });

  return { uris, total, fetched, collected, skippedLocal, skippedNull };
}
