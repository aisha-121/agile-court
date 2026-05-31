import { useState } from 'react';
import { ChevronDown, FolderOpen, Plus, Trash2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { useProjectStore } from '@/stores/projectStore';
import { useChatStore } from '@/stores/chatStore';
import { ProjectModal } from './project-modal';

export function ProjectSelector() {
  const [modalOpen, setModalOpen] = useState(false);

  const projects = useProjectStore((s) => s.projects);
  const activeProjectId = useProjectStore((s) => s.activeProjectId);
  const setActiveProject = useProjectStore((s) => s.setActiveProject);
  const deleteProject = useProjectStore((s) => s.deleteProject);
  const resetForProject = useChatStore((s) => s.resetForProject);
  const fetchConversations = useChatStore((s) => s.fetchConversations);

  const activeProject = projects.find((p) => p.id === activeProjectId);

  const handleSelect = async (id: number) => {
    if (id === activeProjectId) return;
    resetForProject();
    await setActiveProject(id);
    await fetchConversations();
  };

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    resetForProject();
    await deleteProject(id);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 max-w-[220px]">
            <FolderOpen className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate text-xs">
              {activeProject ? activeProject.name : 'Select project'}
            </span>
            <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground ml-auto" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {projects.length > 0 ? (
            <>
              {projects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  className="flex items-center justify-between group cursor-pointer"
                  onSelect={() => handleSelect(project.id)}
                >
                  <span className="truncate text-sm">{project.name}</span>
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="ml-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
            </>
          ) : (
            <div className="px-2 py-3 text-xs text-muted-foreground text-center">No projects yet</div>
          )}
          <DropdownMenuItem onSelect={() => setModalOpen(true)} className="cursor-pointer">
            <Plus className="h-3.5 w-3.5 mr-2" />
            <span className="text-sm">New project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ProjectModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
