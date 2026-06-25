import { safeExecute } from "../../../../db/db.config.js";
import { assertUserOwnsAnswer } from "./shared/answer-access.js";
import { getSingleAnswerById } from "./shared/answer.repository.js";

/**
 * Updates the content of an answer owned by the authenticated user.
 * Assumes that userId, answerId, and content are not NULL or undefined.
 * @param userId - ID of the authenticated user making the update
 * @param answerId - numeric ID of the answer to update
 * @param content - new answer body text
 * @returns {Promise<{id: number, questionId: number, content: string, createdAt: Date, updatedAt: Date, author: {id: number, firstName: string, lastName: string}}>} - the updated answer; throws NotFoundError with message "Answer not found" if the answer does not exist or is not owned by userId
 */
export async function updateAnswerService({ userId, answerId, content }) {
  await assertUserOwnsAnswer(userId, answerId);

  await safeExecute("UPDATE answers SET content = ? WHERE answer_id = ?", [
    content,
    answerId,
  ]);

  return getSingleAnswerById(answerId);
}
