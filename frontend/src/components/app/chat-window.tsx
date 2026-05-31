import { useRef, useEffect, useState } from 'react';
import { Send, Trash2, FolderOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useChatStore } from '@/stores/chatStore';
import { useProjectStore } from '@/stores/projectStore';
import { ROLE_CONFIG, ROLES } from '@/lib/roles';
import { MessageBubble } from './message-bubble';

function NoProjectState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="text-center space-y-4 max-w-xs">
        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-muted mx-auto">
          <FolderOpen className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-1.5">
          <p className="text-sm font-semibold">No project selected</p>
          <p className="text-xs text-muted-foreground">
            Create or select a project using the dropdown above, then start a conversation from the sidebar.
          </p>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-8">
      <div className="text-center space-y-6 max-w-sm">
        <div className="space-y-1.5">
          <p className="text-xl font-semibold tracking-tight">Welcome to Agile Court</p>
          <p className="text-sm text-muted-foreground">
            You're the Developer. Pick a team member from the sidebar to start a conversation.
          </p>
        </div>
        <div className="flex gap-8 justify-center">
          {ROLES.map(([, cfg]) => (
            <div key={cfg.initials} className="flex flex-col items-center gap-2">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-border transition-all ${cfg.avatarClass}`}>
                {cfg.initials}
              </div>
              <div className="text-center">
                <p className="text-xs font-medium">{cfg.name}</p>
                <p className="text-xs text-muted-foreground">{cfg.sublabel}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="flex items-center gap-2.5 py-3 pl-1">
      <div className="flex gap-1">
        {[0, 150, 300].map((delay) => (
          <span
            key={delay}
            className="h-1.5 w-1.5 rounded-full bg-muted-foreground/60 animate-bounce"
            style={{ animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{name}…</span>
    </div>
  );
}

export function ChatWindow() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  const activeConversationId = useChatStore((s) => s.activeConversationId);
  const conversations = useChatStore((s) => s.conversations);
  const messages = useChatStore((s) => s.messages);
  const loading = useChatStore((s) => s.loading);
  const sendMessage = useChatStore((s) => s.sendMessage);
  const deleteConversation = useChatStore((s) => s.deleteConversation);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);

  const activeConv = conversations.find((c) => c.id === activeConversationId);
  const config = activeConv ? ROLE_CONFIG[activeConv.role] : null;

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const content = input.trim();
    setInput('');
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (activeProjectId === null) {
    return (
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <NoProjectState />
      </div>
    );
  }

  if (!activeConversationId) {
    return (
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <EmptyState />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="flex flex-1 flex-col h-full overflow-hidden">
        <header className="flex h-12 items-center justify-between border-b px-4 shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-3">
            {config && (
              <>
                <Avatar className="h-6 w-6">
                  <AvatarFallback className={`text-[10px] font-bold ${config.avatarClass}`}>
                    {config.initials}
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-baseline gap-1.5">
                  <span className={`text-sm font-semibold ${config.color}`}>{config.name}</span>
                  <span className="text-xs text-muted-foreground">{config.sublabel}</span>
                </div>
              </>
            )}
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={() => deleteConversation(activeConversationId)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Delete conversation</TooltipContent>
          </Tooltip>
        </header>

        <ScrollArea className="flex-1 min-h-0 px-4 py-6">
          <div className="max-w-2xl mx-auto space-y-1">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                {config && (
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className={`text-sm font-bold ${config.avatarClass}`}>
                      {config.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div className="text-center space-y-1">
                  <p className="text-sm font-medium">{config?.name ?? 'Your team member'} is ready</p>
                  <p className="text-xs text-muted-foreground">Ask anything as the Developer.</p>
                </div>
              </div>
            )}
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} role={activeConv?.role} />
            ))}
            {loading && <TypingIndicator name={config?.name ?? 'Thinking'} />}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="p-4 shrink-0 bg-background">
          <div className="max-w-2xl mx-auto flex gap-2 items-end">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${config?.name ?? 'your team member'}…`}
              rows={1}
              className="flex-1 min-h-[40px] max-h-32 resize-none rounded-lg border bg-background px-3 py-2.5 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || loading}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-lg"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}
