import bcrypt from "bcryptjs";
import { safeExecute } from "../../../../db/db.config.js";
import { BadRequestError } from "../../../utils/errors/index.js";
import { normalizeEmail } from "./shared/email.js";

/**
 * Checks whether a user account already exists for the given email address.
 * Assumes that email is not NULL or undefined.
 * @param email - normalized email address to look up
 * @returns {Promise<boolean>} - true when a matching user row exists
 */
async function checkUserExists(email) {
  const sql = "SELECT user_id FROM users WHERE email = ?";
  const rows = await safeExecute(sql, [email]);
  return rows.length > 0;
}

/**
 * Registers a new user in the database with a hashed password.
 * Assumes that firstName, lastName, email, and password are not NULL or undefined.
 * @param firstName - user's first name
 * @param lastName - user's last name
 * @param email - raw email address (normalized internally)
 * @param password - plain-text password to hash before storage
 * @returns {Promise<{id: number, firstName: string, lastName: string, email: string}>} - the created user without password; throws BadRequestError with message "User already exists with this email." when the email is taken
 */
export async function registerService({
  firstName,
  lastName,
  email,
  password,
}) {
  const normalizedEmail = normalizeEmail(email);
  const userExists = await checkUserExists(normalizedEmail);

  if (userExists) {
    throw new BadRequestError("User already exists with this email.");
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  const sql =
    "INSERT INTO users (first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?)";
  let result;

  try {
    result = await safeExecute(sql, [
      firstName,
      lastName,
      normalizedEmail,
      hashedPassword,
    ]);
  } catch (error) {
    if (error?.code === "ER_DUP_ENTRY") {
      throw new BadRequestError("User already exists with this email.");
    }
    throw error;
  }

  return {
    id: result.insertId,
    firstName,
    lastName,
    email: normalizedEmail,
  };
}
