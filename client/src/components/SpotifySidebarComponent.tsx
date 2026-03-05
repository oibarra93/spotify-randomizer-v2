import { Home, Search, Library, Heart } from "lucide-react";
import { playlists, likedSongs } from "@/data/playlists";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface SpotifySidebarProps {
  activeView: "home" | "search";
  onNavigate: (view: "home" | "search") => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const PlaylistMosaic = ({ colors }: { colors: string[] }) => (
  <div className="w-10 h-10 rounded grid grid-cols-2 grid-rows-2 overflow-hidden flex-shrink-0">
    {colors.map((c, i) => (
      <div key={i} style={{ backgroundColor: c }} />
    ))}
  </div>
);

const SidebarTooltip = ({ label, children, show }: { label: string; children: React.ReactNode; show: boolean }) => {
  if (!show) return <>{children}</>;
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="right" className="bg-surface-hover text-foreground border-border text-xs">
        {label}
      </TooltipContent>
    </Tooltip>
  );
};

export function SpotifySidebar({ activeView, onNavigate, collapsed, onToggleCollapse }: SpotifySidebarProps) {
  return (
    <aside
      className={cn(
        "flex-shrink-0 flex flex-col h-screen bg-background transition-all duration-200 ease-in-out",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Main Nav */}
      <div className="p-2 pb-1">
        <nav className="flex flex-col gap-0.5">
          <SidebarTooltip label="Home" show={collapsed}>
            <button
              onClick={() => onNavigate("home")}
              className={cn(
                "flex items-center gap-4 rounded-md text-sm font-semibold transition-colors duration-150",
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                activeView === "home"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Home className="w-6 h-6 flex-shrink-0" />
              {!collapsed && "Home"}
            </button>
          </SidebarTooltip>
          <SidebarTooltip label="Search" show={collapsed}>
            <button
              onClick={() => onNavigate("search")}
              className={cn(
                "flex items-center gap-4 rounded-md text-sm font-semibold transition-colors duration-150",
                collapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5",
                activeView === "search"
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Search className="w-6 h-6 flex-shrink-0" />
              {!collapsed && "Search"}
            </button>
          </SidebarTooltip>
        </nav>
      </div>

      {/* Library */}
      <div className="flex-1 flex flex-col mt-2 bg-surface rounded-lg mx-2 mb-2 overflow-hidden">
        <SidebarTooltip label={collapsed ? "Expand library" : "Collapse library"} show={collapsed}>
          <button
            onClick={onToggleCollapse}
            className={cn(
              "flex items-center gap-3 px-3 py-3 w-full text-muted-foreground hover:text-foreground transition-colors duration-150",
              collapsed ? "justify-center" : ""
            )}
          >
            <Library className="w-6 h-6 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm font-semibold">Your Library</span>
            )}
          </button>
        </SidebarTooltip>

        {collapsed ? (
          <div className="flex-1 overflow-y-auto px-1 pb-2 flex flex-col items-center gap-1">
            <SidebarTooltip label={`Liked Songs · ${likedSongs.count} songs`} show>
              <button
                className="w-10 h-10 rounded bg-gradient-to-br from-indigo-700 to-blue-300 flex items-center justify-center flex-shrink-0 hover:scale-105 transition-transform duration-150"
              >
                <Heart className="w-4 h-4 text-foreground fill-foreground" />
              </button>
            </SidebarTooltip>
            {playlists.map((pl) => (
              <SidebarTooltip key={pl.id} label={`${pl.name} · ${pl.trackCount} tracks`} show>
                <button
                  className="hover:scale-105 transition-transform duration-150"
                >
                  <PlaylistMosaic colors={pl.coverColors} />
                </button>
              </SidebarTooltip>
            ))}
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-2 pb-2">
            {/* Liked Songs - full width clickable row */}
            <button className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-surface-hover transition-colors duration-150 group">
              <div className="w-12 h-12 rounded bg-gradient-to-br from-indigo-700 to-blue-300 flex items-center justify-center flex-shrink-0">
                <Heart className="w-5 h-5 text-foreground fill-foreground" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-medium text-foreground truncate">Liked Songs</p>
                <p className="text-xs text-muted-foreground/70 truncate">Playlist · {likedSongs.count} songs</p>
              </div>
            </button>

            {playlists.map((pl) => (
              <button
                key={pl.id}
                className="w-full flex items-center gap-3 px-2 py-2 rounded-md hover:bg-surface-hover transition-colors duration-150 group"
              >
                <PlaylistMosaic colors={pl.coverColors} />
                <div className="text-left min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{pl.name}</p>
                  <p className="text-xs text-muted-foreground/70 truncate">Playlist · {pl.owner}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}
