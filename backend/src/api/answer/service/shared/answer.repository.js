import { safeExecute } from "../../../../../db/db.config.js";
import { NotFoundError } from "../../../../utils/errors/index.js";

/**
 * Maps a raw database row to the public answer response shape.
 * Assumes that row is not NULL or undefined.
 * @param row - database row with answer and author fields
 * @returns {{id: number, questionId: number, content: string, createdAt: Date, updatedAt: Date, author: {id: number, firstName: string, lastName: string}}} - formatted answer object
 */
function mapAnswer(row) {
  return {
    id: row.id,
    questionId: row.questionId,
    content: row.content,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    author: {
      id: row.userId,
      firstName: row.firstName,
      lastName: row.lastName,
    },
  };
}

/**
 * Retrieves a single answer by its ID, including author details.
 * Assumes that answerId is not NULL or undefined.
 * @param answerId - numeric ID of the answer to fetch
 * @returns {Promise<{id: number, questionId: number, content: string, createdAt: Date, updatedAt: Date, author: {id: number, firstName: string, lastName: string}}>} - the answer with author info; throws NotFoundError with message "Answer not found" if no matching row exists
 */
export async function getSingleAnswerById(answerId) {
  const sql = `
    SELECT
      a.answer_id AS id,
      a.question_id AS questionId,
      a.content,
      a.created_at AS createdAt,
      a.updated_at AS updatedAt,
      u.user_id AS userId,
      u.first_name AS firstName,
      u.last_name AS lastName
    FROM answers a
    JOIN users u ON u.user_id = a.user_id
    WHERE a.answer_id = ?
    LIMIT 1
  `;

  const rows = await safeExecute(sql, [answerId]);

  if (rows.length === 0) {
    throw new NotFoundError("Answer not found");
  }

  return mapAnswer(rows[0]);
}
