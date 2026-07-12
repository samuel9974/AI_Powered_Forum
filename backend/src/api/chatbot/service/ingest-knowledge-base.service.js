import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import {
  clearStoredChunks,
  countStoredChunks,
  insertChunk,
} from "./shared/chatbot.repository.js";
import { embedText } from "./shared/embedding.service.js";
import {
  chunkKnowledgeBaseText,
  readKnowledgeBaseText,
} from "./shared/knowledge-base.js";

/**
 * Reads, chunks, embeds, and stores the Evangadi knowledge base.
 * @param {Object} [params]
 * @param {boolean} [params.force=false] - Re-ingest even when chunks already exist
 * @returns {Promise<{skipped: boolean, chunkCount: number, message: string}>}
 */
export async function ingestKnowledgeBaseService({ force = false } = {}) {
  const existing = await countStoredChunks();
  if (existing > 0 && !force) {
    return {
      skipped: true,
      chunkCount: existing,
      message: "Knowledge base already ingested.",
    };
  }

  const rawText = await readKnowledgeBaseText();
  const chunks = chunkKnowledgeBaseText(rawText);

  if (chunks.length === 0) {
    throw new ServiceUnavailableError(
      "Knowledge base file did not contain ingestible text.",
    );
  }

  if (force) {
    await clearStoredChunks();
  }

  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i], "RETRIEVAL_DOCUMENT");

    if (!Array.isArray(embedding) || embedding.length === 0) {
      console.warn(`[Chatbot] skipping chunk ${i}: invalid embedding`);
      continue;
    }

    await insertChunk({
      chunkIndex: i,
      content: chunks[i],
      embedding,
    });
  }

  return {
    skipped: false,
    chunkCount: chunks.length,
    message: "Knowledge base ingested successfully.",
  };
}
