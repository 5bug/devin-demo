const API_URL = import.meta.env.VITE_API_URL;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export interface Conversation {
  id: string;
  messages: Message[];
  created_at: number;
}

export const api = {
  async createConversation(): Promise<Conversation> {
    const response = await fetch(`${API_URL}/api/conversations`, {
      method: 'POST',
    });
    return response.json();
  },

  async removeConversation(id: string): Promise<void> {
    await fetch(`${API_URL}/api/conversations/${id}`, {
      method: 'DELETE',
    });
  },

  async listConversations(): Promise<Conversation[]> {
    const response = await fetch(`${API_URL}/api/conversations`);
    return response.json();
  },

  async streamChat(conversationId: string, message: string): Promise<ReadableStream<Uint8Array> | null> {
    const response = await fetch(`${API_URL}/api/conversations/${conversationId}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    return response.body;
  },
};
