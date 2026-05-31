import { useEffect } from 'react';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { AppSidebar } from '@/components/app/sidebar';
import { ChatWindow } from '@/components/app/chat-window';
import { ProjectSelector } from '@/components/app/project-selector';
import { ProjectPanel } from '@/components/app/project-panel';
import { useProjectStore } from '@/stores/projectStore';

function App() {
  const fetchProjects = useProjectStore((s) => s.fetchProjects);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  return (
    <ThemeProvider defaultTheme="system" storageKey="agile-court-theme">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="flex flex-col h-screen overflow-hidden">
          {/* TopBar */}
          <header className="flex h-12 items-center gap-2 border-b px-4 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <SidebarTrigger className="-ml-1" />
            <ProjectSelector />
          </header>

            <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 overflow-hidden">
              <ChatWindow />
            </div>
            <ProjectPanel />
          </div>
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
