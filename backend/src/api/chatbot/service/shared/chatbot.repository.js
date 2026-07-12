import { safeExecute } from "../../../../../db/db.config.js";

/**
 * Parses a stored embedding value into a numeric array.
 * @param {string|Array<number>|null|undefined} embedding
 * @returns {Array<number>}
 */
export function parseEmbedding(embedding) {
  if (!embedding) return [];
  if (typeof embedding === "string") {
    try {
      return JSON.parse(embedding);
    } catch {
      return [];
    }
  }
  return embedding;
}

/**
 * Returns the total number of ingested chatbot chunks.
 * @returns {Promise<number>}
 */
export async function countStoredChunks() {
  const rows = await safeExecute(
    "SELECT COUNT(*) AS total FROM chatbot_chunks",
    [],
  );
  return Number(rows[0]?.total ?? 0);
}

/**
 * Loads all stored chatbot chunks with embeddings, ordered by chunk index.
 * @returns {Promise<Array<{chunk_id: number, chunk_index: number, content: string, embedding: string|Array<number>}>>}
 */
export async function fetchAllChunksWithEmbeddings() {
  const sql = `
    SELECT chunk_id, chunk_index, content, embedding
    FROM chatbot_chunks
    ORDER BY chunk_index ASC
  `;
  return await safeExecute(sql, []);
}

/**
 * Removes all ingested chatbot chunks.
 * @returns {Promise<void>}
 */
export async function clearStoredChunks() {
  await safeExecute("DELETE FROM chatbot_chunks", []);
}

/**
 * Inserts or updates one chatbot chunk row.
 * @param {Object} params
 * @param {number} params.chunkIndex
 * @param {string} params.content
 * @param {Array<number>} params.embedding
 * @returns {Promise<void>}
 */
export async function insertChunk({ chunkIndex, content, embedding }) {
  const sql = `
    INSERT INTO chatbot_chunks (chunk_index, content, embedding)
    VALUES (?, ?, ?)
    ON DUPLICATE KEY UPDATE
      content = VALUES(content),
      embedding = VALUES(embedding)
  `;
  await safeExecute(sql, [chunkIndex, content, JSON.stringify(embedding)]);
}
