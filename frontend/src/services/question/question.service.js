import { apiClient } from '../core/api.client.js';

/**
 * Centralized error handler for question service requests.
 */
function handleQuestionError(error) {
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

  return new Error(backendMessage || 'Failed to load questions.');
}

/**
 * Fetches questions with optional keyword search or "mine" filter.
 * @param {{ search?: string, mine?: boolean }} [options]
 * @returns {Promise<Array>}
 */
async function getQuestions({ search, mine } = {}) {
  try {
    const params = {};
    if (search?.trim()) params.search = search.trim();
    if (mine) params.mine = true;

    const response = await apiClient.get('/api/questions', { params });
    return response.data.data ?? [];
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Semantic (vector) search for questions similar to the query string.
 * @param {string} query
 * @param {{ k?: number, threshold?: number }} [options]
 * @returns {Promise<Array>}
 */
async function searchQuestionsSemantic(query, options = {}) {
  try {
    const params = { query: query.trim(), ...options };
    const response = await apiClient.get('/api/questions/search', { params });
    return response.data.data ?? [];
  } catch (error) {
    throw handleQuestionError(error);
  }
}

export const questionService = {
  getQuestions,
  searchQuestionsSemantic,
};
