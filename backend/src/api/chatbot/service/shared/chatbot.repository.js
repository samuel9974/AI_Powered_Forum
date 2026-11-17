import db, { safeExecute } from "../../../../../db/db.config.js";

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
 * Replaces the stored knowledge base in one transaction.
 * Embeddings must already be generated. A failure rolls back to the previous rows.
 * @param {Array<{chunkIndex: number, content: string, embedding: Array<number>}>} rows
 * @returns {Promise<void>}
 */
export async function replaceStoredChunks(rows) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute("DELETE FROM chatbot_chunks");
    const sql = `
      INSERT INTO chatbot_chunks (chunk_index, content, embedding)
      VALUES (?, ?, ?)
    `;
    for (const row of rows) {
      await connection.execute(sql, [
        row.chunkIndex,
        row.content,
        JSON.stringify(row.embedding),
      ]);
    }
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
