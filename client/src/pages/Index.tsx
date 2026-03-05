import { useState } from "react";
import { SpotifySidebar } from "@/components/SpotifySidebarComponent";
import { SpotifyTopBar } from "@/components/SpotifyTopBarComponent";
import { HomeView } from "@/components/HomeView";
import { SearchView } from "@/components/SearchView";

const Index = () => {
  const [activeView, setActiveView] = useState<"home" | "search">("home");
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const handleRefresh = () => {
    // TODO: Add refresh logic (e.g., reload data)
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <SpotifySidebar
        activeView={activeView}
        onNavigate={setActiveView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <div className="flex-1 flex flex-col overflow-hidden rounded-lg m-2 ml-0 bg-surface">
        <SpotifyTopBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRefresh={handleRefresh}
          showSearch={activeView === "search"}
        />

        <main className="flex-1 overflow-y-auto">
          <div className="spotify-gradient">
            <div className="max-w-[1400px] mx-auto px-6 py-6">
              {activeView === "home" ? (
                <HomeView />
              ) : (
                <SearchView query={searchQuery} />
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Index;
