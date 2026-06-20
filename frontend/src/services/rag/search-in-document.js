import { apiClient } from '../core/api.client.js';
import { handleRagError } from './shared/handle-rag-error.js';
import { mapSearchResultFromApi } from './shared/map-search-result.js';

/**
 * GET /api/rag/documents/:documentId/search — semantic search in one document.
 * @param {number|string} documentId
 * @param {string} query
 * @param {{ k?: number }} [options]
 * @returns {Promise<{ query: string, results: Array }>}
 */
export async function searchInDocument(documentId, query, options = {}) {
  try {
    const response = await apiClient.get(
      `/api/rag/documents/${documentId}/search`,
      {
        params: {
          query: query.trim(),
          ...options,
        },
      },
    );

    const data = response.data.data ?? {};
    const results = Array.isArray(data.results) ? data.results : [];

    return {
      query: data.query ?? query.trim(),
      results: results.map(mapSearchResultFromApi),
    };
  } catch (error) {
    throw handleRagError(error);
  }
}
