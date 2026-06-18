import { safeExecute } from "../../../../../db/db.config.js";
import { BadRequestError } from "../../../../utils/errors/index.js";

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

export function mapDocumentToListItem(row) {
  const { user_id, storage_path, ...listItem } = mapDocumentToResponse(row);
  return listItem;
}

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

export async function deleteDocumentById(documentId) {
  const sql = `
    DELETE FROM documents
    WHERE document_id = ?
  `;

  await safeExecute(sql, [documentId]);
}

export async function deleteDocumentChunksByDocumentId(documentId) {
  const sql = `
    DELETE FROM document_chunks
    WHERE document_id = ?
  `;

  await safeExecute(sql, [documentId]);
}

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
