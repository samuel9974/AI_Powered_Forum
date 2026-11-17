/**
 * Formats a date into a relative time string such as "5 mins ago" or "2 hrs ago".
 * Assumes that dateInput is not NULL or undefined when a non-empty result is expected.
 * @param dateInput - Date instance, ISO string, or timestamp to format
 * @returns {string} - relative time label, or empty string when dateInput is missing or invalid
 */
export function timeAgo(dateInput) {
  if (!dateInput) return '';

  const date = new Date(dateInput);

  // Check for invalid dates
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  // Handle future dates or extremely recent dates
  if (seconds < 0) return 'just now';
  if (seconds < 60) return `${seconds} sec${seconds !== 1 ? 's' : ''} ago`;

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes !== 1 ? 's' : ''} ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours !== 1 ? 's' : ''} ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks} week${weeks !== 1 ? 's' : ''} ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;

  const years = Math.floor(days / 365);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
}

/**
 * Minimum answer body length required by the API (create + update validations).
 * Keep compose and edit forms in sync with backend answer content rules.
 */
export const ANSWER_MIN = 20;

/**
 * Checks whether a resource (question or answer) was authored by the signed-in user.
 * Client-side only — the API still enforces ownership on mutate routes.
 * Assumes that resource and user are not NULL or undefined when comparing ownership.
 * @param resource - object with optional author.id (question or answer shape)
 * @param user - signed-in user object with id
 * @returns {boolean} - true when author.id matches user.id as strings
 */
export function isAuthoredByUser(resource, user) {
  if (!resource || !user) return false;
  const authorId = resource.author?.id;
  const userId = user.id;
  if (authorId == null || userId == null) return false;
  return String(authorId) === String(userId);
}

/**
 * Checks whether an answer was authored by the signed-in user.
 * Thin alias over isAuthoredByUser for clearer call sites on answer cards.
 * @param answer - answer object with optional author.id
 * @param user - signed-in user object with id
 * @returns {boolean} - true when the answer belongs to the signed-in user
 */
export function isAnswerAuthoredByUser(answer, user) {
  return isAuthoredByUser(answer, user);
}

/**
 * Two-letter mark drawn locally so the user's name is not sent to an avatar host.
 * @param {{ firstName?: string, lastName?: string } | null | undefined} user
 * @returns {string}
 */
export function userInitials(user) {
  const first = user?.firstName?.trim()?.[0] ?? '';
  const last = user?.lastName?.trim()?.[0] ?? '';
  return (first + last).toUpperCase() || '?';
}
