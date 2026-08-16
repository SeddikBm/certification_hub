import api from './api';

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface SourceInfo {
  type: string;
  title: string;
  url?: string;
  score?: number;
}

export interface ChatResponse {
  response: string;
  suggestedActions: string[];
  sources: SourceInfo[];
  latencyMs: number;
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
