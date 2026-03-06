// src/api/spotify/types.ts
// Strict types for only what we use (not Spotify's entire schema).

export type SpotifyImage = {
  url: string;
  height: number | null;
  width: number | null;
};

export type SpotifyExternalUrls = {
  spotify?: string;
};

export type SpotifyUser = {
  id: string;
  display_name: string | null;
  images: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
};

export type SpotifyOwner = {
  id: string;
  display_name: string | null;
  external_urls?: SpotifyExternalUrls;
};

export type SimplifiedPlaylist = {
  id: string;
  name: string;
  description: string | null;
  public: boolean | null;
  collaborative: boolean;
  images: SpotifyImage[];
  owner: SpotifyOwner;
  tracks: {
    total: number;
  };
  external_urls?: SpotifyExternalUrls;
};

export type Paging<T> = {
  href: string;
  items: T[];
  limit: number;
  next: string | null;
  offset: number;
  previous: string | null;
  total: number;
};

export type SpotifyArtist = {
  id: string;
  name: string;
};

export type SpotifyAlbum = {
  id: string;
  name: string;
  images: SpotifyImage[];
};

export type SpotifyTrack = {
  id: string | null;
  name: string;
  uri: string | null;
  is_local: boolean;
  artists: SpotifyArtist[];
  album?: SpotifyAlbum;
  duration_ms?: number;
};

export type PlaylistTrackItem = {
  added_at: string | null;
  track: SpotifyTrack | null;
};

/**
 * Both legacy /tracks and Feb-2026 /items return paging of playlist items.
 * Keep the type name stable so the rest of the app doesn't care.
 */
export type PlaylistItemsResponse = Paging<PlaylistTrackItem>;

export type SavedTrackItem = {
  added_at: string;
  track: SpotifyTrack;
};

export type SavedTracksResponse = Paging<SavedTrackItem>;

/**
 * Feb-2026 create playlist (preferred): POST /me/playlists
 */
export type CreatePlaylistMeRequest = {
  name: string;
  description?: string;
  public?: boolean;
};

/**
 * Legacy create playlist (deprecated): POST /users/{user_id}/playlists
 */
export type CreatePlaylistLegacyRequest = {
  userId: string;
  name: string;
  description?: string;
  public?: boolean;
};

export type CreatePlaylistResponse = {
  id: string;
  name: string;
  description: string | null;
  public: boolean | null;
  images: SpotifyImage[];
  external_urls?: SpotifyExternalUrls;
};
