import { safeExecute } from "../../../../db/db.config.js";
import { generateQuestionEmbedding } from "../../question/service/vector.service.js";
import { BadRequestError, NotFoundError } from "../../../utils/errors/index.js";
import { queryDocumentService } from "./query-document.service.js";
import {
  classifyRagFailureMode,
  computeChunkCorpusStats,
} from "./shared/rag-chunk-stats.js";
import { getRagRetrievalConfig } from "./shared/rag-retrieval-config.js";
import { scoreChunksAgainstQuery } from "./shared/score-chunks-by-similarity.js";
import {
  fetchDocumentById,
  fetchReadyChunkVectorsByDocumentId,
} from "./shared/document.repository.js";

const DEFAULT_OVERVIEW_QUERY =
  "Explain the overall content of this document so I can learn from it";

const DEFAULT_FACTUAL_QUERY =
  "What is the main topic or subject introduced in this document?";

/**
 * Rank all chunk vectors against a query embedding (no threshold filter).
 * @param {Array<{chunkId: number, chunkIndex: number, content: string, embedding: number[]}>} chunkVectors
 * @param {number[]} queryEmbedding
 * @returns {Array<{chunkId: number, chunkIndex: number, score: number, excerpt: string, length: number}>}
 */
function rankAllChunks(chunkVectors, queryEmbedding) {
  const scored = scoreChunksAgainstQuery(chunkVectors, queryEmbedding);

  const ranked = scored.map((chunk) => ({
    chunkId: chunk.chunkId,
    chunkIndex: chunk.chunkIndex,
    score: Number(chunk.score.toFixed(4)),
    excerpt:
      chunk.content.length > 160
        ? `${chunk.content.slice(0, 157)}...`
        : chunk.content,
    length: chunk.content.length,
  }));

  ranked.sort((a, b) => b.score - a.score);
  return ranked;
}

/**
 * Run one probe query: unfiltered top scores vs production threshold, then ask the LLM path.
 * @param {Object} params
 * @returns {Promise<object>}
 */
async function runProbe({
  label,
  userId,
  documentId,
  query,
  chunkVectors,
  threshold,
  defaultK,
}) {
  const { embedding: queryEmbedding } = await generateQuestionEmbedding(query, {
    taskType: "RETRIEVAL_QUERY",
  });

  const rankedAll = rankAllChunks(chunkVectors, queryEmbedding);
  const aboveThreshold = rankedAll.filter((item) => item.score >= threshold);
  const productionTop = aboveThreshold.slice(0, defaultK);

  let answer = "";
  let citations = [];
  let chunksUsed = [];

  try {
    const queryResult = await queryDocumentService({
      userId,
      documentId,
      query,
    });
    answer = queryResult.answer;
    citations = queryResult.citations;
    chunksUsed = queryResult.chunksUsed;
  } catch (error) {
    answer = `[queryDocumentService error: ${error.message}]`;
  }

  const failureMode = classifyRagFailureMode({
    hitsAboveThreshold: aboveThreshold.length,
    answer,
  });

  return {
    label,
    query,
    topScoresUnfiltered: rankedAll.slice(0, 10),
    hitsAboveThreshold: aboveThreshold.length,
    productionTopK: productionTop,
    maxScore: rankedAll[0]?.score ?? 0,
    scoreGapToThreshold:
      rankedAll[0] != null
        ? Number((rankedAll[0].score - threshold).toFixed(4))
        : null,
    answerPreview:
      answer.length > 280 ? `${answer.slice(0, 277)}...` : answer,
    citationCount: citations.length,
    chunksUsedCount: chunksUsed.length,
    failureMode,
  };
}

/**
 * Phase A / Step 1 baseline report for one ready RAG document.
 * Measures chunk corpus shape and whether overview vs factual asks fail at
 * retrieval (empty) or after the LLM (refusal).
 *
 * @param {Object} params
 * @param {number} params.documentId
 * @param {string} [params.overviewQuery]
 * @param {string} [params.factualQuery]
 * @returns {Promise<object>}
 */
export async function diagnoseDocumentBaseline({
  documentId,
  overviewQuery = DEFAULT_OVERVIEW_QUERY,
  factualQuery = DEFAULT_FACTUAL_QUERY,
}) {
  const numericId = Number(documentId);

  if (!Number.isInteger(numericId) || numericId < 1) {
    throw new BadRequestError("documentId must be a positive integer.");
  }

  const document = await fetchDocumentById(numericId);

  if (!document) {
    throw new NotFoundError("Document not found.");
  }

  if (document.status !== "ready") {
    throw new BadRequestError(
      `Document ${numericId} status is "${document.status}"; diagnostics require status "ready".`,
    );
  }

  const chunkVectors = await fetchReadyChunkVectorsByDocumentId(numericId);
  const chunkStats = computeChunkCorpusStats(chunkVectors);
  const { similarityThreshold, topK, maxK, overviewTopK, overviewSeedPages, overviewSeedLimit } =
    getRagRetrievalConfig();

  const overviewProbe = await runProbe({
    label: "overview",
    userId: document.user_id,
    documentId: numericId,
    query: overviewQuery,
    chunkVectors,
    threshold: similarityThreshold,
    defaultK: overviewTopK,
  });

  const factualProbe = await runProbe({
    label: "factual",
    userId: document.user_id,
    documentId: numericId,
    query: factualQuery,
    chunkVectors,
    threshold: similarityThreshold,
    defaultK: topK,
  });

  return {
    generatedAt: new Date().toISOString(),
    document: {
      documentId: document.document_id,
      userId: document.user_id,
      title: document.title,
      status: document.status,
      byteSize: Number(document.byte_size),
    },
    retrievalConfig: {
      similarityThreshold,
      topK,
      maxK,
      overviewTopK,
      overviewSeedPages,
      overviewSeedLimit,
      note: "Ask path classifies overview vs factual; overview uses seeds + diversification",
    },
    chunkStats,
    probes: [overviewProbe, factualProbe],
    checklist: {
      lineSizedChunksLikely:
        chunkStats.avgLength > 0 && chunkStats.avgLength < 120,
      overviewEmptyRetrieval: overviewProbe.failureMode === "empty_retrieval",
      overviewLlmRefusal: overviewProbe.failureMode === "llm_refusal",
      overviewAnswered: overviewProbe.failureMode === "answered",
      factualEmptyRetrieval: factualProbe.failureMode === "empty_retrieval",
      factualLlmRefusal: factualProbe.failureMode === "llm_refusal",
      factualAnswered: factualProbe.failureMode === "answered",
    },
  };
}

/**
 * Resolve the newest ready document id for CLI convenience.
 * @returns {Promise<number|null>}
 */
export async function findLatestReadyDocumentId() {
  const rows = await safeExecute(
    `
      SELECT document_id
      FROM documents
      WHERE status = 'ready'
      ORDER BY created_at DESC
      LIMIT 1
    `,
    [],
  );

  return rows[0]?.document_id ?? null;
}
