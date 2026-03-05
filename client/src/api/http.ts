// src/api/http.ts
//
// Compatibility shim.
//
// If older code imports from "src/api/http", keep it working,
// but the real implementation lives in:
//   src/api/spotify/http.ts
//
// New code should import from "src/api/spotify/http".

export { spotifyRequest } from "./spotify/http";
export type { SpotifyRequestInit } from "./spotify/http";
