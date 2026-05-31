import { create } from 'zustand';
import type { Project, Document } from '@/types';
import * as api from '@/lib/api';

interface ProjectState {
  projects: Project[];
  activeProjectId: number | null;
  documents: Document[];

  fetchProjects: () => Promise<void>;
  createProject: (name: string, description?: string) => Promise<Project>;
  deleteProject: (id: number) => Promise<void>;
  setActiveProject: (id: number | null) => Promise<void>;
  fetchDocuments: () => Promise<void>;
  uploadDocument: (file: File, docType: string) => Promise<void>;
  deleteDocument: (docId: number) => Promise<void>;
}

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  documents: [],

  fetchProjects: async () => {
    const projects = await api.fetchProjects();
    set({ projects });
  },

  createProject: async (name: string, description?: string) => {
    const project = await api.createProject(name, description);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  deleteProject: async (id: number) => {
    await api.deleteProject(id);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId: state.activeProjectId === id ? null : state.activeProjectId,
      documents: state.activeProjectId === id ? [] : state.documents,
    }));
  },

  setActiveProject: async (id: number | null) => {
    set({ activeProjectId: id, documents: [] });
    if (id !== null) {
      const docs = await api.fetchDocuments(id);
      set({ documents: docs });
    }
  },

  fetchDocuments: async () => {
    const { activeProjectId } = get();
    if (activeProjectId === null) return;
    const docs = await api.fetchDocuments(activeProjectId);
    set({ documents: docs });
  },

  uploadDocument: async (file: File, docType: string) => {
    const { activeProjectId } = get();
    if (activeProjectId === null) return;
    const doc = await api.uploadDocument(activeProjectId, file, docType);
    set((state) => ({ documents: [doc, ...state.documents] }));
  },

  deleteDocument: async (docId: number) => {
    const { activeProjectId } = get();
    if (activeProjectId === null) return;
    await api.deleteDocument(activeProjectId, docId);
    set((state) => ({ documents: state.documents.filter((d) => d.id !== docId) }));
  },
}));