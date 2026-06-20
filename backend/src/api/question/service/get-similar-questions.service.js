import { safeExecute } from "../../../../db/db.config.js";
import { NotFoundError } from "../../../utils/errors/index.js";
import {
  findSimilarQuestionsByQuestionId,
  getVectorConfig,
} from "./vector.service.js";

/**
 * Retrieves questions similar to an existing question.
 */
export async function getSimilarQuestionsService({
  questionHash,
  k = 5,
  threshold,
}) {
  const questionRows = await safeExecute(
    "SELECT question_id AS id FROM questions WHERE question_hash = ? LIMIT 1",
    [questionHash],
  );

  if (questionRows.length === 0) {
    throw new NotFoundError("Question not found");
  }

  const questionId = questionRows[0].id;
  const vectorConfig = getVectorConfig();

  const searchThreshold =
    threshold !== undefined ? threshold : vectorConfig.recommendThreshold;

  const similarQuestions = await findSimilarQuestionsByQuestionId({
    questionId,
    threshold: searchThreshold,
    k,
  });

  return {
    data: similarQuestions,
    meta: {
      total: similarQuestions.length,
      k,
      threshold: searchThreshold,
      query: null,
      questionHash,
    },
  };
}
