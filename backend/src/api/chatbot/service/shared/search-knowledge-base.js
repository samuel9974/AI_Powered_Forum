import {
  cosineSimilarity,
  embedText,
} from "./embedding.service.js";
import {
  fetchAllChunksWithEmbeddings,
  parseEmbedding,
} from "./chatbot.repository.js";

const CHATBOT_SEARCH_K = 5;

/**
 * Retrieves the top-k knowledge base chunks most similar to the query.
 * @param {string} query
 * @param {number} [k=CHATBOT_SEARCH_K]
 * @returns {Promise<Array<{chunkId: number, chunkIndex: number, content: string, score: number}>>}
 */
export async function searchKnowledgeBase(query, k = CHATBOT_SEARCH_K) {
  const queryEmbedding = await embedText(query, "RETRIEVAL_QUERY");
  const stored = await fetchAllChunksWithEmbeddings();

  const ranked = stored
    .map((row) => ({
      chunkId: row.chunk_id,
      chunkIndex: row.chunk_index,
      content: row.content,
      score: cosineSimilarity(
        queryEmbedding,
        parseEmbedding(row.embedding),
      ),
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, k);
}
