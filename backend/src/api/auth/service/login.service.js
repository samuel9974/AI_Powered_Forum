import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { safeExecute } from "../../../../db/db.config.js";
import { UnauthenticatedError } from "../../../utils/errors/index.js";
import { normalizeEmail } from "./shared/email.js";

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1d";

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is required");
}

/**
 * Authenticates a user and generates a JWT token.
 */
export async function loginService({ email, password }) {
  const normalizedEmail = normalizeEmail(email);
  const sql =
    "SELECT user_id, first_name, last_name, email, password_hash FROM users WHERE email = ?";
  const rows = await safeExecute(sql, [normalizedEmail]);

  if (rows.length === 0) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  const user = rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new UnauthenticatedError("Invalid email or password");
  }

  const payload = {
    id: user.user_id,
    firstName: user.first_name,
    lastName: user.last_name,
  };

  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

  return {
    user: {
      id: user.user_id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    },
    token,
  };
}
