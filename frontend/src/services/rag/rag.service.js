import { deleteDocument } from './delete-document.js';
import { fetchPdfObjectUrl } from './fetch-document-pdf.js';
import { getDocumentMeta } from './get-document-meta.js';
import { listDocuments } from './list-documents.js';
import { queryDocument } from './query-document.js';
import { searchInDocument } from './search-in-document.js';
import { uploadPdf } from './upload-document.js';

/**
 * RAG API facade — each method lives in its own module; import those directly
 * when you only need one endpoint, or use this object from pages/components.
 */
export const ragService = {
  listDocuments,
  uploadPdf,
  getDocumentMeta,
  deleteDocument,
  searchInDocument,
  queryDocument,
  fetchPdfObjectUrl,
};

export { deleteDocument } from './delete-document.js';
export { fetchPdfObjectUrl } from './fetch-document-pdf.js';
export { getDocumentMeta } from './get-document-meta.js';
export { listDocuments } from './list-documents.js';
export { queryDocument } from './query-document.js';
export { searchInDocument } from './search-in-document.js';
export { uploadPdf } from './upload-document.js';
