/**
 * Near-duplicate filtering for overview retrieval (lightweight MMR substitute).
 */

/**
 * Tokenize excerpt text for Jaccard similarity.
 * @param {string} text
 * @returns {Set<string>}
 */
export function tokenizeForOverlap(text) {
  return new Set(
    String(text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((token) => token.length > 2),
  );
}

/**
 * Jaccard similarity between two token sets.
 * @param {Set<string>} a
 * @param {Set<string>} b
 * @returns {number}
 */
export function jaccardSimilarity(a, b) {
  if (!a.size && !b.size) {
    return 1;
  }
  if (!a.size || !b.size) {
    return 0;
  }

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

/**
 * Select up to `limit` hits, skipping near-duplicates of already chosen excerpts.
 * @param {Array<{ excerpt: string, chunkId?: number }>} rankedHits - highest score first
 * @param {number} limit
 * @param {number} [maxOverlap=0.82]
 * @param {Set<string>[]} [seedTokenSets] - token sets of already-selected excerpts (e.g. seeds) to dedupe against
 * @returns {Array}
 */
export function diversifyRankedHits(
  rankedHits,
  limit,
  maxOverlap = 0.82,
  seedTokenSets = [],
) {
  const selected = [];
  const selectedTokens = [...seedTokenSets];

  for (const hit of rankedHits || []) {
    if (selected.length >= limit) {
      break;
    }

    const tokens = tokenizeForOverlap(hit.excerpt);
    const isDuplicate = selectedTokens.some(
      (existing) => jaccardSimilarity(existing, tokens) >= maxOverlap,
    );

    if (isDuplicate) {
      continue;
    }

    selected.push(hit);
    selectedTokens.push(tokens);
  }

  return selected;
}

/**
 * Merge early-page seed chunks with similarity hits for overview coverage.
 * Seeds are prepended (document order), then diversified similarity fills remaining slots.
 *
 * @param {Object} params
 * @param {Array} params.rankedHits - threshold-filtered similarity hits, score desc
 * @param {Array} params.allChunks - full chunk list for the document (with page/chunkIndex)
 * @param {number} params.limit - final result size
 * @param {number} params.seedPages - include chunks whose pageStart <= this
 * @param {number} params.seedLimit - max seed chunks to inject
 * @param {number} [params.maxOverlap]
 * @returns {Array}
 */
export function mergeOverviewHits({
  rankedHits,
  allChunks,
  limit,
  seedPages,
  seedLimit,
  maxOverlap = 0.82,
}) {
  const safeLimit = Math.max(1, limit);
  const safeSeedLimit = Math.max(0, seedLimit);
  const safeSeedPages = Math.max(0, seedPages);

  const seeds = (allChunks || [])
    .filter((chunk) => {
      const page = Number(chunk.pageStart);
      return Number.isInteger(page) && page >= 1 && page <= safeSeedPages;
    })
    .sort((a, b) => a.chunkIndex - b.chunkIndex)
    .slice(0, safeSeedLimit)
    .map((chunk) => {
      const ranked = (rankedHits || []).find(
        (hit) => hit.chunkId === chunk.chunkId,
      );
      return {
        chunkId: chunk.chunkId,
        chunkIndex: chunk.chunkIndex,
        excerpt: chunk.content ?? chunk.excerpt,
        pageStart: chunk.pageStart ?? null,
        pageEnd: chunk.pageEnd ?? null,
        score: ranked?.score ?? 0,
        seed: true,
      };
    });

  const selectedIds = new Set(seeds.map((item) => item.chunkId));
  const seedTokenSets = seeds.map((seed) => tokenizeForOverlap(seed.excerpt));
  const remainingSlots = Math.max(0, safeLimit - seeds.length);
  const fillers = diversifyRankedHits(
    (rankedHits || []).filter((hit) => !selectedIds.has(hit.chunkId)),
    remainingSlots,
    maxOverlap,
    seedTokenSets,
  ).map((hit) => ({ ...hit, seed: false }));

  return [...seeds, ...fillers].slice(0, safeLimit);
}
