import { apiClient } from '../core/api.client.js';
import { CHATBOT_LONG_REQUEST_TIMEOUT_MS } from './shared/chatbot.constants.js';
import { handleChatbotError } from './shared/handle-chatbot-error.js';
import { mapCitationFromApi } from './shared/map-citation.js';

/**
 * POST /api/chatbot/chat — ask the Evangadi assistant a question.
 * @param {string} message
 * @param {Array<{ role: 'user'|'assistant', content: string }>} [history]
 * @returns {Promise<{ answer: string, citations: Array }>}
 */
export async function sendChatMessage(message, history = []) {
  try {
    const response = await apiClient.post(
      '/api/chatbot/chat',
      {
        message: message.trim(),
        history: Array.isArray(history) ? history : [],
      },
      { timeout: CHATBOT_LONG_REQUEST_TIMEOUT_MS },
    );

    const data = response.data.data ?? {};
    const citations = Array.isArray(data.citations) ? data.citations : [];

    return {
      answer: data.answer ?? '',
      citations: citations.map(mapCitationFromApi),
    };
  } catch (error) {
    throw handleChatbotError(error);
  }
}
