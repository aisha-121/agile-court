import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ThemeProvider } from '@/components/theme-provider';
import { AppSidebar } from '@/components/app/sidebar';
import { ChatWindow } from '@/components/app/chat-window';

function App() {
  return (
    <ThemeProvider defaultTheme="system" storageKey="agile-court-theme">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <ChatWindow />
        </SidebarInset>
      </SidebarProvider>
    </ThemeProvider>
  );
}

export default App;
