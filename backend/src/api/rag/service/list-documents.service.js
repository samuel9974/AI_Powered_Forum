import {
  fetchDocumentsByUserId,
  mapDocumentToListItem,
} from "./shared/document.repository.js";

/**
 * List all documents owned by the authenticated user, newest first.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @returns {Promise<Object[]>} Formatted document list items
 */
export async function listDocumentsForUserService({ userId }) {
  const rows = await fetchDocumentsByUserId(userId);
  return rows.map(mapDocumentToListItem);
}
