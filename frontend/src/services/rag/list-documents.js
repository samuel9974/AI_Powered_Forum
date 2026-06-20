import { apiClient } from '../core/api.client.js';
import { handleRagError } from './shared/handle-rag-error.js';
import { mapDocumentFromApi } from './shared/map-document.js';

/**
 * GET /api/rag/documents — list all documents for the signed-in user.
 * @returns {Promise<Array>}
 */
export async function listDocuments() {
  try {
    const response = await apiClient.get('/api/rag/documents');
    const rows = response.data.data ?? [];
    return Array.isArray(rows) ? rows.map(mapDocumentFromApi) : [];
  } catch (error) {
    throw handleRagError(error);
  }
}
