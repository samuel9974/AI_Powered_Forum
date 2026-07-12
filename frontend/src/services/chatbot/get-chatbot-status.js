import { apiClient } from '../core/api.client.js';
import { handleChatbotError } from './shared/handle-chatbot-error.js';

/**
 * GET /api/chatbot/status — whether the Evangadi knowledge base is ready.
 * @returns {Promise<{ ready: boolean, chunkCount: number, knowledgeBase: string }>}
 */
export async function getChatbotStatus() {
  try {
    const response = await apiClient.get('/api/chatbot/status');
    const data = response.data.data ?? {};

    return {
      ready: Boolean(data.ready),
      chunkCount: Number(data.chunkCount ?? 0),
      knowledgeBase: data.knowledgeBase ?? '',
    };
  } catch (error) {
    throw handleChatbotError(error);
  }
}
