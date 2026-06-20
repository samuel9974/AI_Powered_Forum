/**
 * Normalize an email address for consistent storage and lookup.
 * @param {string} email
 * @returns {string}
 */
export function normalizeEmail(email) {
  return email.trim().toLowerCase();
}
