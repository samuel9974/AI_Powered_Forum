import { apiClient } from '../core/api.client.js';

/**
 * Registers a new user via POST /api/auth/register.
 * Assumes that userData is not NULL or undefined.
 * @param userData - registration payload with firstName, lastName, email, and password
 * @returns {Promise<{user: Object}>} - created user from the API; throws Error from handleAuthError on failure
 */
async function register(userData) {
  try {
    const response = await apiClient.post('/api/auth/register', userData);
    return { user: response.data.user };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs in an existing user and persists the session in localStorage.
 * Assumes that credentials is not NULL or undefined.
 * @param credentials - login payload with email and password
 * @returns {Promise<{user: Object, token: string}>} - authenticated user and JWT; throws Error from handleAuthError on failure
 */
async function login(credentials) {
  try {
    const response = await apiClient.post('/api/auth/login', credentials);
    const { user, token } = response.data;

    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { user, token };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Clears the stored JWT and user object from localStorage.
 * @returns {void}
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
}

/**
 * Reads the JWT token from localStorage.
 * @returns {string|null} - stored token string, or null when not signed in
 */
function getStoredToken() {
  return localStorage.getItem('token');
}

/**
 * Reads and parses the stored user object from localStorage.
 * @returns {Object|null} - parsed user object, or null when missing or invalid JSON
 */
function getStoredUser() {
  const userJson = localStorage.getItem('user');
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    // If JSON parsing fails, clear invalid data
    localStorage.removeItem('user');
    return null;
  }
}

/**
 * Returns whether a JWT token is present in localStorage.
 * @returns {boolean} - true when a token is stored
 */
function isAuthenticated() {
  return !!getStoredToken();
}

/**
 * Normalizes axios failures from auth API calls into user-facing Error objects.
 * Assumes that error is not NULL or undefined.
 * @param error - axios error, possibly without a response
 * @returns {Error} - messages such as "Request timed out. Please try again.", "Invalid email or password." (401), or "Invalid input data." (400)
 */
function handleAuthError(error) {
  if (!error.response) {
    if (error.code === 'ECONNABORTED') {
      return new Error('Request timed out. Please try again.');
    }
    return new Error(
      'Unable to connect to server. Please check your internet connection.',
    );
  }

  const status = error.response.status;
  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  switch (status) {
    case 400:
      return new Error(backendMessage || 'Invalid input data.');
    case 401:
      return new Error(backendMessage || 'Invalid email or password.');
    case 500:
      return new Error(
        'Something went wrong on our end. Please try again later.',
      );
    default:
      return new Error(backendMessage || 'An unexpected error occurred.');
  }
}

/**
 * Service for handling auth-related requests.
 */
export const authService = {
  register,
  login,
  logout,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
};
