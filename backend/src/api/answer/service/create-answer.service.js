import { safeExecute } from "../../../../db/db.config.js";
import { BadRequestError } from "../../../utils/errors/index.js";
import { getSingleAnswerById } from "./shared/answer.repository.js";
import { getQuestionOwner } from "./shared/question-access.js";

/**
 * Creates a new answer on an existing question for the authenticated user.
 * Assumes that questionId, userId, and content are not NULL or undefined.
 * @param questionId - numeric ID of the question being answered
 * @param userId - ID of the authenticated user posting the answer
 * @param content - answer body text
 * @returns {Promise<{id: number, questionId: number, content: string, createdAt: Date, updatedAt: Date, author: {id: number, firstName: string, lastName: string}}>} - the newly created answer; throws NotFoundError with message "Question not found" if questionId is invalid, or BadRequestError with message "You cannot answer your own question" if the user owns the question
 */
export async function createAnswerService({ questionId, userId, content }) {
  const question = await getQuestionOwner(questionId);

  if (question.user_id === userId) {
    throw new BadRequestError("You cannot answer your own question");
  }

  const insertSql =
    "INSERT INTO answers (question_id, user_id, content) VALUES (?, ?, ?)";

  const result = await safeExecute(insertSql, [questionId, userId, content]);

  return getSingleAnswerById(result.insertId);
}
