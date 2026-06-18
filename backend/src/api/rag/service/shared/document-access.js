import { BadRequestError, NotFoundError } from "../../../../utils/errors/index.js";
import { fetchDocumentById } from "./document.repository.js";

/**
 * Ensure the document exists and belongs to the authenticated user.
 *
 * @param {number} userId
 * @param {number} documentId
 * @returns {Promise<Object>} The document row
 * @throws {NotFoundError} If the document is missing or not owned by the user
 */
export async function assertUserOwnsDocument(userId, documentId) {
  const document = await fetchDocumentById(documentId);

  if (!document || document.user_id !== userId) {
    throw new NotFoundError("Document not found");
  }

  return document;
}

/**
 * Ensure the document exists, belongs to the user, and is ready for search.
 *
 * @param {number} userId
 * @param {number} documentId
 * @returns {Promise<Object>} The document row
 * @throws {NotFoundError} If the document is missing or not owned by the user
 * @throws {BadRequestError} If the document status is not `ready`
 */
export async function assertUserOwnsReadyDocument(userId, documentId) {
  const document = await assertUserOwnsDocument(userId, documentId);

  if (document.status !== "ready") {
    throw new BadRequestError("Document is not ready for search.");
  }

  return document;
}
