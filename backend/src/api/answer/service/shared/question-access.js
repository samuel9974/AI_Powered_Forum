import { safeExecute } from "../../../../../db/db.config.js";
import { NotFoundError } from "../../../../utils/errors/index.js";

/**
 * Loads a question row to verify it exists before creating an answer.
 * Assumes that questionId is not NULL or undefined.
 * @param questionId - numeric ID of the question
 * @returns {Promise<{question_id: number, user_id: number}>} - the question owner row; throws NotFoundError with message "Question not found" if no matching question exists
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
