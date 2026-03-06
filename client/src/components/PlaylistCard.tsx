import { Shuffle } from "lucide-react";

// We import Playlist type from the data module only for its shape.  This
// allows the card to be reused for both static demo data and the runtime
// playlists built from Spotify.  Consumers can still pass a playlist-like
// object that matches the expected fields.
import type { Playlist } from "@/data/playlists";

/**
 * Props accepted by the PlaylistCard.  An optional onShuffle handler can
 * be supplied which will be invoked when the shuffle button is clicked.
 */
export type PlaylistCardProps = {
  playlist: Playlist;
  onShuffle?: (playlist: Playlist) => void;
};

const PlaylistMosaic = ({ colors }: { colors: string[] }) => (
  <div className="w-full aspect-square rounded-md grid grid-cols-2 grid-rows-2 overflow-hidden shadow-lg">
    {colors.map((c, i) => (
      <div key={i} style={{ backgroundColor: c }} />
    ))}
  </div>
);

/**
 * PlaylistCard renders a single playlist tile.  It shows a colourful mosaic
 * derived from the playlist data and exposes a shuffle button.  When
 * onShuffle is provided the handler is invoked with the playlist; this
 * allows parent components to trigger the shuffle job.
 */
export function PlaylistCard({ playlist, onShuffle }: PlaylistCardProps) {
  return (
    <div className="group p-4 rounded-lg bg-surface-elevated hover:bg-surface-hover transition-all duration-200 cursor-pointer relative">
      <div className="relative mb-4">
        <PlaylistMosaic colors={playlist.coverColors} />
        {/* Shuffle button revealed on hover */}
        <button
          className="absolute bottom-2 right-2 w-11 h-11 bg-primary rounded-full flex items-center justify-center shadow-xl shadow-primary/30 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 hover:scale-110 active:scale-95"
          title={`Shuffle ${playlist.name}`}
          onClick={(e) => {
            // Prevent card click if parent handles that separately
            e.stopPropagation();
            onShuffle?.(playlist);
          }}
        >
          <Shuffle className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>
      <h3 className="text-sm font-semibold text-foreground truncate mb-1">{playlist.name}</h3>
      <p className="text-xs text-muted-foreground/70 truncate">Playlist · {playlist.owner}</p>
      <p className="text-xs text-muted-foreground/50 mt-0.5">{playlist.trackCount} tracks</p>
    </div>
  );
}
