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

  return new Error(backendMessage || 'Request failed. Please try again.');
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

/**
 * Creates a new forum question.
 * @param {{ title: string, content: string }} payload
 * @returns {Promise<Object>}
 */
async function createQuestion({ title, content }) {
  try {
    const response = await apiClient.post('/api/questions', { title, content });
    return response.data.data ?? null;
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * AI draft coach tips for a question draft.
 * @param {{ title?: string, content: string }} payload
 * @returns {Promise<{ tips: string[] }>}
 */
async function generateQuestionDraftCoach({ title, content }) {
  try {
    const response = await apiClient.post('/api/questions/draft-coach', {
      title,
      content,
    });
    return response.data.data ?? { tips: [] };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Fetches a single question thread with answers.
 * @param {string} questionHash
 * @returns {Promise<{ question: Object, answers: Array }>}
 */
async function getSingleQuestion(questionHash) {
  try {
    const response = await apiClient.get(`/api/questions/${questionHash}`);
    return {
      question: response.data.question ?? null,
      answers: response.data.answers ?? [],
    };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * AI relevance check for an answer draft.
 * @param {string} questionHash
 * @param {string} answerText
 * @returns {Promise<{ level: string, note: string }>}
 */
async function assessAnswerFit(questionHash, answerText) {
  try {
    const response = await apiClient.post(
      `/api/questions/${questionHash}/answer-fit`,
      { answerText },
    );
    return response.data.data ?? { level: 'partial', note: '' };
  } catch (error) {
    throw handleQuestionError(error);
  }
}

/**
 * Similar questions for the related sidebar.
 * @param {string} questionHash
 * @returns {Promise<Array>}
 */
async function getSimilarQuestions(questionHash) {
  try {
    const response = await apiClient.get(
      `/api/questions/${questionHash}/similar`,
    );
    return response.data.data ?? [];
  } catch (error) {
    throw handleQuestionError(error);
  }
}

export const questionService = {
  getQuestions,
  searchQuestionsSemantic,
  createQuestion,
  generateQuestionDraftCoach,
  getSingleQuestion,
  assessAnswerFit,
  getSimilarQuestions,
};
