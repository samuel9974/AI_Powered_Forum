import path from "path";
import { RAG_UPLOADS_ROOT } from "../../../../middleware/rag.upload.js";
import { NotFoundError } from "../../../../utils/errors/index.js";

/**
 * Resolve a stored relative path to an absolute path under RAG_UPLOADS_ROOT.
 *
 * @param {string} storagePath
 * @returns {string}
 * @throws {NotFoundError} If the resolved path escapes the uploads root
 */
export function resolveDocumentAbsolutePath(storagePath) {
  const uploadsRoot = path.resolve(RAG_UPLOADS_ROOT);
  const absolutePath = path.resolve(uploadsRoot, storagePath);
  const relativePath = path.relative(uploadsRoot, absolutePath);

  if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
    throw new NotFoundError("Document not found");
  }

  return absolutePath;
}
