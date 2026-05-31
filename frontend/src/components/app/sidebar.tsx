import { useEffect } from 'react';
import { Contrast, Plus, Trash2 } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/components/theme-provider';
import { useChatStore } from '@/stores/chatStore';
import { useProjectStore } from '@/stores/projectStore';
import { ROLE_CONFIG, ROLES } from '@/lib/roles';

export function AppSidebar() {
  const { theme, setTheme } = useTheme();
  const conversations = useChatStore((s) => s.conversations);
  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const fetchConversations = useChatStore((s) => s.fetchConversations);
  const createConversation = useChatStore((s) => s.createConversation);
  const setActiveConversation = useChatStore((s) => s.setActiveConversation);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  useEffect(() => { fetchConversations(); }, [fetchConversations, activeProjectId]);

  return (
    <TooltipProvider delayDuration={300}>
      <Sidebar>
        <SidebarHeader className="h-12 border-b px-4 flex-row items-center justify-between py-0 gap-0">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-xs font-bold shrink-0">
                AC
              </div>
              <p className="text-sm font-semibold tracking-tight">Agile Court</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
              <Contrast className="h-4 w-4" />
              <span className="sr-only">Toggle theme</span>
            </Button>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Start a conversation</SidebarGroupLabel>
            <SidebarMenu>
              {ROLES.map(([role, cfg]) => (
                <SidebarMenuItem key={role}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <SidebarMenuButton
                        onClick={() => createConversation(role)}
                        className="h-8 group"
                        disabled={activeProjectId === null}
                      >
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${cfg.avatarClass}`}>
                          {cfg.initials}
                        </span>
                        <div className="flex flex-col items-start min-w-0">
                          <span className="text-xs font-medium leading-none">{cfg.name}</span>
                          <span className="text-[10px] text-muted-foreground leading-none mt-0.5">{cfg.sublabel}</span>
                        </div>
                        <Plus className="h-3 w-3 ml-auto shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </SidebarMenuButton>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      {activeProjectId === null ? 'Select a project first' : `New chat with ${cfg.name}`}
                    </TooltipContent>
                  </Tooltip>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>

          <Separator />

          <SidebarGroup>
            <SidebarGroupLabel>History</SidebarGroupLabel>
            <SidebarMenu>
              {conversations.length === 0 ? (
                <p className="text-xs text-muted-foreground px-2 py-2 italic">
                  {activeProjectId === null ? 'Select a project to start' : 'No conversations yet'}
                </p>
              ) : (
                conversations.map((conv) => {
                  const cfg = ROLE_CONFIG[conv.role];
                  return (
                    <SidebarMenuItem key={conv.id}>
                      <SidebarMenuButton
                        isActive={conv.id === activeConversationId}
                        onClick={() => setActiveConversation(conv.id)}
                        className="h-auto py-1 items-center pr-8"
                      >
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${cfg.dotClass}`} />
                        <div className="flex flex-col items-start min-w-0">
                          <span className="text-xs truncate w-full leading-snug">{conv.title}</span>
                          <span className="text-[10px] text-muted-foreground">{cfg.sublabel}</span>
                        </div>
                      </SidebarMenuButton>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <SidebarMenuAction
                            showOnHover
                            onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                            className="top-2 hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </SidebarMenuAction>
                        </TooltipTrigger>
                        <TooltipContent side="right">Delete</TooltipContent>
                      </Tooltip>
                    </SidebarMenuItem>
                  );
                })
              )}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t px-4 py-3">
          <p className="text-xs text-muted-foreground">Your AI Agile team</p>
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  );
}