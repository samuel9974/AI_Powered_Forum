import {
  findSimilarQuestionsByText,
  getVectorConfig,
  normalizeQuestionText,
} from "./vector.service.js";

/**
 * Performs semantic search on questions using vector similarity.
 */
export async function searchQuestionsSemanticService({
  query,
  k = 5,
  threshold,
}) {
  const sourceText = normalizeQuestionText({ title: query });
  const vectorConfig = getVectorConfig();

  const searchThreshold =
    threshold !== undefined ? threshold : vectorConfig.recommendThreshold;

  const result = await findSimilarQuestionsByText({
    sourceText,
    threshold: searchThreshold,
    k,
  });

  return {
    data: result.similarQuestions,
    meta: {
      query,
      k,
      threshold: searchThreshold,
      total: result.similarQuestions.length,
    },
  };
}
