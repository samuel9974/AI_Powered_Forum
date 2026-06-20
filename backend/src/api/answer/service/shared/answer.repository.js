import { safeExecute } from "../../../../../db/db.config.js";
import { NotFoundError } from "../../../../utils/errors/index.js";

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
 * Retrieves a single answer by its ID.
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
