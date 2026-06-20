/**
 * Map a semantic search hit from the API to frontend shape.
 */
export function mapSearchResultFromApi(result) {
  return {
    chunkId: result.chunkId ?? result.chunk_id,
    chunkIndex: result.chunkIndex ?? result.chunk_index,
    score: Number(result.score ?? 0),
    excerpt: result.excerpt ?? '',
  };
}
