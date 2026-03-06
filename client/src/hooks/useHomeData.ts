import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { spotifyClient } from "../api/spotify/client";
import type { SimplifiedPlaylist, SpotifyUser } from "../api/spotify/types";
import { toAppError, type AppError } from "../api/errors";

 type HomeDataState = {
  me: SpotifyUser | null;
  likedCount: number | null;

  playlists: SimplifiedPlaylist[];
  playlistsTotal: number | null;

  // Pagination state (offset-based for /me/playlists)
  limit: number;
  offset: number;
  hasMore: boolean;

  loading: boolean;
  loadingMore: boolean;
  error: AppError | null;
 };

 type UseHomeDataOptions = {
  limit?: number; // page size for playlists
 };

 export function useHomeData(options?: UseHomeDataOptions) {
  const limit = options?.limit ?? 24;

  const [state, setState] = useState<HomeDataState>({
    me: null,
    likedCount: null,
    playlists: [],
    playlistsTotal: null,

    limit,
    offset: 0,
    hasMore: true,

    loading: true,
    loadingMore: false,
    error: null,
  });

  // Prevent duplicate fetches (especially useful once we add infinite scroll)
  const inFlightRef = useRef<AbortController | null>(null);

  const abortInFlight = useCallback(() => {
    if (inFlightRef.current) {
      inFlightRef.current.abort();
      inFlightRef.current = null;
    }
  }, []);

  const refresh = useCallback(async () => {
    abortInFlight();
    const ac = new AbortController();
    inFlightRef.current = ac;

    setState((s) => ({
      ...s,
      loading: true,
      error: null,
      offset: 0,
      hasMore: true,
      playlists: [],
      playlistsTotal: null,
    }));

    try {
      // Fetch in parallel for best UX (still small, no premature optimizations)
      const [me, likedCount, playlistsPage] = await Promise.all([
        spotifyClient.getMe(),
        spotifyClient.getLikedTracksCount(),
        spotifyClient.getMyPlaylists({ limit, offset: 0 }),
      ]);

      const items = playlistsPage.items ?? [];
      const total = playlistsPage.total ?? null;
      const nextOffset = items.length;

      setState((s) => ({
        ...s,
        me,
        likedCount,
        playlists: items,
        playlistsTotal: total,
        offset: nextOffset,
        hasMore: playlistsPage.next !== null && items.length > 0,
        loading: false,
        loadingMore: false,
        error: null,
      }));
    } catch (e) {
      setState((s) => ({
        ...s,
        loading: false,
        loadingMore: false,
        error: toAppError(e, "Failed to load home data."),
      }));
    } finally {
      inFlightRef.current = null;
    }
  }, [abortInFlight, limit]);

  const loadMorePlaylists = useCallback(async () => {
    // Guard rails
    setState((s) => {
      if (s.loading || s.loadingMore || !s.hasMore) return s;
      return { ...s, loadingMore: true, error: null };
    });

    // Snapshot current state safely
    const snapshot = ((): { offset: number; playlistsLen: number; hasMore: boolean } => {
      const s = state;
      return { offset: s.offset, playlistsLen: s.playlists.length, hasMore: s.hasMore };
    })();

    if (!snapshot.hasMore) {
      setState((s) => ({ ...s, loadingMore: false }));
      return;
    }

    try {
      const page = await spotifyClient.getMyPlaylists({ limit, offset: snapshot.offset });
      const items = page.items ?? [];

      setState((s) => {
        // If state has moved since we started (rare), append anyway but avoid duplicates by id
        const existingIds = new Set(s.playlists.map((p) => p.id));
        const merged = [...s.playlists];
        for (const it of items) {
          if (!existingIds.has(it.id)) merged.push(it);
        }

        return {
          ...s,
          playlists: merged,
          playlistsTotal: s.playlistsTotal ?? page.total ?? null,
          offset: merged.length,
          hasMore: page.next !== null && items.length > 0,
          loadingMore: false,
        };
      });
    } catch (e) {
      setState((s) => ({
        ...s,
        loadingMore: false,
        error: toAppError(e, "Failed to load more playlists."),
      }));
    }
  }, [limit, state]);

  useEffect(() => {
    void refresh();

    return () => {
      abortInFlight();
    };
  }, [refresh, abortInFlight]);

  const derived = useMemo(() => {
    return {
      me: state.me,
      likedCount: state.likedCount,
      playlists: state.playlists,
      playlistsTotal: state.playlistsTotal,
      hasMore: state.hasMore,
      loading: state.loading,
      loadingMore: state.loadingMore,
      error: state.error,
    };
  }, [state]);

  return {
    ...derived,
    refresh,
    loadMorePlaylists,
  };
 }
