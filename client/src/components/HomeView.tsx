import { Heart, Shuffle } from "lucide-react";
import { useHomeData } from "@/hooks/useHomeData";
import { useShuffleJob } from "@/hooks/useShuffleJob";
import { useIntersectionSentinel } from "@/hooks/useIntersectionSentinel";
import { useSessionGuard } from "@/hooks/useSessionGuard";
import { PlaylistCard } from "@/components/PlaylistCard";
import { hashStringToUint32, mulberry32 } from "@/features/shuffle/shuffleMath";

// Helper type describing the props consumed by PlaylistCard.  We re‑use the
// existing PlaylistCard component by transforming the Spotify data into this
// shape.  The PlaylistCard definition lives under `client/src/components/PlaylistCard.tsx`.
export interface PlaylistCardProps {
  id: string;
  name: string;
  owner: string;
  trackCount: number;
  coverColors: [string, string, string, string];
}

/**
 * HomeView renders the landing page of the application.  It fetches the
 * current user's profile, liked song count and playlists via `useHomeData`,
 * exposes shuffle actions via `useShuffleJob` and implements infinite
 * scrolling through `useIntersectionSentinel`.  When a shuffle is in
 * progress it displays a progress banner at the bottom of the screen.  Once
 * complete the banner links directly to the newly created playlist.
 */
export function HomeView() {
  // Redirect unauthenticated users to login.  If the auth token is expired
  // or missing, useSessionGuard will navigate to the login page.  This has
  // no effect for authenticated sessions.
  useSessionGuard();

  const {
    me,
    likedCount,
    playlists,
    hasMore,
    loading,
    loadingMore,
    error,
    refresh,
    loadMorePlaylists,
  } = useHomeData();

  const {
    state: shuffleState,
    running: shuffleRunning,
    jobSummary,
    progressRatio,
    startLiked,
    startPlaylist,
    cancel,
    reset,
  } = useShuffleJob();

  // Set up infinite scroll sentinel.  It fires loadMorePlaylists when the
  // sentinel element enters the viewport.  Disabled while the initial load
  // or subsequent loads are in flight, or when no more pages exist.
  const sentinelRef = useIntersectionSentinel({
    enabled: !loading && !loadingMore && hasMore,
    onIntersect: loadMorePlaylists,
  });

  // Generate a friendly greeting based on the current hour.
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  // Convert Spotify playlists into the data structure expected by PlaylistCard.
  // A deterministic colour palette is generated from the playlist id via
  // mulberry32 seeded PRNG.  This preserves the mosaic style without
  // requiring actual artwork.
  const mapToCard = (p: (typeof playlists)[number]): PlaylistCardProps => {
    const seed = hashStringToUint32(p.id);
    const rand = mulberry32(seed);
    const colors: string[] = [];
    for (let i = 0; i < 4; i++) {
      const h = Math.floor(rand() * 360);
      const s = Math.floor(rand() * 40) + 60; // 60–100% saturation
      const l = Math.floor(rand() * 40) + 40; // 40–80% lightness
      colors.push(`hsl(${h}, ${s}%, ${l}%)`);
    }
    return {
      id: p.id,
      name: p.name,
      owner: p.owner.display_name ?? p.owner.id,
      trackCount: p.tracks.total,
      coverColors: colors as [string, string, string, string],
    };
  };

  const cardPlaylists: PlaylistCardProps[] = playlists.map(mapToCard);

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary mb-2">
          Spotify Randomizer
        </p>
        <h1 className="text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          {greeting()}, {me?.display_name ?? ''}
        </h1>
      </div>

      {/* Liked Songs Hero */}
      <div
        className="relative mb-12 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-700/40 via-blue-600/20 to-transparent border border-foreground/[0.06] p-6 group cursor-pointer hover:border-foreground/[0.1] transition-all duration-300"
        onClick={() => startLiked()}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/20 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Heart className="w-7 h-7 text-foreground fill-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Liked Songs</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {typeof likedCount === 'number' ? likedCount.toLocaleString() : '…'} tracks
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Creates a new randomized playlist from your liked tracks.
              </p>
            </div>
          </div>
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:scale-105 hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/25 flex-shrink-0"
            onClick={(e) => {
              e.stopPropagation();
              startLiked();
            }}
            disabled={shuffleRunning}
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
        </div>
      </div>

      {/* Playlists Grid */}
      <section>
        <div className="flex items-baseline justify-between mb-5">
          <h2 className="text-xl font-bold text-foreground">Your Playlists</h2>
          <p className="text-xs text-muted-foreground/60">
            Tap a playlist to create a new randomized playlist.
          </p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
          {cardPlaylists.map((pl) => (
            <PlaylistCard
              key={pl.id}
              playlist={pl}
              onShuffle={() => startPlaylist({ id: pl.id, name: pl.name } as any)}
            />
          ))}
        </div>
        {/* Sentinel for infinite scroll */}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </section>

      {/* Shuffle progress/status banner */}
      {shuffleState.status === 'running' && (
        <div className="fixed inset-x-0 bottom-4 px-4 sm:px-6 md:px-8">
          <div className="bg-surface-elevated border border-foreground/[0.08] rounded-xl p-4 shadow-lg flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{jobSummary}</p>
              {progressRatio != null && (
                <div className="mt-2 w-full bg-muted/20 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-full transition-all duration-200"
                    style={{ width: `${progressRatio * 100}%` }}
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => cancel()}
              className="text-sm font-medium text-primary hover:underline"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      {shuffleState.status === 'done' && (
        <div className="fixed inset-x-0 bottom-4 px-4 sm:px-6 md:px-8">
          <div className="bg-surface-elevated border border-foreground/[0.08] rounded-xl p-4 shadow-lg flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                Done! Your randomized playlist is ready.
              </p>
            </div>
            <a
              href={(shuffleState as any).result.playListUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-primary hover:underline"
            >
              Open
            </a>
            <button
              onClick={() => reset()}
              className="text-sm font-medium text-muted-foreground hover:underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      {shuffleState.status === 'error' && (
        <div className="fixed inset-x-0 bottom-4 px-4 sm:px-6 md:px-8">
          <div className="bg-destructive/90 text-destructive-foreground rounded-xl p-4 shadow-lg flex items-center gap-4">
            <div className="flex-1">
              <p className="text-sm font-medium">
                {(shuffleState as any).message}
              </p>
            </div>
            <button
              onClick={() => reset()}
              className="text-sm font-medium hover:underline"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
