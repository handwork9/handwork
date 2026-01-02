/**
 * Chatbot Service
 * Handles AI chatbot interactions
 */

import apiClient from './apiClient';

export interface ChatbotMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedActions?: string[];
}

export interface ChatbotConversation {
  id: string;
  userId: string;
  messages: ChatbotMessage[];
  topic?: string;
  status: 'active' | 'ended' | 'escalated';
  createdAt: string;
  updatedAt: string;
}

export interface ChatResponse {
  response: string;
  conversationId: string;
  suggestedActions?: string[];
  escalated?: boolean;
}

class ChatbotService {
  /**
   * Send a message to the AI chatbot
   */
  async sendMessage(message: string, conversationId?: string): Promise<ChatResponse> {
    const payload: { message: string; conversationId?: string } = { message };
    if (conversationId) {
      payload.conversationId = conversationId;
    }
    console.log('[ChatbotService] Sending payload:', JSON.stringify(payload));
    const response: any = await apiClient.post('/chatbot/chat', payload);
    console.log('[ChatbotService] Raw response:', JSON.stringify(response.data));
    // Backend wraps response in { success: true, data: ... }
    const data = response.data?.data || response.data;
    console.log('[ChatbotService] Extracted data:', JSON.stringify(data));
    return data;
  }

  /**
   * Get user's chatbot conversations
   */
  async getConversations(limit: number = 10): Promise<ChatbotConversation[]> {
    const response: any = await apiClient.get('/chatbot/conversations', {
      params: { limit },
    });
    return response.data;
  }

  /**
   * Get active conversation if any
   */
  async getActiveConversation(): Promise<ChatbotConversation | null> {
    try {
      const response: any = await apiClient.get('/chatbot/conversations/active');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get a specific conversation
   */
  async getConversation(conversationId: string): Promise<ChatbotConversation> {
    const response: any = await apiClient.get(`/chatbot/conversations/${conversationId}`);
    return response.data;
  }

  /**
   * End a conversation
   */
  async endConversation(conversationId: string): Promise<void> {
    await apiClient.put(`/chatbot/conversations/${conversationId}/end`);
  }

  /**
   * Escalate conversation to human support
   */
  async escalateToSupport(conversationId: string, reason?: string): Promise<void> {
    await apiClient.post(`/chatbot/conversations/${conversationId}/escalate`, {
      reason,
    });
  }

  /**
   * Rate a conversation
   */
  async rateConversation(conversationId: string, rating: number, feedback?: string): Promise<void> {
    await apiClient.post(`/chatbot/conversations/${conversationId}/rate`, {
      rating,
      feedback,
    });
  }
}

export const chatbotService = new ChatbotService();
export default chatbotService;
