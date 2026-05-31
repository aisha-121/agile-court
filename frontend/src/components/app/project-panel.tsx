import { useState } from 'react';
import { FileText, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useProjectStore } from '@/stores/projectStore';
import { DocumentUploader } from './document-uploader';

const DOC_TYPE_LABELS: Record<string, string> = {
  prd: 'PRD',
  sprint_plan: 'Sprint Plan',
  backlog: 'Backlog',
  ui_design: 'UI Design',
};

export function ProjectPanel() {
  const [uploaderOpen, setUploaderOpen] = useState(false);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const documents = useProjectStore((s) => s.documents);
  const deleteDocument = useProjectStore((s) => s.deleteDocument);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  if (!activeProject) {
    return (
      <div className="w-72 border-l flex flex-col items-center justify-center p-6 text-center gap-2">
        <FileText className="h-8 w-8 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No project selected</p>
      </div>
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="w-72 border-l flex flex-col">
        <div className="h-12 flex flex-col justify-center px-4 border-b">
          <p className="text-sm font-semibold truncate">{activeProject.name}</p>
          {activeProject.description && (
            <p className="text-[10px] text-muted-foreground truncate">{activeProject.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between px-4 py-2.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Context docs ({documents.length})
          </p>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setUploaderOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="left">Upload document</TooltipContent>
          </Tooltip>
        </div>

        <Separator />

        <div className="flex-1 overflow-auto">
          {documents.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-10 px-4 text-center">
              <FileText className="h-7 w-7 text-muted-foreground/40" />
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">No documents yet</p>
                <p className="text-xs text-muted-foreground/70">
                  Upload a PRD, sprint plan, or backlog to ground advisor responses.
                </p>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setUploaderOpen(true)}>
                <Plus className="h-3 w-3 mr-1" />
                Upload
              </Button>
            </div>
          ) : (
            <ul className="py-1">
              {documents.map((doc) => (
                <li key={doc.id} className="flex items-center gap-2.5 px-4 py-2 group hover:bg-muted/50">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{doc.filename}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {DOC_TYPE_LABELS[doc.doc_type] ?? doc.doc_type}
                    </p>
                  </div>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => deleteDocument(doc.id)}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="left">Delete document</TooltipContent>
                  </Tooltip>
                </li>
              ))}
            </ul>
          )}
        </div>

        <DocumentUploader open={uploaderOpen} onOpenChange={setUploaderOpen} />
      </div>
    </TooltipProvider>
  );
}
