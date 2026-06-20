import { safeExecute } from "../../../../db/db.config.js";
import { BadRequestError } from "../../../utils/errors/index.js";
import { getSingleAnswerById } from "./shared/answer.repository.js";
import { getQuestionOwner } from "./shared/question-access.js";

/**
 * Creates an answer for an existing question.
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
