import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SourceInfo {
  type?: string | null;
  title?: string | null;
  url?: string;
  score?: number;
}

export interface ChatTraceItem {
  type?: string | null;
  label?: string | null;
  detail?: string | null;
  status?: string | null;
}

export interface ChatResponse {
  response: string;
  suggestedActions: string[];
  sources: SourceInfo[];
  latencyMs: number;
  trace?: ChatTraceItem[];
  error?: string;
}

export interface ChatRequest {
  message: string;
  history: ChatMessage[];
  certificationId?: string;
}

export const chatService = {
  sendMessage: async (request: ChatRequest): Promise<ChatResponse> => {
    const response = await api.post<ChatResponse>('/chat', request);
    return response.data;
  },
};
