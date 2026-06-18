import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import {
  calculateCosineSimilarity,
  generateQuestionEmbedding,
  getVectorConfig,
} from "../../question/service/vector.service.js";
import { assertUserOwnsReadyDocument } from "./shared/document-access.js";
import { fetchReadyChunkVectorsByDocumentId } from "./shared/document.repository.js";

/**
 * Semantic search within a single document.
 * Verifies ownership, embeds the query, ranks chunk vectors by cosine similarity,
 * and returns the top-k excerpts above the configured threshold.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.documentId
 * @param {string} params.query
 * @param {number} [params.k=5]
 * @returns {Promise<{ query: string, results: Array<{ chunkId: number, chunkIndex: number, score: number, excerpt: string }> }>}
 */
export async function searchInDocumentService({
  userId,
  documentId,
  query,
  k = 5,
}) {
  await assertUserOwnsReadyDocument(userId, documentId);
  const chunkVectors = await fetchReadyChunkVectorsByDocumentId(documentId);

  const { recommendThreshold } = getVectorConfig();
  const normalizedK = k > 0 ? Math.min(k, 20) : 5;

  let queryEmbedding;

  try {
    const embeddingResult = await generateQuestionEmbedding(query, {
      taskType: "RETRIEVAL_QUERY",
    });
    queryEmbedding = embeddingResult.embedding;
  } catch (error) {
    console.error("=== GEMINI API ERROR DURING DOCUMENT SEARCH ===");
    console.error("Operation: searchInDocumentService");
    console.error("Document ID:", documentId);
    console.error("Search text:", query);
    console.error("Error:", error);
    console.error("============================================");
    throw new ServiceUnavailableError(
      "Failed to generate embedding for search query. Please try again later.",
    );
  }

  const similarities = [];

  for (const chunk of chunkVectors) {
    try {
      const score = calculateCosineSimilarity(queryEmbedding, chunk.embedding);

      if (score >= recommendThreshold) {
        similarities.push({
          chunkId: chunk.chunkId,
          chunkIndex: chunk.chunkIndex,
          excerpt: chunk.content,
          score,
        });
      }
    } catch (error) {
      console.warn(
        `Failed to calculate similarity for chunk ${chunk.chunkId}:`,
        error.message,
      );
    }
  }

  similarities.sort((a, b) => b.score - a.score);

  const results = similarities.slice(0, normalizedK).map((item) => ({
    chunkId: item.chunkId,
    chunkIndex: item.chunkIndex,
    score: Number(item.score.toFixed(2)),
    excerpt: item.excerpt,
  }));

  return {
    query,
    results,
  };
}
