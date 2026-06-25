import { apiClient } from '../core/api.client.js';
import { handleRagError } from './shared/handle-rag-error.js';

/**
 * GET /api/rag/documents/:documentId/file — fetches the PDF and returns a temporary object URL.
 * Caller must revoke with URL.revokeObjectURL when done.
 * Assumes that documentId is not NULL or undefined.
 * @param documentId - numeric ID of the RAG document
 * @returns {Promise<string>} - blob object URL for the PDF; throws Error from handleRagError on network or backend failure
 */
export async function fetchPdfObjectUrl(documentId) {
  try {
    const response = await apiClient.get(
      `/api/rag/documents/${documentId}/file`,
      { responseType: 'blob' },
    );

    return URL.createObjectURL(response.data);
  } catch (error) {
    throw handleRagError(error);
  }
}
