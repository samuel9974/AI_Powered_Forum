import fs from "fs/promises";
import { NotFoundError } from "../../../utils/errors/index.js";
import { assertUserOwnsDocument } from "./shared/document-access.js";
import { resolveDocumentAbsolutePath } from "./shared/document-path.js";

/**
 * Resolve the on-disk PDF path for a document owned by the authenticated user.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.documentId
 * @returns {Promise<{ absolutePath: string, mimeType: string }>}
 * @throws {NotFoundError} If the document is missing, not owned, or file is absent
 */
export async function getDocumentFileService({ userId, documentId }) {
  const document = await assertUserOwnsDocument(userId, documentId);
  const absolutePath = resolveDocumentAbsolutePath(document.storage_path);

  try {
    await fs.access(absolutePath);
  } catch {
    throw new NotFoundError("Document not found");
  }

  return {
    absolutePath,
    mimeType: document.mime_type || "application/pdf",
  };
}
