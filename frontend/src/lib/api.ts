import type { Role, Conversation, Message, ChatRequest, ChatResponse, FlipRequest, FlipResponse } from '@/types';

const API_BASE = 'http://localhost:8000/api';

export async function fetchConversations(role?: Role): Promise<Conversation[]> {
  const url = new URL(`${API_BASE}/conversations`);
  if (role) url.searchParams.append('role', role);
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch conversations');
  return res.json();
}

export async function createConversation(role: Role, title?: string): Promise<Conversation> {
  const url = new URL(`${API_BASE}/conversations`);
  url.searchParams.append('role', role);
  if (title) url.searchParams.append('title', title);
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function deleteConversation(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete conversation');
}

export async function fetchMessages(conversationId: number): Promise<Message[]> {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages`);
  if (!res.ok) throw new Error('Failed to fetch messages');
  return res.json();
}

export async function sendMessage(role: Role, payload: ChatRequest): Promise<ChatResponse> {
  const res = await fetch(`${API_BASE}/chat/${role}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to send message');
  return res.json();
}

export async function flipPerspective(payload: FlipRequest): Promise<FlipResponse> {
  const res = await fetch(`${API_BASE}/flip`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Failed to flip perspective');
  return res.json();
}