import { safeExecute } from "../../../../../db/db.config.js";
import { BadRequestError } from "../../../../utils/errors/index.js";

/**
 * Maps a raw documents table row to the full API response shape.
 * Assumes that row is not NULL or undefined.
 * @param row - database row from the documents table
 * @returns {Object} - document fields including storage_path and user_id
 */
export function mapDocumentToResponse(row) {
  return {
    document_id: row.document_id,
    title: row.title,
    mime_type: row.mime_type,
    byte_size: Number(row.byte_size),
    status: row.status,
    error_message: row.error_message,
    created_at: row.created_at,
    updated_at: row.updated_at,
    user_id: row.user_id,
    storage_path: row.storage_path,
  };
}

/**
 * Maps a document row to the public list-item shape without internal paths.
 * Assumes that row is not NULL or undefined.
 * @param row - database row from the documents table
 * @returns {Object} - document metadata safe for list views (no user_id or storage_path)
 */
export function mapDocumentToListItem(row) {
  const { user_id, storage_path, ...listItem } = mapDocumentToResponse(row);
  return listItem;
}

/**
 * Inserts a new document row with status "processing".
 * Assumes that userId, title, mimeType, storagePath, and byteSize are not NULL or undefined.
 * @param userId - ID of the document owner
 * @param title - original filename or display title
 * @param mimeType - MIME type of the uploaded file
 * @param storagePath - relative path to the file on disk
 * @param byteSize - file size in bytes
 * @returns {Promise<{insertId: number}>} - mysql insert result; throws BadRequestError with message "User does not exist" when userId is invalid
 */
export async function insertDocumentRecord({
  userId,
  title,
  mimeType,
  storagePath,
  byteSize,
}) {
  const sql = `
    INSERT INTO documents (
      user_id,
      title,
      mime_type,
      storage_path,
      byte_size,
      status
    )
    VALUES (?, ?, ?, ?, ?, 'processing')
  `;

  try {
    return await safeExecute(sql, [
      userId,
      title,
      mimeType,
      storagePath,
      byteSize,
    ]);
  } catch (error) {
    if (error?.code === "ER_NO_REFERENCED_ROW_2") {
      throw new BadRequestError("User does not exist");
    }

    throw error;
  }
}

/**
 * Fetches one document row by primary key.
 * Assumes that documentId is not NULL or undefined.
 * @param documentId - numeric ID of the document
 * @returns {Promise<Object|null>} - raw document row, or null when not found
 */
export async function fetchDocumentById(documentId) {
  const sql = `
    SELECT
      document_id,
      user_id,
      title,
      mime_type,
      storage_path,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at
    FROM documents
    WHERE document_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [documentId]);
  return rows[0] ?? null;
}

/**
 * Lists all documents owned by a user, newest first.
 * Assumes that userId is not NULL or undefined.
 * @param userId - ID of the document owner
 * @returns {Promise<Array>} - array of document list-item rows
 */
export async function fetchDocumentsByUserId(userId) {
  const sql = `
    SELECT
      document_id,
      title,
      mime_type,
      byte_size,
      status,
      error_message,
      created_at,
      updated_at
    FROM documents
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  return safeExecute(sql, [userId]);
}

/**
 * Updates processing status and optional error message for a document.
 * Assumes that documentId and status are not NULL or undefined.
 * @param documentId - numeric ID of the document
 * @param status - new status value such as "ready" or "failed"
 * @param errorMessage - optional failure reason stored when status is "failed"
 * @returns {Promise<void>}
 */
export async function updateDocumentStatus({
  documentId,
  status,
  errorMessage = null,
}) {
  const sql = `
    UPDATE documents
    SET status = ?, error_message = ?
    WHERE document_id = ?
  `;

  await safeExecute(sql, [status, errorMessage, documentId]);
}

/**
 * Permanently deletes a document row by primary key.
 * Assumes that documentId is not NULL or undefined.
 * @param documentId - numeric ID of the document to delete
 * @returns {Promise<void>}
 */
export async function deleteDocumentById(documentId) {
  const sql = `
    DELETE FROM documents
    WHERE document_id = ?
  `;

  await safeExecute(sql, [documentId]);
}

/**
 * Deletes all text chunks belonging to a document.
 * Assumes that documentId is not NULL or undefined.
 * @param documentId - numeric ID of the parent document
 * @returns {Promise<void>}
 */
export async function deleteDocumentChunksByDocumentId(documentId) {
  const sql = `
    DELETE FROM document_chunks
    WHERE document_id = ?
  `;

  await safeExecute(sql, [documentId]);
}

/**
 * Inserts one text chunk row for a document.
 * Assumes that documentId, chunkIndex, content, pageStart, and pageEnd are not NULL or undefined.
 * @param documentId - numeric ID of the parent document
 * @param chunkIndex - zero-based order of the chunk within the document
 * @param content - chunk text content
 * @param pageStart - first PDF page number covered by the chunk
 * @param pageEnd - last PDF page number covered by the chunk
 * @returns {Promise<number>} - insertId of the new chunk row
 */
export async function insertDocumentChunk({
  documentId,
  chunkIndex,
  content,
  pageStart,
  pageEnd,
}) {
  const sql = `
    INSERT INTO document_chunks (
      document_id,
      chunk_index,
      content,
      page_start,
      page_end
    )
    VALUES (?, ?, ?, ?, ?)
  `;

  const result = await safeExecute(sql, [
    documentId,
    chunkIndex,
    content,
    pageStart,
    pageEnd,
  ]);
  return result.insertId;
}

/**
 * Stores the embedding vector for a document chunk.
 * Assumes that chunkId, sourceText, and embedding are not NULL or undefined.
 * @param chunkId - numeric ID of the chunk row
 * @param sourceText - normalized text that was embedded
 * @param embedding - numeric vector returned by the embedding API
 * @returns {Promise<void>}
 */
export async function insertDocumentChunkVector({ chunkId, sourceText, embedding }) {
  const sql = `
    INSERT INTO document_chunk_vectors (
      chunk_id,
      source_text,
      embedding,
      status
    )
    VALUES (?, ?, ?, 'ready')
  `;

  await safeExecute(sql, [chunkId, sourceText, JSON.stringify(embedding)]);
}

/**
 * Loads ready chunk vectors for a document, skipping rows with invalid embeddings.
 * Assumes that documentId is not NULL or undefined.
 * @param documentId - numeric ID of the document
 * @returns {Promise<Array<{chunkId: number, chunkIndex: number, content: string, embedding: Array<number>}>>} - parsed chunk vectors ordered by chunk_index
 */
export async function fetchReadyChunkVectorsByDocumentId(documentId) {
  const sql = `
    SELECT
      dc.chunk_id,
      dc.chunk_index,
      dc.content,
      dcv.embedding
    FROM document_chunks dc
    INNER JOIN document_chunk_vectors dcv ON dcv.chunk_id = dc.chunk_id
    WHERE dc.document_id = ?
      AND dcv.status = 'ready'
    ORDER BY dc.chunk_index ASC
  `;

  const rows = await safeExecute(sql, [documentId]);
  const chunkVectors = [];

  for (const row of rows) {
    try {
      const embedding =
        typeof row.embedding === "string"
          ? JSON.parse(row.embedding)
          : row.embedding;

      if (
        !Array.isArray(embedding) ||
        embedding.length === 0 ||
        !embedding.every((value) => typeof value === "number" && !Number.isNaN(value))
      ) {
        console.warn(
          `Skipping chunk ${row.chunk_id}: invalid embedding for document ${documentId}`,
        );
        continue;
      }

      chunkVectors.push({
        chunkId: row.chunk_id,
        chunkIndex: row.chunk_index,
        content: row.content,
        embedding,
      });
    } catch (parseError) {
      console.warn(
        `Skipping chunk ${row.chunk_id}: failed to parse embedding JSON`,
        parseError,
      );
    }
  }

  return chunkVectors;
}
