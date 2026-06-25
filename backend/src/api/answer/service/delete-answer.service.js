import { safeExecute } from "../../../../db/db.config.js";
import { assertUserOwnsAnswer } from "./shared/answer-access.js";

/**
 * Permanently deletes an answer owned by the authenticated user.
 * Assumes that userId and answerId are not NULL or undefined.
 * @param userId - ID of the authenticated user requesting deletion
 * @param answerId - numeric ID of the answer to delete
 * @returns {Promise<{id: number}>} - confirmation object with the deleted answer ID; throws NotFoundError with message "Answer not found" if the answer does not exist or is not owned by userId
 */
export async function deleteAnswerService({ userId, answerId }) {
  await assertUserOwnsAnswer(userId, answerId);

  await safeExecute("DELETE FROM answers WHERE answer_id = ?", [answerId]);

  return { id: answerId };
}
