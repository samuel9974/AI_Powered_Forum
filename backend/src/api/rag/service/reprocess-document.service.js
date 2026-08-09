import { BadRequestError } from "../../../utils/errors/index.js";
import { assertUserOwnsDocument } from "./shared/document-access.js";
import { resolveDocumentAbsolutePath } from "./shared/document-path.js";
import {
  deleteDocumentChunksByDocumentId,
  fetchDocumentById,
  mapDocumentToResponse,
  updateDocumentStatus,
} from "./shared/document.repository.js";
import { processDocumentContent } from "./shared/process-document-content.js";

/**
 * Re-chunk and re-embed an existing uploaded PDF without re-uploading the file.
 * Clears old chunks/vectors, then runs the current ingest pipeline.
 *
 * @param {Object} params
 * @param {number} params.userId
 * @param {number} params.documentId
 * @returns {Promise<Object>} updated document response
 */
export async function reprocessDocumentService({ userId, documentId }) {
  const document = await assertUserOwnsDocument(userId, documentId);

  if (document.status === "processing") {
    throw new BadRequestError(
      "Document is already processing. Wait for it to finish, then try again.",
    );
  }

  const absolutePath = resolveDocumentAbsolutePath(document.storage_path);

  await updateDocumentStatus({
    documentId,
    status: "processing",
    errorMessage: null,
  });

  try {
    await deleteDocumentChunksByDocumentId(documentId);
    await processDocumentContent(documentId, absolutePath);
    await updateDocumentStatus({
      documentId,
      status: "ready",
      errorMessage: null,
    });
  } catch (error) {
    try {
      await deleteDocumentChunksByDocumentId(documentId);
    } catch (cleanupError) {
      console.error(
        `Failed to remove partial chunks after reprocess failure for document ${documentId}:`,
        cleanupError,
      );
    }

    await updateDocumentStatus({
      documentId,
      status: "failed",
      errorMessage: error.message,
    });

    const failedDocument = await fetchDocumentById(documentId);
    if (!failedDocument) {
      throw error;
    }

    return mapDocumentToResponse(failedDocument);
  }

  const readyDocument = await fetchDocumentById(documentId);
  if (!readyDocument) {
    throw new Error("Failed to load document after reprocessing.");
  }

  return mapDocumentToResponse(readyDocument);
}
