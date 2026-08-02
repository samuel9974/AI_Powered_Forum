import { apiClient } from '../core/api.client.js';

/**
 * Normalizes axios failures from answer API calls into user-facing Error objects.
 * Assumes that error is not NULL or undefined.
 * @param error - axios error, possibly without a response
 * @returns {Error} - message such as "Request timed out. Please try again.", "Unable to connect to server. Please check your internet connection.", or the backend msg/message field
 */
function handleAnswerError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error(
      'Unable to connect to server. Please check your internet connection.',
    );
  }

  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  return new Error(backendMessage || 'Answer request failed. Please try again.');
}

/**
 * Posts a new answer to a question via POST /api/answers.
 * Assumes that questionId and content are not NULL or undefined.
 * @param questionId - numeric ID of the question being answered
 * @param content - answer body text
 * @returns {Promise<Object|null>} - created answer data from the API; throws Error from handleAnswerError on network or backend failure
 */
async function postAnswer({ questionId, content }) {
  try {
    const response = await apiClient.post('/api/answers', {
      questionId,
      content,
    });
    return response.data.data ?? null;
  } catch (error) {
    throw handleAnswerError(error);
  }
}

/**
 * Fetches a single answer via GET /api/answers/:answerId.
 * Assumes that answerId is not NULL or undefined.
 * @param answerId - numeric ID of the answer
 * @returns {Promise<Object|null>} - answer data from the API; throws Error from handleAnswerError on network or backend failure
 */
async function getAnswer(answerId) {
  try {
    const response = await apiClient.get(`/api/answers/${answerId}`);
    return response.data.data ?? null;
  } catch (error) {
    throw handleAnswerError(error);
  }
}

/**
 * Updates an owned answer via PATCH /api/answers/:answerId.
 * Assumes that answerId and content are not NULL or undefined.
 * @param answerId - numeric ID of the answer to update
 * @param content - updated answer body text
 * @returns {Promise<Object|null>} - updated answer data from the API; throws Error from handleAnswerError on network or backend failure
 */
async function updateAnswer(answerId, { content }) {
  try {
    const response = await apiClient.patch(`/api/answers/${answerId}`, {
      content,
    });
    return response.data.data ?? null;
  } catch (error) {
    throw handleAnswerError(error);
  }
}

/**
 * Deletes an owned answer via DELETE /api/answers/:answerId.
 * Assumes that answerId is not NULL or undefined.
 * @param answerId - numeric ID of the answer to delete
 * @returns {Promise<{id: number}|null>} - deleted answer id from the API; throws Error from handleAnswerError on network or backend failure
 */
async function deleteAnswer(answerId) {
  try {
    const response = await apiClient.delete(`/api/answers/${answerId}`);
    return response.data.data ?? null;
  } catch (error) {
    throw handleAnswerError(error);
  }
}

export const answerService = {
  postAnswer,
  getAnswer,
  updateAnswer,
  deleteAnswer,
};
