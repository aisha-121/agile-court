import { create } from 'zustand';
import type { Role, Conversation, Message } from '@/types';
import * as api from '@/lib/api';

interface ChatState {
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Message[];
  loading: boolean;
  flipLoading: boolean;
  flipResult: { role: Role; content: string } | null;
  
  fetchConversations: () => Promise<void>;
  createConversation: (role: Role) => Promise<void>;
  setActiveConversation: (id: number | null) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteConversation: (id: number) => Promise<void>;
  flipPerspective: (lastUserMessage: string, targetRole: Role) => Promise<void>;
  clearFlipResult: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],
  loading: false,
  flipLoading: false,
  flipResult: null,

  fetchConversations: async () => {
    const convs = await api.fetchConversations();
    set({ conversations: convs });
  },

  createConversation: async (role: Role) => {
    const conv = await api.createConversation(role);
    set((state) => ({
      conversations: [conv, ...state.conversations],
      activeConversationId: conv.id,
      messages: [],
    }));
  },

  setActiveConversation: async (id: number | null) => {
    set({ activeConversationId: id, messages: [], flipResult: null });
    if (id) {
      const msgs = await api.fetchMessages(id);
      set({ messages: msgs });
    }
  },

  sendMessage: async (content: string) => {
    const { activeConversationId, conversations } = get();
    const conv = conversations.find((c) => c.id === activeConversationId);
    if (!conv) return;

    const role = conv.role;
    
    const tempUserMsg: Message = {
      id: Date.now(),
      sender: 'user',
      content,
      is_perspective_flip: false,
      created_at: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, tempUserMsg], loading: true }));

    try {
      const res = await api.sendMessage(role, {
        content,
        conversation_id: activeConversationId ?? undefined,
      });
      
      const assistantMsg: Message = {
        id: res.message_id,
        sender: 'assistant',
        content: res.content,
        is_perspective_flip: false,
        created_at: new Date().toISOString(),
      };

      set((state) => ({
        messages: [...state.messages.filter((m) => m.id !== tempUserMsg.id), tempUserMsg, assistantMsg],
        loading: false,
        conversations: state.conversations.map((c) =>
          c.id === res.conversation_id ? { ...c, updated_at: new Date().toISOString() } : c
        ),
      }));

      if (!activeConversationId) {
        await get().fetchConversations();
        set({ activeConversationId: res.conversation_id });
      }
    } catch (e) {
      set({ loading: false });
      throw e;
    }
  },

  deleteConversation: async (id: number) => {
    await api.deleteConversation(id);
    set((state) => ({
      conversations: state.conversations.filter((c) => c.id !== id),
      activeConversationId: state.activeConversationId === id ? null : state.activeConversationId,
      messages: state.activeConversationId === id ? [] : state.messages,
    }));
  },

  flipPerspective: async (lastUserMessage: string, targetRole: Role) => {
    set({ flipLoading: true, flipResult: null });
    try {
      const res = await api.flipPerspective({
        last_user_message: lastUserMessage,
        target_role: targetRole,
      });
      set({ flipResult: { role: res.role, content: res.content }, flipLoading: false });
    } catch (e) {
      set({ flipLoading: false });
      throw e;
    }
  },

  clearFlipResult: () => set({ flipResult: null, flipLoading: false }),
}));