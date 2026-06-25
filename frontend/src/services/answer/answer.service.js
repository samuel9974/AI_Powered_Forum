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

  return new Error(backendMessage || 'Failed to post answer. Please try again.');
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

export const answerService = {
  postAnswer,
};
