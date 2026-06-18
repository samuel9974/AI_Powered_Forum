import { assertUserOwnsDocument } from "./shared/document-access.js";
import { mapDocumentToResponse } from "./shared/document.repository.js";

/**
 * Fetch metadata for a single document owned by the authenticated user.
 * Returns any document status (processing, ready, failed, etc.).
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.documentId
 * @returns {Promise<Object>} Formatted document metadata
 * @throws {NotFoundError} If the document is missing or not owned by the user
 */
export async function getDocumentMetaService({ userId, documentId }) {
  const document = await assertUserOwnsDocument(userId, documentId);
  return mapDocumentToResponse(document);
}
