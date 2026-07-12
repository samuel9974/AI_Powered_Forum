import { countStoredChunks } from "./shared/chatbot.repository.js";
import { getKnowledgeBaseFilename } from "./shared/knowledge-base.js";

/**
 * Returns whether the chatbot knowledge base has been ingested.
 * @returns {Promise<{ready: boolean, chunkCount: number, knowledgeBase: string}>}
 */
export async function getChatbotStatusService() {
  const chunkCount = await countStoredChunks();
  return {
    ready: chunkCount > 0,
    chunkCount,
    knowledgeBase: getKnowledgeBaseFilename(),
  };
}
