import bcrypt from "bcryptjs";
import { safeExecute } from "../../../../db/db.config.js";
import { BadRequestError } from "../../../utils/errors/index.js";
import { normalizeEmail } from "./shared/email.js";

async function checkUserExists(email) {
  const sql = "SELECT user_id FROM users WHERE email = ?";
  const rows = await safeExecute(sql, [email]);
  return rows.length > 0;
}

/**
 * Registers a new user in the database.
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
