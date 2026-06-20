import { apiClient } from '../core/api.client.js';
import { handleRagError } from './shared/handle-rag-error.js';

/**
 * GET /api/rag/documents/:documentId/file — PDF blob as a temporary object URL.
 * Caller must revoke with URL.revokeObjectURL when done.
 * @param {number|string} documentId
 * @returns {Promise<string>}
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
