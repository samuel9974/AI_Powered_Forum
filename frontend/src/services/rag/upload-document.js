import { apiClient } from '../core/api.client.js';
import {
  RAG_LONG_REQUEST_TIMEOUT_MS,
  RAG_UPLOAD_FIELD_NAME,
} from './shared/rag.constants.js';
import { handleRagError } from './shared/handle-rag-error.js';
import { mapDocumentFromApi } from './shared/map-document.js';

/**
 * POST /api/rag/documents — upload and process a PDF for RAG.
 * @param {File} file
 * @returns {Promise<Object>}
 */
export async function uploadPdf(file) {
  try {
    const formData = new FormData();
    formData.append(RAG_UPLOAD_FIELD_NAME, file);

    const response = await apiClient.post('/api/rag/documents', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: RAG_LONG_REQUEST_TIMEOUT_MS,
    });

    return mapDocumentFromApi(response.data.data);
  } catch (error) {
    throw handleRagError(error);
  }
}
