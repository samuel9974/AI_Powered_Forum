import { apiClient } from '../core/api.client.js';
import { handleRagError } from './shared/handle-rag-error.js';

/**
 * DELETE /api/rag/documents/:documentId — remove a document and its PDF.
 * @param {number|string} documentId
 * @returns {Promise<{ id: number }>}
 */
export async function deleteDocument(documentId) {
  try {
    const response = await apiClient.delete(`/api/rag/documents/${documentId}`);
    const data = response.data.data ?? {};
    return { id: data.id ?? Number(documentId) };
  } catch (error) {
    throw handleRagError(error);
  }
}
