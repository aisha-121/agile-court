import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useChatStore } from '@/stores/chatStore';
import { ROLE_CONFIG } from '@/lib/roles';

interface PerspectiveFlipProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PerspectiveFlip({ open, onOpenChange }: PerspectiveFlipProps) {
  const flipResult = useChatStore((s) => s.flipResult);
  const flipLoading = useChatStore((s) => s.flipLoading);
  const config = flipResult ? ROLE_CONFIG[flipResult.role] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm font-medium">Alternative Perspective</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-80">
          {flipLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-muted border-t-foreground" />
              Getting perspective…
            </div>
          )}
          {flipResult && config && !flipLoading && (
            <div className="flex gap-3 pt-1">
              <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                <AvatarFallback className={`text-[10px] font-bold ${config.avatarClass}`}>
                  {config.initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium mb-2 ${config.color}`}>
                  {config.name} · {config.sublabel}
                </p>
                <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {flipResult.content}
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
