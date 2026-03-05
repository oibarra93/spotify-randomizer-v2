import { Heart, Shuffle } from "lucide-react";
import { PlaylistCard } from "@/components/PlaylistCard";
import { playlists, likedSongs } from "@/data/playlists";

export function HomeView() {
  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div className="mb-10">
        <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary mb-2">
          Spotify Randomizer
        </p>
        <h1 className="text-5xl font-extrabold text-foreground tracking-tight leading-tight">
          {greeting()}, Oscar
        </h1>
      </div>

      {/* Liked Songs Hero */}
      <div className="relative mb-12 rounded-xl overflow-hidden bg-gradient-to-r from-indigo-700/40 via-blue-600/20 to-transparent border border-foreground/[0.06] p-6 group cursor-pointer hover:border-foreground/[0.1] transition-all duration-300">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700/20 to-transparent pointer-events-none" />
        <div className="relative flex items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-indigo-600 to-blue-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 flex-shrink-0">
              <Heart className="w-7 h-7 text-foreground fill-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Liked Songs</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {likedSongs.count.toLocaleString()} tracks
              </p>
              <p className="text-xs text-muted-foreground/50 mt-1">
                Creates a new randomized playlist from your liked tracks.
              </p>
            </div>
          </div>
          <button className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-primary-foreground font-bold text-sm hover:scale-105 hover:bg-primary/90 active:scale-95 transition-all duration-150 shadow-lg shadow-primary/25 flex-shrink-0">
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
          {playlists.map((pl) => (
            <PlaylistCard key={pl.id} playlist={pl} />
          ))}
        </div>
      </section>
    </div>
  );
}
