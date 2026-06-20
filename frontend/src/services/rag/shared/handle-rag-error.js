/**
 * Normalize axios failures into user-facing Error messages for RAG requests.
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
