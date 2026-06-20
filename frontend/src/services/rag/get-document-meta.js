import { apiClient } from '../core/api.client.js';
import { handleRagError } from './shared/handle-rag-error.js';
import { mapDocumentFromApi } from './shared/map-document.js';

/**
 * GET /api/rag/documents/:documentId — fetch metadata for one document.
 * @param {number|string} documentId
 * @returns {Promise<Object>}
 */
export async function getDocumentMeta(documentId) {
  try {
    const response = await apiClient.get(`/api/rag/documents/${documentId}`);
    return mapDocumentFromApi(response.data.data);
  } catch (error) {
    throw handleRagError(error);
  }
}
