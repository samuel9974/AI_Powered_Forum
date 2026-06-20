import { safeExecute } from "../../../../../db/db.config.js";
import { NotFoundError } from "../../../../utils/errors/index.js";

/**
 * Retrieves the owner of a specific question.
 */
export async function getQuestionOwner(questionId) {
  const rows = await safeExecute(
    "SELECT question_id, user_id FROM questions WHERE question_id = ? LIMIT 1",
    [questionId],
  );

  if (rows.length === 0) {
    throw new NotFoundError("Question not found");
  }

  return rows[0];
}
