import { safeExecute } from "../../../../../db/db.config.js";
import { NotFoundError } from "../../../../utils/errors/index.js";

/**
 * Verifies that an answer exists and belongs to the given user before mutating it.
 * Assumes that userId and answerId are not NULL or undefined.
 * @param userId - ID of the authenticated user
 * @param answerId - numeric ID of the answer to authorize
 * @returns {Promise<{answer_id: number, question_id: number, user_id: number}>} - the matching answer row; throws NotFoundError with message "Answer not found" if the answer is missing or owned by a different user
 */
export async function assertUserOwnsAnswer(userId, answerId) {
  const rows = await safeExecute(
    "SELECT answer_id, question_id, user_id FROM answers WHERE answer_id = ? LIMIT 1",
    [answerId],
  );

  if (rows.length === 0 || rows[0].user_id !== userId) {
    throw new NotFoundError("Answer not found");
  }

  return rows[0];
}
