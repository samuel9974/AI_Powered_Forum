import { getSingleAnswerById } from "./shared/answer.repository.js";

/**
 * Retrieves a single answer by its ID for the GET /api/answers/:answerId endpoint.
 * Assumes that answerId is not NULL or undefined.
 * @param answerId - numeric ID of the answer to fetch
 * @returns {Promise<{id: number, questionId: number, content: string, createdAt: Date, updatedAt: Date, author: {id: number, firstName: string, lastName: string}}>} - the answer with author info; throws NotFoundError with message "Answer not found" if no matching row exists
 */
export async function getSingleAnswerService({ answerId }) {
  return getSingleAnswerById(answerId);
}
