import fs from "fs/promises";
import { assertUserOwnsDocument } from "./shared/document-access.js";
import { resolveDocumentAbsolutePath } from "./shared/document-path.js";
import { deleteDocumentById } from "./shared/document.repository.js";

/**
 * Delete a document owned by the authenticated user from disk and the database.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.documentId
 * @returns {Promise<{ id: number }>}
 * @throws {NotFoundError} If the document is missing or not owned by the user
 */
export async function deleteDocumentService({ userId, documentId }) {
  const document = await assertUserOwnsDocument(userId, documentId);
  const absolutePath = resolveDocumentAbsolutePath(document.storage_path);

  try {
    await fs.unlink(absolutePath);
  } catch (error) {
    if (error?.code !== "ENOENT") {
      throw error;
    }
  }

  await deleteDocumentById(documentId);

  return { id: documentId };
}
