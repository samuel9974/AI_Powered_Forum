import { apiClient } from '../core/api.client.js';

/**
 * Normalizes axios failures from question API calls into user-facing Error objects.
 * Assumes that error is not NULL or undefined.
 * @param error - axios error, possibly without a response
 * @returns {Error} - message such as "Request timed out. Please try again.", "Unable to connect to server. Please check your internet connection.", or the backend msg/message field
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
 * Fetches questions with optional keyword search or "mine" filter via GET /api/questions.
 * Assumes that options is not NULL or undefined when provided.
 * @param search - optional keyword to match against title and content
 * @param mine - when true, limits results to the authenticated user's questions
 * @returns {Promise<Array>} - question list from the API; throws Error from handleQuestionError on failure
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
 * Semantic vector search for questions similar to the query string.
 * Assumes that query is not NULL or undefined.
 * @param query - natural-language search text
 * @param options - optional k (result count) and threshold (similarity cutoff)
 * @returns {Promise<Array>} - matching questions from GET /api/questions/search; throws Error from handleQuestionError on failure
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
 * Creates a new forum question via POST /api/questions.
 * Assumes that title and content are not NULL or undefined.
 * @param title - question headline
 * @param content - question body text
 * @returns {Promise<Object|null>} - created question data; throws Error from handleQuestionError on failure
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
 * Requests AI draft-coach tips for a question draft.
 * Assumes that content is not NULL or undefined.
 * @param title - optional question headline
 * @param content - draft question body used for coaching
 * @returns {Promise<{tips: string[]}>} - coaching tips from POST /api/questions/draft-coach; throws Error from handleQuestionError on failure
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
 * Fetches a single question thread with its answers.
 * Assumes that questionHash is not NULL or undefined.
 * @param questionHash - public hash slug for the question
 * @returns {Promise<{question: Object, answers: Array}>} - question and answers from GET /api/questions/:questionHash; throws Error from handleQuestionError on failure
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
 * AI relevance check for an answer draft against a question.
 * Assumes that questionHash and answerText are not NULL or undefined.
 * @param questionHash - public hash slug for the question
 * @param answerText - draft answer body to assess
 * @returns {Promise<{level: string, note: string}>} - fit level and explanation; throws Error from handleQuestionError on failure
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
 * Fetches semantically similar questions for the related sidebar.
 * Assumes that questionHash is not NULL or undefined.
 * @param questionHash - public hash slug for the source question
 * @returns {Promise<Array>} - similar questions from GET /api/questions/:questionHash/similar; throws Error from handleQuestionError on failure
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
