import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStore } from '@/stores/chatStore';
import { ROLE_CONFIG, ROLES } from '@/lib/roles';
import { PerspectiveFlip } from './perspective-flip';
import type { Role, Message } from '@/types';

interface MessageBubbleProps {
  message: Message;
  role?: Role;
}

export function MessageBubble({ message, role }: MessageBubbleProps) {
  const [showFlip, setShowFlip] = useState(false);
  const flipPerspective = useChatStore((s) => s.flipPerspective);

  if (message.sender === 'user') {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[78%] bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  const config = role ? ROLE_CONFIG[role] : null;
  const otherRoles = ROLES.filter(([r]) => r !== role);

  return (
    <>
      <div className="flex justify-start mb-3">
        <div className="flex gap-2.5 max-w-[85%]">
          {config && (
            <Avatar className="h-7 w-7 shrink-0 mt-0.5">
              <AvatarFallback className={`text-[10px] font-bold ${config.avatarClass}`}>
                {config.initials}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="flex-1 min-w-0">
            {config && (
              <p className={`text-xs font-semibold mb-1 ${config.color}`}>{config.name}</p>
            )}
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm text-sm ${config?.bubbleClass ?? 'bg-muted/50 border'}`}>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">{message.content}</p>
            </div>
            {otherRoles.length > 0 && (
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[10px] text-muted-foreground mr-0.5">Get take from:</span>
                <TooltipProvider>
                  {otherRoles.map(([targetRole, cfg]) => (
                    <Tooltip key={targetRole}>
                      <TooltipTrigger asChild>
                        <button
                          className={`inline-flex items-center gap-1 h-5 px-1.5 rounded-full text-[10px] font-semibold border border-transparent transition-opacity hover:opacity-80 ${cfg.avatarClass}`}
                          onClick={() => { flipPerspective(message.content, targetRole); setShowFlip(true); }}
                        >
                          <RefreshCw className="h-2 w-2" />
                          {cfg.initials}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{cfg.name}'s perspective</TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>
              </div>
            )}
          </div>
        </div>
      </div>
      <PerspectiveFlip open={showFlip} onOpenChange={setShowFlip} />
    </>
  );
}
