import { PlaylistCard } from "@/components/PlaylistCard";
import { playlists } from "@/data/playlists";
import { Music } from "lucide-react";

interface SearchViewProps {
  query: string;
}

export function SearchView({ query }: SearchViewProps) {
  const filtered = query.trim()
    ? playlists.filter((pl) =>
        pl.name.toLowerCase().includes(query.toLowerCase()) ||
        pl.owner.toLowerCase().includes(query.toLowerCase())
      )
    : playlists;

  return (
    <div className="fade-in">
      <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">Search</h1>
      <p className="text-sm text-muted-foreground mb-8">Find your playlists, tracks, and more.</p>

      {query.trim() && (
        <p className="text-sm text-muted-foreground mb-4">
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
        </p>
      )}

      {filtered.length > 0 ? (
        <section>
          <h2 className="text-lg font-bold text-foreground mb-4">Playlists</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {filtered.map((pl) => (
              <PlaylistCard key={pl.id} playlist={pl} />
            ))}
          </div>
        </section>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
          <Music className="w-16 h-16 mb-4 opacity-40" />
          <p className="text-lg font-medium">No results found</p>
          <p className="text-sm mt-1">Try a different search term</p>
        </div>
      )}
    </div>
  );
}
