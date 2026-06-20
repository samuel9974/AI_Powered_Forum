import { apiClient } from '../core/api.client.js';
import { RAG_LONG_REQUEST_TIMEOUT_MS } from './shared/rag.constants.js';
import { handleRagError } from './shared/handle-rag-error.js';
import { mapCitationFromApi } from './shared/map-citation.js';

/**
 * POST /api/rag/documents/:documentId/query — grounded AI answer for one document.
 * @param {number|string} documentId
 * @param {string} query
 * @returns {Promise<{ answer: string, citations: Array, chunksUsed: number[] }>}
 */
export async function queryDocument(documentId, query) {
  try {
    const response = await apiClient.post(
      `/api/rag/documents/${documentId}/query`,
      { query: query.trim() },
      { timeout: RAG_LONG_REQUEST_TIMEOUT_MS },
    );

    const data = response.data.data ?? {};
    const citations = Array.isArray(data.citations) ? data.citations : [];
    const chunksUsed = Array.isArray(data.chunksUsed) ? data.chunksUsed : [];

    return {
      answer: data.answer ?? '',
      citations: citations.map(mapCitationFromApi),
      chunksUsed,
    };
  } catch (error) {
    throw handleRagError(error);
  }
}
