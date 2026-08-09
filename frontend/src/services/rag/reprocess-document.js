import { apiClient } from '../core/api.client.js';
import { RAG_LONG_REQUEST_TIMEOUT_MS } from './shared/rag.constants.js';
import { handleRagError } from './shared/handle-rag-error.js';
import { mapDocumentFromApi } from './shared/map-document.js';

/**
 * POST /api/rag/documents/:documentId/reprocess — re-chunk/re-embed existing PDF.
 * @param {number|string} documentId
 * @returns {Promise<object>} updated document
 */
export async function reprocessDocument(documentId) {
  try {
    const response = await apiClient.post(
      `/api/rag/documents/${documentId}/reprocess`,
      {},
      { timeout: RAG_LONG_REQUEST_TIMEOUT_MS },
    );
    return mapDocumentFromApi(response.data.data);
  } catch (error) {
    throw handleRagError(error);
  }
}
