import type { Role, Project, Document, Conversation, Message, ChatRequest, ChatResponse, FlipRequest, FlipResponse } from '@/types';

const API_BASE = 'http://localhost:8000/api';

const projectBase = (projectId: number) => `${API_BASE}/projects/${projectId}`;

// projects

export async function fetchProjects(): Promise<Project[]> {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error('Failed to fetch projects');
  return res.json();
}

export async function createProject(name: string, description?: string): Promise<Project> {
  const res = await fetch(`${API_BASE}/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, description }),
  });
  if (!res.ok) throw new Error('Failed to create project');
  return res.json();
}

export async function deleteProject(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/projects/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete project');
}

// documents

export async function fetchDocuments(projectId: number): Promise<Document[]> {
  const res = await fetch(`${projectBase(projectId)}/documents`);
  if (!res.ok) throw new Error('Failed to fetch documents');
  return res.json();
}

export async function uploadDocument(projectId: number, file: File, docType: string): Promise<Document> {
  const form = new FormData();
  form.append('file', file);
  form.append('doc_type', docType);
  const res = await fetch(`${projectBase(projectId)}/documents`, { method: 'POST', body: form });
  if (!res.ok) throw new Error('Failed to upload document');
  return res.json();
}

export async function deleteDocument(projectId: number, docId: number): Promise<void> {
  const res = await fetch(`${projectBase(projectId)}/documents/${docId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
}

// conversations

export async function fetchConversations(projectId: number, role?: Role): Promise<Conversation[]> {
  const url = new URL(`${projectBase(projectId)}/conversations`);
  if (role) url.searchParams.append('role', role);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function createConversation(projectId: number, role: Role, title?: string): Promise<Conversation> {
  const url = new URL(`${projectBase(projectId)}/conversations`);
  url.searchParams.append('role', role);
  if (title) url.searchParams.append('title', title);
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function deleteConversation(projectId: number, id: number): Promise<void> {
  const res = await fetch(`${projectBase(projectId)}/conversations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete conversation');
}

export async function fetchMessages(projectId: number, conversationId: number): Promise<Message[]> {
  const res = await fetch(`${projectBase(projectId)}/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

// chat

export async function sendMessage(projectId: number, role: Role, payload: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${projectBase(projectId)}/chat/${role}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function flipPerspective(projectId: number, payload: FlipRequest): Promise<FlipResponse> {
  const res = await fetch(`${projectBase(projectId)}/flip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to flip perspective');
  return res.json();
}