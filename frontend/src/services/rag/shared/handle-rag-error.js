/**
 * Normalizes axios failures from RAG API calls into user-facing Error objects.
 * Assumes that error is not NULL or undefined.
 * @param error - axios error, possibly without a response
 * @returns {Error} - message such as "Request timed out. Please try again.", "Unable to connect to server. Please check your internet connection.", or the backend msg/message field
 */
export function handleRagError(error) {
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
