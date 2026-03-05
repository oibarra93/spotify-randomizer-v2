// src/api/spotify/client.ts

import { spotifyRequest } from "./http";
import { spotifyQueue } from "./queue";
import { getSpotifyEndpointMode, createPlaylistPath, playlistItemsPath } from "./endpoints";
import type {
  SpotifyUser,
  Paging,
  SimplifiedPlaylist,
  PlaylistItemsResponse,
  SavedTracksResponse,
  CreatePlaylistMeRequest,
  CreatePlaylistLegacyRequest,
  CreatePlaylistResponse,
} from "./types";

/**
 * Strongly-typed Spotify client.
 * Reads can go direct; writes go through spotifyQueue by default.
 */
export const spotifyClient = {
  async getMe(): Promise<SpotifyUser> {
    return spotifyRequest<SpotifyUser>({ path: "/me" });
  },

  async getMyPlaylists(params?: { limit?: number; offset?: number }): Promise<Paging<SimplifiedPlaylist>> {
    return spotifyRequest<Paging<SimplifiedPlaylist>>({
      path: "/me/playlists",
      query: {
        limit: params?.limit ?? 20,
        offset: params?.offset ?? 0,
      },
    });
  },

  async getLikedTracksCount(): Promise<number> {
    const res = await spotifyRequest<{ total: number }>({
      path: "/me/tracks",
      query: { limit: 1, offset: 0 },
    });
    return res.total;
  },

  /**
   * Paged read of Liked Songs.
   * Note: /me/tracks has historically used max limit=50, so callers should use 50.
   */
  async getLikedTracksPage(params: {
    limit?: number;
    offset?: number;
    market?: string;
    signal?: AbortSignal;
  }): Promise<SavedTracksResponse> {
    const { limit = 50, offset = 0, market, signal } = params;

    return spotifyRequest<SavedTracksResponse>({
      path: "/me/tracks",
      query: {
        limit,
        offset,
        ...(market ? { market } : {}),
      },
      signal,
    });
  },

  /**
   * Playlist items (Feb 2026: /items, legacy: /tracks).
   * Docs show max limit=50 for /items. Use 50 in callers for safety.
   */
  async getPlaylistItems(params: {
    playlistId: string;
    limit?: number;
    offset?: number;
    fields?: string;
    additional_types?: string;
    market?: string;
    signal?: AbortSignal;
  }): Promise<PlaylistItemsResponse> {
    const { playlistId, limit = 50, offset = 0, fields, additional_types, market, signal } = params;
    const mode = getSpotifyEndpointMode();

    return spotifyRequest<PlaylistItemsResponse>({
      path: playlistItemsPath(mode, playlistId),
      query: {
        limit,
        offset,
        ...(fields ? { fields } : {}),
        ...(additional_types ? { additional_types } : {}),
        ...(market ? { market } : {}),
      },
      signal,
    });
  },

  /**
   * @deprecated Use getPlaylistItems()
   */
  async getPlaylistTracks(params: {
    playlistId: string;
    limit?: number;
    offset?: number;
    fields?: string;
    additional_types?: string;
    market?: string;
    signal?: AbortSignal;
  }): Promise<PlaylistItemsResponse> {
    return spotifyClient.getPlaylistItems(params);
  },

  /**
   * Create playlist (preferred): POST /me/playlists (Feb 2026+)
   * Queued because it's a write.
   */
  async createPlaylist(input: CreatePlaylistMeRequest & { signal?: AbortSignal }): Promise<CreatePlaylistResponse> {
    const { name, description, public: isPublic, signal } = input;
    const mode = getSpotifyEndpointMode();

    return spotifyQueue.request<CreatePlaylistResponse>({
      path: createPlaylistPath(mode),
      method: "POST",
      body: {
        name,
        description: description ?? "",
        public: isPublic ?? false,
      },
      signal,
    });
  },

  /**
   * @deprecated Legacy create playlist: POST /users/{user_id}/playlists
   */
  async createPlaylistLegacy(
    input: CreatePlaylistLegacyRequest & { signal?: AbortSignal }
  ): Promise<CreatePlaylistResponse> {
    const { userId, name, description, public: isPublic, signal } = input;

    return spotifyQueue.request<CreatePlaylistResponse>({
      path: createPlaylistPath("legacy", userId),
      method: "POST",
      body: {
        name,
        description: description ?? "",
        public: isPublic ?? false,
      },
      signal,
    });
  },

  /**
   * Replace all items in playlist (queued write).
   */
  async replacePlaylistItems(params: { playlistId: string; uris: string[]; signal?: AbortSignal }): Promise<void> {
    const { playlistId, uris, signal } = params;
    const mode = getSpotifyEndpointMode();

    await spotifyQueue.request<{ snapshot_id: string }>({
      path: playlistItemsPath(mode, playlistId),
      method: "PUT",
      body: { uris },
      signal,
    });
  },

  /**
   * Add items to playlist (queued write).
   */
  async addPlaylistItems(params: { playlistId: string; uris: string[]; signal?: AbortSignal }): Promise<void> {
    const { playlistId, uris, signal } = params;
    const mode = getSpotifyEndpointMode();

    await spotifyQueue.request<{ snapshot_id: string }>({
      path: playlistItemsPath(mode, playlistId),
      method: "POST",
      body: { uris },
      signal,
    });
  },

  async clearPlaylist(params: { playlistId: string; signal?: AbortSignal }): Promise<void> {
    const { playlistId, signal } = params;
    await spotifyClient.replacePlaylistItems({ playlistId, uris: [], signal });
  },
};
