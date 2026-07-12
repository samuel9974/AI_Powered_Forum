import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import { getChatbotStatusService } from "./get-chatbot-status.service.js";
import { buildChatbotPrompt } from "./shared/chatbot-prompt.js";
import {
  GEMINI_GENERATION_MODEL,
  generateChatbotContent,
  getGeneratedText,
} from "./shared/gemini.client.js";
import { searchKnowledgeBase } from "./shared/search-knowledge-base.js";

/**
 * Answers a user question grounded in the ingested Evangadi knowledge base.
 * @param {Object} params
 * @param {string} params.message
 * @param {Array<{role: string, content: string}>} [params.history]
 * @returns {Promise<{answer: string, citations: Array<{ref: number, chunkIndex: number, excerpt: string}>}>}
 */
export async function queryChatbotService({ message, history = [] }) {
  const question = (message || "").trim();
  if (!question) {
    throw new Error("Message is required.");
  }

  const status = await getChatbotStatusService();
  if (!status.ready) {
    throw new ServiceUnavailableError(
      "Chatbot knowledge base is not ready yet. Please try again shortly.",
    );
  }

  const chunks = await searchKnowledgeBase(question);

  if (chunks.length === 0) {
    return {
      answer:
        "I do not have enough information in my knowledge base to answer that question.",
      citations: [],
    };
  }

  const prompt = buildChatbotPrompt({ question, chunks, history });

  try {
    const response = await generateChatbotContent(prompt);
    const answer = getGeneratedText(response);

    if (!answer) {
      throw new Error("Gemini response did not include answer text.");
    }

    return {
      answer,
      citations: chunks.map((chunk, index) => ({
        ref: index + 1,
        chunkIndex: chunk.chunkIndex,
        excerpt: chunk.content.slice(0, 160),
      })),
    };
  } catch (error) {
    console.error(
      `[Chatbot] query failed (model=${GEMINI_GENERATION_MODEL}):`,
      error?.message ?? error,
    );

    const errorText = String(error?.message ?? error);
    if (errorText.includes("429") || errorText.includes("RESOURCE_EXHAUSTED")) {
      throw new ServiceUnavailableError(
        "AI service is busy. Please wait a moment and try again.",
      );
    }

    throw new ServiceUnavailableError(
      "Failed to generate a chatbot response. Please try again later.",
    );
  }
}
