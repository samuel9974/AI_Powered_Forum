import { calculateCosineSimilarity } from "../../../question/service/vector.service.js";

/**
 * Score chunk vectors against a query embedding via cosine similarity.
 * Unsorted, unfiltered — skips (and reports via onInvalid) chunks whose
 * embedding cannot be compared instead of throwing.
 *
 * @param {Array<{ embedding: number[] }>} chunkVectors
 * @param {number[]} queryEmbedding
 * @param {{ onInvalid?: (chunk: object, error: Error) => void }} [options]
 * @returns {Array<object & { score: number }>}
 */
export function scoreChunksAgainstQuery(
  chunkVectors,
  queryEmbedding,
  { onInvalid } = {},
) {
  const scored = [];

  for (const chunk of chunkVectors) {
    try {
      const score = calculateCosineSimilarity(queryEmbedding, chunk.embedding);
      scored.push({ ...chunk, score });
    } catch (error) {
      onInvalid?.(chunk, error);
    }
  }

  return scored;
}
