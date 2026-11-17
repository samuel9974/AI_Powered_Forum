import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import {
  countStoredChunks,
  replaceStoredChunks,
} from "./shared/chatbot.repository.js";
import { embedTexts } from "./shared/embedding.service.js";
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

  const rows = [];
  const batchSize = 16;
  for (let start = 0; start < chunks.length; start += batchSize) {
    const batch = chunks.slice(start, start + batchSize);
    const embeddings = await embedBatchWithRetry(batch);
    for (let offset = 0; offset < batch.length; offset++) {
      rows.push({
        chunkIndex: start + offset,
        content: batch[offset],
        embedding: embeddings[offset],
      });
    }
    console.log(
      `[Chatbot] embedded ${rows.length}/${chunks.length} knowledge-base chunks`,
    );
  }

  await replaceStoredChunks(rows);

  return {
    skipped: false,
    chunkCount: rows.length,
    message: "Knowledge base ingested successfully.",
  };
}

/**
 * Embeds one batch, retrying transient Gemini failures.
 * @param {string[]} batch
 * @returns {Promise<Array<Array<number>>>}
 */
async function embedBatchWithRetry(batch) {
  const maxAttempts = 4;
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await embedTexts(batch, "RETRIEVAL_DOCUMENT");
    } catch (error) {
      lastError = error;
      const message = String(error?.status || error?.message || error);
      const retryable = /429|500|503|RESOURCE_EXHAUSTED|UNAVAILABLE|rate/i.test(
        message,
      );
      if (!retryable || attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 500 * 2 ** (attempt - 1)));
    }
  }

  throw lastError;
}
