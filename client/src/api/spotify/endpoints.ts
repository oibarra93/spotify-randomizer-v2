// src/api/spotify/endpoints.ts
/**
 * Spotify Web API endpoint adapter.
 *
 * Spotify is actively changing/renaming endpoints (notably Feb 2026).
 * Keep all path decisions in one place so the rest of the app stays stable.
 *
 * References:
 * - Feb 2026 changes: /playlists/{id}/tracks -> /playlists/{id}/items
 * - Create playlist: /users/{user_id}/playlists removed -> /me/playlists
 */

export type SpotifyEndpointMode = "feb-2026" | "legacy";

/**
 * Default to Feb 2026 endpoints.
 * You can force legacy in dev if needed by setting:
 *   VITE_SPOTIFY_ENDPOINT_MODE=legacy
 */
export function getSpotifyEndpointMode(): SpotifyEndpointMode {
  // Vite exposes env vars on import.meta.env
  const raw = (import.meta as any)?.env?.VITE_SPOTIFY_ENDPOINT_MODE as string | undefined;
  return raw === "legacy" ? "legacy" : "feb-2026";
}

export function createPlaylistPath(mode: SpotifyEndpointMode, userId?: string): string {
  if (mode === "legacy") {
    if (!userId) {
      throw new Error("Legacy create playlist requires userId.");
    }
    return `/users/${encodeURIComponent(userId)}/playlists`;
  }
  return "/me/playlists";
}

export function playlistItemsPath(mode: SpotifyEndpointMode, playlistId: string): string {
  const base = `/playlists/${encodeURIComponent(playlistId)}`;
  return mode === "legacy" ? `${base}/tracks` : `${base}/items`;
}
