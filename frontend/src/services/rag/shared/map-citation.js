/**
 * Map a RAG citation from the API to frontend shape.
 */
export function mapCitationFromApi(citation) {
  return {
    ref: citation.ref,
    chunkIndex: citation.chunkIndex ?? citation.chunk_index,
  };
}
