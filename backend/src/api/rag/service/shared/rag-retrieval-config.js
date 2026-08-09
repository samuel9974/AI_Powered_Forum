/**
 * RAG-specific retrieval knobs.
 * Kept separate from forum duplicate-question recommend settings
 * (RECOMMEND_THRESHOLD / RECOMMEND_K) so PDF Q&A can use broader recall.
 */

const RAG_MAX_K = 20;

const DEFAULT_RAG_SIMILARITY_THRESHOLD = 0.6;
const DEFAULT_RAG_TOP_K = 12;
const DEFAULT_RAG_OVERVIEW_TOP_K = 16;
const DEFAULT_RAG_OVERVIEW_SEED_PAGES = 2;
const DEFAULT_RAG_OVERVIEW_SEED_LIMIT = 2;

/**
 * Clamp a numeric env value into [min, max], falling back when invalid.
 * @param {unknown} value
 * @param {number} fallback
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampNumber(value, fallback, min, max) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, parsed));
}

/**
 * @returns {{
 *   similarityThreshold: number,
 *   topK: number,
 *   maxK: number,
 *   overviewTopK: number,
 *   overviewSeedPages: number,
 *   overviewSeedLimit: number,
 * }}
 */
export function getRagRetrievalConfig() {
  const topK = clampNumber(
    process.env.RAG_TOP_K,
    DEFAULT_RAG_TOP_K,
    1,
    RAG_MAX_K,
  );

  return {
    similarityThreshold: clampNumber(
      process.env.RAG_SIMILARITY_THRESHOLD,
      DEFAULT_RAG_SIMILARITY_THRESHOLD,
      0,
      1,
    ),
    topK,
    maxK: RAG_MAX_K,
    overviewTopK: clampNumber(
      process.env.RAG_OVERVIEW_TOP_K,
      Math.max(topK, DEFAULT_RAG_OVERVIEW_TOP_K),
      1,
      RAG_MAX_K,
    ),
    overviewSeedPages: clampNumber(
      process.env.RAG_OVERVIEW_SEED_PAGES,
      DEFAULT_RAG_OVERVIEW_SEED_PAGES,
      0,
      20,
    ),
    overviewSeedLimit: clampNumber(
      process.env.RAG_OVERVIEW_SEED_LIMIT,
      DEFAULT_RAG_OVERVIEW_SEED_LIMIT,
      0,
      RAG_MAX_K,
    ),
  };
}

/**
 * Normalize a requested top-k against RAG defaults and max.
 * @param {unknown} requestedK
 * @param {number} [defaultK]
 * @returns {number}
 */
export function normalizeRagTopK(requestedK, defaultK) {
  const { topK, maxK } = getRagRetrievalConfig();
  const fallback = Number.isFinite(Number(defaultK)) ? Number(defaultK) : topK;
  const parsed = Number(requestedK);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(maxK, Math.max(1, Math.trunc(parsed)));
}
