import { ServiceUnavailableError } from "../../../utils/errors/index.js";
import { generateQuestionEmbedding } from "../../question/service/vector.service.js";
import { assertUserOwnsReadyDocument } from "./shared/document-access.js";
import { logRagDiagnostic } from "./shared/rag-diagnostics.js";
import { mergeOverviewHits } from "./shared/overview-retrieval.js";
import {
  getRagRetrievalConfig,
  normalizeRagTopK,
} from "./shared/rag-retrieval-config.js";
import { scoreChunksAgainstQuery } from "./shared/score-chunks-by-similarity.js";
import { fetchReadyChunkVectorsByDocumentId } from "./shared/document.repository.js";

/**
 * Map an internal ranked hit to the public search result shape.
 * @param {object} item
 * @returns {{ chunkId: number, chunkIndex: number, score: number, excerpt: string, pageStart: number|null, pageEnd: number|null }}
 */
function toSearchResult(item) {
  return {
    chunkId: item.chunkId,
    chunkIndex: item.chunkIndex,
    score: Number(Number(item.score || 0).toFixed(2)),
    excerpt: item.excerpt,
    pageStart: item.pageStart ?? null,
    pageEnd: item.pageEnd ?? null,
  };
}

/**
 * Semantic search within a single document.
 * Verifies ownership, embeds the query, ranks chunk vectors by cosine similarity,
 * and returns the top-k excerpts above the RAG similarity threshold.
 *
 * When retrievalMode is "overview", also injects early-page seed chunks and
 * diversifies near-duplicate excerpts for broader document coverage.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.documentId
 * @param {string} params.query
 * @param {number} [params.k] - optional top-k override
 * @param {'similarity'|'overview'} [params.retrievalMode='similarity']
 * @returns {Promise<{ query: string, results: Array<{ chunkId: number, chunkIndex: number, score: number, excerpt: string, pageStart: number|null, pageEnd: number|null }>, retrievalMode: string }>}
 */
export async function searchInDocumentService({
  userId,
  documentId,
  query,
  k,
  retrievalMode = "similarity",
}) {
  await assertUserOwnsReadyDocument(userId, documentId);
  const chunkVectors = await fetchReadyChunkVectorsByDocumentId(documentId);

  const config = getRagRetrievalConfig();
  const mode = retrievalMode === "overview" ? "overview" : "similarity";
  const defaultK = mode === "overview" ? config.overviewTopK : config.topK;
  const normalizedK = normalizeRagTopK(k, defaultK);

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

  const scored = scoreChunksAgainstQuery(chunkVectors, queryEmbedding, {
    onInvalid: (chunk, error) =>
      console.warn(
        `Failed to calculate similarity for chunk ${chunk.chunkId}:`,
        error.message,
      ),
  });

  const allScores = scored.map((item) => item.score);
  const similarities = scored
    .filter((item) => item.score >= config.similarityThreshold)
    .map((item) => ({
      chunkId: item.chunkId,
      chunkIndex: item.chunkIndex,
      excerpt: item.content,
      pageStart: item.pageStart ?? null,
      pageEnd: item.pageEnd ?? null,
      score: item.score,
    }));

  similarities.sort((a, b) => b.score - a.score);
  allScores.sort((a, b) => b - a);

  let selected =
    mode === "overview"
      ? mergeOverviewHits({
          rankedHits: similarities,
          allChunks: chunkVectors,
          limit: normalizedK,
          seedPages: config.overviewSeedPages,
          seedLimit: config.overviewSeedLimit,
        })
      : similarities.slice(0, normalizedK);

  // Overview fallback: if threshold filtered everything, still seed early pages
  // so the LLM has something grounded to teach from.
  if (mode === "overview" && selected.length === 0 && chunkVectors.length > 0) {
    selected = mergeOverviewHits({
      rankedHits: [],
      allChunks: chunkVectors,
      limit: normalizedK,
      seedPages: config.overviewSeedPages,
      seedLimit: Math.max(config.overviewSeedLimit, Math.min(4, normalizedK)),
    });
  }

  const results = selected.map(toSearchResult);

  logRagDiagnostic("search", {
    documentId,
    query,
    retrievalMode: mode,
    chunkCount: chunkVectors.length,
    threshold: config.similarityThreshold,
    k: normalizedK,
    hitsAboveThreshold: similarities.length,
    returned: results.length,
    topRawScores: allScores
      .slice(0, 10)
      .map((score) => Number(score.toFixed(4))),
    emptyRetrieval: results.length === 0,
  });

  return {
    query,
    results,
    retrievalMode: mode,
  };
}
