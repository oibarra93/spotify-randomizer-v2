import { useEffect, useState } from "react";
import { spotifyClient } from "../api/spotify/client";
import type { SpotifyUser } from "../api/spotify/types";
import { toAppError, type AppError } from "../api/errors";

export function useSpotifyMe() {
  const [me, setMe] = useState<SpotifyUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);

        const data = await spotifyClient.getMe();
        if (!cancelled) setMe(data);
      } catch (e) {
        if (!cancelled) setError(toAppError(e, "Failed to load profile."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return { me, loading, error };
}
