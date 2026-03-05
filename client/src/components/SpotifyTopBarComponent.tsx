import { Search, RefreshCw, User, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SpotifyTopBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  showSearch: boolean;
}

export function SpotifyTopBar({ searchQuery, onSearchChange, onRefresh, showSearch }: SpotifyTopBarProps) {
  return (
    <header className="h-16 flex items-center justify-between px-6 bg-surface sticky top-0 z-10">
      <div className="flex items-center gap-4 flex-1">
        {showSearch && (
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="What do you want to play?"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-surface-hover text-foreground text-sm pl-10 pr-4 py-2.5 rounded-full border-2 border-transparent placeholder:text-muted-foreground focus:outline-none focus:border-foreground/30 transition-all duration-150"
            />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onRefresh}
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-surface-hover transition-colors duration-150"
          title="Refresh"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-8 h-8 rounded-full bg-surface-active flex items-center justify-center hover:scale-105 transition-transform duration-150">
              <User className="w-4 h-4 text-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-surface-hover border-border">
            <DropdownMenuItem className="cursor-pointer gap-2 text-foreground hover:!bg-surface-active">
              <User className="w-4 h-4" />
              Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-border" />
            <DropdownMenuItem className="cursor-pointer gap-2 text-foreground hover:!bg-surface-active">
              <LogOut className="w-4 h-4" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
