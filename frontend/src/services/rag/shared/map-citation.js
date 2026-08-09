/**
 * Map a RAG citation from the API to frontend shape.
 */
export function mapCitationFromApi(citation) {
  const pageStart = citation.pageStart ?? citation.page_start ?? null;
  const pageEnd = citation.pageEnd ?? citation.page_end ?? null;

  return {
    ref: citation.ref,
    chunkIndex: citation.chunkIndex ?? citation.chunk_index,
    pageStart,
    pageEnd,
  };
}
