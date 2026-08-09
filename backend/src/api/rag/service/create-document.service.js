import { BadRequestError } from "../../../utils/errors/index.js";
import {
  deleteDocumentChunksByDocumentId,
  fetchDocumentById,
  insertDocumentRecord,
  mapDocumentToResponse,
  updateDocumentStatus,
} from "./shared/document.repository.js";
import { processDocumentContent } from "./shared/process-document-content.js";

/**
 * Marks a document as failed, removes partial chunks, and records the error message.
 * @param {number} documentId
 * @param {Error} error
 * @returns {Promise<void>}
 */
async function markDocumentFailed(documentId, error) {
  try {
    await deleteDocumentChunksByDocumentId(documentId);
  } catch (cleanupError) {
    console.error(
      `Failed to remove partial chunks for document ${documentId}:`,
      cleanupError,
    );
  }

  await updateDocumentStatus({
    documentId,
    status: "failed",
    errorMessage: error.message,
  });
}

/**
 * Uploads, parses, chunks, embeds, and persists a PDF document for RAG.
 * @param {Object} params
 * @param {number} params.userId
 * @param {Object} params.file
 * @param {string} params.storagePath
 * @returns {Promise<Object>}
 */
export async function createDocumentFromUploadService({
  userId,
  file,
  storagePath,
}) {
  if (!file) {
    throw new BadRequestError("PDF file is required.");
  }

  if (!storagePath) {
    throw new BadRequestError("Uploaded file storage path is missing.");
  }

  const insertResult = await insertDocumentRecord({
    userId,
    title: file.originalname,
    mimeType: file.mimetype || "application/pdf",
    storagePath,
    byteSize: file.size,
  });

  const documentId = insertResult.insertId;

  try {
    await processDocumentContent(documentId, file.path);
    await updateDocumentStatus({
      documentId,
      status: "ready",
      errorMessage: null,
    });
  } catch (error) {
    await markDocumentFailed(documentId, error);

    const failedDocument = await fetchDocumentById(documentId);
    if (!failedDocument) {
      throw error;
    }

    return mapDocumentToResponse(failedDocument);
  }

  const readyDocument = await fetchDocumentById(documentId);

  if (!readyDocument) {
    throw new Error("Failed to load document after processing.");
  }

  return mapDocumentToResponse(readyDocument);
}
