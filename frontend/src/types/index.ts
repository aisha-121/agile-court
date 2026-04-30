export type Role = 'product_owner' | 'scrum_master' | 'tech_lead';

export interface Conversation {
  id: number;
  role: Role;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: number;
  sender: 'user' | 'assistant';
  content: string;
  is_perspective_flip: boolean;
  created_at: string;
}

export interface ChatRequest {
  content: string;
  conversation_id?: number;
}

export interface ChatResponse {
  role: Role;
  content: string;
  conversation_id: number;
  message_id: number;
}

export interface FlipRequest {
  last_user_message: string;
  target_role: Role;
}

export interface FlipResponse {
  role: Role;
  content: string;
}